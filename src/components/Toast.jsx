import React from 'react'
import { X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const tone = (t, type) => {
  switch (type) {
    case 'success':
      return 'border-emerald-600 text-emerald-300'
    case 'error':
      return 'border-red-600 text-red-300'
    case 'warning':
      return 'border-yellow-600 text-yellow-300'
    default:
      return t.textSecondary
  }
}

const Toast = ({ type = 'info', message = '', onClose }) => {
  const { t } = useTheme()
  if (!message) return null
  return (
    <div className="fixed top-3 right-3 z-50 max-w-md">
      <div className={`px-4 py-3 rounded-lg border ${t.bgSecondary} ${t.border} ${tone(t, type)} shadow-lg flex items-start gap-3`}>
        <div className="flex-1 text-sm whitespace-pre-line">{message}</div>
        <button onClick={onClose} className={`p-1 rounded ${t.bgCard} ${t.border}`}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
