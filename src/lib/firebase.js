// Firebase initialization and providers
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, setPersistence, browserLocalPersistence, onAuthStateChanged, signOut } from 'firebase/auth'

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

function hasEnv(name) {
  const v = import.meta.env[name]
  return !(v === undefined || v === '')
}

export function isFirebaseConfigured() {
  return requiredKeys.every(hasEnv)
}

function getEnv(name) {
  const v = import.meta.env[name]
  if (v === undefined || v === '') {
    console.warn(`[firebase] Missing env: ${name}. Create a .env with this key.`)
  }
  return v
}

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
}

let appInstance
let authInstance

function initFirebase() {
  if (!isFirebaseConfigured()) {
    console.warn('[firebase] Skipping initialization: env not configured')
    appInstance = null
    authInstance = null
    return { app: null, auth: null }
  }
  if (!appInstance) {
    appInstance = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
    authInstance = getAuth(appInstance)
    // Ensure auth state persists across reloads
    setPersistence(authInstance, browserLocalPersistence).catch(() => {})
  }
  return { app: appInstance, auth: authInstance }
}

function getAuthInstance() {
  if (!authInstance) initFirebase()
  return authInstance
}

/**
 * Get the current Firebase ID token for the authenticated user
 * Returns null if no user is signed in
 */
export async function getCurrentIdToken() {
  try {
    const auth = getAuthInstance()
    if (!auth) return null
    const user = auth.currentUser
    if (!user) return null
    // Force refresh to get a fresh token
    return await user.getIdToken(true)
  } catch (error) {
    console.error('Error getting ID token:', error)
    return null
  }
}

const googleProvider = new GoogleAuthProvider()

export { initFirebase, getAuthInstance, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, onAuthStateChanged, signOut }
