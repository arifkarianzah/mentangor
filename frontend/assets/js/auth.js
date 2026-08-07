// assets/js/auth.js

if (typeof window.Auth === 'undefined') {
  window.Auth = {
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
      window.location.href = '/admin/login.html';
    },

    getUser: () => {
      const userStr = localStorage.getItem('portaldesa_user');
      return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: () => {
      return !!localStorage.getItem('portaldesa_token');
    },

    requireAuth: () => {
      if (!window.Auth.isAuthenticated()) {
        window.location.href = '/admin/login.html';
      }
    },

    requireAdmin: () => {
      window.Auth.requireAuth();
      const user = window.Auth.getUser();
      if (user && user.role !== 'admin') {
        Swal.fire({
          title: 'Akses Ditolak',
          text: 'Halaman ini hanya untuk Admin.',
          icon: 'error',
          confirmButtonText: 'Kembali ke Dashboard',
          allowOutsideClick: false
        }).then(() => {
          window.location.href = '/admin/dashboard.html';
        });
      }
    },

    renderUserMenu: () => {
      const user = window.Auth.getUser();
      if (user) {
        const initial = user.name ? user.name.charAt(0).toUpperCase() : 'A';
        const base = (typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:3000/api').replace('/api', '');
        const avatarUrl = user.avatar ? `${base}/uploads/${user.avatar}` : null;
        const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=10b981&color=fff';

        // Update sidebar username & role
        const sidebarName = document.getElementById('sidebarUserName');
        if (sidebarName) sidebarName.textContent = user.name;
        
        const sidebarRole = document.getElementById('sidebarUserRole');
        if (sidebarRole) sidebarRole.textContent = user.role === 'admin' ? 'Administrator' : 'Petugas Lapangan';

        const sidebarInitial = document.getElementById('sidebarAvatarInitial');
        if (sidebarInitial) {
          if (avatarUrl) {
            sidebarInitial.innerHTML = `<img src="${avatarUrl}" alt="${user.name}" class="w-100 h-100 rounded-circle object-fit-cover">`;
            sidebarInitial.style.background = 'transparent';
            sidebarInitial.style.overflow = 'hidden';
          } else {
            sidebarInitial.textContent = initial;
            sidebarInitial.style.background = '';
          }
        }

        // Update navbar
        const navName = document.getElementById('navUserName');
        if (navName) navName.textContent = user.name;

        const navRole = document.getElementById('navUserRole');
        if (navRole) navRole.textContent = user.role === 'admin' ? 'Administrator' : 'Petugas';

        const navInitial = document.getElementById('navAvatarInitial');
        if (navInitial) {
          if (avatarUrl) {
            navInitial.innerHTML = `<img src="${avatarUrl}" alt="${user.name}" class="w-100 h-100 rounded-circle object-fit-cover">`;
            navInitial.style.background = 'transparent';
            navInitial.style.overflow = 'hidden';
          } else {
            navInitial.textContent = initial;
            navInitial.style.background = '';
          }
        }

        // Update any other .user-avatar-img
        const avatars = document.querySelectorAll('.user-avatar-img');
        avatars.forEach(img => {
          img.src = avatarUrl || defaultAvatar;
        });
      }
    }
  };
}
var Auth = window.Auth;

// Global logout hook
document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout && !btnLogout.dataset.bound) {
    btnLogout.dataset.bound = 'true';
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
