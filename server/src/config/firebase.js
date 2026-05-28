const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

let initialized = false
let useMock = false

// Read project and storage from env with sensible fallbacks
const ENV_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
const DEFAULT_PROJECT_ID = 'tally-12b68'
const projectId = ENV_PROJECT_ID || DEFAULT_PROJECT_ID

// Allow either a full host or a bucket id in env
const ENV_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET || ''

function normalizeBucketName(projectId, bucket) {
  if (!bucket) return `${projectId}.appspot.com`
  if (/\.appspot\.com$/i.test(bucket)) return bucket
  return `${projectId}.appspot.com`
}

// Check if credentials exist in the environment
const hasCredentials = !!(
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS
)

function ensureFirebaseInitialized() {
  if (initialized) return

  if (!hasCredentials || process.env.USE_MOCK_DB === 'true') {
    console.log('[Firebase] No credentials found or USE_MOCK_DB is true. Falling back to local file-based database mock.')
    useMock = true
    initialized = true
    
    // Monkeypatch the firestore module to return mock FieldValues
    try {
      const firestoreModule = require('firebase-admin/firestore')
      const mockIncrement = (val) => ({ __isMockIncrement: true, value: val })
      const mockServerTimestamp = () => ({ __isMockServerTimestamp: true })
      
      firestoreModule.FieldValue.increment = mockIncrement
      firestoreModule.FieldValue.serverTimestamp = mockServerTimestamp
      
      if (admin.firestore && admin.firestore.FieldValue) {
        admin.firestore.FieldValue.increment = mockIncrement
        admin.firestore.FieldValue.serverTimestamp = mockServerTimestamp
      }
    } catch (e) {
      console.warn('[Firebase Mock] Failed to monkeypatch FieldValue:', e.message)
    }
    return
  }

  const storageBucket = normalizeBucketName(projectId, ENV_STORAGE_BUCKET)
  let credential
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        credential = admin.credential.cert(serviceAccount)
        console.log('[Firebase] Initialized with service account from FIREBASE_SERVICE_ACCOUNT')
      } catch (e) {
        console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT:', e.message)
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT: ${e.message}`)
      }
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
      console.log('[Firebase] Initialized with service account from individual env vars')
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credential = admin.credential.applicationDefault()
      console.log('[Firebase] Using GOOGLE_APPLICATION_CREDENTIALS at', process.env.GOOGLE_APPLICATION_CREDENTIALS)
    } else {
      try {
        credential = admin.credential.applicationDefault()
        console.warn('[Firebase] Using applicationDefault() - ensure GOOGLE_APPLICATION_CREDENTIALS is set or running on GCP')
      } catch (defaultError) {
        console.error('[Firebase] applicationDefault() failed:', defaultError.message)
        throw new Error('No Firebase credentials found. Add them to server/.env')
      }
    }

    admin.initializeApp({
      credential,
      projectId,
      storageBucket,
    })

    console.log('[Firebase] Successfully initialized Firebase Admin SDK')
    console.log('[Firebase] Project ID:', projectId)
    console.log('[Firebase] Storage Bucket:', storageBucket)
    initialized = true
  } catch (error) {
    console.error('[Firebase] Failed to initialize:', error.message)
    console.warn('[Firebase] Falling back to local file-based database mock.')
    useMock = true
    initialized = true
  }
}

// ---------------------------------------------------------------------
// Mock Firestore implementation using server/data/db.json
// ---------------------------------------------------------------------

const dbPath = path.resolve(__dirname, '../../data/db.json')

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      const dir = path.dirname(dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(dbPath, JSON.stringify({
        products: [],
        customers: [],
        vendors: [],
        transactions: [],
        uploads: [],
        meta: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        }
      }, null, 2))
    }
    const content = fs.readFileSync(dbPath, 'utf8')
    return JSON.parse(content)
  } catch (e) {
    console.error('[MockDB] Read error:', e)
    return { products: [], customers: [], vendors: [], transactions: [], uploads: [] }
  }
}

function writeDb(data) {
  try {
    data.meta = {
      ...data.meta,
      updatedAt: new Date().toISOString()
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('[MockDB] Write error:', e)
  }
}

function resolveMockFields(obj) {
  if (typeof obj !== 'object' || obj === null) return
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (val && typeof val === 'object') {
      if (val.__isMockServerTimestamp) {
        obj[key] = new Date().toISOString()
      } else {
        resolveMockFields(val)
      }
    }
  }
}

function applyUpdates(existingData, updates) {
  for (const key of Object.keys(updates)) {
    const val = updates[key]
    if (val && typeof val === 'object' && val.__isMockIncrement) {
      const orig = Number(existingData[key]) || 0
      existingData[key] = orig + val.value
    } else if (val && typeof val === 'object' && val.__isMockServerTimestamp) {
      existingData[key] = new Date().toISOString()
    } else if (val && typeof val === 'object') {
      if (!existingData[key] || typeof existingData[key] !== 'object') {
        existingData[key] = {}
      }
      applyUpdates(existingData[key], val)
    } else {
      existingData[key] = val
    }
  }
}

class MockFirestore {
  collection(name) {
    return new MockCollection(name)
  }
  batch() {
    return new MockBatch()
  }
}

class MockDocSnap {
  constructor(id, data) {
    this.id = id
    this._data = data
    this.exists = !!data
  }

  data() {
    if (!this._data) return undefined
    const clone = JSON.parse(JSON.stringify(this._data))
    // Rewrite storage downloadURL to point to local express mock route
    if (clone.downloadURL && clone.path && clone.path.startsWith('uploads/')) {
      const relativePath = clone.path.substring('uploads/'.length)
      const port = process.env.PORT || 3001
      clone.downloadURL = `http://localhost:${port}/mock-uploads/${relativePath}`
    }
    return clone
  }
}

