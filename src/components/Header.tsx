import { scrollToSection } from '../hooks/useSmoothScroll'

const NAV_LINKS = [
  { label: 'Pricing', sectionId: 'pricing' },
  { label: 'Contact', sectionId: 'contact' },
]

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary-fixed'

function Header() {
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault()
    scrollToSection(sectionId)
  }

  return (
    <nav
      id="site-header"
      className="fixed top-0 z-50 flex w-full max-w-container-max items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-margin-mobile py-6 backdrop-blur-xl md:px-margin-desktop mx-auto left-0 right-0"
    >
      <a
        href="#"
        className="font-headline-md text-headline-md tracking-tighter text-on-surface"
      >
        MERIDIAN RENDER CO.
      </a>
      <div className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => (
          <a
            key={link.sectionId}
            href={`#${link.sectionId}`}
            onClick={(event) => handleNavClick(event, link.sectionId)}
            className={`font-label-caps text-label-caps uppercase text-on-surface-variant transition-colors hover:text-on-surface ${FOCUS_RING}`}
          >
            {link.label}
          </a>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scrollToSection('contact')}
        className={`font-label-caps text-label-caps border border-outline-variant/20 px-6 py-3 text-primary transition-all duration-300 hover:bg-on-surface hover:text-background active:scale-95 active:opacity-80 ${FOCUS_RING}`}
      >
        DEMO TOUR
      </button>
    </nav>
  )
}

export default Header
