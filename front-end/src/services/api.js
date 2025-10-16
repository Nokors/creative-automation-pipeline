import axios from 'axios'

// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.PROD 
  ? 'http://localhost:8000' 
  : '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Export API_BASE_URL for use in other components
export { API_BASE_URL }

// API methods
export const campaignAPI = {
  // Get all campaigns
  list: (params = {}) => api.get('/campaigns', { params }),

  // Get single campaign
  get: (id) => api.get(`/campaigns/${id}`),

  // Create campaign
  create: (data) => api.post('/campaigns', data),

  // Get asset report
  getAssetReport: () => api.get('/reports/assets'),
}

// Image Library API
export const imageLibraryAPI = {
  // Upload image
  upload: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/api/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // List all images
  list: () => api.get('/api/images'),

  // Get image URL
  getUrl: (filename) => `${API_BASE_URL}/api/images/${filename}`,

  // Get thumbnail URL
  getThumbnailUrl: (filename) => `${API_BASE_URL}/api/images/${filename}/thumbnail`,
}

export default api

