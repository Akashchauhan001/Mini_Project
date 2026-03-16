import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

// ── Papers ─────────────────────────────────
export const getPapers = () => api.get('/papers')
export const getPaper = (id) => api.get(`/papers/${id}`)
export const deletePaper = (id) => api.delete(`/papers/${id}`)

export const uploadPaper = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/papers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
}

// ── Search ─────────────────────────────────
export const semanticSearch = (query, topK = 10) =>
  api.post('/search', { query, top_k: topK })

// ── Knowledge Graph ────────────────────────
export const getGraph = () => api.get('/graph')
export const getPaperGraph = (id) => api.get(`/graph/paper/${id}`)

// ── AI Assistant ───────────────────────────
export const askAssistant = (query, paperId = null) =>
  api.post('/assistant/query', { query, paper_id: paperId })

// ── Stats ──────────────────────────────────
export const getStats = () => api.get('/stats')
export const getHealth = () => api.get('/health')

export default api
