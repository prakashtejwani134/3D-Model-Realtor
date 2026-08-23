import { useEffect, useRef } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

type ContactSectionProps = {
  /** Tier name picked on the Pricing section, if any. */
  selectedPlan?: string | null
}

function ContactSection({ selectedPlan }: ContactSectionProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const sectionRef = useScrollReveal<HTMLElement>()
  const messageRef = useRef<HTMLTextAreaElement>(null)

  // Prefills the message field when a plan is picked on Pricing. Imperative
  // (not a controlled textarea) so it doesn't disturb anything the visitor
  // may have already typed in the other fields, and only touches this one
  // field exactly when the plan actually changes.
  useEffect(() => {
    if (selectedPlan && messageRef.current) {
      messageRef.current.value = `Interested in: ${selectedPlan}\n\n`
    }
  }, [selectedPlan])

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
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="group -mx-2 flex w-fit items-center gap-3 px-2 py-3 text-on-surface opacity-50 disabled:cursor-not-allowed disabled:hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-2xl">
                chat
              </span>
              <span className="font-label-caps text-label-caps border-b border-transparent pb-0.5 uppercase">
                Chat on WhatsApp
              </span>
            </button>
            <span className="font-body-md text-body-md text-on-surface-variant">
              Available in Phase 15.
            </span>
          </div>
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
                ref={messageRef}
                rows={3}
                className="input-field font-body-md text-body-md resize-none"
                placeholder="Tell us about the property, market, and desired launch date."
              />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="submit"
                disabled
                aria-disabled="true"
                className="btn-primary font-label-caps text-label-caps px-8 py-4 uppercase opacity-50 disabled:cursor-not-allowed"
              >
                Send Inquiry
              </button>
              <span className="font-body-md text-body-md text-on-surface-variant">
                Available in Phase 15.
              </span>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
