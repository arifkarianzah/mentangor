// assets/js/main.js

function initApp() {
  // Navbar Scrolled Effect
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Handle Auth state in Navbar
  const token = localStorage.getItem('portaldesa_token');
  const userStr = localStorage.getItem('portaldesa_user');
  const authNavContainer = document.getElementById('authNavContainer');
  
  if (authNavContainer) {
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const adminPath = '/admin/dashboard.html';
        authNavContainer.innerHTML = `
          <a href="${adminPath}" class="btn btn-outline-light btn-sm rounded-pill px-3 d-flex align-items-center gap-2">
            <i class="fa-solid fa-user-circle"></i> Panel ${user.role === 'admin' ? 'Admin' : 'Petugas'}
          </a>
        `;
      } catch(e) {}
    }
  }

  // Handle cross-page anchor scrolling on load
  if (window.location.hash) {
    const hash = window.location.hash;
    const targetElement = document.querySelector(hash);
    
    if (targetElement) {
      setTimeout(() => {
        const navbarHeight = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight : 80;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  }

  // Before/After Slider Logic (if exists on page)
  initSlider();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initSlider() {
  const resize = document.querySelector('.ba-slider .resize');
  const handle = document.querySelector('.ba-slider .handle');
  const slider = document.querySelector('.ba-slider');

  if (!slider || !resize || !handle) return;

  let isDragging = false;

  const move = (e) => {
    if (!isDragging) return;
    
    const sliderRect = slider.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    if (clientX === undefined) return;

    let x = clientX - sliderRect.left;
    
    // Constraints
    if (x < 0) x = 0;
    if (x > sliderRect.width) x = sliderRect.width;

    const percentage = (x / sliderRect.width) * 100;
    
    resize.style.width = percentage + '%';
    handle.style.left = percentage + '%';
  };

  const stop = () => { isDragging = false; };

  slider.addEventListener('mousedown', (e) => { isDragging = true; move(e); });
  slider.addEventListener('touchstart', (e) => { isDragging = true; move(e); }, { passive: true });

  window.addEventListener('mousemove', move);
  window.addEventListener('touchmove', move, { passive: true });

  window.addEventListener('mouseup', stop);
  window.addEventListener('touchend', stop);
}
