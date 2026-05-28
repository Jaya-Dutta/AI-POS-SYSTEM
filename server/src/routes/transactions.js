const { db, admin } = require('../config/firebase')
const express = require('express')
const router = express.Router()

// Create transaction (sale)
router.post('/', async (req, res) => {
  const { items = [], payments = [], customerId = null, discount = 0, taxRate = 0 } = req.body
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items required' })
  }

  const batch = db().batch()
  try {
    // Calculate totals
    let subtotal = 0
    for (const it of items) {
      const line = (it.price || 0) * (it.quantity || 1)
      subtotal += line
    }
    const discountAmt = discount || 0
    const taxable = Math.max(0, subtotal - discountAmt)
    const tax = Math.round(taxable * (taxRate || 0) * 100) / 100
    const total = Math.round((taxable + tax) * 100) / 100

    const txRef = db().collection('transactions').doc()
    const txData = {
      items,
      payments,
      customerId,
      discount: discountAmt,
      taxRate,
      subtotal,
      tax,
      total,
      createdAt: new Date(),
      ownerUid: req.user?.uid || null,
      type: 'sale',
    }
    batch.set(txRef, txData)

    // Update stock: decrement quantity by sold amount
    for (const it of items) {
      if (!it.productId || !it.quantity) continue
      const prodRef = db().collection('products').doc(it.productId)
      batch.update(prodRef, { quantity: admin.firestore.FieldValue.increment(-Math.abs(Number(it.quantity) || 0)), updatedAt: new Date() })
    }

    await batch.commit()
    const snap = await txRef.get()
    res.json({ id: snap.id, ...snap.data() })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to create transaction' })
  }
})

// List transactions
router.get('/', async (req, res) => {
  try {
    const q = await db().collection('transactions').orderBy('createdAt', 'desc').limit(200).get()
    res.json(q.docs.map(d => ({ id: d.id, ...d.data() })))
  } catch (e) {
    res.status(500).json({ error: 'Failed to list transactions' })
  }
})

module.exports = router
