import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useInViewport } from '../hooks/useInViewport'

gsap.registerPlugin(ScrollTrigger)

const VIDEO_WEBM = '/video/studio-noir-teaser.webm'
const VIDEO_MP4 = '/video/studio-noir-teaser.mp4'

/**
 * Plain DOM <video> — deliberately not a video texture on a canvas. Keeps
 * this section free of R3F/WebGL entirely so it can't inherit the chair
 * scene's geometry issues, and stays cheap to decode on scroll-heavy pages.
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
    const ctx = gsap.context(() => {
      // Entrance: frame fades/scales in as the section reaches the top of
      // the viewport, mirroring the establishing -> tight framing language
      // used by the two 3D scenes.
      gsap.fromTo(
        frameRef.current,
        { opacity: 0, scale: 1.08 },
        {
          opacity: 1,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        },
      )

      gsap.fromTo(
        captionRef.current,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: 'top center',
            end: 'center center',
            scrub: true,
          },
        },
      )

      // Hand-off: as the section scrolls past, dim and pull back slightly so
      // HeroChairDetail's own entrance (which starts at "top bottom") reads
      // as taking over rather than two sections competing for attention.
      gsap.to(frameRef.current, {
        opacity: 0.12,
        scale: 0.96,
        ease: 'none',
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'bottom center',
          end: 'bottom top',
          scrub: true,
        },
      })

      gsap.to(captionRef.current, {
        opacity: 0,
        y: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'bottom center',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, wrapperRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={wrapperRef} className="relative h-screen w-full overflow-hidden bg-[#131313]">
      <div ref={frameRef} className="absolute inset-0">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
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
