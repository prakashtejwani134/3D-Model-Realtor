import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion, scrollToSection } from '../hooks/useSmoothScroll'

gsap.registerPlugin(ScrollTrigger)

// Prevents ScrollTrigger from recalculating pin/end positions when a mobile
// browser's address bar shows/hides mid-scroll (a resize event that has
// nothing to do with the user actually resizing the viewport) — without
// this, the pinned hero below can jump or re-measure itself as the chrome
// animates away.
ScrollTrigger.config({ ignoreMobileResize: true })

const FRAME_COUNT = 120

// Two parallel, identically-numbered frame sets — 1600x900 for wide
// viewports, 900x1600 (portrait-native, not just a crop) for narrow ones.
// 768 matches Tailwind's own 'md' breakpoint, which the rest of this
// component (and the design system generally) already treats as the
// desktop/mobile line.
const MOBILE_BREAKPOINT = 768
const HERO_FRAMES_DESKTOP_DIR = '/hero-frames'
const HERO_FRAMES_MOBILE_DIR = '/hero-frames-mobile'
const FRAME_PATH = (baseDir: string, index: number) =>
  `${baseDir}/frame${String(index + 1).padStart(4, '0')}.webp`

// Caps how many frame requests are in flight at once, matching a typical
// browser's per-origin connection limit — dispatching all 120 at once would
// just queue them in index order inside the browser itself, defeating the
// whole point of reprioritizing toward the user's current scroll position.
// Keeping our own queue below this means "not yet dispatched" frames can
// still be reordered right up until the moment they're actually requested.
const MAX_CONCURRENT_LOADS = 6

// Tiny (32px-wide, ~270 byte) blurred still of frame 1, inlined so it paints
// with zero network round-trip — covers the section's own background the
// instant it mounts, before the real first frame has had a chance to load.
// On a slow/throttled connection that real request can take seconds to
// arrive, and until it does there was nothing between the raw dark section
// background and the viewer — this closes that gap unconditionally,
// regardless of how long the rest of the sequence takes to load.
const PLACEHOLDER_DATA_URI =
  'data:image/jpeg;base64,/9j//gAPTGF2YzYzLjEuMTAwAP/bAEMACD4+ST5JVVVVVVVVZF1kaGhoZGRkZGhoaHBwcIODg3BwcGhocHB8fIODj5OPh4eDh5OTm5uburqystnZ4P/////EAFoAAQEBAQAAAAAAAAAAAAAAAAUEBgMBAQEBAQAAAAAAAAAAAAAAAAQAAgEQAAICAwEBAQEAAAAAAAAAAAABAhEhMQNBcVFhEQEAAAAAAAAAAAAAAAAAAAAA/8AAEQgAEgAgAwEiAAIRAAMRAP/aAAwDAQACEQMRAD8ALh3ksb+k8uvX+esy13pJjij+vwCcncpzWaokqo3gWccYYO3hRJ1TDQ4CQ0NCB3cz3TRoTP8ATRlP/9k='

// Fraction of the pinned scroll distance spent scrubbing the frame sequence
// before the section below starts revealing — roughly "45 of 52 seconds" of
// the source clip, leaving the tail of the scroll for the crossfade instead
// of tacking it onto the end of the footage. Past this point the frame
// sequence holds on its last frame; see the two-phase onUpdate below.
const REVEAL_START = 45 / 52

// How long the hero stays pinned, in multiples of the viewport height. Needs
// to be long enough that scrubbing 120 frames doesn't feel rushed, but not
// so long the section feels stuck. Tested 3.5/5/6: finer px-per-frame reads
// smoother as this goes up, but at 6 the hero pin alone eats ~50% of the
// entire page's scroll length — disproportionate for a marketing page with
// real content below it. 500% is the balance: a clearly finer scrub than
// 350% without the hero swallowing the page.
const PIN_SCROLL_VH_MULTIPLIER = 5

// The section immediately below the hero in the DOM — hidden for all of
// phase 1 and crossfaded in during phase 2, see onUpdate.
const NEXT_SECTION_SELECTOR = '#features'

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

// How far the hero recedes during phase 2 (the crossfade) — gentle, not a
// full hide, so the section never reads as "gone" the instant it unpins.
const EXIT_MIN_OPACITY = 0.65
const EXIT_MIN_SCALE = 0.96

/**
 * Phase 1 (0 -> REVEAL_START): scrub the full frame sequence. Phase 2
 * (REVEAL_START -> 1): hold on the last frame while the section below
 * crossfades in.
 */
