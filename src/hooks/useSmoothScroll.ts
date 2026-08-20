import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const HEADER_SELECTOR = '#site-header'

// Module-level singleton, set while useSmoothScroll's effect is mounted.
// Lenis owns the "real" scroll position once it's active — a plain
// window.scrollTo or element.scrollIntoView gets fought/snapped back by its
// own RAF loop, so anything that wants to programmatically scroll (like nav
// links) needs to go through this instance instead.
let lenisInstance: Lenis | null = null

/**
 * Site-wide smooth scroll, mounted once at the App root. Previously this
 * lived inside HeroScene's own effect, which meant removing that section
 * from the page silently killed smooth scrolling everywhere. Every
 * section's ScrollTrigger (pinned or otherwise) now rides the same
 * Lenis-smoothed scroll position regardless of which sections are mounted.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisInstance = lenis

    const onTick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)
    lenis.on('scroll', ScrollTrigger.update)

    // Focusing an off-screen element (keyboard Tab, screen reader) triggers
    // the browser's native focus-scroll directly, bypassing Lenis entirely —
    // Lenis never sees that jump, so no 'scroll' re-emits and any
    // ScrollTrigger (e.g. entrance reveals) never re-evaluates against the
    // new position. A plain ScrollTrigger.update() reflects the new scroll
    // value in .progress()/.isActive but does not re-run the enter/leave
    // callback pass for a trigger that was already marked active before the
    // jump; .refresh() re-derives each trigger's state from scratch and does
    // fire them. Focus events are user-paced, not high-frequency, so the
    // heavier recalculation is not a performance concern here.
    const onFocusIn = () => ScrollTrigger.refresh()
    document.addEventListener('focusin', onFocusIn)

    return () => {
      lenisInstance = null
      gsap.ticker.remove(onTick)
      document.removeEventListener('focusin', onFocusIn)
      lenis.destroy()
    }
  }, [])
}

/** True when the user's OS/browser is set to minimize motion. */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Smooth-scrolls to an in-page section by id, offset so the fixed header
 * doesn't cover its top edge. Jumps instantly instead of animating when the
 * user prefers reduced motion.
 */
export function scrollToSection(sectionId: string) {
  const target = document.getElementById(sectionId)
  if (!target) return

  const header = document.querySelector<HTMLElement>(HEADER_SELECTOR)
  const headerOffset = header ? header.offsetHeight : 0
  const reduceMotion = prefersReducedMotion()

  if (lenisInstance) {
    lenisInstance.scrollTo(target, {
      offset: -headerOffset,
      immediate: reduceMotion,
    })
  } else {
    // Defensive fallback only — useSmoothScroll mounts on App load, well
    // before a user could realistically click a nav link.
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }
}
