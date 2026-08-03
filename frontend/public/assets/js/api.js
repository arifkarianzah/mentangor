// assets/js/api.js
// Otomatis gunakan URL backend (Vercel Serverless atau Localhost)
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

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

// Interceptor untuk menangani token kedaluwarsa secara otomatis
if (typeof axios !== 'undefined') {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        if (window.location.pathname.includes('/admin/') && !window.location.pathname.includes('login.html')) {
          localStorage.removeItem('portaldesa_token');
          localStorage.removeItem('portaldesa_user');
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              title: 'Sesi Telah Berakhir',
              text: 'Sesi login Anda telah kedaluwarsa. Silakan login kembali.',
              icon: 'warning',
              confirmButtonColor: '#10b981',
              confirmButtonText: 'Login Kembali',
              allowOutsideClick: false
            }).then(() => {
              window.location.href = 'login.html';
            });
          } else {
            window.location.href = 'login.html';
          }
        }
      }
      return Promise.reject(error);
    }
  );
}
