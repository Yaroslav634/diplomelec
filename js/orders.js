// orders.js - СОВРЕМЕННАЯ ВЕРСИЯ (без дубликатов и hero)

const API_BASE_URL = window.location.origin.includes("localhost")
  ? `http://localhost:${window.location.port || 3001}/api`
  : "/api";

let currentUser = null;
let allOrders = [];
let filteredOrders = [];
let currentStatusFilter = 'all';
let currentSearchTerm = '';
let currentDateFrom = '';
let currentDateTo = '';

// ============ ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener("DOMContentLoaded", async () => {
  initThemeToggle();
  await checkAuth();
  await loadOrders();
  setupEventListeners();
});

function initThemeToggle() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  
  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      }
    });
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
      currentSearchTerm = searchInput.value.toLowerCase();
      applyFilters();
    }, 300));
  }
  
  const applyBtn = document.getElementById("applyFiltersBtn");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      currentStatusFilter = document.getElementById("statusFilter").value;
      currentDateFrom = document.getElementById("dateFrom").value;
      currentDateTo = document.getElementById("dateTo").value;
      applyFilters();
      updateActiveStatCard(currentStatusFilter);
    });
  }
  
  const resetBtn = document.getElementById("resetFiltersBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetFilters);
  }
  
  document.querySelectorAll(".stat-card-order").forEach(card => {
    card.addEventListener("click", () => {
      const status = card.dataset.status;
      currentStatusFilter = status === 'processing' ? status : status;
      document.getElementById("statusFilter").value = status;
      applyFilters();
      updateActiveStatCard(status);
    });
  });
}

function updateActiveStatCard(status) {
  document.querySelectorAll(".stat-card-order").forEach(c => c.classList.remove("active"));
  const activeCard = document.querySelector(`.stat-card-order[data-status="${status}"]`);
  if (activeCard) activeCard.classList.add("active");
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============ АВТОРИЗАЦИЯ ============
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
    const data = await response.json();

    if (data.success && data.authenticated) {
      currentUser = data.user;
      updateAuthUI();
    } else {
      window.location.href = "/";
    }
  } catch (error) {
    console.error("Ошибка авторизации:", error);
    window.location.href = "/";
  }
}

function updateAuthUI() {
  const authSection = document.getElementById("authSection");
  if (!authSection) return;

  if (currentUser) {
    let roleText = "Пользователь";
    let roleColor = "#3b82f6";
    if (currentUser.role === "admin") {
      roleText = "Админ";
      roleColor = "#ef4444";
    } else if (currentUser.role === "manager") {
      roleText = "Менеджер";
      roleColor = "#f59e0b";
    }

    authSection.innerHTML = `
      <div class="user-menu" style="display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.08); padding: 6px 20px 6px 16px; border-radius: 50px;">
        <span><i class="fas fa-user"></i> ${escapeHtml(currentUser.full_name || currentUser.username)}</span>
        <span class="role-badge" style="background: ${roleColor}; color: white; padding: 5px 12px; border-radius: 30px; font-size: 0.75rem;">${roleText}</span>
        ${currentUser.role === "admin" || currentUser.role === "manager" ? 
          `<a href="/admin.html" class="nav-link" style="color: white; background: rgba(59,130,246,0.2); padding: 6px 14px; border-radius: 30px;"><i class="fas fa-cog"></i> Админка</a>` : ""}
        <button onclick="logout()" class="logout-btn" style="background: #ef4444; color: white; border: none; padding: 6px 14px; border-radius: 30px; cursor: pointer;">
          <i class="fas fa-sign-out-alt"></i> Выйти
        </button>
      </div>
    `;
  } else {
    authSection.innerHTML = `
      <div class="auth-buttons-modern">
        <button class="btn-login" onclick="showLoginModal()"><i class="fas fa-sign-in-alt"></i><span>Вход</span></button>
        <button class="btn-register" onclick="showRegisterModal()"><i class="fas fa-user-plus"></i><span>Регистрация</span></button>
      </div>
    `;
  }
}

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/logout`, { method: "POST", credentials: "include" });
    window.location.href = "/";
  } catch (error) {
    showNotification("Ошибка при выходе", "error");
  }
}

// ============ ЗАГРУЗКА ЗАКАЗОВ ============
async function loadOrders() {
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/my-orders`, { credentials: "include" });
    allOrders = await response.json();
    
    updateStats();
    applyFilters();
  } catch (error) {
    console.error("Ошибка загрузки заказов:", error);
    showErrorState();
  } finally {
    showLoading(false);
  }
}

function updateStats() {
  const stats = {
    all: allOrders.length,
    new: allOrders.filter(o => o.status === "new").length,
    processing: allOrders.filter(o => ["processing", "confirmed", "manufacturing", "ready", "delivered"].includes(o.status)).length,
    completed: allOrders.filter(o => o.status === "completed").length
  };
  
  document.getElementById("statAll").textContent = stats.all;
  document.getElementById("statNew").textContent = stats.new;
  document.getElementById("statProcessing").textContent = stats.processing;
  document.getElementById("statCompleted").textContent = stats.completed;
}

function applyFilters() {
  filteredOrders = allOrders.filter(order => {
    if (currentStatusFilter !== 'all') {
      if (currentStatusFilter === 'processing') {
        if (!["processing", "confirmed", "manufacturing", "ready", "delivered"].includes(order.status)) return false;
      } else if (order.status !== currentStatusFilter) return false;
    }
    
    if (currentSearchTerm) {
      const searchable = `${order.order_number} ${order.customer_name} ${order.customer_phone || ''} ${order.customer_email || ''}`.toLowerCase();
      if (!searchable.includes(currentSearchTerm)) return false;
    }
    
    if (currentDateFrom && order.created_at) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      if (orderDate < currentDateFrom) return false;
    }
    if (currentDateTo && order.created_at) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      if (orderDate > currentDateTo) return false;
    }
    
    return true;
  });
  
  renderOrders();
}

function resetFilters() {
  currentStatusFilter = 'all';
  currentSearchTerm = '';
  currentDateFrom = '';
  currentDateTo = '';
  
  document.getElementById("searchInput").value = '';
  document.getElementById("statusFilter").value = 'all';
  document.getElementById("dateFrom").value = '';
  document.getElementById("dateTo").value = '';
  
  updateActiveStatCard('all');
  applyFilters();
  showNotification("Фильтры сброшены", "info");
}

function showErrorState() {
  const container = document.getElementById("ordersList");
  if (container) {
    container.innerHTML = `
      <div class="empty-state-modern">
        <i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>
        <h3>Ошибка загрузки заказов</h3>
        <p>Не удалось загрузить список заказов. Попробуйте позже.</p>
        <button class="btn btn-primary" onclick="location.reload()"><i class="fas fa-sync-alt"></i> Обновить</button>
      </div>
    `;
  }
}

// ============ ОТОБРАЖЕНИЕ ЗАКАЗОВ ============
function renderOrders() {
  const container = document.getElementById("ordersList");
  const emptyState = document.getElementById("emptyState");
  
  if (!container) return;
  
  if (filteredOrders.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = "block";
    return;
  }
  
  if (emptyState) emptyState.style.display = "none";
  
  container.innerHTML = filteredOrders.map(order => createOrderCard(order)).join("");
}

