import { useEffect, useState } from 'react'
import Header from './components/Header'
import ScrollHero from './components/ScrollHero'
import FeatureStrip from './components/FeatureStrip'
import CaseStudy from './components/CaseStudy'
import Pricing from './components/Pricing'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'
import { useSmoothScroll } from './hooks/useSmoothScroll'

function App() {
  useSmoothScroll()

  // Fades the whole page in once React has actually mounted, so the initial
  // paint reads as a deliberate reveal rather than a blank-to-content glitch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Carries a picked pricing tier into the contact form's message field.
  // Lifted here since Pricing and ContactSection are siblings.
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  return (
    <div
      className={`font-body-md text-on-surface antialiased selection:bg-tertiary-fixed selection:text-primary-container overflow-x-hidden transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      <Header />
      <ScrollHero />
      <main>
        <FeatureStrip />
        <CaseStudy />
        <Pricing onSelectPlan={setSelectedPlan} />
        <ContactSection selectedPlan={selectedPlan} />
      </main>
      <Footer />
    </div>
  )
}

export default App
