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

  return (
    <div className="font-body-md text-on-surface antialiased selection:bg-tertiary-fixed selection:text-primary-container overflow-x-hidden">
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
