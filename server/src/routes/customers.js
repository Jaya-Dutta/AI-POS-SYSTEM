const { db } = require('../config/firebase')
const express = require('express')
const router = express.Router()

// Create customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })
    const doc = await db().collection('customers').add({
      name, phone: phone || null, email: email || null, address: address || null,
      createdAt: new Date(), updatedAt: new Date(), ownerUid: req.user?.uid || null,
    })
    const snap = await doc.get()
    res.json({ id: doc.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ error: 'Failed to create customer' })
  }
})

router.get('/', async (req, res) => {
  try {
    const q = await db().collection('customers').orderBy('createdAt', 'desc').limit(200).get()
    res.json(q.docs.map(d => ({ id: d.id, ...d.data() })))
  } catch (e) {
    res.status(500).json({ error: 'Failed to list customers' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const ref = db().collection('customers').doc(req.params.id)
    await ref.update({ ...req.body, updatedAt: new Date() })
    const snap = await ref.get()
    res.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    res.status(500).json({ error: 'Failed to update customer' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await db().collection('customers').doc(req.params.id).delete()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete customer' })
  }
})

module.exports = router
