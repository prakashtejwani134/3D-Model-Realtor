const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA57HXIqzeMyUPm-EN7UaUAvyuMcOWcs0FhGfzowADCWPFjom-F0gj4KRziloWuubDxL_Rs1U7nlIGGjOD3wFedNY4Ra-ih8s15evM-7RuXUk-83xFl08X05P3EfzeG4OQhUJQk0IE910L5onWpzKKBNZMQrx4EyBu6_BM5ijqtIG88ptXZanrxy7szGDYbkCeJIJZoOpwXiewbmM7oUNl2XGV6mT34l1Qxu4D8D7jPbOzIZkSkGv1j'

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
        className="btn-primary font-label-caps text-label-caps mb-16 px-8 py-4 uppercase tracking-[0.15em]"
      >
        Request a Demo Tour
      </button>

      <div className="raised-surface group relative aspect-video w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80 transition-transform duration-1000 group-hover:scale-105"
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="material-symbols-outlined cursor-pointer text-6xl text-tertiary-fixed opacity-70 drop-shadow-lg transition-opacity hover:opacity-100"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            play_circle
          </span>
        </div>
      </div>
    </section>
  )
}

export default Hero