function createOrderCard(order) {
  const total = order.final_amount || order.total_amount || 0;
  const statusInfo = getStatusInfo(order.status);
  const progressPercent = getProgressPercent(order.status);
  const createdDate = new Date(order.created_at);
  const formattedDate = createdDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  
  const initials = order.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return `
    <div class="order-card-modern" data-order-id="${order.id}">
      <div class="order-card-header-modern">
        <div class="order-number-modern">
          <span class="number"><i class="fas fa-receipt"></i> ${escapeHtml(order.order_number)}</span>
          <span class="date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
        </div>
        <span class="status-badge-modern ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</span>
      </div>
      
      <div class="order-card-body-modern">
        <div class="customer-info-modern">
          <div class="customer-avatar-modern"><span>${escapeHtml(initials)}</span></div>
          <div class="customer-details-modern">
            <h4>${escapeHtml(order.customer_name)}</h4>
            ${order.customer_phone ? `<p><i class="fas fa-phone"></i> ${escapeHtml(order.customer_phone)}</p>` : ''}
          </div>
        </div>
        
        <div class="progress-section">
          <div class="progress-label"><span>Выполнение заказа</span><span>${progressPercent}%</span></div>
          <div class="progress-bar-modern"><div class="progress-fill-modern" style="width: ${progressPercent}%; background: ${statusInfo.color};"></div></div>
        </div>
        
        <div class="info-row-modern"><i class="fas fa-truck"></i><span>${order.delivery_method === "pickup" ? "Самовывоз" : "🚚 Доставка"}</span></div>
        <div class="info-row-modern"><i class="fas fa-credit-card"></i><span>${order.payment_method === "cash" ? "💵 Наличные" : order.payment_method === "card" ? "💳 Карта" : "📄 По счету"}</span></div>
        
        <div class="total-section-modern">
          <span class="total-label-modern">Итого:</span>
          <span class="total-value-modern">${new Intl.NumberFormat("ru-RU").format(total)} ₽</span>
        </div>
      </div>
      
      <div class="order-card-actions-modern">
        <button class="btn-action-modern btn-view-modern" onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i> Детали</button>
        <button class="btn-action-modern btn-repeat-modern" onclick="repeatOrder(${order.id})"><i class="fas fa-redo-alt"></i> Повторить</button>
        <button class="btn-action-modern btn-track-modern" onclick="trackOrder(${order.id})"><i class="fas fa-map-marker-alt"></i> Отследить</button>
      </div>
    </div>
  `;
}

function getStatusInfo(status) {
  const statusMap = {
    new: { text: "Новый", icon: "fas fa-clock", class: "status-new-modern", color: "#3b82f6" },
    processing: { text: "В обработке", icon: "fas fa-spinner fa-spin", class: "status-processing-modern", color: "#f59e0b" },
    confirmed: { text: "Подтверждён", icon: "fas fa-check-circle", class: "status-processing-modern", color: "#f59e0b" },
    manufacturing: { text: "В производстве", icon: "fas fa-industry", class: "status-processing-modern", color: "#f59e0b" },
    ready: { text: "Готов к выдаче", icon: "fas fa-box", class: "status-processing-modern", color: "#f59e0b" },
    delivered: { text: "Доставлен", icon: "fas fa-truck", class: "status-completed-modern", color: "#10b981" },
    completed: { text: "Выполнен", icon: "fas fa-check-double", class: "status-completed-modern", color: "#10b981" },
    cancelled: { text: "Отменён", icon: "fas fa-times-circle", class: "status-cancelled-modern", color: "#ef4444" }
  };
  return statusMap[status] || statusMap.new;
}

function getProgressPercent(status) {
  const map = { new: 10, processing: 30, confirmed: 45, manufacturing: 60, ready: 75, delivered: 90, completed: 100, cancelled: 100 };
  return map[status] || 0;
}

// ============ ДЕЙСТВИЯ С ЗАКАЗАМИ ============
async function viewOrder(orderId) {
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, { credentials: "include" });
    const data = await response.json();
    if (data.success) {
      showDetailedOrderModal(data);
    } else {
      showNotification("Ошибка загрузки заказа", "error");
    }
  } catch (error) {
    console.error("Ошибка:", error);
    showNotification("Ошибка при загрузке деталей заказа", "error");
  } finally {
    showLoading(false);
  }
}

