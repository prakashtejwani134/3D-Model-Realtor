import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FRAME_COUNT = 84
const FRAME_PATH = (index: number) => `/hero-frames/frame${String(index + 1).padStart(4, '0')}.webp`
const FIRST_FRAME = FRAME_PATH(0)

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

// How far the hero recedes right at the very end of its scroll range, as a
// hand-off cue to the next section. Restricted to the last fraction of
// progress (see EXIT_FADE_START) rather than fading linearly across the
// whole range — on mobile that range now spans ~2 screens of scroll, and a
// linear fade would have the hero visibly dimming while the user is still
// mid-sequence, undermining the "one full immersive screen" effect.
const EXIT_FADE_START = 0.88
const EXIT_MIN_OPACITY = 0.65
const EXIT_MIN_SCALE = 0.96

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

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
 * the Higgsfield clip, preloaded into an Image[] and drawn onto a <canvas>
 * with a 2D context. GSAP ScrollTrigger maps scroll progress linearly onto
 * frame index — no <video> element, no video.currentTime seeking.
 *
 * Two nested elements:
 *  - `wrapperRef` (outer, <section>): the ScrollTrigger target. On desktop
 *    it's a normal aspect-video block (unchanged from before). On mobile
 *    it's 200dvh tall, giving the frame sequence a full ~2-screen scroll
 *    runway instead of the short aspect-[3/4] block it used to be.
 *  - `visualRef` (inner div): the actual visible area, holding the canvas
 *    and caption. On mobile it's `position: sticky` at the header's real
 *    height, sized to exactly fill the viewport below it — CSS-native
 *    stickiness, not GSAP's `pin: true`, specifically to avoid the
 *    pin-spacer/spurious-onEnter issues that came up earlier this project
 *    with JS-driven pinning. On desktop it's `static`, filling the outer
 *    element exactly like before.
 */
export default function ScrollHero() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const framesRef = useRef<HTMLImageElement[]>([])
  const currentFrameRef = useRef(0)
  const [allLoaded, setAllLoaded] = useState(false)

  // Preload every frame once. The static <img> fallback below (plain HTML,
  // painted natively by the browser) covers the gap before this finishes,
  // so there's never a blank canvas moment even on a slow connection.
  useEffect(() => {
    let cancelled = false
    const images: HTMLImageElement[] = []
    let loadedCount = 0

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image()
      img.src = FRAME_PATH(i)
      img.onload = () => {
        loadedCount += 1
        if (i === 0) drawFrame(0)
        if (loadedCount === FRAME_COUNT && !cancelled) setAllLoaded(true)
      }
      img.onerror = () => {
        loadedCount += 1
        if (loadedCount === FRAME_COUNT && !cancelled) setAllLoaded(true)
      }
      images.push(img)
    }
    framesRef.current = images

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function drawFrame(index: number) {
    const canvas = canvasRef.current
    const img = framesRef.current[index]
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawCover(ctx, img, canvas.width, canvas.height)
    currentFrameRef.current = index
  }

  // Keeps the canvas backing store matching the visible (sticky-on-mobile)
  // box, not the tall scroll-range wrapper, and redraws the current frame
  // after any resize.
  useEffect(() => {
    const visual = visualRef.current
    const canvas = canvasRef.current
    if (!visual || !canvas) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = visual.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      drawFrame(currentFrameRef.current)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(visual)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
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
      // No GSAP pin: "top top" -> "bottom top" covers exactly the scroll
      // distance of the outer wrapper (short aspect-video block on desktop,
      // tall 200dvh runway on mobile), which drives both the frame scrub
      // and the exit fade. The mobile "stay full-screen" effect comes from
      // visualRef's CSS position: sticky, not from this trigger pinning.
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

          const exitT = clamp01((progress - EXIT_FADE_START) / (1 - EXIT_FADE_START))
          const opacity = gsap.utils.interpolate(1, EXIT_MIN_OPACITY, exitT)
          const scale = gsap.utils.interpolate(1, EXIT_MIN_SCALE, exitT)
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
    <section ref={wrapperRef} className="relative h-[200dvh] w-full md:h-auto md:aspect-video">
      <div
        ref={visualRef}
        className="sticky top-[var(--site-header-height,90px)] h-[calc(100dvh-var(--site-header-height,90px))] w-full overflow-hidden bg-[#131313] md:static md:h-full"
      >
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

        {!allLoaded && (
          <div className="font-label-caps text-label-caps pointer-events-none absolute bottom-4 right-4 uppercase tracking-[0.2em] text-on-surface-variant/70">
            Loading…
          </div>
        )}

        <div
          ref={captionRef}
          className="absolute inset-x-0 bottom-[8%] flex flex-col items-center px-margin-mobile text-center md:bottom-[14%]"
        >
          <span className="font-label-caps text-label-caps uppercase tracking-[0.15em] text-tertiary-fixed sm:tracking-[0.25em]">
            Studio Noir — Property Teaser
          </span>
          <p className="font-display-lg-mobile mt-3 max-w-2xl text-xl leading-snug text-on-surface md:mt-4 md:text-3xl md:leading-normal">
            A quiet walk through light and material.
          </p>
        </div>
      </div>
    </section>
  )
}
