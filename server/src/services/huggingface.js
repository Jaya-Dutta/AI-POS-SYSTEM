const axios = require('axios')
const { Jimp } = require('jimp')
const { createWorker } = require('tesseract.js')

const HF_API_TOKEN = process.env.HF_API_TOKEN
const HF_MODEL = process.env.HUGGINGFACE_OCR_MODEL || 'microsoft/trocr-base-printed'

/**
 * Preprocesses image to maximize Tesseract OCR text detection accuracy.
 * Performs grayscale conversion, contrast adjustment, auto-resizing, and threshold binarization.
 */
async function preprocessImage(buffer) {
  try {
    console.log('[Preprocessing] Starting image preprocessing...')
    const image = await Jimp.read(buffer)
    
    // 1. Resize to target width (around 1200px) for consistent character resolution
    if (image.bitmap.width < 1000) {
      console.log(`[Preprocessing] Upscaling image from ${image.bitmap.width}px width to 1200px`)
      image.resize({ w: 1200 })
    } else if (image.bitmap.width > 2000) {
      console.log(`[Preprocessing] Downscaling image from ${image.bitmap.width}px width to 1600px`)
      image.resize({ w: 1600 })
    }
    
    // 2. Grayscale conversion
    image.greyscale()
    
    // 3. Contrast boost
    image.contrast(0.25)
    
    // 4. Thresholding / Binarization (Luminance check)
    // Converts pixels to pure black or pure white based on a threshold (default 125)
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx]
      const green = this.bitmap.data[idx + 1]
      const blue = this.bitmap.data[idx + 2]
      
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
      const threshold = 125
      const color = luminance < threshold ? 0 : 255
      
      this.bitmap.data[idx] = color
      this.bitmap.data[idx + 1] = color
      this.bitmap.data[idx + 2] = color
    })
    
    const preprocessedBuffer = await image.getBuffer('image/jpeg')
    console.log('[Preprocessing] Image preprocessing finished successfully')
    return preprocessedBuffer
  } catch (e) {
    console.error('[Preprocessing] Failed:', e.message)
    return buffer // return original buffer as fallback
  }
}

async function ocrImageBuffer(buffer) {
  // Preprocess first
  const cleanBuffer = await preprocessImage(buffer)

  // Check if user specifically requested Hugging Face OCR and has a token
  if (process.env.USE_HF_OCR === 'true' && HF_API_TOKEN) {
    console.log('[OCR] Using Hugging Face Inference API...')
    try {
      const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`
      const headers = {
        Authorization: `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      }
      const { data } = await axios.post(url, cleanBuffer, { headers, timeout: 25000 })
      let text = ''
      if (Array.isArray(data) && data.length && data[0].generated_text) {
        text = data[0].generated_text
      } else if (typeof data === 'string') {
        text = data
      } else if (data?.generated_text) {
        text = data.generated_text
      }
      console.log('[OCR] Hugging Face OCR Result:')
      console.log('========================================')
      console.log(text || '(No text detected)')
      console.log('========================================')
      return { text }
    } catch (hfError) {
      console.error('[OCR] Hugging Face failed, falling back to local Tesseract:', hfError.message)
    }
  }

  // Use local Tesseract.js
  let worker = null
  try {
    console.log('[OCR] Starting local Tesseract.js OCR engine...')
    worker = await createWorker('eng')
    
    console.log('[OCR] Processing preprocessed receipt image...')
    const { data: { text } } = await worker.recognize(cleanBuffer)
    
    console.log('[OCR] Local Tesseract.js OCR text extracted successfully:')
    console.log('========================================')
    console.log(text || '(No text detected)')
    console.log('========================================')
    
    return { text }
  } catch (tessError) {
    console.error('[OCR] Local Tesseract.js failed:', tessError.message)
    // Attempt Hugging Face fallback if token is available
    if (HF_API_TOKEN) {
      console.log('[OCR] Attempting Hugging Face fallback...')
      try {
        const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`
        const headers = {
          Authorization: `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        }
        const { data } = await axios.post(url, cleanBuffer, { headers, timeout: 25000 })
        let text = ''
        if (Array.isArray(data) && data.length && data[0].generated_text) {
          text = data[0].generated_text
        } else if (typeof data === 'string') {
          text = data
        } else if (data?.generated_text) {
          text = data.generated_text
        }
        return { text }
      } catch (hfError) {
        console.error('[OCR] Hugging Face fallback also failed:', hfError.message)
        throw hfError
      }
    }
    throw tessError
  } finally {
    if (worker) {
      try {
        await worker.terminate()
      } catch (_) {}
    }
  }
}

module.exports = { ocrImageBuffer }
