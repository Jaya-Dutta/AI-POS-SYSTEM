import React from 'react'
import { ChevronRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const CTASection = ({ onGetStarted }) => {
  const { t } = useTheme()
  return (
    <div className={`${t.bgSecondary} py-20`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
        <p className={`text-xl ${t.textSecondary} mb-10`}>
          Join hundreds of retailers who are already using AI POS to streamline their operations
        </p>
        <button
          onClick={onGetStarted}
          className={`px-10 py-4 ${t.accent} ${t.accentHover} text-white rounded-lg font-medium text-lg transition inline-flex items-center space-x-2`}
        >
          <span>Get Started for Free</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default CTASection
