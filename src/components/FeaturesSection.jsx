import React from 'react'
import { Brain, BarChart3, Package, Users, FileText, Zap } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const FeaturesSection = () => {
  const { t } = useTheme()
  const features = [
    { icon: <Brain className="w-8 h-8" />, title: 'AI-Powered OCR', description: 'Automatically extract data from uploaded bills using advanced AI' },
    { icon: <BarChart3 className="w-8 h-8" />, title: 'Smart Analytics', description: 'Get insights on sales trends and profit predictions' },
    { icon: <Package className="w-8 h-8" />, title: 'Inventory Management', description: 'Auto-update stock with low inventory alerts' },
    { icon: <Users className="w-8 h-8" />, title: 'Customer Profiles', description: 'Maintain customer history and vendor records' },
    { icon: <FileText className="w-8 h-8" />, title: 'Invoice Generation', description: 'Create professional invoices with GST calculation' },
    { icon: <Zap className="w-8 h-8" />, title: 'Real-time Updates', description: 'Cloud-based system accessible from anywhere' },
  ]

  return (
    <div id="features" className={`${t.bgSecondary} py-20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
          <p className={`text-xl ${t.textSecondary}`}>Everything you need to run your retail business efficiently</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className={`${t.bgCard} border ${t.border} rounded-xl p-6 hover:border-blue-500 transition`}>
              <div className="w-16 h-16 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className={t.textSecondary}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FeaturesSection
