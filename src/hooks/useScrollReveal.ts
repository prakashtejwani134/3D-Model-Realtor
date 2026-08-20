import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from './useSmoothScroll'

gsap.registerPlugin(ScrollTrigger)

const REVEAL_Y = 20
const REVEAL_DURATION = 0.6
const REVEAL_EASE = 'power3.out'
const REVEAL_STAGGER = 0.06
const TRIGGER_START = 'top 85%'

type ScrollRevealOptions = {
  /**
   * Selector (scoped to the section) for repeated sibling items to
   * stagger-reveal individually, e.g. cards in a grid. Omit to reveal the
   * whole section as a single block.
   */
  staggerSelector?: string
}

/**
 * Restrained fade + rise entrance, triggered once when the section nears
 * the viewport. Mirrors ScrollHero's own gsap.context()-per-section and
 * opacity/transform-only discipline, riding the same Lenis-driven
 * ScrollTrigger.update() wiring from useSmoothScroll — no extra scroll
 * listener is created here.
 */
export function useScrollReveal<T extends HTMLElement>({ staggerSelector }: ScrollRevealOptions = {}) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const section = ref.current
    if (!section) return

    const targets = staggerSelector ? section.querySelectorAll(staggerSelector) : section

    if (prefersReducedMotion()) {
      gsap.set(targets, { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: REVEAL_Y })
      ScrollTrigger.create({
        trigger: section,
        start: TRIGGER_START,
        once: true,
        onEnter: () => {
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            duration: REVEAL_DURATION,
            ease: REVEAL_EASE,
            stagger: staggerSelector ? REVEAL_STAGGER : 0,
          })
        },
      })
    }, section)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staggerSelector])

  return ref
}
