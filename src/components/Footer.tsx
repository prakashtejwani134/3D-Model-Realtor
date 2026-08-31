const LINKEDIN_URL = 'https://www.linkedin.com/in/prakash-tejwani-90ab32194/'

const WHATSAPP_NUMBER = '916377986953'
const WHATSAPP_MESSAGE =
  "Hi Meridian Render Co., I'd like to know more about your 3D property visualization services."
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

const SOCIAL_LINKS = [
  { label: 'LinkedIn', href: LINKEDIN_URL },
  { label: 'WhatsApp', href: WHATSAPP_URL },
]

function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-container-max flex-col items-start justify-between gap-gutter border-t border-outline-variant/10 bg-background px-margin-mobile py-section-gap md:flex-row md:items-center md:px-margin-desktop">
      <div className="font-headline-md text-headline-md text-on-surface">
        MERIDIAN RENDER CO.
      </div>
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body-md text-body-md text-on-surface-variant"
          >
            {link.label.toUpperCase()}
          </a>
        ))}
      </div>
      <div className="flex flex-col gap-1 font-body-md text-body-md text-on-surface-variant">
        <span>© {new Date().getFullYear()} MERIDIAN RENDER CO. AJMER, INDIA.</span>
        <span>Serving real-estate teams in the US and UAE.</span>
      </div>
    </footer>
  )
}

export default Footer
