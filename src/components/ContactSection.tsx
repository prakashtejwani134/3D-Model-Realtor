import { useEffect, useRef, useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

type ContactSectionProps = {
  /** Tier name picked on the Pricing section, if any. */
  selectedPlan?: string | null
}

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xqpkayqv'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

function ContactSection({ selectedPlan }: ContactSectionProps) {
  const sectionRef = useScrollReveal<HTMLElement>()
  const messageRef = useRef<HTMLTextAreaElement>(null)

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')

  // Prefills the message field when a plan is picked on Pricing, without
  // disturbing anything the visitor may have already typed elsewhere.
  useEffect(() => {
    if (selectedPlan) {
      setMessage(`Interested in: ${selectedPlan}\n\n`)
      messageRef.current?.focus()
    }
  }, [selectedPlan])

  const isValid = email.trim() !== '' && message.trim() !== ''

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid || status === 'submitting') return

    setStatus('submitting')

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(event.currentTarget),
      })

      if (response.ok) {
        setStatus('success')
        setEmail('')
        setPhone('')
        setMessage('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

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
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field font-body-md text-body-md"
                placeholder="you@company.com"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="contact-phone"
                className="font-label-caps text-label-caps mb-2 uppercase text-on-surface-variant"
              >
                Phone{' '}
                <span className="normal-case text-on-surface-variant/70">
                  (Optional)
                </span>
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
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
                required
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="input-field font-body-md text-body-md resize-none"
                placeholder="Tell us about the property, market, and desired launch date."
              />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="submit"
                disabled={!isValid || status === 'submitting'}
                aria-disabled={!isValid || status === 'submitting'}
                className="btn-primary font-label-caps text-label-caps px-8 py-4 uppercase disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'submitting' ? 'Sending…' : 'Send Inquiry'}
              </button>
              <div aria-live="polite">
                {status === 'success' && (
                  <span className="font-body-md text-body-md text-tertiary-fixed">
                    Thank you — your inquiry has been received. We&apos;ll
                    reply within one business day.
                  </span>
                )}
                {status === 'error' && (
                  <span className="font-body-md text-body-md text-error">
                    We couldn&apos;t send your inquiry. Please try again or
                    email hello@meridianrenderco.com.
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
