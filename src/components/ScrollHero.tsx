import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion, scrollToSection } from '../hooks/useSmoothScroll'

gsap.registerPlugin(ScrollTrigger)

const FRAME_COUNT = 84
const FRAME_PATH = (index: number) => `/hero-frames/frame${String(index + 1).padStart(4, '0')}.webp`
const FIRST_FRAME = FRAME_PATH(0)

// Frames 0-11 (frame0001.webp..frame0012.webp) load immediately so early
// scroll interaction already has real frames to scrub through. Frames
// 12-83 stream in afterward via requestIdleCallback, in small batches, so
// they never compete with first paint / interactivity for bandwidth or
// main-thread time.
const INITIAL_WINDOW_END = 12
const IDLE_BATCH_SIZE = 4
// Also doubles as the requestIdleCallback timeout: guarantees a batch
// still runs even if the browser never reports an idle period.
const IDLE_FALLBACK_MS = 200

type IdleHandle = number

/** requestIdleCallback with a setTimeout fallback for browsers without it (Safari). */
function scheduleIdle(cb: () => void): IdleHandle {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(cb, { timeout: IDLE_FALLBACK_MS })
  }
  return window.setTimeout(cb, IDLE_FALLBACK_MS) as unknown as IdleHandle
}

function cancelIdle(handle: IdleHandle) {
  if (typeof window.cancelIdleCallback === 'function') {
    window.cancelIdleCallback(handle)
  } else {
    window.clearTimeout(handle)
  }
}

// Targets the fixed nav rendered by Header.tsx. Looked up via plain DOM
// query rather than a selector string handed to GSAP, because it lives
// outside this component's own subtree — gsap.context() scopes selector
// text to descendants of `wrapperRef`, so a scoped lookup would never find it.
const HEADER_SELECTOR = '#site-header'
const HEADER_HIDE_Y = -16
const HEADER_HIDE_DURATION = 0.4
const HEADER_REVEAL_DURATION = 0.5
// Ignores sub-pixel/floating-point progress noise right at the top-of-page
// boundary (e.g. from a ScrollTrigger.refresh() on window resize) so the
// header-hide check below only fires on genuine scroll movement, not jitter.
const HEADER_HIDE_EPSILON = 0.002

// How far the hero recedes as it scrolls past — gentle, not a full hide, so
// the section never reads as "gone" mid-scroll.
const EXIT_MIN_OPACITY = 0.65
const EXIT_MIN_SCALE = 0.96

/** Draws `img` into the canvas filling (dw, dh) with an object-fit: cover crop. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, dw: number, dh: number) {
  const sw = img.naturalWidth
  const sh = img.naturalHeight
  if (!sw || !sh) return
  const sourceRatio = sw / sh
  const destRatio = dw / dh
  let sx = 0
  let sy = 0
  let sWidth = sw
  let sHeight = sh
  if (sourceRatio > destRatio) {
    sWidth = sh * destRatio
    sx = (sw - sWidth) / 2
  } else {
    sHeight = sw / destRatio
    sy = (sh - sHeight) / 2
  }
  ctx.clearRect(0, 0, dw, dh)
  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, dw, dh)
}

/**
 * Full frame-sequence scroll-scrubbed hero: 84 WebP frames extracted from
 * the Higgsfield clip, loaded progressively into a sparse Image[] and
 * drawn onto a <canvas> with a 2D context. GSAP ScrollTrigger maps scroll
 * progress linearly onto frame index — no <video> element, no
 * video.currentTime seeking. Only frames 0-11 load immediately; the rest
 * stream in via requestIdleCallback so the other ~72 frames never compete
 * with first paint or interactivity for bandwidth or main-thread time.
 *
 * Deliberately not pinned: the wrapper is a normal, responsive-aspect-ratio
 * block in the document flow. Scrubbing happens over exactly the scroll
 * distance it takes the section to pass the top of the viewport, which
 * avoids the pin-spacer edge cases (spurious onEnter at page load, blank
 * states) that showed up with the earlier pinned video approach.
 */
