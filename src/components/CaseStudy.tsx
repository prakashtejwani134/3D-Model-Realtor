import { useScrollReveal } from '../hooks/useScrollReveal'

// Placeholder stock photo — doesn't match ScrollHero's bespoke Higgsfield
// grade. Content debt: swap for real project photography/renders when
// available. Copy below is deliberately framed as an illustrative concept
// demo (not a real client project) so this stock image never carries an
// unverified client, location, or value claim — see Batch 7 taste review.
const CASE_STUDY_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBOby5da9GAX2oaLOFCCmv4sy3hFldYFDLdf_enNilYu0382WoRWPPeOBGUsk0RM5zH9ZhpLPz_5QrY6VQCWxKgvU5g9dGZuwVt2JyTp2ctf8pfWhkpHfDvjzYgrs_npcUBL5i4Q_o7VY1AnsbybvXdDJryicOibF3QWJkNVHi8CrEidxHpq59rypBWlKOd4Qw8Lu0GKGIgKpca_rjrsn7N0sf47xvUwyGXNHCELJjbxoNhaRKPCrvR'

function CaseStudy() {
  const sectionRef = useScrollReveal<HTMLElement>()

  return (
    <section ref={sectionRef} className="mx-auto max-w-container-max px-margin-mobile pb-section-gap md:px-margin-desktop">
      <div className="grid grid-cols-1 items-center gap-gutter md:grid-cols-12">
        <div className="raised-surface relative aspect-[4/3] overflow-hidden md:col-span-7">
          <img
            src={CASE_STUDY_IMAGE}
            alt="Exterior architectural visualization of a modern luxury villa at dusk"
            className="absolute inset-0 h-full w-full object-cover opacity-90 grayscale transition-all duration-700 hover:grayscale-0"
          />
        </div>
        <div className="flex flex-col gap-6 pt-8 md:col-span-4 md:col-start-9 md:pt-0">
          <span className="font-label-caps text-label-caps uppercase text-tertiary-fixed">
            Concept Showcase
          </span>
          <h2 className="font-headline-lg text-headline-md text-on-surface md:text-headline-lg">
            Interactive 3D
            <br />
            Property Tours
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            A demonstration of the fully interactive 3D digital twins we
            build for luxury listings, letting buyers experience light,
            volume, and materials long before a single showing.
          </p>
          <div className="pt-4">
            <button
              type="button"
              className="btn-secondary font-label-caps text-label-caps px-8 py-4 uppercase"
            >
              See the Approach
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CaseStudy