function showDetailedOrderModal(data) {
  const order = data.order;
  const components = data.components || [];
  const services = data.services || [];
  const history = data.history || [];
  
  let total = 0;
  let componentsHtml = '';
  
  components.forEach(item => {
    const sum = item.total_price || item.unit_price * item.quantity;
    total += sum;
    componentsHtml += `
      <div class="order-detail-item">
        <div class="order-detail-item-info">
          <div class="order-detail-item-name">${escapeHtml(item.name)}</div>
          <div class="order-detail-item-meta">${item.quantity} шт × ${new Intl.NumberFormat("ru-RU").format(item.unit_price)} ₽</div>
        </div>
        <div class="order-detail-item-price">${new Intl.NumberFormat("ru-RU").format(sum)} ₽</div>
      </div>
    `;
  });
  
  services.forEach(item => {
    const sum = item.total_price || item.unit_price;
    total += sum;
    componentsHtml += `<div class="order-detail-item service-item"><div class="order-detail-item-info"><div class="order-detail-item-name"><i class="fas fa-tools"></i> ${escapeHtml(item.name)}</div><div class="order-detail-item-meta">Услуга</div></div><div class="order-detail-item-price">${new Intl.NumberFormat("ru-RU").format(sum)} ₽</div></div>`;
  });
  
  const statuses = [
    { key: "new", name: "Новый", icon: "fa-clock" },
    { key: "processing", name: "В обработке", icon: "fa-spinner" },
    { key: "confirmed", name: "Подтверждён", icon: "fa-check-circle" },
    { key: "manufacturing", name: "В производстве", icon: "fa-industry" },
    { key: "ready", name: "Готов к выдаче", icon: "fa-box" },
    { key: "delivered", name: "Доставлен", icon: "fa-truck" },
    { key: "completed", name: "Выполнен", icon: "fa-check-double" }
  ];
  
  const currentStatusIndex = statuses.findIndex(s => s.key === order.status);
  
  let timelineHtml = '<div class="order-timeline-modern">';
  statuses.forEach((status, index) => {
    let statusClass = '';
    if (index < currentStatusIndex) statusClass = 'completed';
    else if (index === currentStatusIndex) statusClass = 'active';
    else statusClass = 'pending';
    
    timelineHtml += `<div class="timeline-step-modern ${statusClass}"><div class="timeline-dot-modern">${index < currentStatusIndex ? '<i class="fas fa-check"></i>' : `<i class="${status.icon}"></i>`}</div><div class="timeline-label-modern">${status.name}</div></div>`;
  });
  timelineHtml += '</div>';
  
  let historyHtml = '';
  if (history.length > 0) {
    historyHtml = `<div class="order-detail-section"><h4><i class="fas fa-history"></i> История изменений</h4><div class="history-list-modern">`;
    history.forEach(h => {
      const date = new Date(h.created_at).toLocaleString("ru-RU");
      historyHtml += `<div class="history-item-modern"><div class="history-dot-modern"></div><div class="history-content-modern"><div class="history-status-modern">${h.old_status ? `<span class="old-status">${getStatusTextSimple(h.old_status)}</span> → ` : ''}<span class="new-status">${getStatusTextSimple(h.new_status)}</span></div><div class="history-meta-modern"><i class="fas fa-user"></i> ${escapeHtml(h.changed_by_name || "Система")} <i class="fas fa-calendar-alt"></i> ${date}</div>${h.comment ? `<div class="history-comment-modern">${escapeHtml(h.comment)}</div>` : ''}</div></div>`;
    });
    historyHtml += `</div></div>`;
  }
  
  const statusInfo = getStatusInfo(order.status);
  
  const modalHtml = `
    <div id="orderDetailsModal" class="modal" style="display: flex; z-index: 10000;">
      <div class="modal-content" style="max-width: 750px; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="modal-header"><h2><i class="fas fa-file-invoice"></i> Заказ ${order.order_number}</h2><span class="close" onclick="closeOrderDetailsModal()">&times;</span></div>
        <div class="modal-body" style="overflow-y: auto; padding: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;"><div class="status-badge-modern ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</div><div><i class="far fa-calendar-alt"></i> ${new Date(order.created_at).toLocaleString("ru-RU")}</div></div>
          ${timelineHtml}
          <div class="order-detail-section"><h4><i class="fas fa-user"></i> Информация о клиенте</h4><div class="detail-grid-modern"><div class="detail-item-modern"><span class="detail-label-modern">Имя</span><span class="detail-value-modern">${escapeHtml(order.customer_name)}</span></div>${order.customer_phone ? `<div class="detail-item-modern"><span class="detail-label-modern">Телефон</span><span class="detail-value-modern">${escapeHtml(order.customer_phone)}</span></div>` : ''}${order.customer_email ? `<div class="detail-item-modern"><span class="detail-label-modern">Email</span><span class="detail-value-modern">${escapeHtml(order.customer_email)}</span></div>` : ''}</div></div>
          <div class="order-detail-section"><h4><i class="fas fa-truck"></i> Доставка и оплата</h4><div class="detail-grid-modern"><div class="detail-item-modern"><span class="detail-label-modern">Способ доставки</span><span class="detail-value-modern">${order.delivery_method === "pickup" ? "🏪 Самовывоз" : "🚚 Доставка"}</span></div>${order.delivery_address ? `<div class="detail-item-modern"><span class="detail-label-modern">Адрес доставки</span><span class="detail-value-modern">${escapeHtml(order.delivery_address)}</span></div>` : ''}<div class="detail-item-modern"><span class="detail-label-modern">Способ оплаты</span><span class="detail-value-modern">${order.payment_method === "cash" ? "💵 Наличные" : order.payment_method === "card" ? "💳 Карта" : "📄 По счету"}</span></div></div></div>
          <div class="order-detail-section"><h4><i class="fas fa-list-ul"></i> Состав заказа</h4><div class="order-detail-list">${componentsHtml}</div><div class="order-detail-total"><span>Итого к оплате:</span><span class="total-amount">${new Intl.NumberFormat("ru-RU").format(total)} ₽</span></div></div>
          ${order.comments ? `<div class="order-detail-section"><h4><i class="fas fa-comment"></i> Комментарий к заказу</h4><div class="comment-box-modern">${escapeHtml(order.comments)}</div></div>` : ''}
          ${order.manager_comments ? `<div class="order-detail-section"><h4><i class="fas fa-comment-dots"></i> Комментарий менеджера</h4><div class="comment-box-modern manager-comment">${escapeHtml(order.manager_comments)}</div></div>` : ''}
          ${historyHtml}
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" onclick="closeOrderDetailsModal()">Закрыть</button><button class="btn btn-primary" onclick="repeatOrderFromModal(${order.id})">Повторить заказ</button><button class="btn btn-warning" onclick="downloadOrderInvoice(${order.id})">Скачать чек</button></div>
      </div>
    </div>
  `;
  
  const oldModal = document.getElementById("orderDetailsModal");
  if (oldModal) oldModal.remove();
  
  document.body.insertAdjacentHTML("beforeend", modalHtml);
  addOrderDetailStyles();
}

