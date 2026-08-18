import Header from './components/Header'
import HeroScene from './components/HeroScene'
import Hero from './components/Hero'
import HeroVideoInterlude from './components/HeroVideoInterlude'
import HeroChairDetail from './components/HeroChairDetail'
import FeatureStrip from './components/FeatureStrip'
import CaseStudy from './components/CaseStudy'
import Pricing from './components/Pricing'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'

function App() {
  return (
    <div className="font-body-md text-on-surface antialiased selection:bg-tertiary-fixed selection:text-primary-container overflow-x-hidden">
      <HeroScene />
      <Header />
      <main>
        <Hero />
        <FeatureStrip />
        <CaseStudy />
        <HeroVideoInterlude />
        <HeroChairDetail />
        <Pricing />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}

export default App
