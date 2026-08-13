const NAV_LINKS = ['Portfolio', 'Services', 'Pricing', 'Contact']

function Header() {
  return (
    <nav className="fixed top-0 z-50 flex w-full max-w-container-max items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-margin-mobile py-6 backdrop-blur-xl md:px-margin-desktop mx-auto left-0 right-0">
      <a
        href="#"
        className="font-headline-md text-headline-md tracking-tighter text-on-surface"
      >
        STUDIO NOIR
      </a>
      <div className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href="#"
            className="font-label-caps text-label-caps uppercase text-on-surface-variant transition-colors hover:text-on-surface"
          >
            {link}
          </a>
        ))}
      </div>
      <button
        type="button"
        className="font-label-caps text-label-caps border border-outline-variant/20 px-6 py-3 text-primary transition-all duration-300 hover:bg-on-surface hover:text-background active:scale-95 active:opacity-80"
      >
        DEMO TOUR
      </button>
    </nav>
  )
}

export default Header