function frameIndexForProgress(progress: number) {
  return progress <= REVEAL_START
    ? Math.round((progress / REVEAL_START) * (FRAME_COUNT - 1))
    : FRAME_COUNT - 1
}

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
 * Full frame-sequence scroll-scrubbed hero: 120 WebP frames (4.4MB total),
 * loaded into a sparse Image[] and drawn onto a <canvas> with a 2D context.
 * No <video> element, no video.currentTime seeking — GSAP ScrollTrigger
 * maps scroll progress onto frame index directly.
 *
 * Loading is progressive, not gated: onUpdate always draws the nearest
 * already-loaded frame to the current scroll position (see
 * findNearestLoaded), so scrubbing never blocks on the full set finishing —
 * a fast-scrolling user on a slow connection sees the sequence advance
 * through whatever's already landed instead of freezing on frame 1 for the
 * entire load. Requests are dispatched MAX_CONCURRENT_LOADS at a time, and
 * each time a slot frees up the next request is picked by proximity to
 * wherever the user has scrolled to *now* (frameIndexForProgress of
 * latestProgressRef) — so the load order continuously re-targets itself
 * toward the user's actual position instead of marching through the
 * sequence in a fixed order they may have already scrolled past.
 *
 * Pinned full-viewport for PIN_SCROLL_VH_MULTIPLIER * 100vh of scroll,
 * split into two phases (see onUpdate below): the frame sequence scrubs to
 * completion by REVEAL_START, then holds on its last frame while the
 * section below crossfades in for the remainder of the pin. Tying the
 * reveal to the pin's own progress — rather than to the wrapper's natural,
 * frame-count-independent flow height — is what keeps the next section from
 * bleeding through before the footage has actually finished.
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
  // Latest scroll progress, updated on every onUpdate tick — read by the
  // frame loader to figure out which not-yet-requested frame is currently
  // closest to the user, so it can keep reprioritizing the load queue as
  // they scroll rather than loading in a fixed order.
  const latestProgressRef = useRef(0)
  const [initialReady, setInitialReady] = useState(false)
  // Computed once per mount, not reactive to a live OS-setting change mid
  // session — matches the same convention useScrollReveal already follows.
  const reduceMotion = useRef(prefersReducedMotion()).current
  // Same convention: checked once on mount, not on resize/orientation
  // change. A live viewport-crossing mid-session would mean tearing down
  // and re-fetching an entirely different 4.4MB frame set out from under a
  // user who may already be mid-scrub — worse than just picking the set
  // that matched the viewport at load time and leaving it there.
  const isMobileViewport = useRef(window.innerWidth < MOBILE_BREAKPOINT).current
  const frameBaseDir = isMobileViewport ? HERO_FRAMES_MOBILE_DIR : HERO_FRAMES_DESKTOP_DIR
  const firstFrame = FRAME_PATH(frameBaseDir, 0)

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

  // Redraws toward `target` only if a better (or newly available) frame is
  // loaded than what's currently showing — called both on every scroll tick
  // and whenever a frame finishes loading, so a frame that lands while the
  // user has paused mid-scroll still visibly updates instead of waiting for
  // the next scroll event.
  function refreshToward(target: number) {
    const resolved = findNearestLoaded(target)
    if (resolved !== null && resolved !== currentFrameRef.current) {
      drawFrame(resolved)
    }
  }

  // Loads every frame, but not all at once and not in a fixed order: at
  // most MAX_CONCURRENT_LOADS requests are in flight, and every time one
  // settles the next is picked by proximity to wherever the user has
  // scrolled to right now. The static <img> fallback below, and the
  // section's own inlined PLACEHOLDER_DATA_URI background beneath that,
  // cover first paint — after that, drawing is progressive (see onUpdate's
  // refreshToward) rather than gated on this finishing. Skipped entirely
  // under reduced motion: that static first frame is the whole picture
  // there, so there's no reason to fetch the other 119.
  useEffect(() => {
    if (reduceMotion) {
      setInitialReady(true)
      return
    }

    let cancelled = false
    let settledCount = 0
    let activeCount = 0
    const requested = new Set<number>()

    function pickNext(): number | null {
      const target = frameIndexForProgress(latestProgressRef.current)
      let best: number | null = null
      let bestDist = Infinity
      for (let i = 0; i < FRAME_COUNT; i++) {
        if (requested.has(i)) continue
        const dist = Math.abs(i - target)
        if (dist < bestDist) {
          bestDist = dist
          best = i
        }
      }
      return best
    }

    function dispatchNext() {
      while (!cancelled && activeCount < MAX_CONCURRENT_LOADS) {
        const index = pickNext()
        if (index === null) break
        requestFrame(index)
      }
    }

    function requestFrame(index: number) {
      requested.add(index)
      activeCount += 1
      const img = new Image()
      framesRef.current[index] = img
      const onSettled = () => {
        if (cancelled) return
        activeCount -= 1
        settledCount += 1
        if (settledCount === FRAME_COUNT) setInitialReady(true)
        dispatchNext()
      }
      img.onload = () => {
        if (cancelled) return
        loadedRef.current.add(index)
        refreshToward(frameIndexForProgress(latestProgressRef.current))
        onSettled()
      }
      img.onerror = () => {
        // TEMP-DEBUG: remove once the ?debug=1 mobile investigation is done.
        console.error(`[ScrollHero] frame failed to load: ${img.src}`)
        onSettled()
      }
      img.src = FRAME_PATH(frameBaseDir, index)
    }

    dispatchNext()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keeps the canvas backing store matching its CSS box (and device pixel
  // ratio) so frames stay crisp across the full-viewport box at any device
  // aspect ratio, and redraws the current frame after any resize. Skipped
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
      // Resizing the backing store resets all 2D context state, including
      // smoothing — re-applied every time so it isn't silently left at the
      // (already cheap, but browser-dependent) default.
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.imageSmoothingQuality = 'low'
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
    const nextSection = document.querySelector<HTMLElement>(NEXT_SECTION_SELECTOR)
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

    // TEMP-DEBUG block — remove once the ?debug=1 mobile investigation is
    // done. Rolling per-second onUpdate call count, logged once a second
    // during active scroll, to catch jerkiness/rate anomalies on-device via
    // Eruda's console (see index.html).
    let __updateCount = 0
    let __updateWindowStart = performance.now()

    const ctx = gsap.context(() => {
      // Hidden up front so there's no flash of the next section before the
      // first scroll update runs — mirrors useScrollReveal's own initial
      // gsap.set for its reveal targets.
      if (nextSection) {
        gsap.set(nextSection, { opacity: 0 })
      }

      // Hints the browser to keep these on their own compositor layer for
      // the life of the pin, since every onUpdate tick below touches their
      // opacity/transform — avoids repeated layer promotion/demotion on
      // each scroll tick.
      gsap.set([canvasRef.current, captionRef.current, nextSection].filter(Boolean), {
        willChange: 'opacity, transform',
      })

      // Pinned full-viewport for the whole scroll distance. "end" is a
      // function (not a fixed value) so ScrollTrigger re-derives it in
      // viewport-height units on every refresh (initial load, orientation
      // change, real resize) rather than baking in a stale pixel figure.
      // pinType is left to GSAP's own auto-detection: it defaults to
      // 'fixed' unless it finds a transformed ancestor, and Lenis (see
      // useSmoothScroll) drives the real document scroll position rather
      // than transforming a wrapper, so 'fixed' is correct here.
      ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top',
        end: () => `+=${window.innerHeight * PIN_SCROLL_VH_MULTIPLIER}`,
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
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
        // TEMP-DEBUG: catches ScrollTrigger recalculating pin/trigger
        // bounds — e.g. a mobile address-bar show/hide slipping past
        // ignoreMobileResize, or a real orientation change — mid-session.
        // Remove once the ?debug=1 mobile investigation is done.
        onRefresh: (self) => {
          console.log(
            `[ScrollHero] ScrollTrigger refreshed: start=${Math.round(self.start)} end=${Math.round(self.end)} innerWidth=${window.innerWidth} innerHeight=${window.innerHeight}`
          )
        },
        onUpdate: (self) => {
          // TEMP-DEBUG: remove once the ?debug=1 mobile investigation is done.
          __updateCount++
          const __now = performance.now()
          if (__now - __updateWindowStart >= 1000) {
            console.log(
              `[ScrollHero] onUpdate rate: ${(__updateCount / ((__now - __updateWindowStart) / 1000)).toFixed(1)}/s`
            )
            __updateCount = 0
            __updateWindowStart = __now
          }

          const progress = self.progress
          latestProgressRef.current = progress

          if (prevProgress <= HEADER_HIDE_EPSILON && progress > HEADER_HIDE_EPSILON) {
            hideHeader()
          }
          prevProgress = progress

          refreshToward(frameIndexForProgress(progress))

          const revealProgress =
            progress <= REVEAL_START ? 0 : (progress - REVEAL_START) / (1 - REVEAL_START)

          const opacity = gsap.utils.interpolate(1, EXIT_MIN_OPACITY, revealProgress)
          const scale = gsap.utils.interpolate(1, EXIT_MIN_SCALE, revealProgress)
          gsap.set(canvasRef.current, { opacity, scale })
          gsap.set(captionRef.current, { opacity, scale })

          if (nextSection) {
            gsap.set(nextSection, { opacity: revealProgress })
          }
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
      className="relative h-dvh w-full overflow-hidden bg-[#131313] bg-cover bg-center"
      style={{ backgroundImage: `url(${PLACEHOLDER_DATA_URI})` }}
    >
      {/* The page's one semantic <h1> — visually hidden so it doesn't
          disrupt the approved hero composition, which uses a <p> for its
          on-screen headline for its own type-scale reasons. */}
      <h1 className="sr-only">Meridian Render Co. - Luxury 3D Real Estate Tours</h1>

      {/* Plain <img>, painted as soon as its own network request completes —
          on a fast connection this is effectively instant, but it's still a
          real request, not a guarantee. The section's own inlined
          PLACEHOLDER_DATA_URI background (above) is what actually covers
          the gap on a slow connection, since it needs no network round-trip
          at all. */}
      <img
        src={firstFrame}
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
