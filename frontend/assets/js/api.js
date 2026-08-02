// assets/js/api.js
// Otomatis gunakan URL backend sesuai environment
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api'
  : 'https://BACKEND_URL_PRODUCTION/api'; // Ganti dengan URL backend Railway/Render setelah deploy

const API = {
  getHeaders: () => {
    const token = localStorage.getItem('portaldesa_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  get: async (endpoint) => {
    try {
      const res = await axios.get(`${API_URL}${endpoint}`, { headers: API.getHeaders() });
      return res.data;
    } catch (err) {
      throw err.response ? err.response.data : new Error('Koneksi terputus');
    }
  },

  post: async (endpoint, data, isMultipart = false) => {
    try {
      const headers = API.getHeaders();
      if (isMultipart) {
        headers['Content-Type'] = 'multipart/form-data';
      }
      const res = await axios.post(`${API_URL}${endpoint}`, data, { headers });
      return res.data;
    } catch (err) {
      throw err.response ? err.response.data : new Error('Koneksi terputus');
    }
  },

  put: async (endpoint, data, isMultipart = false) => {
    try {
      const headers = API.getHeaders();
      if (isMultipart) {
        headers['Content-Type'] = 'multipart/form-data';
      }
      const res = await axios.put(`${API_URL}${endpoint}`, data, { headers });
      return res.data;
    } catch (err) {
      throw err.response ? err.response.data : new Error('Koneksi terputus');
    }
  },

  patch: async (endpoint, data = {}) => {
    try {
      const res = await axios.patch(`${API_URL}${endpoint}`, data, { headers: API.getHeaders() });
      return res.data;
    } catch (err) {
      throw err.response ? err.response.data : new Error('Koneksi terputus');
    }
  },

  delete: async (endpoint) => {
    try {
      const res = await axios.delete(`${API_URL}${endpoint}`, { headers: API.getHeaders() });
      return res.data;
    } catch (err) {
      throw err.response ? err.response.data : new Error('Koneksi terputus');
    }
  }
};