function addOrderDetailStyles() {
  if (document.getElementById("orderDetailStyles")) return;
  
  const styles = `
    <style id="orderDetailStyles">
      .order-detail-section { margin-bottom: 24px; padding: 16px; background: var(--bg-panel); border-radius: 16px; border: 1px solid var(--border-color); }
      .order-detail-section h4 { margin-bottom: 16px; color: var(--text-primary); display: flex; align-items: center; gap: 8px; font-size: 1rem; }
      .detail-grid-modern { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
      .detail-item-modern { display: flex; flex-direction: column; gap: 4px; }
      .detail-label-modern { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
      .detail-value-modern { font-weight: 600; color: var(--text-primary); }
      .order-detail-list { border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
      .order-detail-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-card); }
      .order-detail-item:last-child { border-bottom: none; }
      .order-detail-item-info { flex: 1; }
      .order-detail-item-name { font-weight: 600; margin-bottom: 4px; color: var(--text-primary); }
      .order-detail-item-meta { font-size: 0.75rem; color: var(--text-muted); }
      .order-detail-item-price { font-weight: 700; color: var(--success-color); }
      .service-item { background: var(--primary-light); }
      .order-detail-total { display: flex; justify-content: space-between; align-items: center; padding: 16px; margin-top: 16px; background: var(--success-light); border-radius: 12px; font-weight: 700; font-size: 1.1rem; }
      .order-detail-total .total-amount { font-size: 1.3rem; color: var(--success-color); }
      .comment-box-modern { padding: 12px 16px; background: var(--bg-card); border-radius: 12px; border-left: 4px solid var(--primary-color); color: var(--text-secondary); }
      .manager-comment { border-left-color: #f59e0b; }
      .order-timeline-modern { display: flex; justify-content: space-between; margin: 20px 0; padding: 20px; background: var(--bg-panel); border-radius: 16px; overflow-x: auto; gap: 10px; }
      .timeline-step-modern { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; opacity: 0.5; }
      .timeline-step-modern.completed, .timeline-step-modern.active { opacity: 1; }
      .timeline-dot-modern { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-card); border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; transition: all 0.3s; }
      .timeline-step-modern.completed .timeline-dot-modern { background: var(--success-color); border-color: var(--success-color); color: white; }
      .timeline-step-modern.active .timeline-dot-modern { background: var(--primary-color); border-color: var(--primary-color); color: white; animation: pulse 2s infinite; }
      .timeline-label-modern { font-size: 0.7rem; color: var(--text-secondary); text-align: center; max-width: 80px; }
      .history-list-modern { display: flex; flex-direction: column; gap: 16px; }
      .history-item-modern { display: flex; gap: 15px; position: relative; }
      .history-dot-modern { width: 10px; height: 10px; border-radius: 50%; background: var(--primary-color); margin-top: 6px; flex-shrink: 0; }
      .history-item-modern:not(:last-child) .history-dot-modern::after { content: ''; position: absolute; top: 16px; left: 4px; width: 2px; height: calc(100% + 8px); background: var(--border-color); }
      .history-content-modern { flex: 1; }
      .history-status-modern { font-weight: 600; margin-bottom: 4px; }
      .old-status { color: var(--text-muted); text-decoration: line-through; }
      .new-status { color: var(--success-color); }
      .history-meta-modern { font-size: 0.7rem; color: var(--text-muted); display: flex; gap: 12px; margin-bottom: 8px; }
      .history-comment-modern { padding: 8px 12px; background: var(--bg-card); border-radius: 8px; font-size: 0.8rem; color: var(--text-secondary); }
    </style>
  `;
  document.head.insertAdjacentHTML("beforeend", styles);
}

