import React, { useState } from 'react'
import { ShoppingCart, Sun, Moon, Menu, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const Navbar = ({ onGetStarted }) => {
  const { t, isDarkMode, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className={`${t.bgSecondary} border-b ${t.border} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold">AI POS</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className={`${t.textSecondary} hover:${t.text} transition`}>Features</a>
            <a href="#benefits" className={`${t.textSecondary} hover:${t.text} transition`}>Benefits</a>
            <a href="#pricing" className={`${t.textSecondary} hover:${t.text} transition`}>Pricing</a>
            <button onClick={toggleTheme} className={`p-2 rounded-lg ${t.bgCard} border ${t.border}`}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={onGetStarted} className={`px-6 py-2 ${t.accent} ${t.accentHover} text-white rounded-lg transition`}>
              Get Started
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={`md:hidden ${t.bgSecondary} border-t ${t.border}`}>
          <div className="px-4 py-4 space-y-3">
            <a href="#features" className={`block ${t.textSecondary}`}>Features</a>
            <a href="#benefits" className={`block ${t.textSecondary}`}>Benefits</a>
            <a href="#pricing" className={`block ${t.textSecondary}`}>Pricing</a>
            <button onClick={onGetStarted} className={`w-full px-6 py-2 ${t.accent} text-white rounded-lg`}>
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
