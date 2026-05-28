import React from 'react'
import { ShoppingCart, Package, Users, BarChart3, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const Sidebar = ({ activeView, setActiveView, onLogout }) => {
  const { t, isDarkMode, toggleTheme } = useTheme()

  const menuItems = [
    { id: 'pos', label: 'POS', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className={`w-64 ${t.bgSecondary} border-r ${t.border} flex flex-col h-screen`}>
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-8 h-8 text-blue-500" />
          <span className="text-xl font-bold">AI POS</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : `${t.bgCard} hover:bg-gray-700`
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${t.bgCard} hover:bg-gray-700 transition`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={onLogout}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${t.bgCard} hover:bg-red-600 transition`}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
