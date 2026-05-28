const express = require('express')
const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { ocrImageBuffer } = require('../services/huggingface')
const { parseOcrTextToItems } = require('../services/parser')
const { bucket, db, admin } = require('../config/firebase')
const { FieldValue } = require('firebase-admin/firestore')

const router = express.Router()

// Multer configured with memory storage, size limit (10MB), and image format filter
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/i
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mime = allowedTypes.test(file.mimetype)
    if (ext && mime) {
      return cb(null, true)
    }
    cb(new Error('Only JPG, JPEG, and PNG images are supported'))
  }
})

// Helper to build a download URL with token metadata
function buildDownloadURL(filePath, token) {
  const b = bucket()
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(b.name)}/o/${encodeURIComponent(filePath)}?alt=media&token=${encodeURIComponent(token)}`
}

// GET /api/upload - list recent uploads for the user
router.get('/', async (req, res) => {
  try {
    const uid = req.user?.uid || null
    const firestoreDb = db()
    if (!firestoreDb) {
      throw new Error('Firestore not initialized')
    }
    
    let query = firestoreDb.collection('uploads')
    
    if (uid) {
      query = query.where('ownerUid', '==', uid)
    }
    
    // Try with orderBy first, fallback if index missing
    let snap
    try {
      snap = await query.orderBy('createdAt', 'desc').limit(100).get()
    } catch (orderError) {
      // If orderBy fails (likely missing index), try without ordering
      if (orderError.code === 9 || orderError.message?.includes('index')) {
        console.warn('[Upload] Firestore index missing for createdAt, fetching without order')
        snap = await query.limit(100).get()
      } else {
        throw orderError
      }
    }
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  } catch (e) {
    console.error('[Upload] List error:', e.message)
    console.error('[Upload] Stack:', e.stack)
    res.status(500).json({ error: 'Failed to list uploads', details: e.message })
  }
})

// POST /api/upload - Accept image, run OCR, store to Firebase Storage, save metadata in Firestore, return parsed items
router.post('/', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` })
    } else if (err) {
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const uid = req.user?.uid || null
    const buffer = req.file.buffer

    // 1) OCR the image (optional)
    let ocrResult = { text: '', warning: null }
    try {
      ocrResult = await ocrImageBuffer(buffer)
      if (ocrResult.warning) {
        console.warn('[OCR]', ocrResult.warning)
      }
    } catch (ocrError) {
      console.error('[OCR] Error during OCR processing:', ocrError.message)
      // Continue without OCR - not critical
      ocrResult = { text: '', warning: `OCR failed: ${ocrError.message}` }
    }

    // 2) Upload to Firebase Storage with a download token
    let filePath, downloadURL, downloadToken
    try {
      const b = bucket()
      if (!b) {
        throw new Error('Firebase Storage bucket not initialized. Check Firebase Admin credentials.')
      }
      
      const fileId = uuidv4()
      const safeName = (req.file.originalname || 'image').replace(/[^a-zA-Z0-9._-]/g, '_')
      filePath = `uploads/${uid || 'anonymous'}/${Date.now()}_${fileId}_${safeName}`
      downloadToken = uuidv4()

      const file = b.file(filePath)
      await file.save(buffer, {
        resumable: false,
        contentType: req.file.mimetype || 'application/octet-stream',
        metadata: {
          contentType: req.file.mimetype || 'application/octet-stream',
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
        public: false,
        validation: 'crc32c',
      })

      downloadURL = buildDownloadURL(filePath, downloadToken)
      console.log('[Storage] File uploaded successfully:', filePath)
    } catch (storageError) {
      console.error('[Storage] Error uploading to Firebase Storage:', storageError.message)
      console.error('[Storage] Stack:', storageError.stack)
      throw new Error(`Storage upload failed: ${storageError.message}. Check Firebase Admin credentials and Storage permissions.`)
    }

    // 3) Parse OCR to items (if OCR available)
    let items = []
    try {
      if (!ocrResult.warning && ocrResult.text) {
        items = parseOcrTextToItems(ocrResult.text)
        console.log('[Parser] Extracted', items.length, 'items from OCR text')
      }
    } catch (parseError) {
      console.error('[Parser] Error parsing OCR text:', parseError.message)
      // Continue without parsed items - not critical
    }

    // 4) Save Firestore record
    try {
      const firestoreDb = db()
      if (!firestoreDb) {
        throw new Error('Firestore not initialized. Check Firebase Admin credentials.')
      }

      const docRef = firestoreDb.collection('uploads').doc()
      const docData = {
        ownerUid: uid,
        path: filePath,
        downloadURL,
        contentType: req.file.mimetype || null,
        size: req.file.size || null,
        ocrText: ocrResult.text || '',
        items,
        createdAt: FieldValue.serverTimestamp(), // Use Firestore timestamp
      }
      await docRef.set(docData)
      console.log('[Firestore] Document saved:', docRef.id)

      res.json({
        id: docRef.id,
        ...docData,
        createdAt: new Date(), // Convert back to Date for response
        warning: ocrResult.warning || null,
        success: true,
      })
    } catch (firestoreError) {
      console.error('[Firestore] Error saving document:', firestoreError.message)
      console.error('[Firestore] Stack:', firestoreError.stack)
      throw new Error(`Firestore save failed: ${firestoreError.message}. Check Firebase Admin credentials and Firestore permissions.`)
    }
  } catch (error) {
    console.error('[Upload] Complete error:', error.message)
    console.error('[Upload] Stack:', error.stack)
    res.status(500).json({ 
      error: 'Failed to process image', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

module.exports = router
