require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')

const { ensureFirebaseInitialized } = require('./config/firebase')
const auth = require('./middleware/auth')

const productsRouter = require('./routes/products')
const customersRouter = require('./routes/customers')
const vendorsRouter = require('./routes/vendors')
const transactionsRouter = require('./routes/transactions')
const uploadRouter = require('./routes/upload')
const reportsRouter = require('./routes/reports')
const streamRouter = require('./routes/stream')
const authRouter = require('./routes/auth')

const app = express()

// Initialize Firebase Admin
ensureFirebaseInitialized()

// Security & performance middleware
app.use(helmet())
app.use(compression())
const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 })
app.use(limiter)

// CORS
let corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean) : null
if (!corsOrigins || corsOrigins.length === 0) {
  // Sensible dev default to allow cookies from common dev ports
  corsOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173'
  ]
}
app.use(cors({ 
  origin: corsOrigins,
  credentials: true,
}))

// Parsers & logging
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined'))

// Serve local mock storage files static route
const path = require('path')
app.use('/mock-uploads', express.static(path.resolve(__dirname, '../data/uploads')))

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.get('/api/health/db', async (req, res) => {
  try {
    const { admin, db } = require('./config/firebase')
    await db().collection('__health').doc('_').get()
    res.json({ status: 'ok', projectId: admin.app().options.projectId })
  } catch (e) {
    console.error('DB health error:', e)
    res.status(500).json({ status: 'error', details: e?.message })
  }
})

// Auth session endpoints (unprotected)
app.use('/api/auth', authRouter)

// Protected APIs
app.use('/api/products', auth, productsRouter)
app.use('/api/customers', auth, customersRouter)
app.use('/api/vendors', auth, vendorsRouter)
app.use('/api/transactions', auth, transactionsRouter)
app.use('/api/upload', auth, uploadRouter)
app.use('/api/reports', auth, reportsRouter)
app.use('/api/stream', auth, streamRouter)

const PORT = process.env.PORT || 3001
const server = app.listen(PORT, () => {
  console.log(`AI POS server listening on port ${PORT}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try one of the following:`)
    console.error(`  1. Stop the process using port ${PORT}`)
    console.error(`  2. Set a different PORT in your .env file`)
    console.error(`  3. Run: netstat -ano | findstr :${PORT} to find the process ID`)
    process.exit(1)
  } else {
    throw err
  }
})
