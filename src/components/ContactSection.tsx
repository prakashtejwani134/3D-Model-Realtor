import { useScrollReveal } from '../hooks/useScrollReveal'

function ContactSection() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const sectionRef = useScrollReveal<HTMLElement>()

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="mx-auto max-w-container-max px-margin-mobile pb-section-gap md:px-margin-desktop"
    >
      <div className="grid grid-cols-1 items-start gap-gutter md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-6 pr-0 md:gap-8 md:pr-16">
          <span className="font-label-caps text-label-caps uppercase text-tertiary-fixed">
            Get in Touch
          </span>
          <h2 className="font-headline-lg text-headline-md text-on-surface md:text-headline-lg">
            Initiate a Dialogue.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Whether you have a specific project in mind or want to explore
            our capabilities, we are ready to elevate your property&apos;s
            visual narrative.
          </p>
          <button
            type="button"
            className="group -mx-2 flex w-fit items-center gap-3 px-2 py-3 text-on-surface transition-colors hover:text-tertiary-fixed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary-fixed"
          >
            <span className="material-symbols-outlined text-2xl transition-transform group-hover:scale-110">
              chat
            </span>
            <span className="font-label-caps text-label-caps border-b border-transparent pb-0.5 uppercase group-hover:border-tertiary-fixed">
              Chat on WhatsApp
            </span>
          </button>
        </div>

        <div className="raised-surface mt-12 p-8 md:mt-0 md:p-12">
          <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label
                htmlFor="contact-name"
                className="font-label-caps text-label-caps mb-2 uppercase text-on-surface-variant"
              >
                Name
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                className="input-field font-body-md text-body-md"
                placeholder="Your name"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="contact-email"
                className="font-label-caps text-label-caps mb-2 uppercase text-on-surface-variant"
              >
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                className="input-field font-body-md text-body-md"
                placeholder="you@company.com"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="contact-phone"
                className="font-label-caps text-label-caps mb-2 uppercase text-on-surface-variant"
              >
                Phone
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="input-field font-body-md text-body-md"
                placeholder="+1 555 000 0000"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="contact-message"
                className="font-label-caps text-label-caps mb-2 uppercase text-on-surface-variant"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={3}
                className="input-field font-body-md text-body-md resize-none"
                placeholder="Tell us about the property, market, and desired launch date."
              />
            </div>
            <button
              type="submit"
              className="btn-primary font-label-caps text-label-caps mt-4 px-8 py-4 uppercase"
            >
              Send Inquiry
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
