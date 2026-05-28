import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import LoadingBar from './LoadingBar'
import Toast from './Toast'
import { api } from '../lib/api'

const CustomersView = () => {
  const { t } = useTheme()
  const [customers, setCustomers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ type: 'info', message: '' })
  const showToast = (type, message) => setToast({ type, message })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      } else {
        const data = await response.json().catch(() => ({}))
        const errorMsg = data?.error || `HTTP ${response.status}: ${response.statusText}`
        console.error('Failed to fetch customers:', { status: response.status, data })
        showToast('error', `Failed to load customers: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      const errorMsg = error.message || 'Failed to fetch customers. Please check if the server is running.'
      showToast('error', errorMsg)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const path = editingCustomer
      ? `/api/customers/${editingCustomer.id}`
      : '/api/customers'

    setSaving(true)
    try {
      const response = editingCustomer
        ? await api.put(path, formData)
        : await api.post(path, formData)

      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        fetchCustomers()
        setShowModal(false)
        resetForm()
        showToast('success', editingCustomer ? 'Customer updated' : 'Customer created')
      } else {
        const errorMsg = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`
        console.error('Save customer error:', { status: response.status, data, response })
        showToast('error', errorMsg)
      }
    } catch (error) {
      console.error('Save failed:', error)
      const errorMsg = error.message || 'Failed to save customer. Please check your connection and try again.'
      showToast('error', errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return

    try {
      const response = await api.delete(`/api/customers/${id}`)

      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        fetchCustomers()
        showToast('success', 'Customer deleted')
      } else {
        const msg = data?.error || 'Failed to delete customer'
        showToast('error', msg)
      }
    } catch (error) {
      console.error('Delete failed:', error)
      showToast('error', 'Failed to delete customer')
    }
  }

  const openEditModal = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingCustomer(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: ''
    })
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="p-6">
      <LoadingBar active={saving} label={saving ? (editingCustomer ? 'Updating customer...' : 'Creating customer...') : ''} />
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ type: 'info', message: '' })} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className={`px-6 py-3 ${t.accent} ${t.accentHover} text-white rounded-lg flex items-center space-x-2`}
        >
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-lg border ${t.input}`}
          />
        </div>
      </div>

      <div className={`${t.bgCard} rounded-lg border ${t.border} overflow-hidden`}>
        <table className="w-full">
          <thead className={`${t.bgSecondary}`}>
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Phone</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Address</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className={`border-t ${t.border}`}>
                <td className="p-4 font-semibold">{customer.name}</td>
                <td className="p-4">{customer.phone || '-'}</td>
                <td className="p-4">{customer.email || '-'}</td>
                <td className="p-4">{customer.address || '-'}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => openEditModal(customer)}
                    className="text-blue-500 hover:text-blue-400 mr-3"
                  >
                    <Edit className="w-4 h-4 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${t.bgSecondary} rounded-lg p-6 w-full max-w-md`}>
            <h2 className="text-2xl font-bold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary}`}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary}`}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary}`}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${t.textSecondary}`}>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${t.input}`}
                  rows="3"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className={`flex-1 py-2 ${t.bgCard} border ${t.border} rounded-lg hover:border-gray-500`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 py-2 ${t.accent} ${t.accentHover} text-white rounded-lg disabled:opacity-60`}
                >
                  {saving ? 'Saving...' : (editingCustomer ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomersView
