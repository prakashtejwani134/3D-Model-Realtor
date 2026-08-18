import { useEffect, useState } from 'react'
import Header from './components/Header'
import HeroVideoInterlude from './components/HeroVideoInterlude'
import Hero from './components/Hero'
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

  return (
    <div
      className={`font-body-md text-on-surface antialiased selection:bg-tertiary-fixed selection:text-primary-container overflow-x-hidden transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      <Header />
      <HeroVideoInterlude />
      <main>
        <Hero />
        <FeatureStrip />
        <CaseStudy />
        <Pricing />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}

export default App
