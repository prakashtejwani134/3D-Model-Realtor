import { useEffect, useState, type RefObject } from 'react'

/**
 * Tracks whether `ref`'s element intersects the viewport. Defaults to
 * visible so nothing is skipped on first paint before the observer attaches.
 */
export function useInViewport(ref: RefObject<Element | null>, rootMargin = '200px') {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      rootMargin,
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [ref, rootMargin])

  return isVisible
}
