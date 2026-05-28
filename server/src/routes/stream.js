const express = require('express')
const { db } = require('../config/firebase')

const router = express.Router()

// Allowed collections for streaming
const ALLOWED = new Set(['products', 'customers', 'vendors', 'transactions', 'uploads'])

function sseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  // CORS is handled globally; if needed, you can set specific headers here.
}

function send(res, event, data) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

function isIndexError(err) {
  return err?.code === 9 || /index/i.test(err?.message || '')
}

// GET /api/stream/:collection - real-time Firestore -> SSE stream
router.get('/:collection', async (req, res) => {
  try {
    const { collection } = req.params
    if (!ALLOWED.has(collection)) {
      return res.status(400).json({ error: 'Unsupported collection for streaming' })
    }

    sseHeaders(res)
    const uid = req.user?.uid || null

    let base = db().collection(collection)
    if (uid) base = base.where('ownerUid', '==', uid)

    let unsubscribe = null

    function subscribe(withOrder) {
      if (unsubscribe) { try { unsubscribe() } catch (_) {} unsubscribe = null }
      let q = base
      if (withOrder) {
        try { q = q.orderBy('createdAt', 'desc') } catch (_) {}
      }
      unsubscribe = q.onSnapshot(
        (snapshot) => {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
          send(res, 'snapshot', { collection, docs, count: docs.length, ts: Date.now() })
        },
        (err) => {
          // Retry without order if index is missing
          if (withOrder && isIndexError(err)) {
            send(res, 'warn', { message: 'Missing index for createdAt; retrying without order' })
            return subscribe(false)
          }
          send(res, 'error', { message: err.message })
        }
      )
    }

    // Start with ordering, fallback handled in handler
    subscribe(true)

    // Keep the connection alive with ping messages
    const ping = setInterval(() => send(res, 'ping', { ts: Date.now() }), 25000)

    req.on('close', () => {
      clearInterval(ping)
      unsubscribe && unsubscribe()
      try { res.end() } catch (_) {}
    })
  } catch (e) {
    console.error('SSE stream error:', e)
    try { res.writeHead(500) } catch (_) {}
    send(res, 'error', { message: 'Stream failed' })
  }
})

module.exports = router
