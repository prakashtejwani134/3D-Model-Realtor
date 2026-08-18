function Hero() {
  return (
    <section className="mx-auto flex min-h-screen max-w-container-max flex-col items-center justify-center px-margin-mobile pb-section-gap pt-32 text-center md:px-margin-desktop">
      <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg mx-auto mb-8 max-w-4xl text-on-surface">
        Walk through the home before you walk through the door.
      </h1>
      <p className="font-body-lg text-body-lg mx-auto mb-12 max-w-2xl text-on-surface-variant">
        Experience photorealistic 3D property tours that redefine the
        pre-construction experience.
      </p>
      <button
        type="button"
        className="btn-primary font-label-caps text-label-caps px-8 py-4 uppercase tracking-[0.15em]"
      >
        Request a Demo Tour
      </button>
    </section>
  )
}

export default Hero
