const SOCIAL_LINKS = ['Instagram', 'LinkedIn', 'WhatsApp']

function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-container-max flex-col items-start justify-between gap-gutter border-t border-outline-variant/10 bg-background px-margin-mobile py-section-gap md:flex-row md:items-center md:px-margin-desktop">
      <div className="font-headline-md text-headline-md text-on-surface">
        STUDIO NOIR
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-6 md:flex-row md:gap-12">
          {SOCIAL_LINKS.map((link) => (
            <span
              key={link}
              aria-disabled="true"
              className="font-body-md text-body-md cursor-not-allowed text-on-surface-variant opacity-50"
            >
              {link.toUpperCase()}
            </span>
          ))}
        </div>
        <span className="font-body-md text-body-md text-on-surface-variant">
          Live links launch in Phase 15.
        </span>
      </div>
      <div className="flex flex-col gap-1 font-body-md text-body-md text-on-surface-variant">
        <span>© {new Date().getFullYear()} STUDIO NOIR. AJMER, INDIA.</span>
        <span>Serving real-estate teams in the US and UAE.</span>
      </div>
    </footer>
  )
}

export default Footer
