import { getCurrentIdToken } from './firebase'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export function apiUrl(path) {
  const basePath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${basePath}`
}

/**
 * Make an authenticated API request with automatic Firebase ID token inclusion
 * @param {string} path - API endpoint path (e.g., '/api/products' or 'api/products')
 * @param {RequestInit} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>}
 */
export async function apiRequest(path, options = {}) {
  const url = apiUrl(path)
  
  // Get fresh Firebase ID token
  const token = await getCurrentIdToken()
  
  // If no token and not in demo mode, try localStorage fallback
  const authToken = token || localStorage.getItem('token')
  
  // Log if no token (for debugging)
  if (!authToken) {
    console.warn('[API] No authentication token available for request to:', path)
  }
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  // Add authorization header if we have a token
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  // For FormData requests, don't set Content-Type (browser will set it with boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }
  
  // Make the request
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })
    
    // Log authentication errors
    if (response.status === 401) {
      console.error('[API] Authentication failed (401) for:', path)
      console.error('[API] Token available:', !!authToken)
    }
    
    return response
  } catch (error) {
    console.error('[API] Request failed:', { path, url, error })
    throw error
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (path, options = {}) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => apiRequest(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (path, body, options = {}) => apiRequest(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (path, options = {}) => apiRequest(path, { ...options, method: 'DELETE' }),
  // For FormData uploads
  postFormData: (path, formData, options = {}) => apiRequest(path, { ...options, method: 'POST', body: formData }),
}
