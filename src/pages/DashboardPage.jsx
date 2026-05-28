import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import Sidebar from '../components/Sidebar'
import POSView from '../components/POSView'
import ProductsView from '../components/ProductsView'
import CustomersView from '../components/CustomersView'
import ReportsView from '../components/ReportsView'
import SettingsView from '../components/SettingsView'
import { onAuthStateChanged, signOut, getAuthInstance, initFirebase, isFirebaseConfigured } from '../lib/firebase'

const DashboardPage = ({ onLogout }) => {
  const { t } = useTheme()
  const [activeView, setActiveView] = useState('pos')
  const [user, setUser] = useState(null)

useEffect(() => {
    if (isFirebaseConfigured()) {
      initFirebase()
      const unsub = onAuthStateChanged(getAuthInstance(), (u) => setUser(u))
      return () => unsub && unsub()
    }
    return () => {}
  }, [])

  const renderView = () => {
    switch (activeView) {
      case 'pos':
        return <POSView />
      case 'products':
        return <ProductsView />
      case 'customers':
        return <CustomersView />
      case 'reports':
        return <ReportsView />
      case 'settings':
        return <SettingsView />
      default:
        return <POSView />
    }
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} flex`}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} />
      <div className="flex-1 overflow-auto">
        <div className={`w-full flex items-center justify-between px-4 py-3 border-b ${t.border}`}>
          <div className="text-sm opacity-80">
            {user ? (
              <>
                <span className="font-medium">{user.displayName || user.email}</span>
                {user.displayName && <span className={`ml-2 ${t.textSecondary}`}>({user.email})</span>}
              </>
            ) : (
              <span className={t.textSecondary}>Not signed in</span>
            )}
          </div>
          {user && (
            <button
              onClick={async () => { try { await signOut(getAuthInstance()) } finally { onLogout && onLogout() } }}
              className={`px-3 py-1.5 rounded-lg border ${t.border} ${t.bgCard} hover:border-blue-500 transition text-sm`}
            >
              Sign out
            </button>
          )}
        </div>
        {renderView()}
      </div>
    </div>
  )
}

export default DashboardPage
