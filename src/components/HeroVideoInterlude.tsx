import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useInViewport } from '../hooks/useInViewport'

gsap.registerPlugin(ScrollTrigger)

const VIDEO_WEBM = '/video/studio-noir-teaser.webm'
const VIDEO_MP4 = '/video/studio-noir-teaser.mp4'
const VIDEO_POSTER = '/video/teaser-poster.jpg'

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
// the section never reads as "gone" mid-scroll the way the old pinned
// intro/outro fade could.
const EXIT_MIN_OPACITY = 0.65
const EXIT_MIN_SCALE = 0.96

/**
 * Plain DOM <video> — deliberately not a video texture on a canvas. Keeps
 * this section free of R3F/WebGL entirely so it can't inherit the chair
 * scene's geometry issues, and stays cheap to decode on scroll-heavy pages.
 *
 * A normal section, not pinned: the poster/first frame and caption are
 * fully visible at rest (page load, or scrolled back to the top), the video
 * autoplays (muted) while in view and pauses out of view, and scroll only
 * drives a gentle fade/scale as the section passes by — no scroll-scrubbed
 * seeking.
 */
export default function HeroVideoInterlude() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const isVisible = useInViewport(wrapperRef)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isVisible) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isVisible])

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
    // scrolling forward from the very top of the page" ourselves (see below)
    // instead of relying on ScrollTrigger's onEnter for it.
    let prevProgress = 0

    const ctx = gsap.context(() => {
      // No pin: this is a normal h-screen section. "top top" -> "bottom top"
      // covers exactly the scroll distance during which it passes by the
      // top of the viewport, which is what drives the gentle exit fade.
      ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        // The wordmark/nav glides away as the hero starts passing by and
        // returns with a deliberate eased tween — decoupled from scroll
        // speed on purpose so a fast scroll doesn't make it "pop" back in —
        // once the section is actually left, in either direction.
        //
        // Only onLeave/onEnterBack are wired to ScrollTrigger's own
        // callbacks. onEnter is deliberately NOT used: this section's
        // "top top" start coincides exactly with scrollY 0 (Header is
        // position:fixed and out of document flow, so this section sits at
        // the very top of the page), and ScrollTrigger fires onEnter
        // immediately at creation whenever the current scroll position
        // already satisfies the start condition — which it always does here
        // on page load. That hid the header before the user ever scrolled.
        // The forward "just left the very top" transition is instead
        // detected below, from real progress deltas, so it only fires once
        // scrolling actually happens.
        onLeave: revealHeader,
        onEnterBack: revealHeader,
        onUpdate: (self) => {
          const progress = self.progress

          if (prevProgress <= HEADER_HIDE_EPSILON && progress > HEADER_HIDE_EPSILON) {
            hideHeader()
          }
          prevProgress = progress

          const opacity = gsap.utils.interpolate(1, EXIT_MIN_OPACITY, progress)
          const scale = gsap.utils.interpolate(1, EXIT_MIN_SCALE, progress)
          gsap.set(frameRef.current, { opacity, scale })
          gsap.set(captionRef.current, { opacity, scale })
        },
      })
    }, wrapperRef)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <section ref={wrapperRef} className="relative h-screen w-full overflow-hidden bg-[#131313]">
      <div ref={frameRef} className="absolute inset-0">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="auto"
          poster={VIDEO_POSTER}
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