class MockQuerySnapshot {
  constructor(docs) {
    this.docs = docs
    this.size = docs.length
    this.empty = docs.length === 0
  }
}

class MockDocRef {
  constructor(collectionName, id) {
    this.collectionName = collectionName
    this.id = id
  }

  async get() {
    const dbData = readDb()
    const list = dbData[this.collectionName] || []
    const doc = list.find(d => d.id === this.id)
    return new MockDocSnap(this.id, doc)
  }

  async set(data) {
    const dbData = readDb()
    if (!dbData[this.collectionName]) {
      dbData[this.collectionName] = []
    }
    const list = dbData[this.collectionName]
    const idx = list.findIndex(d => d.id === this.id)
    
    const docData = { id: this.id, ...data }
    resolveMockFields(docData)
    
    if (idx >= 0) {
      list[idx] = docData
    } else {
      list.push(docData)
    }
    writeDb(dbData)
  }

  async update(updates) {
    const dbData = readDb()
    if (!dbData[this.collectionName]) {
      dbData[this.collectionName] = []
    }
    const list = dbData[this.collectionName]
    const idx = list.findIndex(d => d.id === this.id)
    if (idx >= 0) {
      const existing = list[idx]
      applyUpdates(existing, updates)
      existing.updatedAt = new Date().toISOString()
      writeDb(dbData)
    } else {
      throw new Error(`Document not found for update: ${this.id}`)
    }
  }

  async delete() {
    const dbData = readDb()
    if (dbData[this.collectionName]) {
      dbData[this.collectionName] = dbData[this.collectionName].filter(d => d.id !== this.id)
      writeDb(dbData)
    }
  }
}

class MockCollection {
  constructor(name, filters = [], orderByField = null, orderDirection = 'desc', limitVal = null) {
    this.name = name
    this.filters = filters
    this.orderByField = orderByField
    this.orderDirection = orderDirection
    this.limitVal = limitVal
  }

  where(field, op, value) {
    const newFilters = [...this.filters]
    newFilters.push((doc) => {
      const docVal = doc[field]
      if (op === '==') return docVal === value
      if (op === '>=') {
        if (!docVal) return false
        return new Date(docVal) >= new Date(value)
      }
      if (op === '<=') {
        if (!docVal) return false
        return new Date(docVal) <= new Date(value)
      }
      return true
    })
    return new MockCollection(this.name, newFilters, this.orderByField, this.orderDirection, this.limitVal)
  }

  orderBy(field, direction = 'asc') {
    return new MockCollection(this.name, this.filters, field, direction, this.limitVal)
  }

  limit(n) {
    return new MockCollection(this.name, this.filters, this.orderByField, this.orderDirection, n)
  }

  doc(id) {
    const docId = id || require('uuid').v4()
    return new MockDocRef(this.name, docId)
  }

  async add(data) {
    const dbData = readDb()
    if (!dbData[this.name]) {
      dbData[this.name] = []
    }
    const id = require('uuid').v4()
    const docData = { id, ...data }
    resolveMockFields(docData)
    dbData[this.name].push(docData)
    writeDb(dbData)
    return new MockDocRef(this.name, id)
  }