export default function ScrollHero() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  // Sparse: entries are created lazily, only for frames actually requested
  // so far — never all 84 up front.
  const framesRef = useRef<(HTMLImageElement | undefined)[]>([])
  const loadedRef = useRef<Set<number>>(new Set())
  const currentFrameRef = useRef(0)
  const [initialReady, setInitialReady] = useState(false)
  // Computed once per mount, not reactive to a live OS-setting change mid
  // session — matches the same convention useScrollReveal already follows.
  const reduceMotion = useRef(prefersReducedMotion()).current

  // If the exact requested frame isn't loaded yet (scrolled ahead of the
  // progressive queue), fall back to the nearest frame that IS loaded
  // rather than leaving the canvas showing a stale/blank image.
  function findNearestLoaded(index: number): number | null {
    if (loadedRef.current.has(index)) return index
    for (let d = 1; d < FRAME_COUNT; d++) {
      const before = index - d
      const after = index + d
      if (before >= 0 && loadedRef.current.has(before)) return before
      if (after < FRAME_COUNT && loadedRef.current.has(after)) return after
      if (before < 0 && after >= FRAME_COUNT) break
    }
    return null
  }

  function drawFrame(index: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const resolved = findNearestLoaded(index)
    if (resolved === null) return
    const img = framesRef.current[resolved]
    if (!img || !img.complete || img.naturalWidth === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCover(ctx, img, canvas.width, canvas.height)
    currentFrameRef.current = resolved
  }

  // Progressive load: frames 0-11 immediately (early scroll needs real
  // frames right away), frames 12-83 in small idle-time batches,
  // re-prioritized each batch by distance from whatever frame is
  // currently on screen. The static <img> fallback below (plain HTML,
  // painted natively by the browser) covers the gap before frame 0
  // finishes, so there's never a blank canvas moment. Skipped entirely
  // under reduced motion: that static first frame is the whole picture
  // there, so there's no reason to fetch the other 83.
  useEffect(() => {
    if (reduceMotion) {
      setInitialReady(true)
      return
    }

    let cancelled = false
    let idleHandle: IdleHandle | undefined

    function loadFrame(index: number, onSettled: () => void) {
      if (framesRef.current[index]) {
        onSettled()
        return
      }
      const img = new Image()
      framesRef.current[index] = img
      img.onload = () => {
        if (cancelled) return
        loadedRef.current.add(index)
        if (index === 0) drawFrame(0)
        onSettled()
      }
      img.onerror = () => {
        if (cancelled) return
        onSettled()
      }
      img.src = FRAME_PATH(index)
    }

    let remainingInitial = INITIAL_WINDOW_END
    const onInitialFrameSettled = () => {
      remainingInitial -= 1
      if (remainingInitial === 0 && !cancelled) setInitialReady(true)
    }
    for (let i = 0; i < INITIAL_WINDOW_END; i++) {
      loadFrame(i, onInitialFrameSettled)
    }

    const queue: number[] = []
    for (let i = INITIAL_WINDOW_END; i < FRAME_COUNT; i++) queue.push(i)

    function runBatch() {
      if (cancelled || queue.length === 0) return
      queue.sort((a, b) => Math.abs(a - currentFrameRef.current) - Math.abs(b - currentFrameRef.current))
      const batch = queue.splice(0, IDLE_BATCH_SIZE)
      let pending = batch.length
      const onBatchFrameSettled = () => {
        pending -= 1
        if (pending === 0 && !cancelled) {
          idleHandle = scheduleIdle(runBatch)
        }
      }
      batch.forEach((i) => loadFrame(i, onBatchFrameSettled))
    }
    idleHandle = scheduleIdle(runBatch)

    return () => {
      cancelled = true
      if (idleHandle !== undefined) cancelIdle(idleHandle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keeps the canvas backing store matching its CSS box (and device pixel
  // ratio) so frames stay crisp across the desktop 16:9 / mobile 3:4
  // breakpoints, and redraws the current frame after any resize. Skipped
  // under reduced motion: the canvas never gets drawn to, so sizing it is
  // wasted work.
  useEffect(() => {
    if (reduceMotion) return

    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = wrapper.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      drawFrame(currentFrameRef.current)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(wrapper)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Skipped entirely under reduced motion: no scrub, no header hide/reveal,
  // no exit fade/scale. Header stays put and the caption stays fully
  // legible at rest, matching the plain static-poster presentation below.
  useEffect(() => {
    if (reduceMotion) return

    const wrapper = wrapperRef.current
    if (!wrapper) return

    const header = document.querySelector<HTMLElement>(HEADER_SELECTOR)
    const hideHeader = () => {
      if (!header) return
      gsap.to(header, {
        autoAlpha: 0,
        y: HEADER_HIDE_Y,
        duration: HEADER_HIDE_DURATION,
        ease: 'power2.inOut',
        overwrite: 'auto',
      })
    }
    const revealHeader = () => {
      if (!header) return
      gsap.to(header, {
        autoAlpha: 1,
        y: 0,
        duration: HEADER_REVEAL_DURATION,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    // Tracks the previous frame's progress so we can detect "just started
    // scrolling forward from the very top of the page" ourselves, instead
    // of relying on ScrollTrigger's onEnter for it.
    let prevProgress = 0

    const ctx = gsap.context(() => {
      // No pin: a normal section. "top top" -> "bottom top" covers exactly
      // the scroll distance during which it passes by the top of the
      // viewport, which drives both the frame scrub and the exit fade.
      ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        // Only onLeave/onEnterBack are wired to ScrollTrigger's own
        // callbacks. onEnter is deliberately NOT used: this section's
        // "top top" start coincides exactly with scrollY 0 (Header is
        // position:fixed and out of document flow, so this section sits at
        // the very top of the page), and ScrollTrigger fires onEnter
        // immediately at creation whenever the current scroll position
        // already satisfies the start condition — which it always does here
        // on page load. The forward "just left the very top" transition is
        // instead detected below, from real progress deltas.
        onLeave: revealHeader,
        onEnterBack: revealHeader,
        onUpdate: (self) => {
          const progress = self.progress

          if (prevProgress <= HEADER_HIDE_EPSILON && progress > HEADER_HIDE_EPSILON) {
            hideHeader()
          }
          prevProgress = progress

          const frameIndex = Math.round(progress * (FRAME_COUNT - 1))
          if (frameIndex !== currentFrameRef.current) {
            drawFrame(frameIndex)
          }

          const opacity = gsap.utils.interpolate(1, EXIT_MIN_OPACITY, progress)
          const scale = gsap.utils.interpolate(1, EXIT_MIN_SCALE, progress)
          gsap.set(canvasRef.current, { opacity, scale })
          gsap.set(captionRef.current, { opacity, scale })
        },
      })
    }, wrapperRef)

    return () => {
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section
      ref={wrapperRef}
      className="relative aspect-[3/4] w-full overflow-hidden bg-[#131313] md:aspect-video"
    >
      {/* The page's one semantic <h1> — visually hidden so it doesn't
          disrupt the approved hero composition, which uses a <p> for its
          on-screen headline for its own type-scale reasons. */}
      <h1 className="sr-only">Meridian Render Co. - Luxury 3D Real Estate Tours</h1>

      {/* Plain <img>, painted natively before any JS runs — guarantees the
          first frame is visible immediately, with zero blank-canvas gap. */}
      <img
        src={FIRST_FRAME}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        fetchPriority="high"
        aria-hidden="true"
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Vignette so the frame blends into the charcoal sections on either side */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#131313] via-transparent to-[#131313]"
        style={{ opacity: 0.5 }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#131313]/50 via-transparent to-[#131313]/50" />

      {!initialReady && (
        <div className="font-label-caps text-label-caps pointer-events-none absolute bottom-4 right-4 uppercase tracking-[0.2em] text-on-surface-variant/70">
          Loading…
        </div>
      )}

      <div
        ref={captionRef}
        className="absolute inset-x-0 bottom-[10%] flex flex-col items-center px-margin-mobile text-center md:bottom-[14%]"
      >
        <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-tertiary-fixed sm:tracking-[0.25em]">
          Meridian Render Co. / Property Teaser
        </span>
        <p className="font-display-lg-mobile mt-4 max-w-2xl text-xl text-on-surface md:text-3xl">
          A quiet walk through light and material.
        </p>
        <button
          type="button"
          onClick={() => scrollToSection('contact')}
          className="btn-primary font-label-caps text-label-caps mt-6 px-6 py-3 uppercase tracking-[0.15em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary-fixed"
        >
          Request a Demo Tour
        </button>
      </div>
    </section>
  )
}
