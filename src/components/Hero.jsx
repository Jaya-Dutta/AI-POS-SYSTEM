import React from 'react'
import { Brain, Shield, Cloud, Zap, ChevronRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const Hero = ({ onGetStarted }) => {
  const { t } = useTheme()
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
          <Brain className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-blue-500 font-medium">Powered by AI</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          Smart POS for Modern Retail
        </h1>

        <p className={`text-xl ${t.textSecondary} mb-10`}>
          Automate billing, inventory, and analytics with AI-powered technology.
          Perfect for small shopkeepers and local retailers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={onGetStarted} className={`px-8 py-4 ${t.accent} ${t.accentHover} text-white rounded-lg font-medium text-lg transition flex items-center justify-center space-x-2`}>
            <span>Start Free Trial</span>
            <ChevronRight className="w-5 h-5" />
          </button>
          <button className={`px-8 py-4 ${t.bgCard} border ${t.border} rounded-lg font-medium text-lg transition hover:border-blue-500`}>
            Watch Demo
          </button>
        </div>

        <div className={`mt-12 flex items-center justify-center space-x-8 text-sm ${t.textSecondary}`}>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span>Secure & Encrypted</span>
          </div>
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-blue-500" />
            <span>Cloud-Based</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <span>Real-time Sync</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
