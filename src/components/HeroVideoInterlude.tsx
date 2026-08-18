import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useInViewport } from '../hooks/useInViewport'

gsap.registerPlugin(ScrollTrigger)

const VIDEO_WEBM = '/video/studio-noir-teaser.webm'
const VIDEO_MP4 = '/video/studio-noir-teaser.mp4'

// Matches the Higgsfield generation params (duration: 14). Overwritten with
// the real value once the browser reports loadedmetadata, so this is only
// the seed used for the very first scroll updates.
const DURATION_FALLBACK = 14

// How far (in viewport heights) the section stays pinned while the video
// scrubs from 0 -> duration. Larger = slower, more granular scrub per pixel
// scrolled.
const PIN_DISTANCE = '+=200%'

const INTRO_END = 0.08
const OUTRO_START = 0.85

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

// Minimum change in target video time (seconds) before we actually issue a
// seek. Lenis's RAF loop can drive onUpdate up to ~60x/sec; seeking a
// compressed video that often is expensive (each seek decodes from the
// nearest keyframe) and was enough to freeze the tab during smooth-scroll
// testing. ~1/24s matches roughly one video frame, so the scrub still reads
// as continuous while cutting redundant seeks by an order of magnitude.
const MIN_SEEK_DELTA = 1 / 24

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Plain DOM <video> — deliberately not a video texture on a canvas. Keeps
 * this section free of R3F/WebGL entirely so it can't inherit the chair
 * scene's geometry issues, and stays cheap to decode on scroll-heavy pages.
 *
 * Playback is fully scroll-driven: the video never plays on its own. While
 * the section is pinned, ScrollTrigger's progress (0 -> 1) is mapped
 * directly onto video.currentTime, so scrubbing the page scrubs the clip.
 */
export default function HeroVideoInterlude() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const isVisible = useInViewport(wrapperRef)
  const isVisibleRef = useRef(isVisible)

  useEffect(() => {
    isVisibleRef.current = isVisible
  }, [isVisible])

  useEffect(() => {
    const wrapper = wrapperRef.current
    const video = videoRef.current
    if (!wrapper || !video) return

    video.pause()
    const durationRef = { current: DURATION_FALLBACK }
    const onLoadedMetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        durationRef.current = video.duration
      }
    }
    video.addEventListener('loadedmetadata', onLoadedMetadata)

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
    // scrolling forward from the very top of the page" ourselves (see below)
    // instead of relying on ScrollTrigger's onEnter for it.
    let prevProgress = 0

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top',
        end: PIN_DISTANCE,
        pin: true,
        pinSpacing: true,
        scrub: true,
        // The wordmark/nav glides away for the duration of the pin and
        // returns with a deliberate eased tween — decoupled from scroll
        // speed on purpose so a fast scroll doesn't make it "pop" back in —
        // once the section is actually left, in either direction.
        //
        // Only onLeave/onEnterBack are wired to ScrollTrigger's own
        // callbacks. onEnter is deliberately NOT used: this pin's "top top"
        // start coincides exactly with scrollY 0 (Header is position:fixed
        // and out of document flow, so the video section sits at the very
        // top of the page), and ScrollTrigger fires onEnter immediately at
        // creation whenever the current scroll position already satisfies
        // the start condition — which it always does here on page load.
        // That hid the header before the user ever scrolled. The forward
        // "just left the very top" transition is instead detected below,
        // from real progress deltas, so it only fires once scrolling
        // actually happens.
        onLeave: revealHeader,
        onEnterBack: revealHeader,
        onUpdate: (self) => {
          const progress = self.progress

          if (prevProgress <= HEADER_HIDE_EPSILON && progress > HEADER_HIDE_EPSILON) {
            hideHeader()
          }
          prevProgress = progress

          // Guard: only touch the video element while the section is
          // actually on/near screen, so a fast scroll past a far-off pin
          // range can't keep seeking a video nobody is looking at.
          if (isVisibleRef.current && video.readyState >= 1) {
            const target = progress * durationRef.current
            if (Number.isFinite(target) && Math.abs(target - video.currentTime) > MIN_SEEK_DELTA) {
              try {
                video.currentTime = target
              } catch {
                // Seeking can throw mid-rapid-scroll on some browsers; the
                // next onUpdate tick will retry with a fresh progress value.
              }
            }
          }

          // Entrance: frame fades/scales in over the first 8% of the pin.
          // Hand-off: dims and pulls back over the final 15%, so the next
          // section reads as taking over once the pin releases.
          let frameOpacity = 1
          let frameScale = 1
          if (progress < INTRO_END) {
            const t = clamp01(progress / INTRO_END)
            frameOpacity = gsap.utils.interpolate(0, 1, t)
            frameScale = gsap.utils.interpolate(1.08, 1, t)
          } else if (progress > OUTRO_START) {
            const t = clamp01((progress - OUTRO_START) / (1 - OUTRO_START))
            frameOpacity = gsap.utils.interpolate(1, 0.12, t)
            frameScale = gsap.utils.interpolate(1, 0.96, t)
          }
          gsap.set(frameRef.current, { opacity: frameOpacity, scale: frameScale })

          // Caption: fades in just after the frame settles, holds through
          // the scrub, fades out alongside the hand-off.
          const captionInEnd = INTRO_END + 0.12
          let captionOpacity = 0
          let captionY = 16
          if (progress < INTRO_END) {
            captionOpacity = 0
            captionY = 16
          } else if (progress < captionInEnd) {
            const t = clamp01((progress - INTRO_END) / (captionInEnd - INTRO_END))
            captionOpacity = t
            captionY = gsap.utils.interpolate(16, 0, t)
          } else if (progress < OUTRO_START) {
            captionOpacity = 1
            captionY = 0
          } else {
            const t = clamp01((progress - OUTRO_START) / (1 - OUTRO_START))
            captionOpacity = gsap.utils.interpolate(1, 0, t)
            captionY = gsap.utils.interpolate(0, -12, t)
          }
          gsap.set(captionRef.current, { opacity: captionOpacity, y: captionY })
        },
      })
    }, wrapperRef)

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      ctx.revert()
    }
  }, [])

  return (
    <section ref={wrapperRef} className="relative h-screen w-full overflow-hidden bg-[#131313]">
      <div ref={frameRef} className="absolute inset-0" style={{ opacity: 0 }}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
        >
          <source src={VIDEO_WEBM} type="video/webm" />
          <source src={VIDEO_MP4} type="video/mp4" />
        </video>

        {/* Cinematic letterbox bars */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[6%] bg-[#0a0a0a]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[6%] bg-[#0a0a0a]" />

        {/* Vignette so the raw footage blends into the charcoal sections on either side */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#131313] via-transparent to-[#131313]"
          style={{ opacity: 0.5 }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#131313]/50 via-transparent to-[#131313]/50" />
      </div>

      <div
        ref={captionRef}
        className="absolute inset-x-0 bottom-[14%] flex flex-col items-center px-margin-mobile text-center"
        style={{ opacity: 0 }}
      >
        <span className="font-label-caps text-label-caps uppercase tracking-[0.25em] text-tertiary-fixed">
          Studio Noir — Property Teaser
        </span>
        <p className="font-display-lg-mobile mt-4 max-w-2xl text-2xl text-on-surface md:text-3xl">
          A quiet walk through light and material.
        </p>
      </div>
    </section>
  )
}
