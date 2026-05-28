const { db } = require('../config/firebase')
const express = require('express')
const router = express.Router()

// Create product
router.post('/', async (req, res) => {
  try {
    const { name, cost, price, quantity, category } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })
    
    const firestoreDb = db()
    if (!firestoreDb) {
      throw new Error('Firestore not initialized')
    }
    
    const doc = await firestoreDb.collection('products').add({
      name,
      cost: cost ?? null,
      price: price ?? null,
      quantity: quantity ?? 0,
      category: category || 'Uncategorized',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerUid: req.user?.uid || null,
    })
    const snap = await doc.get()
    console.log('[Products] Created product:', doc.id)
    res.json({ id: doc.id, ...snap.data() })
  } catch (e) {
    console.error('[Products] Create error:', e.message)
    console.error('[Products] Stack:', e.stack)
    res.status(500).json({ error: 'Failed to create product', details: e.message })
  }
})

// List products
router.get('/', async (req, res) => {
  try {
    // Try with orderBy first, fallback to simple query if index doesn't exist
    let q
    try {
      q = await db().collection('products').orderBy('createdAt', 'desc').limit(200).get()
    } catch (orderError) {
      // If orderBy fails (likely missing index), try without ordering
      if (orderError.code === 9 || orderError.message?.includes('index')) {
        console.warn('[Products] Firestore index missing for createdAt, fetching without order')
        q = await db().collection('products').limit(200).get()
      } else {
        throw orderError
      }
    }
    const items = q.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json(items)
  } catch (e) {
    console.error('[Products] List error:', e.message)
    console.error('[Products] Stack:', e.stack)
    res.status(500).json({ error: 'Failed to list products', details: e.message })
  }
})

// Get one
router.get('/:id', async (req, res) => {
  try {
    const ref = db().collection('products').doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ error: 'Not found' })
    res.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ error: 'Failed to get product' })
  }
})

// Update
router.put('/:id', async (req, res) => {
  try {
    const ref = db().collection('products').doc(req.params.id)
    await ref.update({ ...req.body, updatedAt: new Date() })
    const snap = await ref.get()
    res.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// Delete
router.delete('/:id', async (req, res) => {
  try {
    await db().collection('products').doc(req.params.id).delete()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

module.exports = router
