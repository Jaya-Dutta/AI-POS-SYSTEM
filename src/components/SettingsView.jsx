import React from 'react'
import { useTheme } from '../context/ThemeContext'

const SettingsView = () => {
  const { t } = useTheme()

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg`}>
          <h2 className="text-xl font-bold mb-4">Store Information</h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm mb-2 ${t.textSecondary}`}>Store Name</label>
              <input
                type="text"
                placeholder="My Retail Store"
                className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
              />
            </div>
            <div>
              <label className={`block text-sm mb-2 ${t.textSecondary}`}>Store Address</label>
              <textarea
                placeholder="123 Main St, City, State, ZIP"
                className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                rows="3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary}`}>Phone</label>
                <input
                  type="tel"
                  placeholder="+91 1234567890"
                  className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary}`}>Email</label>
                <input
                  type="email"
                  placeholder="store@example.com"
                  className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                />
              </div>
            </div>
            <button className={`px-6 py-2 ${t.accent} ${t.accentHover} text-white rounded-lg`}>
              Save Store Info
            </button>
          </div>
        </div>

        <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg`}>
          <h2 className="text-xl font-bold mb-4">Tax Settings</h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm mb-2 ${t.textSecondary}`}>Default Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                defaultValue="18"
                className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
              />
            </div>
            <button className={`px-6 py-2 ${t.accent} ${t.accentHover} text-white rounded-lg`}>
              Save Tax Settings
            </button>
          </div>
        </div>

        <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg`}>
          <h2 className="text-xl font-bold mb-4">Receipt Settings</h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm mb-2 ${t.textSecondary}`}>Receipt Header</label>
              <input
                type="text"
                placeholder="Thank you for shopping with us!"
                className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
              />
            </div>
            <div>
              <label className={`block text-sm mb-2 ${t.textSecondary}`}>Receipt Footer</label>
              <input
                type="text"
                placeholder="Please visit again!"
                className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
              />
            </div>
            <button className={`px-6 py-2 ${t.accent} ${t.accentHover} text-white rounded-lg`}>
              Save Receipt Settings
            </button>
          </div>
        </div>

        <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg`}>
          <h2 className="text-xl font-bold mb-4">API Configuration</h2>
          <div className="space-y-4">
            <p className={t.textSecondary}>Configure your Firebase and AI service credentials in the server .env file.</p>
            <div className={`p-4 ${t.bgSecondary} rounded-lg border ${t.border}`}>
              <p className="font-mono text-sm">Server: http://localhost:4000</p>
              <p className="font-mono text-sm mt-2">Environment: Development</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsView
