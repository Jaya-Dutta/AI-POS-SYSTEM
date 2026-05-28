const METADATA_KEYWORDS = [
  'subtotal', 'total', 'discount', 'tax', 'change', 'invoice', 'date', 'time',
  'cashier', 'phone', 'road', 'dhaka', 'thank', 'visit', 'software', 'address',
  'bill', 'tel', 'inr', 'rs', 'sl', 'item name', 'qty', 'unit price', 'total price',
  'paid', 'cash'
]

function isMetadataLine(line) {
  const lower = line.toLowerCase()
  return METADATA_KEYWORDS.some(keyword => lower.includes(keyword))
}

function parseLine(line) {
  const cleaned = line.trim().replace(/\s{2,}/g, ' ')
  if (!cleaned || isMetadataLine(cleaned)) return null

  // Strip optional starting number (like index "1. " or "1 ")
  const strippedLine = cleaned.replace(/^\d+[\s.-]+/, '')

  // Pattern A: Name Qty UnitPrice TotalPrice (e.g. "Coca Cola 500ml 2 50.00 100.00")
  const patternA = strippedLine.match(/^(.+?)\s+(\d+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/)
  if (patternA) {
    const name = patternA[1].trim()
    const quantity = parseInt(patternA[2], 10)
    const unitPrice = parseFloat(patternA[3])
    return { name, quantity, price: unitPrice }
  }

  // Pattern B: Name Qty UnitPrice (e.g. "Coca Cola 2 50.00")
  const patternB = strippedLine.match(/^(.+?)\s+(\d+)\s+(\d+(?:\.\d+)?)$/)
  if (patternB) {
    const name = patternB[1].trim()
    const quantity = parseInt(patternB[2], 10)
    const unitPrice = parseFloat(patternB[3])
    return { name, quantity, price: unitPrice }
  }

  // Pattern C: Name Qty (like "x2" or "2 pcs") Price (e.g. "Coca Cola x2 100.00")
  const qtyMatch = strippedLine.match(/\b(x\s?\d+|\d+\s?(pcs|pc|qty))\b/i)
  const priceMatch = strippedLine.match(/(\d+(?:\.\d+)?)$/)
  if (priceMatch) {
    const price = parseFloat(priceMatch[1])
    let quantity = 1
    if (qtyMatch) {
      const q = qtyMatch[0].match(/\d+/)
      if (q) quantity = parseInt(q[0], 10)
    }
    let name = strippedLine
      .replace(qtyMatch ? qtyMatch[0] : '', '')
      .replace(priceMatch[0], '')
      .replace(/[-–—]+/g, '')
      .trim()
    
    if (name) {
      return { name, quantity, price }
    }
  }

  // Pattern D: Name Price (e.g. "French Fries 120.00")
  const patternD = strippedLine.match(/^(.+?)\s+(\d+(?:\.\d+)?)$/)
  if (patternD) {
    const name = patternD[1].trim()
    const price = parseFloat(patternD[2])
    return { name, quantity: 1, price }
  }

  return null
}

function parseOcrTextToItems(text) {
  const lines = text.split(/\r?\n/)
  const items = []
  for (const l of lines) {
    const it = parseLine(l)
    if (it && (it.name || it.price)) {
      items.push({ ...it, category: 'Uncategorized' })
    }
  }

  // Deduplicate and merge quantities by name
  const merged = []
  for (const it of items) {
    const idx = merged.findIndex(m => m.name.toLowerCase() === it.name.toLowerCase())
    if (idx >= 0) {
      merged[idx].quantity += it.quantity || 0
      if (it.price) merged[idx].price = it.price
    } else {
      merged.push(it)
    }
  }
  return merged.slice(0, 50)
}

module.exports = { parseOcrTextToItems }