  async get() {
    const dbData = readDb()
    let docs = dbData[this.name] || []

    for (const filter of this.filters) {
      docs = docs.filter(filter)
    }

    if (this.orderByField) {
      docs.sort((a, b) => {
        const valA = a[this.orderByField]
        const valB = b[this.orderByField]
        if (valA === valB) return 0
        if (valA === undefined || valA === null) return 1
        if (valB === undefined || valB === null) return -1
        
        let cmp = 0
        if (valA instanceof Date || (typeof valA === 'string' && !isNaN(Date.parse(valA)))) {
          cmp = new Date(valA) - new Date(valB)
        } else if (typeof valA === 'number') {
          cmp = valA - valB
        } else {
          cmp = String(valA).localeCompare(String(valB))
        }
        return this.orderDirection === 'desc' ? -cmp : cmp
      })
    }

    if (this.limitVal !== null) {
      docs = docs.slice(0, this.limitVal)
    }

    const docSnaps = docs.map(doc => new MockDocSnap(doc.id, doc))
    return new MockQuerySnapshot(docSnaps)
  }

  onSnapshot(onNext, onError) {
    let lastJson = JSON.stringify(readDb()[this.name] || [])
    
    const trigger = async () => {
      try {
        const snapshot = await this.get()
        onNext(snapshot)
      } catch (err) {
        if (onError) onError(err)
      }
    }
    
    trigger()
    
    const interval = setInterval(async () => {
      const currentJson = JSON.stringify(readDb()[this.name] || [])
      if (currentJson !== lastJson) {
        lastJson = currentJson
        await trigger()
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }
}

class MockBatch {
  constructor() {
    this.operations = []
  }

  set(docRef, data) {
    this.operations.push({ type: 'set', docRef, data })
  }

  update(docRef, updates) {
    this.operations.push({ type: 'update', docRef, data: updates })
  }

  async commit() {
    const dbData = readDb()
    for (const op of this.operations) {
      const { type, docRef, data } = op
      const { collectionName, id } = docRef
      
      if (!dbData[collectionName]) {
        dbData[collectionName] = []
      }
      const list = dbData[collectionName]
      const idx = list.findIndex(d => d.id === id)

      if (type === 'set') {
        const docData = { id, ...data }
        resolveMockFields(docData)
        if (idx >= 0) {
          list[idx] = docData
        } else {
          list.push(docData)
        }
      } else if (type === 'update') {
        if (idx >= 0) {
          const existing = list[idx]
          applyUpdates(existing, data)
          existing.updatedAt = new Date().toISOString()
        } else {
          throw new Error(`Document not found for batch update: ${id}`)
        }
      }
    }
    writeDb(dbData)
  }
}

class MockBucket {
  constructor() {
    this.name = 'mock-bucket'
  }

  file(filePath) {
    return new MockFile(filePath)
  }
}

class MockFile {
  constructor(filePath) {
    this.filePath = filePath
  }

  async save(buffer, options) {
    console.log(`[MockStorage] Saving file ${this.filePath} (${buffer.length} bytes)`)
    const diskPath = path.resolve(__dirname, '../../data', this.filePath)
    const dir = path.dirname(diskPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(diskPath, buffer)
  }
}

const mockFirestore = new MockFirestore()
const mockBucket = new MockBucket()

const mockAdmin = {
  auth: () => ({
    createSessionCookie: async (idToken, options) => 'mock-session-cookie',
    verifyIdToken: async (token) => ({ uid: 'dev', email: 'dev@example.com' }),
    verifySessionCookie: async (cookie) => ({ uid: 'dev', email: 'dev@example.com' }),
  }),
  firestore: {
    FieldValue: {
      increment: (val) => ({ __isMockIncrement: true, value: val }),
      serverTimestamp: () => ({ __isMockServerTimestamp: true }),
    }
  },
  storage: () => ({
    bucket: () => mockBucket
  }),
  apps: { length: 1 },
  app: () => ({
    options: { projectId: 'mock-project' }
  })
}

// Use proxy to support dynamic swapping between real and mock Admin SDK
const adminProxy = new Proxy({}, {
  get(target, prop) {
    const activeAdmin = useMock ? mockAdmin : admin
    return activeAdmin[prop]
  }
})

function db() {
  return useMock ? mockFirestore : admin.firestore()
}

function bucket() {
  return useMock ? mockBucket : admin.storage().bucket()
}

module.exports = { admin: adminProxy, ensureFirebaseInitialized, db, bucket }
