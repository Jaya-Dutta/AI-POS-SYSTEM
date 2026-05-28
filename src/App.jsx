import React, { useState, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import { initFirebase, getAuthInstance, onAuthStateChanged, signOut, isFirebaseConfigured } from './lib/firebase'

const App = () => {
  const [currentPage, setCurrentPage] = useState('landing')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize Firebase and check auth state on mount
  useEffect(() => {
    if (isFirebaseConfigured()) {
      initFirebase()
      const auth = getAuthInstance()
      if (auth) {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setIsAuthenticated(true)
            setCurrentPage((prev) => {
              // Only redirect to dashboard if on landing or auth page
              if (prev === 'landing' || prev === 'auth') {
                return 'dashboard'
              }
              return prev
            })
          } else {
            setIsAuthenticated(false)
            setCurrentPage((prev) => {
              // Only redirect to landing if on dashboard
              if (prev === 'dashboard') {
                return 'landing'
              }
              return prev
            })
          }
        })
        return () => unsubscribe()
      }
    } else {
      // Demo mode: check localStorage for token
      const token = localStorage.getItem('token')
      if (token === 'demo-token') {
        setIsAuthenticated(true)
        setCurrentPage('dashboard')
      }
    }
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
    setCurrentPage('dashboard')
  }

  const handleLogout = async () => {
    if (isFirebaseConfigured()) {
      const auth = getAuthInstance()
      if (auth) {
        try {
          await signOut(auth)
        } catch (error) {
          console.error('Logout error:', error)
        }
      }
    }
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setCurrentPage('landing')
  }

  return (
    <ThemeProvider defaultDark={true}>
      {currentPage === 'landing' && (
        <LandingPage onGetStarted={() => setCurrentPage('auth')} />
      )}
      {currentPage === 'auth' && (
        <AuthPage 
          onBack={() => setCurrentPage('landing')} 
          onLogin={handleLogin}
        />
      )}
      {currentPage === 'dashboard' && isAuthenticated && (
        <DashboardPage onLogout={handleLogout} />
      )}
    </ThemeProvider>
  )
}

export default App
