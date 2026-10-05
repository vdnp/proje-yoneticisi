import mockApi from './mockApi.js'

// Prefer the real Electron bridge (window.api from preload). Fall back to the
// localStorage-backed mock when running the renderer in a plain browser.
const api = typeof window !== 'undefined' && window.api ? window.api : mockApi

export default api
