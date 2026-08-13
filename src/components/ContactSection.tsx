function ContactSection() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <section className="mx-auto max-w-container-max px-margin-mobile pb-section-gap md:px-margin-desktop">
      <div className="grid grid-cols-1 items-start gap-gutter md:grid-cols-2">
        <div className="flex flex-col gap-8 pr-0 md:pr-16">
          <h2 className="font-headline-lg text-4xl leading-tight text-on-surface md:text-headline-lg">
            Initiate a Dialogue.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Whether you have a specific project in mind or want to explore
            our capabilities, we are ready to elevate your property&apos;s
            visual narrative.
          </p>
          <button
            type="button"
            className="group flex w-fit items-center gap-3 text-on-surface transition-colors hover:text-tertiary-fixed"
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
              <label className="font-label-caps text-label-caps mb-2 uppercase text-on-surface-variant">
                Name
              </label>
              <input
                type="text"
                className="input-field font-body-md text-body-md"
                placeholder="John Doe"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-label-caps text-label-caps mb-2 uppercase text-on-surface-variant">
                Email
              </label>
              <input
                type="email"
                className="input-field font-body-md text-body-md"
                placeholder="john@developer.com"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-label-caps text-label-caps mb-2 uppercase text-on-surface-variant">
                Phone
              </label>
              <input
                type="tel"
                className="input-field font-body-md text-body-md"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-label-caps text-label-caps mb-2 uppercase text-on-surface-variant">
                Message
              </label>
              <textarea
                rows={3}
                className="input-field font-body-md text-body-md resize-none"
                placeholder="Tell us about your project..."
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
