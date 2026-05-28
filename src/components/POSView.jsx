import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Camera, Search } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import LoadingBar from './LoadingBar'
import Toast from './Toast'
import { api } from '../lib/api'

const POSView = () => {
  const { t } = useTheme()
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(0.18)
  const [uploading, setUploading] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [toast, setToast] = useState({ type: 'info', message: '' })
  const showToast = (type, message) => setToast({ type, message })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const addToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id)
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price || 0,
        quantity: 1
      }])
    }
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ))
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await api.postFormData('/api/upload', formData)

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        // Show detailed error message
        const errorMsg = data?.error || data?.message || data?.details || `HTTP ${response.status}: ${response.statusText}`
        console.error('Upload error:', { status: response.status, data, response })
        showToast('error', `Failed to process image: ${errorMsg}`)
        return
      }

      if (data.warning) {
        showToast('warning', data.warning)
      }

      if (data.items && data.items.length > 0) {
        let added = 0
        const newCartItems = []
        data.items.forEach(item => {
          // Find matching catalog product (case-insensitive name match)
          const matchedProd = products.find(p => p.name.toLowerCase() === item.name.toLowerCase())
          
          newCartItems.push({
            productId: matchedProd ? matchedProd.id : `temp-${Math.random().toString(36).substring(2, 9)}`,
            name: item.name,
            price: item.price || (matchedProd ? matchedProd.price : 0),
            quantity: item.quantity || 1
          })
          added += 1
        })
        
        // Merge with existing cart items
        setCart(prev => {
          const current = [...prev]
          newCartItems.forEach(newItem => {
            const existingIdx = current.findIndex(item => item.productId === newItem.productId)
            if (existingIdx >= 0) {
              current[existingIdx].quantity += newItem.quantity
            } else {
              current.push(newItem)
            }
          })
          return current
        })
        showToast('success', `Added ${added} item(s) from OCR`)
      } else {
        showToast('info', 'No items detected from the uploaded image')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      const errorMsg = error.message || 'Failed to process image. Please check your connection and try again.'
      showToast('error', errorMsg)
    } finally {
      setUploading(false)
    }
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discountAmt = discount || 0
    const taxable = Math.max(0, subtotal - discountAmt)
    const tax = taxable * taxRate
    const total = taxable + tax
    return { subtotal, discountAmt, tax, total }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('warning', 'Cart is empty')
      return
    }

    const { subtotal, discountAmt, tax, total } = calculateTotals()

    setCheckingOut(true)
    try {
      const response = await api.post('/api/transactions', {
        items: cart,
        discount: discountAmt,
        taxRate,
        payments: [{ method: 'cash', amount: total }]
      })

      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        showToast('success', 'Transaction completed!')
        setCart([])
        setDiscount(0)
        fetchProducts()
      } else {
        const msg = data?.error || 'Transaction failed'
        showToast('error', msg)
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      showToast('error', 'Checkout failed')
    } finally {
      setCheckingOut(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const { subtotal, discountAmt, tax, total } = calculateTotals()

  return (
    <>
      <LoadingBar active={uploading || checkingOut} label={(uploading && 'Processing image...') || (checkingOut && 'Completing sale...') || ''} />
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'info', message: '' })} />
      <div className="flex h-screen">
      {/* Products Section */}
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-3xl font-bold mb-6">Point of Sale</h1>

        <div className="mb-6 flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${t.input}`}
            />
          </div>
          <label className={`px-6 py-3 ${t.accent} ${t.accentHover} text-white rounded-lg cursor-pointer flex items-center space-x-2`}>
            <Camera className="w-5 h-5" />
            <span>{uploading ? 'Processing...' : 'Scan Bill'}</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className={`p-4 ${t.bgCard} border ${t.border} rounded-lg hover:border-blue-500 transition text-left`}
            >
              <h3 className="font-semibold mb-2">{product.name}</h3>
              <p className={`text-sm ${t.textSecondary} mb-2`}>{product.category}</p>
              <p className="text-lg font-bold text-blue-500">₹{product.price?.toFixed(2) || '0.00'}</p>
              <p className={`text-xs ${t.textSecondary}`}>Stock: {product.quantity || 0}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className={`w-96 ${t.bgSecondary} border-l ${t.border} p-6 flex flex-col`}>
        <h2 className="text-2xl font-bold mb-6">Cart</h2>

        <div className="flex-1 overflow-auto mb-4 space-y-3">
          {cart.length === 0 ? (
            <p className={t.textSecondary}>Cart is empty</p>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className={`p-3 ${t.bgCard} rounded-lg border ${t.border}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className={`px-2 py-1 ${t.bgSecondary} rounded`}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className={`px-2 py-1 ${t.bgSecondary} rounded`}
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className={`block text-sm mb-2 ${t.textSecondary}`}>Discount (₹)</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
              min="0"
            />
          </div>
          <div>
            <label className={`block text-sm mb-2 ${t.textSecondary}`}>Tax Rate (%)</label>
            <input
              type="number"
              value={(taxRate * 100).toFixed(0)}
              onChange={(e) => setTaxRate(Number(e.target.value) / 100)}
              className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className={`border-t ${t.border} pt-4 space-y-2`}>
          <div className="flex justify-between">
            <span className={t.textSecondary}>Subtotal:</span>
            <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className={t.textSecondary}>Discount:</span>
            <span className="font-semibold text-red-500">-₹{discountAmt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className={t.textSecondary}>Tax ({(taxRate * 100).toFixed(0)}%):</span>
            <span className="font-semibold">₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-700">
            <span>Total:</span>
            <span className="text-blue-500">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || checkingOut}
          className={`w-full mt-4 py-4 ${t.accent} ${t.accentHover} text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {checkingOut ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
      </div>
    </>
  )
}

export default POSView
