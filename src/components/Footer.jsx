import React from 'react'
import { useTheme } from '../context/ThemeContext'

const Footer = () => {
  const { t } = useTheme()
  return (
    <footer className={`border-t ${t.border} py-8`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center ${t.textSecondary}`}>
        <p>&copy; 2025 AI POS. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
