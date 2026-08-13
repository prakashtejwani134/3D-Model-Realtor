type Tier = {
  name: string
  price: string
  period?: string
  features: string[]
  cta: string
  highlighted?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Single Tour',
    price: '$4,500',
    period: '/ project',
    features: [
      '1 Interactive 3D Tour',
      '5 High-Res Renders',
      'Web Hosting (1 Year)',
    ],
    cta: 'Begin Project',
  },
  {
    name: 'Monthly Retainer',
    price: '$12,000',
    period: '/ month',
    features: [
      'Up to 4 Tours per month',
      'Unlimited Renders',
      'Cinematic Video Teasers',
      'Priority Support',
    ],
    cta: 'Select Plan',
    highlighted: true,
  },
  {
    name: 'Custom Enterprise',
    price: 'Bespoke',
    features: [
      'Full Development Scale',
      'Custom UI/UX Integration',
      'VR Headset Ready files',
      'Dedicated Account Manager',
    ],
    cta: 'Contact Us',
  },
]

function Pricing() {
  return (
    <section className="mx-auto max-w-container-max px-margin-mobile pb-section-gap md:px-margin-desktop">
      <div className="mb-16 text-center">
        <h2 className="font-headline-md text-headline-md mb-4 text-on-surface">
          Investment
        </h2>
        <p className="font-body-md text-body-md mx-auto max-w-xl text-on-surface-variant">
          Transparent pricing for premium visual assets.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        {TIERS.map((tier, index) => (
          <div
            key={tier.name}
            className={`relative flex flex-col gap-6 p-8 border-b md:border-b-0 ${
              index < TIERS.length - 1 ? 'md:border-r' : ''
            } border-outline-variant/20 ${
              tier.highlighted ? 'bg-surface-container/30' : ''
            }`}
          >
            {tier.highlighted && (
              <div className="font-label-caps text-label-caps absolute right-0 top-0 bg-tertiary-fixed px-3 py-1 text-[10px] uppercase text-primary-container">
                Most Popular
              </div>
            )}
            <h3
              className={`font-body-lg text-body-lg ${
                tier.highlighted ? 'text-tertiary-fixed' : 'text-on-surface'
              }`}
            >
              {tier.name}
            </h3>
            <div className="font-headline-md text-headline-md text-on-surface">
              {tier.price}{' '}
              {tier.period && (
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {tier.period}
                </span>
              )}
            </div>
            <ul className="font-body-md text-body-md flex flex-grow flex-col gap-4 border-t border-outline-variant/10 pt-6 text-on-surface-variant">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm">
                    check
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`font-label-caps text-label-caps mt-8 w-full px-6 py-3 uppercase ${
                tier.highlighted
                  ? 'btn-secondary text-tertiary-fixed'
                  : 'btn-primary'
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Pricing