function closeOrderDetailsModal() {
  const modal = document.getElementById("orderDetailsModal");
  if (modal) modal.remove();
}

async function repeatOrder(orderId) {
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, { credentials: "include" });
    const data = await response.json();
    if (!data.success) { showNotification("Ошибка загрузки заказа", "error"); return; }
    
    const order = data.order;
    const components = data.components || [];
    
    if (!currentUser) { showNotification("Авторизуйтесь чтобы повторить заказ", "warning"); showLoginModal(); return; }
    
    if (!confirm(`Повторить заказ №${order.order_number}?`)) { showLoading(false); return; }
    
    if (typeof selectedComponents !== 'undefined') selectedComponents = [];
    if (typeof selectedServices !== 'undefined') selectedServices = [];
    
    let addedCount = 0;
    for (const comp of components) {
      const compResponse = await fetch(`${API_BASE_URL}/components/${comp.component_id}`, { credentials: "include" });
      const compData = await compResponse.json();
      if (compData.success && compData.component.in_stock && typeof window.addToCart === 'function') {
        window.addToCart(comp.component_id);
        addedCount++;
      }
    }
    
    if (typeof updateCart === 'function') updateCart();
    if (typeof updateTotal === 'function') updateTotal();
    if (typeof updateCartBadge === 'function') updateCartBadge();
    
    if (addedCount > 0) {
      showNotification(`✅ ${addedCount} компонентов добавлено в корзину`, "success");
      setTimeout(() => { if (confirm("Перейти в конфигуратор?")) window.location.href = "/#configurator"; }, 500);
    } else {
      showNotification("❌ Нет доступных компонентов для повторения", "error");
    }
    closeOrderDetailsModal();
  } catch (error) {
    console.error("Ошибка:", error);
    showNotification("Ошибка при повторении заказа", "error");
  } finally {
    showLoading(false);
  }
}

function repeatOrderFromModal(orderId) {
  closeOrderDetailsModal();
  setTimeout(() => repeatOrder(orderId), 300);
}

function trackOrder(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) { showNotification("Заказ не найден", "error"); return; }
  
  const statusInfo = getStatusInfo(order.status);
  const progressPercent = getProgressPercent(order.status);
  
  const modalHtml = `
    <div id="trackOrderModal" class="modal" style="display: flex;">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header"><h2><i class="fas fa-map-marker-alt"></i> Отслеживание заказа</h2><span class="close" onclick="closeTrackOrderModal()">&times;</span></div>
        <div class="modal-body">
          <div style="text-align:center;margin-bottom:20px"><div class="status-badge-modern ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</div></div>
          <div class="progress-section"><div class="progress-label"><span>Выполнение заказа</span><span>${progressPercent}%</span></div><div class="progress-bar-modern"><div class="progress-fill-modern" style="width: ${progressPercent}%; background: ${statusInfo.color};"></div></div></div>
          <div style="margin:20px 0"><h4>Статус: ${statusInfo.text}</h4><p>${getStatusDescription(order.status)}</p></div>
          <div style="padding:15px;background:var(--bg-panel);border-radius:12px"><p><strong>Номер заказа:</strong> ${order.order_number}</p><p><strong>Дата создания:</strong> ${new Date(order.created_at).toLocaleString("ru-RU")}</p></div>
          <div style="margin-top:20px;padding:15px;background:var(--primary-light);border-radius:12px"><strong>Ожидаемая дата:</strong> ${getExpectedDate(order.status, order.created_at)}</div>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" onclick="closeTrackOrderModal()">Закрыть</button></div>
      </div>
    </div>
  `;
  
  const oldModal = document.getElementById("trackOrderModal");
  if (oldModal) oldModal.remove();
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

function closeTrackOrderModal() {
  const modal = document.getElementById("trackOrderModal");
  if (modal) modal.remove();
}

function getStatusDescription(status) {
  const map = { new: "Заказ принят и ожидает обработки.", processing: "Заказ в обработке.", confirmed: "Заказ подтверждён.", manufacturing: "Заказ в производстве.", ready: "Заказ готов к выдаче.", delivered: "Заказ доставлен.", completed: "Заказ выполнен.", cancelled: "Заказ отменён." };
  return map[status] || "Статус уточняется.";
}

function getExpectedDate(status, createdAt) {
  const created = new Date(createdAt);
  const daysMap = { new: 1, processing: 3, confirmed: 5, manufacturing: 7, ready: 10, delivered: 0, completed: 0, cancelled: 0 };
  const days = daysMap[status] || 3;
  if (days === 0) return "Заказ已完成";
  const expected = new Date(created);
  expected.setDate(created.getDate() + days);
  return expected.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

async function downloadOrderInvoice(orderId) {
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, { credentials: "include" });
    const data = await response.json();
    if (!data.success) { showNotification("Ошибка загрузки заказа", "error"); return; }
    
    const order = data.order;
    const components = data.components || [];
    let total = 0;
    let itemsHtml = '';
    
    components.forEach(item => {
      const sum = item.total_price || item.unit_price * item.quantity;
      total += sum;
      itemsHtml += `<tr><td>${escapeHtml(item.name)}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">${new Intl.NumberFormat("ru-RU").format(item.unit_price)} ₽</td><td style="text-align:right">${new Intl.NumberFormat("ru-RU").format(sum)} ₽</td></tr>`;
    });
    
    const printHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Чек заказа ${order.order_number}</title><style>body{font-family:Arial;padding:40px;max-width:800px;margin:0 auto}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #3b82f6}.logo{font-size:24px;font-weight:bold;color:#3b82f6}.order-info{margin:20px 0;padding:15px;background:#f3f4f6;border-radius:8px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:left}th{background:#f3f4f6}.total{font-size:18px;font-weight:bold;text-align:right;margin-top:20px;padding-top:10px;border-top:2px solid #e5e7eb}.footer{margin-top:40px;text-align:center;font-size:12px;color:#6b7280}</style></head>
    <body><div class="header"><div class="logo">⚡ Электрощит-Самара</div><h2>ЧЕК ЗАКАЗА №${order.order_number}</h2></div>
    <div class="order-info"><p><strong>Дата:</strong> ${new Date(order.created_at).toLocaleString("ru-RU")}</p><p><strong>Клиент:</strong> ${escapeHtml(order.customer_name)}</p><p><strong>Статус:</strong> ${getStatusTextSimple(order.status)}</p></div>
    <table><thead><tr><th>Наименование</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    <div class="total">ИТОГО: ${new Intl.NumberFormat("ru-RU").format(total)} ₽</div>
    <div class="footer"><p>Спасибо за покупку!<br>АО "Электрощит-Самара" | тел: +7 (846) 123-45-67</p></div></body></html>`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.print();
    showNotification("Чек открыт для печати", "success");
  } catch (error) {
    showNotification("Ошибка при создании чека", "error");
  } finally {
    showLoading(false);
  }
}

function getStatusTextSimple(status) {
  const map = { new: "Новый", processing: "В обработке", confirmed: "Подтверждён", manufacturing: "В производстве", ready: "Готов к выдаче", delivered: "Доставлен", completed: "Выполнен", cancelled: "Отменён" };
  return map[status] || status;
}

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function showLoading(show) {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = show ? "flex" : "none";
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  const icon = type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : type === "warning" ? "exclamation-triangle" : "info-circle";
  notification.innerHTML = `<i class="fas fa-${icon}"></i> ${escapeHtml(message)}`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Функции для модального окна авторизации (из index.js)
function showLoginModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.style.display = "flex";
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (loginForm) loginForm.style.display = "block";
  if (registerForm) registerForm.style.display = "none";
  document.body.style.overflow = "hidden";
}

function showRegisterModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.style.display = "flex";
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (loginForm) loginForm.style.display = "none";
  if (registerForm) registerForm.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.style.display = "none";
  document.body.style.overflow = "";
}

function showLoginForm() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (loginForm) loginForm.style.display = "block";
  if (registerForm) registerForm.style.display = "none";
}

function showRegisterForm() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (loginForm) loginForm.style.display = "none";
  if (registerForm) registerForm.style.display = "block";
}

async function login() {
  const username = document.getElementById("loginUsername")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;
  
  if (!username || !password) {
    showNotification("Заполните все поля", "warning");
    return;
  }
  
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      closeAuthModal();
      await checkAuth();
      showNotification(`Добро пожаловать, ${data.user.full_name}!`, "success");
      window.location.reload();
    } else {
      showNotification(data.message || "Ошибка входа", "error");
    }
  } catch (error) {
    showNotification("Ошибка соединения", "error");
  } finally {
    showLoading(false);
  }
}

async function register() {
  const username = document.getElementById("regUsername")?.value.trim();
  const fullName = document.getElementById("regFullName")?.value.trim();
  const email = document.getElementById("regEmail")?.value.trim();
  const phone = document.getElementById("regPhone")?.value.trim();
  const password = document.getElementById("regPassword")?.value;
  const password2 = document.getElementById("regPassword2")?.value;
  const agree = document.getElementById("regAgree")?.checked;
  
  if (!username || !fullName || !email || !password) {
    showNotification("Заполните обязательные поля", "warning");
    return;
  }
  if (password.length < 6) {
    showNotification("Пароль должен быть не менее 6 символов", "warning");
    return;
  }
  if (password !== password2) {
    showNotification("Пароли не совпадают", "warning");
    return;
  }
  if (!agree) {
    showNotification("Подтвердите согласие с условиями", "warning");
    return;
  }
  
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email, full_name: fullName, phone: phone || null })
    });
    const data = await response.json();
    if (data.success) {
      showNotification("Регистрация успешна! Теперь вы можете войти.", "success");
      showLoginForm();
      document.getElementById("loginUsername").value = username;
    } else {
      showNotification(data.message || "Ошибка регистрации", "error");
    }
  } catch (error) {
    showNotification("Ошибка соединения", "error");
  } finally {
    showLoading(false);
  }
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const type = input.type === "password" ? "text" : "password";
  input.type = type;
}

function subscribeNewsletter() {
  const email = document.getElementById("newsletterEmail")?.value.trim();
  if (!email) { showNotification("Введите email", "warning"); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showNotification("Введите корректный email", "error"); return; }
  showNotification("Спасибо за подписку!", "success");
  document.getElementById("newsletterEmail").value = "";
}

// Глобальные функции
window.viewOrder = viewOrder;
window.repeatOrder = repeatOrder;
window.trackOrder = trackOrder;
window.closeOrderDetailsModal = closeOrderDetailsModal;
window.closeTrackOrderModal = closeTrackOrderModal;
window.downloadOrderInvoice = downloadOrderInvoice;
window.logout = logout;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.closeAuthModal = closeAuthModal;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.login = login;
window.register = register;
window.togglePassword = togglePassword;
window.subscribeNewsletter = subscribeNewsletter;