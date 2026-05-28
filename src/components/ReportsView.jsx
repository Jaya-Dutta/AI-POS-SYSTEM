import React, { useState, useEffect } from 'react'
import { TrendingUp, Package, DollarSign, ShoppingBag } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'

const ReportsView = () => {
  const { t } = useTheme()
  const [salesReport, setSalesReport] = useState(null)
  const [inventoryReport, setInventoryReport] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const [salesRes, inventoryRes, topRes] = await Promise.all([
        api.get('/api/reports/sales'),
        api.get('/api/reports/inventory'),
        api.get('/api/reports/top-products?limit=5')
      ])

      const sales = salesRes.ok ? await salesRes.json() : null
      const inventory = inventoryRes.ok ? await inventoryRes.json() : null
      const top = topRes.ok ? await topRes.json() : null

      if (sales) setSalesReport(sales.summary)
      if (inventory) setInventoryReport(inventory.summary)
      if (top) setTopProducts(top.topProducts)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <p className="text-xl">Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${t.textSecondary}`}>Total Revenue</h3>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-3xl font-bold">₹{salesReport?.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>

        <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${t.textSecondary}`}>Transactions</h3>
            <ShoppingBag className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">{salesReport?.transactionCount || 0}</p>
        </div>

        <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${t.textSecondary}`}>Avg Transaction</h3>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-3xl font-bold">₹{salesReport?.averageTransaction?.toFixed(2) || '0.00'}</p>
        </div>

        <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${t.textSecondary}`}>Total Products</h3>
            <Package className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-3xl font-bold">{inventoryReport?.totalProducts || 0}</p>
        </div>
      </div>

      {/* Sales Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg`}>
          <h2 className="text-xl font-bold mb-4">Sales Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={t.textSecondary}>Total Revenue:</span>
              <span className="font-bold text-green-500">₹{salesReport?.totalRevenue?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className={t.textSecondary}>Total Tax:</span>
              <span className="font-semibold">₹{salesReport?.totalTax?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className={t.textSecondary}>Total Discount:</span>
              <span className="font-semibold text-red-500">₹{salesReport?.totalDiscount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-700">
              <span className={t.textSecondary}>Transaction Count:</span>
              <span className="font-bold">{salesReport?.transactionCount || 0}</span>
            </div>
          </div>
        </div>

        <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg`}>
          <h2 className="text-xl font-bold mb-4">Inventory Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={t.textSecondary}>Total Value:</span>
              <span className="font-bold text-blue-500">₹{inventoryReport?.totalInventoryValue?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className={t.textSecondary}>Total Cost:</span>
              <span className="font-semibold">₹{inventoryReport?.totalInventoryCost?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className={t.textSecondary}>Potential Profit:</span>
              <span className="font-semibold text-green-500">₹{inventoryReport?.potentialProfit?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-700">
              <span className={t.textSecondary}>Low Stock Items:</span>
              <span className={`font-bold ${inventoryReport?.lowStockCount > 0 ? 'text-yellow-500' : ''}`}>
                {inventoryReport?.lowStockCount || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={t.textSecondary}>Out of Stock:</span>
              <span className={`font-bold ${inventoryReport?.outOfStockCount > 0 ? 'text-red-500' : ''}`}>
                {inventoryReport?.outOfStockCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className={`p-6 ${t.bgCard} border ${t.border} rounded-lg`}>
        <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
        {topProducts.length === 0 ? (
          <p className={t.textSecondary}>No sales data available</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div key={idx} className={`p-4 ${t.bgSecondary} rounded-lg border ${t.border}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className={`text-sm ${t.textSecondary}`}>Sold: {product.quantitySold} units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-500">₹{product.revenue.toFixed(2)}</p>
                    <p className={`text-sm ${t.textSecondary}`}>Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsView
