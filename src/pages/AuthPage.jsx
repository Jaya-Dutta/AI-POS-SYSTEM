import React, { useState, useEffect } from 'react'
import { ShoppingCart, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { initFirebase, getAuthInstance, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, isFirebaseConfigured } from '../lib/firebase'

const AuthPage = ({ onBack, onLogin }) => {
  const { t, isDarkMode, toggleTheme } = useTheme()
  const [authMode, setAuthMode] = useState('login')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    shopName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

useEffect(() => {
    if (!isFirebaseConfigured()) return
    initFirebase()
    ;(async () => {
      try {
        const auth = getAuthInstance()
        if (!auth) return
        const res = await getRedirectResult(auth)
        if (res?.user) {
          const token = await res.user.getIdToken()
          localStorage.setItem('token', token)
          if (onLogin) onLogin()
        }
      } catch (e) {
        console.error('Redirect sign-in failed:', e)
      }
    })()
  }, [])

const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (!isFirebaseConfigured()) {
        // Demo mode: accept any credentials
        localStorage.setItem('token', 'demo-token')
        if (onLogin) onLogin()
        return
      }
      if (authMode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          return
        }
        const auth = getAuthInstance(); if (!auth) throw new Error('Auth not initialized')
        const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
        if (formData.name) {
          try { await updateProfile(user, { displayName: formData.name }) } catch {}
        }
        const token = await user.getIdToken()
        localStorage.setItem('token', token)
        if (onLogin) onLogin()
      } else {
        const auth = getAuthInstance(); if (!auth) throw new Error('Auth not initialized')
        const { user } = await signInWithEmailAndPassword(auth, formData.email, formData.password)
        const token = await user.getIdToken()
        localStorage.setItem('token', token)
        if (onLogin) onLogin()
      }
    } catch (e) {
      console.error('Email/password auth failed:', e)
      setError(e?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      if (!isFirebaseConfigured()) {
        localStorage.setItem('token', 'demo-token')
        if (onLogin) onLogin()
        return
      }
      const auth = getAuthInstance(); if (!auth) throw new Error('Auth not initialized')
      const result = await signInWithPopup(auth, googleProvider)
      const token = await result.user.getIdToken()
      localStorage.setItem('token', token)
      if (onLogin) onLogin()
    } catch (e) {
      if (e?.code === 'auth/popup-blocked') {
        const auth = getAuthInstance(); if (!auth) { setError('Auth not initialized'); return }
        await signInWithRedirect(auth, googleProvider)
        return
      }
      console.error('Google sign-in failed:', e)
      setError(e?.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} flex items-center justify-center px-4`}>
      <button
        onClick={onBack}
        className={`absolute top-4 left-4 px-4 py-2 ${t.bgCard} border ${t.border} rounded-lg hover:border-blue-500 transition`}
      >
        ← Back
      </button>

      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2 rounded-lg ${t.bgCard} border ${t.border}`}
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className={`w-full max-w-md ${t.bgSecondary} rounded-2xl border ${t.border} p-8`}>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <ShoppingCart className="w-10 h-10 text-blue-500" />
            <span className="text-2xl font-bold">AI POS</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className={t.textSecondary}>
            {authMode === 'login' ? 'Sign in to access your dashboard' : 'Start your free trial today'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500 text-red-400 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-lg border border-emerald-500 text-emerald-400 px-4 py-3 text-sm">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {authMode === 'signup' && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-2 ${t.textSecondary}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${t.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${t.textSecondary}`}>
                  Shop Name
                </label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${t.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
                  placeholder="My Retail Store"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${t.textSecondary}`}>
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${t.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${t.textSecondary}`}>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg border ${t.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
              placeholder="••••••••"
              required
            />
          </div>

          {authMode === 'signup' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${t.textSecondary}`}>
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border ${t.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {authMode === 'login' && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded border-slate-600" />
                <span className={t.textSecondary}>Remember me</span>
              </label>
              <button type="button" onClick={async () => {
                setError(''); setInfo('');
                if (!formData.email) { setError('Enter your email above to reset password'); return }
                try {
if (!isFirebaseConfigured()) { setError('Password reset requires Firebase to be configured'); return } await sendPasswordResetEmail(getAuthInstance(), formData.email)
                  setInfo('Password reset email sent')
                } catch (e) {
                  console.error('Reset failed:', e)
                  setError(e?.message || 'Failed to send reset email')
                }
              }} className="text-blue-500 hover:text-blue-400">
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 ${t.accent} ${t.accentHover} text-white rounded-lg font-medium transition disabled:opacity-60`}
          >
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="relative my-6">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${t.border}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${t.bg} ${t.textSecondary}`}>Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className={`w-full py-3 ${t.bgCard} border ${t.border} rounded-lg font-medium hover:border-blue-500 transition flex items-center justify-center space-x-2 disabled:opacity-60`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{loading ? 'Signing in...' : 'Google'}</span>
          </button>
        </form>

        <p className={`text-center mt-6 text-sm ${t.textSecondary}`}>
          {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="text-blue-500 hover:text-blue-400 font-medium"
          >
            {authMode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthPage
