import { useScrollReveal } from '../hooks/useScrollReveal'

const FEATURES = [
  {
    icon: 'view_in_ar',
    title: 'Interactive 3D Walkthrough',
    description: 'Immersive, browser-based exploration.',
  },
  {
    icon: 'movie',
    title: 'Cinematic Video Hero',
    description: 'High-fidelity animated sequences.',
  },
  {
    icon: 'smartphone',
    title: 'Mobile-Ready in Seconds',
    description: 'Optimized for every device.',
  },
]

function FeatureStrip() {
  const sectionRef = useScrollReveal<HTMLElement>({ staggerSelector: '[data-reveal-item]' })

  return (
    <section
      id="features"
      ref={sectionRef}
      className="mx-auto max-w-container-max px-margin-mobile pb-section-gap md:px-margin-desktop"
    >
      <div className="grid grid-cols-1 gap-gutter border-t border-outline-variant/20 pt-16 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} data-reveal-item className="flex flex-col items-start gap-4">
            <span
              className="material-symbols-outlined text-4xl text-tertiary-fixed"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {feature.icon}
            </span>
            <h2 className="font-body-lg text-body-lg text-on-surface">
              {feature.title}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default FeatureStrip
