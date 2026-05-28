import React from 'react'
import { Check } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const BenefitsSection = () => {
  const { t } = useTheme()
  const benefits = [
    'Automate manual data entry',
    'Reduce billing errors by 90%',
    'Track inventory in real-time',
    'Generate tax reports instantly',
    'Multi-device synchronization',
    '24/7 AI assistant support',
  ]

  return (
    <div id="benefits" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Why Choose AI POS?</h2>
            <p className={`text-lg ${t.textSecondary} mb-8`}>
              Transform your retail operations with cutting-edge AI technology designed specifically for small businesses.
            </p>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`${t.bgCard} border ${t.border} rounded-2xl p-8`}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className={t.textSecondary}>Traditional POS</span>
                <span className="text-red-500 font-medium">Manual Entry</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={t.textSecondary}>AI POS</span>
                <span className="text-green-500 font-medium">Auto Extract</span>
              </div>
              <div className={`pt-6 border-t ${t.border}`}>
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-500 mb-2">90%</div>
                  <p className={t.textSecondary}>Faster billing process</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BenefitsSection
