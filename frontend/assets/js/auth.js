// assets/js/auth.js

const Auth = {
  login: async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.success) {
        localStorage.setItem('portaldesa_token', res.data.token);
        localStorage.setItem('portaldesa_user', JSON.stringify(res.data.user));
        return res.data;
      }
    } catch (err) {
      throw err;
    }
  },

  register: async (name, email, password, phone) => {
    try {
      const res = await API.post('/auth/register', { name, email, password, phone, role: 'petugas' });
      return res;
    } catch (err) {
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('portaldesa_token');
    localStorage.removeItem('portaldesa_user');
    window.location.href = '../admin/login.html';
  },

  getUser: () => {
    const userStr = localStorage.getItem('portaldesa_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('portaldesa_token');
  },

  requireAuth: () => {
    if (!Auth.isAuthenticated()) {
      window.location.href = '../admin/login.html';
    }
  },

  requireAdmin: () => {
    Auth.requireAuth();
    const user = Auth.getUser();
    if (user && user.role !== 'admin') {
      Swal.fire({
        title: 'Akses Ditolak',
        text: 'Halaman ini hanya untuk Admin.',
        icon: 'error',
        confirmButtonText: 'Kembali ke Dashboard',
        allowOutsideClick: false
      }).then(() => {
        window.location.href = '../admin/dashboard.html';
      });
    }
  },

  renderUserMenu: () => {
    const user = Auth.getUser();
    if (user) {
      // Update sidebar username
      const sidebarName = document.getElementById('sidebarUserName');
      if (sidebarName) sidebarName.textContent = user.name;
      
      const sidebarRole = document.getElementById('sidebarUserRole');
      if (sidebarRole) sidebarRole.textContent = user.role === 'admin' ? 'Administrator' : 'Petugas';

      // Update avatar
      const avatars = document.querySelectorAll('.user-avatar-img');
      const base = API_URL.replace('/api', '');
      const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=1a5c38&color=fff';
      
      avatars.forEach(img => {
        img.src = user.avatar ? `${base}/uploads/${user.avatar}` : defaultAvatar;
      });
    }
  }
};

// Global logout hook
document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      Swal.fire({
        title: 'Konfirmasi Logout',
        text: 'Apakah Anda yakin ingin keluar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1a5c38',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Ya, Logout',
        cancelButtonText: 'Batal'
      }).then((result) => {
        if (result.isConfirmed) {
          Auth.logout();
        }
      });
    });
  }
});
