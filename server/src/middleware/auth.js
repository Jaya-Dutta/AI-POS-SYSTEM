const { admin, ensureFirebaseInitialized } = require('../config/firebase')

// Ensure Firebase is initialized before using admin
ensureFirebaseInitialized()

function parseCookies(cookieHeader) {
  const out = {}
  if (!cookieHeader) return out
  const parts = String(cookieHeader).split(/;\s*/)
  for (const p of parts) {
    const idx = p.indexOf('=')
    if (idx > -1) {
      const k = decodeURIComponent(p.slice(0, idx).trim())
      const v = decodeURIComponent(p.slice(idx + 1).trim())
      out[k] = v
    }
  }
  return out
}

function normalizeJwt(maybeToken) {
  if (!maybeToken) return null
  let token = String(maybeToken).trim()
  token = token.replace(/^"|^'|"$|'$/g, '') // strip surrounding quotes if present
  if (token.split('.').length !== 3) return null
  return token
}

function extractAuth(req) {
  // 1) Headers (various forms)
  const headerCandidates = [
    req.headers.authorization,
    req.headers.Authorization,
    req.headers['x-authorization'],
    req.headers['x-auth-token'],
  ].filter(Boolean)

  for (const raw of headerCandidates) {
    const headerVal = String(raw).trim()
    // Bare JWT
    const bare = normalizeJwt(headerVal)
    if (bare) return { token: bare, source: 'header' }
    // Bearer <token>
    const m = headerVal.match(/^Bearer\s+(.+)$/i)
    if (m && normalizeJwt(m[1])) return { token: normalizeJwt(m[1]), source: 'header' }
    // Bearer: <token>
    const m2 = headerVal.match(/^Bearer:\s*(.+)$/i)
    if (m2 && normalizeJwt(m2[1])) return { token: normalizeJwt(m2[1]), source: 'header' }
  }

  // 2) Query string (useful for SSE/EventSource)
  const qsCandidates = [
    ['token', req.query?.token],
    ['idToken', req.query?.idToken],
    ['access_token', req.query?.access_token],
  ]
  for (const [name, val] of qsCandidates) {
    const t = normalizeJwt(val)
    if (t) return { token: t, source: `query:${name}` }
  }

  // 3) Cookies (__session, idToken, token)
  const cookies = parseCookies(req.headers.cookie)
  const cookieCandidates = [
    ['__session', cookies.__session],
    ['idToken', cookies.idToken],
    ['token', cookies.token],
  ]
  for (const [name, val] of cookieCandidates) {
    const t = normalizeJwt(val)
    if (t) return { token: t, source: `cookie:${name}` }
  }
  
  // 4) Body (for POST/PUT JSON calls that include token field)
  const bodyCandidates = [
    ['token', req.body?.token],
    ['idToken', req.body?.idToken],
    ['access_token', req.body?.access_token],
  ]
  for (const [name, val] of bodyCandidates) {
    const t = normalizeJwt(val)
    if (t) return { token: t, source: `body:${name}` }
  }

  return null
}

module.exports = async function auth(req, res, next) {
  try {
    if (process.env.DISABLE_AUTH === 'true') {
      console.log('[Auth] Authentication disabled via DISABLE_AUTH')
      return next()
    }
    if (req.method === 'OPTIONS') return next() // allow CORS preflight
    // Dev bypass when explicitly requested
    if ((process.env.NODE_ENV !== 'production') && (req.query?.dev === '1' || req.headers['x-dev-bypass'] === '1')) {
      console.log('[Auth] Dev bypass enabled (query/header)')
      req.user = { uid: 'dev', mode: 'dev-bypass' }
      return next()
    }
    // Default dev bypass unless explicitly required
    if (process.env.NODE_ENV !== 'production' && process.env.REQUIRE_AUTH !== 'true') {
      console.log('[Auth] Dev bypass enabled (default). Set REQUIRE_AUTH=true to enforce auth in dev.')
      req.user = { uid: 'dev', mode: 'dev-bypass' }
      return next()
    }

    // Ensure Firebase Admin is initialized
    ensureFirebaseInitialized()
    
    if (!admin.apps.length) {
      console.error('[Auth] Firebase Admin not initialized')
      return res.status(500).json({ error: 'Server configuration error: Firebase Admin not initialized' })
    }

    const extracted = extractAuth(req)
    const token = extracted?.token
    
    if (!token) {
      console.warn('[Auth] No token found in request', {
        path: req.path,
        method: req.method,
        hasAuthHeader: !!req.headers.authorization,
        hasCookie: !!req.headers.cookie
      })
      return res.status(401).json({ error: 'Missing or malformed Firebase ID token' })
    }

    let decoded = null
    try {
      // Prefer verifying as ID token first
      decoded = await admin.auth().verifyIdToken(token, true) // Check revoked tokens
      console.log('[Auth] Token verified successfully for user:', decoded.uid)
    } catch (e) {
      console.error('[Auth] ID token verification failed:', e.message)
      // If verification fails, attempt session cookie verification (useful when __session is set)
      try {
        decoded = await admin.auth().verifySessionCookie(token, true)
        console.log('[Auth] Session cookie verified successfully for user:', decoded.uid)
      } catch (sessionError) {
        console.error('[Auth] Session cookie verification also failed:', sessionError.message)
        throw e // preserve the original error path
      }
    }

    req.user = decoded
    next()
  } catch (err) {
    // Avoid logging sensitive token data; just the message.
    console.error('[Auth] Authentication error:', err.message)
    console.error('[Auth] Error code:', err.code)
    return res.status(401).json({ 
      error: 'Unauthorized',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
}
