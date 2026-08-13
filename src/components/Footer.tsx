const SOCIAL_LINKS = ['Instagram', 'LinkedIn', 'WhatsApp']

function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-container-max flex-col items-start justify-between gap-gutter border-t border-outline-variant/10 bg-background px-margin-mobile py-section-gap md:flex-row md:items-center md:px-margin-desktop">
      <div className="font-headline-md text-headline-md text-on-surface">
        STUDIO NOIR
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:gap-12">
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link}
            href="#"
            className="font-body-md text-body-md text-on-surface-variant transition-colors hover:text-tertiary-fixed"
          >
            {link.toUpperCase()}
          </a>
        ))}
      </div>
      <div className="font-body-md text-body-md text-on-surface-variant">
        © 2024 STUDIO NOIR. AJMER, INDIA.
      </div>
    </footer>
  )
}

export default Footer
