import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import FeaturesSection from '../components/FeaturesSection'
import BenefitsSection from '../components/BenefitsSection'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'
import { useTheme } from '../context/ThemeContext'

const LandingPage = ({ onGetStarted }) => {
  const { t } = useTheme()
  return (
    <div className={`min-h-screen ${t.bg} ${t.text}`}>
      <Navbar onGetStarted={onGetStarted} />
      <Hero onGetStarted={onGetStarted} />
      <FeaturesSection />
      <BenefitsSection />
      <CTASection onGetStarted={onGetStarted} />
      <Footer />
    </div>
  )
}

export default LandingPage
