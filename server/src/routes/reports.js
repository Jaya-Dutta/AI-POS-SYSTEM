const { db } = require('../config/firebase')
const express = require('express')
const router = express.Router()

// GET /api/reports/sales - Sales summary report
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    let query = db().collection('transactions').where('type', '==', 'sale')

    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate))
    }
    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate))
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(1000).get()
    const transactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

    // Calculate totals
    let totalRevenue = 0
    let totalTax = 0
    let totalDiscount = 0
    let transactionCount = transactions.length

    transactions.forEach(tx => {
      totalRevenue += tx.total || 0
      totalTax += tx.tax || 0
      totalDiscount += tx.discount || 0
    })

    res.json({
      transactions,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        transactionCount,
        averageTransaction: transactionCount > 0 ? Math.round((totalRevenue / transactionCount) * 100) / 100 : 0
      }
    })
  } catch (error) {
    console.error('Sales report error:', error)
    res.status(500).json({ error: 'Failed to generate sales report' })
  }
})

// GET /api/reports/inventory - Inventory report
router.get('/inventory', async (req, res) => {
  try {
    const snapshot = await db().collection('products').orderBy('quantity', 'asc').get()
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

    const lowStock = products.filter(p => (p.quantity || 0) < 10)
    const outOfStock = products.filter(p => (p.quantity || 0) === 0)
    
    let totalValue = 0
    let totalCost = 0
    
    products.forEach(p => {
      const qty = p.quantity || 0
      totalValue += qty * (p.price || 0)
      totalCost += qty * (p.cost || 0)
    })

    res.json({
      products,
      summary: {
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalInventoryValue: Math.round(totalValue * 100) / 100,
        totalInventoryCost: Math.round(totalCost * 100) / 100,
        potentialProfit: Math.round((totalValue - totalCost) * 100) / 100
      },
      lowStock,
      outOfStock
    })
  } catch (error) {
    console.error('Inventory report error:', error)
    res.status(500).json({ error: 'Failed to generate inventory report' })
  }
})

// GET /api/reports/top-products - Top selling products
router.get('/top-products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const snapshot = await db().collection('transactions').where('type', '==', 'sale').limit(500).get()
    
    const productStats = {}
    
    snapshot.docs.forEach(doc => {
      const tx = doc.data()
      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach(item => {
          const key = item.productId || item.name
          if (!key) return
          
          if (!productStats[key]) {
            productStats[key] = {
              productId: item.productId,
              name: item.name,
              quantitySold: 0,
              revenue: 0
            }
          }
          
          productStats[key].quantitySold += item.quantity || 0
          productStats[key].revenue += (item.price || 0) * (item.quantity || 0)
        })
      }
    })

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(p => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100
      }))

    res.json({ topProducts })
  } catch (error) {
    console.error('Top products report error:', error)
    res.status(500).json({ error: 'Failed to generate top products report' })
  }
})

module.exports = router
