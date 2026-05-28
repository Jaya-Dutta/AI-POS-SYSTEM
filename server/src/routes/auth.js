const express = require('express')
const { admin } = require('../config/firebase')
const auth = require('../middleware/auth')

const router = express.Router()

function cookieOptions() {
  const prod = process.env.NODE_ENV === 'production'
  // Use __session per Firebase Hosting/Cloud Functions convention
  return {
    httpOnly: true,
    secure: !!(prod || process.env.COOKIE_SECURE === 'true'),
    sameSite: (prod || process.env.COOKIE_SECURE === 'true') ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  }
}

// POST /api/auth/sessionLogin { idToken }
router.post('/sessionLogin', async (req, res) => {
  try {
    const idToken = req.body?.idToken || req.body?.token
    if (!idToken) return res.status(400).json({ error: 'idToken required' })

    const expiresIn = 7 * 24 * 60 * 60 * 1000 // 7 days
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn })

    res.cookie('__session', sessionCookie, cookieOptions())
    res.json({ ok: true })
  } catch (e) {
    console.error('sessionLogin error:', e.message)
    res.status(401).json({ error: 'Failed to create session' })
  }
})

// GET /api/auth/debugLogin?token=IDTOKEN - helper for local dev to set __session
router.get('/debugLogin', async (req, res) => {
  try {
    const idToken = req.query?.token || req.headers['x-id-token']
    if (!idToken) return res.status(400).json({ error: 'token query param required' })

    const expiresIn = 7 * 24 * 60 * 60 * 1000
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn })
    res.cookie('__session', sessionCookie, cookieOptions())
    res.json({ ok: true })
  } catch (e) {
    res.status(401).json({ error: 'Failed to set session' })
  }
})

// Protected: who am I
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user })
})

// POST /api/auth/sessionLogout -> clears cookie
router.post('/sessionLogout', async (req, res) => {
  try {
    res.clearCookie('__session', { ...cookieOptions(), maxAge: 0 })
    res.json({ ok: true })
  } catch (e) {
    res.status(200).json({ ok: true })
  }
})

module.exports = router
