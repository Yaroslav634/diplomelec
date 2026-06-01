// mobile-nav.js

document.addEventListener("DOMContentLoaded", () => {
  initMobileBottomNav();
  initSwipeGestures();
});

function initMobileBottomNav() {
  // Проверяем, что мы на мобильном
  if (window.innerWidth > 768) return;
  
  // Создаём нижнее меню
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'mobile-bottom-nav';
  bottomNav.innerHTML = `
    <a href="/" class="mobile-nav-item ${window.location.pathname === '/' ? 'active' : ''}">
      <i class="fas fa-cogs"></i>
      <span>Сборка</span>
    </a>
    <a href="/#catalog" class="mobile-nav-item">
      <i class="fas fa-th-large"></i>
      <span>Каталог</span>
    </a>
    <a href="/orders.html" class="mobile-nav-item ${window.location.pathname.includes('orders') ? 'active' : ''}">
      <i class="fas fa-box"></i>
      <span>Заказы</span>
    </a>
    <button class="mobile-nav-item" onclick="document.getElementById('btnOpenFilters').click()">
      <i class="fas fa-filter"></i>
      <span>Фильтры</span>
    </button>
  `;
  
  document.body.appendChild(bottomNav);
  
  // Добавляем отступ снизу для контента
  document.body.style.paddingBottom = '70px';
}

function initSwipeGestures() {
  const filterSidebar = document.getElementById('filterSidebar');
  if (!filterSidebar) return;
  
  let touchStartX = 0;
  let touchEndX = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  
  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
  
  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    const threshold = 100;
    
    // Свайп вправо — открываем фильтры
    if (swipeDistance > threshold && touchStartX < 50) {
      if (typeof window.openFilterSidebar === 'function') {
        window.openFilterSidebar();
      }
    }
    
    // Свайп влево — закрываем фильтры
    if (swipeDistance < -threshold && filterSidebar.classList.contains('active')) {
      if (typeof window.closeFilterSidebar === 'function') {
        window.closeFilterSidebar();
      }
    }
  }
}