/**
 * components.js
 * Memuat sidebar.html dan navbar.html secara dinamis ke semua halaman admin.
 * Cara pakai: Sertakan file ini SEBELUM script lain, dan pastikan ada
 * elemen <div id="sidebar-container"> dan <div id="navbar-container"> di HTML.
 */

window.Components = window.Components || {
  async load(pageName) {
    try {
      // Helper fetch component
      const fetchComponent = async (filename) => {
        const paths = [
          `components/${filename}?v=` + Date.now(),
          `./components/${filename}?v=` + Date.now(),
          `../admin/components/${filename}?v=` + Date.now(),
          `/admin/components/${filename}?v=` + Date.now()
        ];
        for (const p of paths) {
          try {
            const res = await fetch(p);
            if (res.ok) return await res.text();
          } catch (_) {}
        }
        return '';
      };

      // Load sidebar (with cache busting)
      const sidebarHtml = await fetchComponent('sidebar.html');
      const sidebarContainer = document.getElementById('sidebar-container');
      if (sidebarContainer && sidebarHtml) sidebarContainer.innerHTML = sidebarHtml;

      // Load navbar (with cache busting)
      const navbarHtml = await fetchComponent('navbar.html');
      const navbarContainer = document.getElementById('navbar-container');
      if (navbarContainer && navbarHtml) navbarContainer.innerHTML = navbarHtml;

      // Set active menu
      const activeItem = document.querySelector(`#sidebar [data-page="${pageName}"]`);
      if (activeItem) activeItem.classList.add('active');

      // Set user info
      const user = Auth.getUser();
      if (user) {
        // Sidebar
        const initial = user.name ? user.name.charAt(0).toUpperCase() : 'A';
        const sidebarInitial = document.getElementById('sidebarAvatarInitial');
        const sidebarName = document.getElementById('sidebarUserName');
        const sidebarRole = document.getElementById('sidebarUserRole');
        if (sidebarInitial) sidebarInitial.textContent = initial;
        if (sidebarName)    sidebarName.textContent = user.name;
        if (sidebarRole)    sidebarRole.textContent = user.role === 'admin' ? 'Administrator' : 'Petugas Lapangan';

        // Navbar
        const navInitial = document.getElementById('navAvatarInitial');
        const navName    = document.getElementById('navUserName');
        const navRole    = document.getElementById('navUserRole');
        if (navInitial) navInitial.textContent = initial;
        if (navName)    navName.textContent = user.name;
        if (navRole)    navRole.textContent = user.role === 'admin' ? 'Administrator' : 'Petugas';

        // Show admin-only menus
        if (user.role === 'admin') {
          document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('d-none'));
        }
      }

      // Page Title in Navbar
      const titles = {
        dashboard:     'Dashboard',
        reports:       'Kelola Keluhan',
        'report-detail': 'Detail Keluhan',
        announcements: 'Kegiatan',
        users:         'Manajemen Pengguna',
        profile:       'Profil Saya',
      };
      const navTitle = document.getElementById('navbarPageTitle');
      if (navTitle && titles[pageName]) navTitle.textContent = titles[pageName];

      // Sidebar toggle & Mobile Backdrop
      const sidebarCollapseBtn = document.getElementById('sidebarCollapse');
      const sidebar = document.getElementById('sidebar');
      const content = document.getElementById('content');
      
      // Create backdrop overlay for mobile
      let backdrop = document.getElementById('sidebarBackdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebarBackdrop';
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
      }

      // Close sidebar function
      function closeSidebar() {
        if (!sidebar) return;
        const isMobile = window.innerWidth < 992;
        if (isMobile) {
          sidebar.classList.remove('mobile-show');
          backdrop.classList.remove('show');
        } else {
          sidebar.classList.add('active');
          if (content) content.classList.add('active');
        }
      }

      // Backdrop click closes sidebar
      backdrop.addEventListener('click', closeSidebar);

      // Hamburger toggle
      if (sidebarCollapseBtn) {
        sidebarCollapseBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const isMobile = window.innerWidth < 992;
          if (isMobile) {
            const isOpen = sidebar.classList.contains('mobile-show');
            if (isOpen) {
              sidebar.classList.remove('mobile-show');
              backdrop.classList.remove('show');
            } else {
              sidebar.classList.add('mobile-show');
              backdrop.classList.add('show');
            }
          } else {
            sidebar.classList.toggle('active');
            if (content) content.classList.toggle('active');
          }
        });
      }

      // Close mobile sidebar when clicking a menu link
      document.querySelectorAll('#sidebar .sidebar-menu a').forEach(function(link) {
        link.addEventListener('click', function() {
          if (window.innerWidth < 992) {
            sidebar.classList.remove('mobile-show');
            backdrop.classList.remove('show');
          }
        });
      });

      // Logout handlers (Sidebar & Navbar)
      const logoutBtns = document.querySelectorAll('#btnLogout, #sidebarBtnLogout, .btn-logout-action');
      logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              title: 'Konfirmasi Keluar',
              text: 'Apakah Anda yakin ingin keluar dari panel admin?',
              icon: 'question',
              showCancelButton: true,
              confirmButtonColor: '#10b981',
              cancelButtonColor: '#ef4444',
              confirmButtonText: '<i class="fa-solid fa-right-from-bracket me-1"></i> Ya, Keluar',
              cancelButtonText: 'Batal',
              customClass: {
                confirmButton: 'rounded-pill px-4',
                cancelButton: 'rounded-pill px-4'
              }
            }).then((result) => {
              if (result.isConfirmed) {
                Auth.logout();
              }
            });
          } else {
            if (confirm('Apakah Anda yakin ingin keluar?')) {
              Auth.logout();
            }
          }
        });
      });

      // Init SPA Router
      Components.initRouter();

      // Pindahkan modal dari .main-content ke body agar Bootstrap backdrop berfungsi
      document.querySelectorAll('.main-content .modal').forEach(m => {
        document.body.appendChild(m);
      });

      // Pending notifications badge
      Components.loadNotifBadge();

    } catch (err) {
      console.error('Error loading components:', err);
    }
  },

  initRouter() {
    document.querySelectorAll('#sidebar .sidebar-menu a').forEach(link => {
      // Abaikan link eksternal atau logout
      if (link.classList.contains('sidebar-link-public') || link.classList.contains('sidebar-link-logout')) return;
      
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Tutup sidebar di versi mobile
        if (window.innerWidth < 992) {
          const sidebar = document.getElementById('sidebar');
          const backdrop = document.getElementById('sidebarBackdrop');
          if (sidebar) sidebar.classList.remove('mobile-show');
          if (backdrop) backdrop.classList.remove('show');
        }

        const url = link.getAttribute('href');
        if (!url || url === '#') return;
        
        // Jangan routing jika itu adalah halaman yang sama
        const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
        const targetPath = url.split('?')[0];
        if (currentPath === targetPath) return;

        try {
          const res = await fetch(url, { cache: 'no-cache' });
          const html = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Ganti konten utama (.main-content)
          const currentMain = document.querySelector('.main-content');
          const newMain = doc.querySelector('.main-content');
          if (currentMain && newMain) {
            currentMain.innerHTML = newMain.innerHTML;
          }

          // Hapus modal lama di body (jika ada)
          document.querySelectorAll('body > .modal').forEach(m => m.remove());
          // Pindahkan modal baru (dari dalam .main-content) ke body agar Bootstrap backdrop berfungsi
          currentMain.querySelectorAll('.modal').forEach(m => {
            m.remove(); // hapus dari main-content
            document.body.appendChild(m); // taruh di body
          });

          // Perbarui Judul Dokumen
          document.title = doc.title;
          
          // Perbarui status aktif sidebar
          document.querySelectorAll('#sidebar .sidebar-menu li').forEach(li => li.classList.remove('active'));
          const pageName = link.parentElement.dataset.page;
          const activeLi = document.querySelector(`#sidebar [data-page="${pageName}"]`);
          if (activeLi) activeLi.classList.add('active');

          // Perbarui judul navbar
          const titles = { dashboard: 'Dashboard', reports: 'Kelola Keluhan', 'report-detail': 'Detail Keluhan', announcements: 'Kegiatan', users: 'Manajemen Pengguna', profile: 'Profil Saya' };
          const navTitle = document.getElementById('navbarPageTitle');
          if (navTitle && titles[pageName]) navTitle.textContent = titles[pageName];

          // Ekstrak & load skrip baru dari head (misal: chart.js, dashboard.js, dll)
          const newScripts = doc.querySelectorAll('script');
          for (const script of newScripts) {
            if (script.src) {
              const srcPath = script.getAttribute('src');
              // Jangan pernah muat ulang components.js
              if (srcPath.includes('components.js')) continue;

              if (!document.querySelector(`script[src="${srcPath}"]`)) {
                await new Promise(resolve => {
                  const s = document.createElement('script');
                  s.src = srcPath;
                  s.onload = resolve;
                  document.body.appendChild(s);
                });
              }
            } else {
              // Jika ini adalah skrip sebaris (inline) yang mengandung window.initPage
              const content = script.innerHTML;
              if (content.includes('window.initPage')) {
                const scriptEl = document.createElement('script');
                scriptEl.textContent = content;
                document.body.appendChild(scriptEl);
              }
            }
          }
          
          // Perbarui URL
          window.history.pushState(null, '', url);

          // Jalankan Inisialisasi Halaman
          if (typeof window.initPage === 'function') {
             window.initPage(true); // true = dipanggil via SPA
          }

        } catch (err) {
          console.error("SPA Routing Error:", err);
          window.location.href = url; // Fallback ke navigasi biasa jika gagal
        }
      });
    });

    // Handle browser Back/Forward buttons
    window.addEventListener('popstate', async () => {
      const url = window.location.href;
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const currentMain = document.querySelector('.main-content');
        const newMain = doc.querySelector('.main-content');
        if (currentMain && newMain) {
          currentMain.innerHTML = newMain.innerHTML;
        }

        // Hapus modal lama di body (jika ada)
        document.querySelectorAll('body > .modal').forEach(m => m.remove());
        // Pindahkan modal baru ke body agar Bootstrap backdrop berfungsi
        currentMain.querySelectorAll('.modal').forEach(m => {
          m.remove();
          document.body.appendChild(m);
        });

        document.title = doc.title;
        
        document.querySelectorAll('#sidebar .sidebar-menu li').forEach(li => li.classList.remove('active'));
        const pageName = doc.body.dataset.page || url.split('/').pop().replace('.html', '').split('?')[0];
        const activeLi = document.querySelector(`#sidebar [data-page="${pageName}"]`);
        if (activeLi) activeLi.classList.add('active');

        const titles = { dashboard: 'Dashboard', reports: 'Kelola Keluhan', 'report-detail': 'Detail Keluhan', announcements: 'Kegiatan', users: 'Manajemen Pengguna', profile: 'Profil Saya' };
        const navTitle = document.getElementById('navbarPageTitle');
        if (navTitle && titles[pageName]) navTitle.textContent = titles[pageName];

        const newScripts = doc.querySelectorAll('script');
        for (const script of newScripts) {
          if (script.src) {
            const srcPath = script.getAttribute('src');
            if (srcPath.includes('components.js')) continue;
            
            if (!document.querySelector(`script[src="${srcPath}"]`)) {
              await new Promise(resolve => {
                const s = document.createElement('script');
                s.src = srcPath;
                s.onload = resolve;
                document.body.appendChild(s);
              });
            }
          } else {
            const content = script.innerHTML;
            if (content.includes('window.initPage')) {
              const scriptEl = document.createElement('script');
              scriptEl.textContent = content;
              document.body.appendChild(scriptEl);
            }
          }
        }
        
        if (typeof window.initPage === 'function') {
           window.initPage(true);
        }
      } catch (err) {
        window.location.reload();
      }
    });
  },

  async loadNotifBadge() {
    try {
      const res = await API.get('/dashboard/stats');
      if (res.success && res.data.menunggu > 0) {
        const badge = document.getElementById('navNotifBadge');
        if (badge) badge.style.display = 'block';
      }
    } catch (_) {}
  }
};
