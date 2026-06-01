const API_BASE_URL = window.location.origin.includes("localhost")
  ? `http://localhost:${window.location.port || 3001}/api`
  : "/api";

let currentUser = null;
let selectedCategory = null;
let selectedComponents = [];
let selectedServices = [];
let allComponents = [];
let allServices = [];
let categories = [];

let catalogFilters = {
  search: "",
  categoryId: "",
  priceMin: "",
  priceMax: "",
  inStock: "all",
  manufacturer: "all"
};

let currentPage = 1;
let itemsPerPage = 12;
let totalPages = 1;
let currentSort = 'default';

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  const icon = type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : type === "warning" ? "exclamation-triangle" : "info-circle";
  notification.innerHTML = `<i class="fas fa-${icon}"></i> ${escapeHtml(message)}`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function showLoading(show) {
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = show ? "flex" : "none";
}

// ============ ФУНКЦИИ АВТОРИЗАЦИИ (РАБОЧАЯ ВЕРСИЯ) ============

function closeAuthModal() {
  var modal = document.getElementById('authModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function showLoginModal() {
  var modal = document.getElementById('authModal');
  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');
  
  if (modal) {
    modal.style.display = 'flex';
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    document.body.style.overflow = 'hidden';
    
    var loginError = document.getElementById('loginError');
    var registerError = document.getElementById('registerError');
    var registerSuccess = document.getElementById('registerSuccess');
    if (loginError) loginError.style.display = 'none';
    if (registerError) registerError.style.display = 'none';
    if (registerSuccess) registerSuccess.style.display = 'none';
    
    var loginUsername = document.getElementById('loginUsername');
    var loginPassword = document.getElementById('loginPassword');
    if (loginUsername) loginUsername.value = '';
    if (loginPassword) loginPassword.value = '';
  }
}

function showRegisterModal() {
  var modal = document.getElementById('authModal');
  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');
  
  if (modal) {
    modal.style.display = 'flex';
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    var loginError = document.getElementById('loginError');
    var registerError = document.getElementById('registerError');
    var registerSuccess = document.getElementById('registerSuccess');
    if (loginError) loginError.style.display = 'none';
    if (registerError) registerError.style.display = 'none';
    if (registerSuccess) registerSuccess.style.display = 'none';
    
    var regUsername = document.getElementById('regUsername');
    var regFullName = document.getElementById('regFullName');
    var regEmail = document.getElementById('regEmail');
    var regPhone = document.getElementById('regPhone');
    var regPassword = document.getElementById('regPassword');
    var regPassword2 = document.getElementById('regPassword2');
    var regAgree = document.getElementById('regAgree');
    if (regUsername) regUsername.value = '';
    if (regFullName) regFullName.value = '';
    if (regEmail) regEmail.value = '';
    if (regPhone) regPhone.value = '';
    if (regPassword) regPassword.value = '';
    if (regPassword2) regPassword2.value = '';
    if (regAgree) regAgree.checked = false;
  }
}

function showLoginForm() {
  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');
  var registerSuccess = document.getElementById('registerSuccess');
  
  if (loginForm) loginForm.style.display = 'block';
  if (registerForm) registerForm.style.display = 'none';
  if (registerSuccess) registerSuccess.style.display = 'none';
  
  var loginError = document.getElementById('loginError');
  var registerError = document.getElementById('registerError');
  if (loginError) loginError.style.display = 'none';
  if (registerError) registerError.style.display = 'none';
  
  var loginUsername = document.getElementById('loginUsername');
  var loginPassword = document.getElementById('loginPassword');
  if (loginUsername) loginUsername.value = '';
  if (loginPassword) loginPassword.value = '';
}

function showRegisterForm() {
  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');
  
  if (loginForm) loginForm.style.display = 'none';
  if (registerForm) registerForm.style.display = 'block';
  
  var loginError = document.getElementById('loginError');
  var registerError = document.getElementById('registerError');
  var registerSuccess = document.getElementById('registerSuccess');
  if (loginError) loginError.style.display = 'none';
  if (registerError) registerError.style.display = 'none';
  if (registerSuccess) registerSuccess.style.display = 'none';
}

function showAuthError(type, message) {
  var errorDiv = document.getElementById(type === 'login' ? 'loginError' : 'registerError');
  if (errorDiv) {
    var span = errorDiv.querySelector('span');
    if (span) span.textContent = message;
    errorDiv.style.display = 'flex';
    setTimeout(function() {
      if (errorDiv) errorDiv.style.display = 'none';
    }, 4000);
  }
}

function showAuthSuccess(message) {
  var successDiv = document.getElementById('registerSuccess');
  if (successDiv) {
    var span = successDiv.querySelector('span');
    if (span) span.textContent = message;
    successDiv.style.display = 'flex';
    setTimeout(function() {
      if (successDiv) successDiv.style.display = 'none';
    }, 3000);
  }
}

async function login() {
  var username = document.getElementById('loginUsername')?.value.trim();
  var password = document.getElementById('loginPassword')?.value;
  
  if (!username) {
    showAuthError('login', 'Введите имя пользователя');
    return;
  }
  if (!password) {
    showAuthError('login', 'Введите пароль');
    return;
  }
  
  showLoading(true);
  try {
    var response = await fetch(API_BASE_URL + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: username, password: password })
    });
    
    var data = await response.json();
    
    if (data.success) {
      closeAuthModal();
      await checkAuth();
      showNotification('Добро пожаловать, ' + data.user.full_name + '!', 'success');
      setTimeout(() => window.location.reload(), 500);
    } else {
      showAuthError('login', data.message || 'Неверный логин или пароль');
    }
  } catch (error) {
    console.error('Ошибка входа:', error);
    showAuthError('login', 'Ошибка соединения с сервером');
  } finally {
    showLoading(false);
  }
}

async function register() {
  var username = document.getElementById('regUsername')?.value.trim();
  var fullName = document.getElementById('regFullName')?.value.trim();
  var email = document.getElementById('regEmail')?.value.trim();
  var phone = document.getElementById('regPhone')?.value.trim();
  var password = document.getElementById('regPassword')?.value;
  var password2 = document.getElementById('regPassword2')?.value;
  var agree = document.getElementById('regAgree')?.checked;
  
  if (!username) {
    showAuthError('register', 'Введите логин');
    return;
  }
  if (username.length < 3) {
    showAuthError('register', 'Логин должен быть не менее 3 символов');
    return;
  }
  if (!fullName) {
    showAuthError('register', 'Введите ФИО');
    return;
  }
  if (!email) {
    showAuthError('register', 'Введите Email');
    return;
  }
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAuthError('register', 'Введите корректный Email');
    return;
  }
  if (!password) {
    showAuthError('register', 'Введите пароль');
    return;
  }
  if (password.length < 6) {
    showAuthError('register', 'Пароль должен быть не менее 6 символов');
    return;
  }
  if (password !== password2) {
    showAuthError('register', 'Пароли не совпадают');
    return;
  }
  if (!agree) {
    showAuthError('register', 'Подтвердите согласие с условиями');
    return;
  }
  
  showLoading(true);
  try {
    var response = await fetch(API_BASE_URL + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        password: password,
        email: email,
        full_name: fullName,
        phone: phone || null
      })
    });
    
    var data = await response.json();
    
    if (data.success) {
      showAuthSuccess('Регистрация успешна! Теперь вы можете войти.');
      
      document.getElementById('regUsername').value = '';
      document.getElementById('regFullName').value = '';
      document.getElementById('regEmail').value = '';
      document.getElementById('regPhone').value = '';
      document.getElementById('regPassword').value = '';
      document.getElementById('regPassword2').value = '';
      document.getElementById('regAgree').checked = false;
      
      setTimeout(() => {
        showLoginForm();
        var loginUsername = document.getElementById('loginUsername');
        if (loginUsername) loginUsername.value = username;
      }, 1500);
    } else {
      showAuthError('register', data.message || 'Ошибка регистрации');
    }
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    showAuthError('register', 'Ошибка соединения с сервером');
  } finally {
    showLoading(false);
  }
}

function togglePassword(inputId) {
  var input = document.getElementById(inputId);
  if (!input) return;
  var parent = input.parentElement;
  var toggle = parent.querySelector('.auth-password-eye i');
  
  if (input.type === 'password') {
    input.type = 'text';
    if (toggle) {
      toggle.classList.remove('fa-eye-slash');
      toggle.classList.add('fa-eye');
    }
  } else {
    input.type = 'password';
    if (toggle) {
      toggle.classList.remove('fa-eye');
      toggle.classList.add('fa-eye-slash');
    }
  }
}

// ============ ЗАГРУЗКА ДАННЫХ ============
async function loadCategoriesData() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    categories = await response.json();
    const categoriesList = document.getElementById("categoriesList");
    const catalogSelect = document.getElementById("catalogCategory");
    if (categoriesList) {
      if (categories.length === 0) categoriesList.innerHTML = '<div class="empty-message">Нет категорий</div>';
      else {
        categoriesList.innerHTML = categories.map(cat => `
          <div class="category-item ${selectedCategory === cat.id ? "active" : ""}" onclick="selectCategory(${cat.id})">
            <h4>${escapeHtml(cat.name)}</h4>
            <p>${escapeHtml(cat.description || "")}</p>
          </div>
        `).join("");
      }
    }
    if (catalogSelect) {
      catalogSelect.innerHTML = '<option value="">Все категории</option>' + categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join("");
    }
    renderCategoriesModern();
  } catch (error) { console.error("Ошибка загрузки категорий:", error); }
}

function selectCategory(categoryId) {
  selectedCategory = selectedCategory === categoryId ? null : categoryId;
  loadComponentsData();
}

async function loadComponentsData() {
  showLoading(true);
  try {
    let url = `${API_BASE_URL}/components`;
    if (selectedCategory) url += `?category_id=${selectedCategory}`;
    const response = await fetch(url);
    allComponents = await response.json();
    const componentsList = document.getElementById("componentsList");
    if (!componentsList) return;
    if (allComponents.length === 0) componentsList.innerHTML = '<div class="empty-message">Нет компонентов</div>';
    else {
      componentsList.innerHTML = allComponents.map(comp => {
        const isSelected = selectedComponents.some((c) => c.id === comp.id);
        return `
          <div class="component-item">
            <div class="component-info">
              <h4>${escapeHtml(comp.name)}</h4>
              <p>${escapeHtml(comp.description || "")}</p>
              <p><small>${escapeHtml(comp.manufacturer || "")}</small></p>
              <span class="stock-status ${comp.in_stock ? "stock-in" : "stock-out"}">
                <i class="fas fa-${comp.in_stock ? "check-circle" : "times-circle"}"></i>
                ${comp.in_stock ? "В наличии" : "Нет в наличии"}
              </span>
            </div>
            <div class="component-details">
              <div class="component-price">${new Intl.NumberFormat("ru-RU").format(comp.price)} ₽</div>
              <button class="add-btn" onclick="addToCart(${comp.id})" ${isSelected ? "disabled" : ""}>
                <i class="fas fa-${isSelected ? "check" : "plus"}"></i>
                ${isSelected ? "Добавлено" : "Добавить"}
              </button>
            </div>
          </div>
        `;
      }).join("");
    }
    filterCatalog();
    renderComponentsModern();
  } catch (error) { console.error("Ошибка загрузки компонентов:", error); }
  finally { showLoading(false); }
}

async function loadServicesData() {
  try {
    const response = await fetch(`${API_BASE_URL}/services`);
    allServices = await response.json();
    const servicesList = document.getElementById("servicesList");
    if (!servicesList) return;
    if (allServices.length === 0) servicesList.innerHTML = '<div class="empty-message">Нет услуг</div>';
    else {
      servicesList.innerHTML = allServices.map(serv => `
        <div class="service-item">
          <label>
            <input type="checkbox" class="service-checkbox" value="${serv.id}" onchange="toggleService(${serv.id}, ${serv.price}, '${serv.name.replace(/'/g, "\\'")}')">
            ${escapeHtml(serv.name)} (${new Intl.NumberFormat("ru-RU").format(serv.price)} ₽)
          </label>
        </div>
      `).join("");
    }
    renderServicesModern();
  } catch (error) { console.error("Ошибка загрузки услуг:", error); }
}

function toggleService(serviceId, price, name) {
  const checkbox = event.target;
  if (checkbox.checked) { selectedServices.push({ id: serviceId, name, price }); showNotification(`Услуга "${name}" добавлена`, "success"); }
  else { selectedServices = selectedServices.filter(s => s.id !== serviceId); showNotification(`Услуга "${name}" удалена`, "info"); }
  updateTotal();
}

function addToCart(componentId) {
  const component = allComponents.find((c) => c.id === componentId);
  if (!component) return;
  if (selectedComponents.some((c) => c.id === componentId)) {
    showNotification("Компонент уже в корзине", "info");
    return;
  }

  selectedComponents.push({ ...component, quantity: 1 });
  updateCart();
  updateTotal();
  loadComponentsData();
  showNotification(`"${component.name}" добавлен в корзину`, "success");
  updateCartBadge();
}

function removeFromCart(componentId) {
  selectedComponents = selectedComponents.filter((c) => c.id !== componentId);
  updateCart();
  updateTotal();
  loadComponentsData();
  updateCartBadge();
}

function changeQuantity(componentId, delta) {
  const index = selectedComponents.findIndex((c) => c.id === componentId);
  if (index !== -1) {
    const newQuantity = (selectedComponents[index].quantity || 1) + delta;
    if (newQuantity > 0) {
      selectedComponents[index].quantity = newQuantity;
      updateCart();
      updateTotal();
    }
  }
}

function updateCart() {
  const cartEl = document.getElementById("selectedComponents");
  if (!cartEl) return;

  if (selectedComponents.length === 0) {
    cartEl.innerHTML = '<div class="empty-message">Нет выбранных компонентов</div>';
  } else {
    cartEl.innerHTML = selectedComponents.map(comp => `
      <div class="selected-item">
        <div style="flex: 1;">
          <h4>${escapeHtml(comp.name)}</h4>
          <p>${new Intl.NumberFormat("ru-RU").format(comp.price)} ₽</p>
          <div style="display: flex; gap: 10px; margin-top: 8px;">
            <button onclick="changeQuantity(${comp.id}, -1)" style="width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-panel); cursor: pointer;"><i class="fas fa-minus"></i></button>
            <span>${comp.quantity || 1}</span>
            <button onclick="changeQuantity(${comp.id}, 1)" style="width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-panel); cursor: pointer;"><i class="fas fa-plus"></i></button>
          </div>
        </div>
        <button onclick="removeFromCart(${comp.id})" style="background: var(--danger-color); color: white; border: none; width: 36px; height: 36px; border-radius: 10px; cursor: pointer;"><i class="fas fa-trash-alt"></i></button>
      </div>
    `).join("");
  }
  renderCartModern();
}

function updateCartBadge() {
  let badge = document.querySelector('.cart-badge');
  const cartTitle = document.querySelector('.configurator-panel:last-child h3');
  if (!badge && cartTitle) {
    badge = document.createElement('span');
    badge.className = 'cart-badge';
    cartTitle.appendChild(badge);
  }
  if (badge) {
    const count = selectedComponents.length;
    badge.textContent = count;
    if (count === 0) badge.classList.add('hidden');
    else badge.classList.remove('hidden');
  }
  const cartCount = document.getElementById("cartCount");
  if (cartCount) cartCount.textContent = selectedComponents.length;
}

function calculateTotal() {
  const componentsTotal = selectedComponents.reduce((sum, comp) => sum + parseFloat(comp.price) * (comp.quantity || 1), 0);
  const servicesTotal = selectedServices.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
  return { components: componentsTotal, services: servicesTotal, total: componentsTotal + servicesTotal };
}

function updateTotal() {
  const totals = calculateTotal();
  const totalPriceEl = document.getElementById("totalPrice");
  if (totalPriceEl) totalPriceEl.textContent = new Intl.NumberFormat("ru-RU").format(totals.total) + " ₽";
  const saveConfigBtn = document.getElementById("saveConfigBtn");
  if (saveConfigBtn) saveConfigBtn.disabled = selectedComponents.length === 0;
}

function filterCatalog() {
  if (!allComponents || allComponents.length === 0) return;
  
  let filtered = [...allComponents];

  if (catalogFilters.search) {
    const searchLower = catalogFilters.search.toLowerCase();
    filtered = filtered.filter(c => (c.name && c.name.toLowerCase().includes(searchLower)) || (c.description && c.description.toLowerCase().includes(searchLower)) || (c.manufacturer && c.manufacturer.toLowerCase().includes(searchLower)));
  }
  if (catalogFilters.categoryId) filtered = filtered.filter(c => c.category_id == catalogFilters.categoryId);
  if (catalogFilters.priceMin) { const minPrice = parseFloat(catalogFilters.priceMin); if (!isNaN(minPrice)) filtered = filtered.filter(c => c.price >= minPrice); }
  if (catalogFilters.priceMax) { const maxPrice = parseFloat(catalogFilters.priceMax); if (!isNaN(maxPrice)) filtered = filtered.filter(c => c.price <= maxPrice); }
  if (catalogFilters.inStock !== "all") filtered = filtered.filter(c => c.in_stock === (catalogFilters.inStock === "true"));
  if (catalogFilters.manufacturer !== "all" && catalogFilters.manufacturer) filtered = filtered.filter(c => c.manufacturer === catalogFilters.manufacturer);

  if (currentSort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (currentSort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (currentSort === 'name-asc') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'));
  else if (currentSort === 'name-desc') filtered.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'ru'));

  const catalogGrid = document.getElementById("catalogGrid");
  if (!catalogGrid) return;

  if (filtered.length === 0) {
    catalogGrid.innerHTML = '<div class="empty-message">Ничего не найдено</div>';
    const showMoreContainer = document.getElementById('showMoreContainer');
    if (showMoreContainer) showMoreContainer.innerHTML = '';
    return;
  }

  if (typeof window.renderCatalogWithShowMore === 'function') {
    window.renderCatalogWithShowMore(filtered);
  } else {
    catalogGrid.innerHTML = filtered.map(comp => `
      <div class="component-card" onclick="openComponentDetail(${comp.id})">
        <div class="card-image">${comp.image_url ? `<img src="${comp.image_url}" alt="${escapeHtml(comp.name)}">` : '<div class="no-photo"><i class="fas fa-microchip"></i></div>'}</div>
        <h4>${escapeHtml(comp.name)}</h4>
        <div class="manufacturer">${escapeHtml(comp.manufacturer || "Производитель не указан")}</div>
        <div class="description">${escapeHtml(comp.description || "Описание отсутствует")}</div>
        <div class="price">${new Intl.NumberFormat("ru-RU").format(comp.price)} ₽</div>
        <div class="card-actions"><button class="btn btn-primary" onclick="event.stopPropagation(); addToCart(${comp.id})" ${!comp.in_stock ? 'disabled' : ''}>В корзину</button></div>
      </div>
    `).join("");
  }
}

async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
    const data = await response.json();
    if (data.success && data.authenticated) {
      currentUser = data.user;
      const authSection = document.getElementById("authSection");
      if (!authSection) return;
      
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
          ${currentUser.role === "admin" || currentUser.role === "manager" ? `<a href="/admin.html" class="nav-link" style="color: white; background: rgba(59,130,246,0.2); padding: 6px 14px; border-radius: 30px;"><i class="fas fa-cog"></i> Админка</a>` : ""}
          <button onclick="logout()" class="logout-btn" style="background: #ef4444; color: white; border: none; padding: 6px 14px; border-radius: 30px; cursor: pointer;">
            <i class="fas fa-sign-out-alt"></i> Выйти
          </button>
        </div>
      `;
      
      const saveConfigBtn = document.getElementById("saveConfigBtn");
      if (saveConfigBtn) saveConfigBtn.disabled = false;
    }
  } catch (error) {
    console.error("Ошибка авторизации:", error);
  }
}

async function logout() {
  try {
    showLoading(true);
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();
    if (data.success) {
      showNotification("Вы вышли из системы", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } else {
      showNotification("Ошибка при выходе", "error");
    }
  } catch (error) {
    console.error("Ошибка logout:", error);
    showNotification("Ошибка при выходе из системы", "error");
  } finally {
    showLoading(false);
  }
}

function showOrderModal() {
  if (!currentUser) { showNotification("Необходимо авторизоваться", "warning"); showLoginModal(); return; }
  if (selectedComponents.length === 0) { showNotification("Добавьте хотя бы один компонент", "warning"); return; }
  updateOrderSummary();
  const orderModal = document.getElementById("orderModal");
  if (orderModal) orderModal.style.display = "flex";
}

function closeOrderModal() { 
  const orderModal = document.getElementById("orderModal");
  if (orderModal) orderModal.style.display = "none";
}

function updateOrderSummary() {
  const totals = calculateTotal();
  const compEl = document.getElementById("orderSummaryComponents");
  const servEl = document.getElementById("orderSummaryServices");
  const totalEl = document.getElementById("orderSummaryTotal");
  if (compEl) compEl.textContent = new Intl.NumberFormat("ru-RU").format(totals.components) + " ₽";
  if (servEl) servEl.textContent = new Intl.NumberFormat("ru-RU").format(totals.services) + " ₽";
  if (totalEl) totalEl.textContent = new Intl.NumberFormat("ru-RU").format(totals.total) + " ₽";
}

function toggleDeliveryAddress() {
  const method = document.getElementById("orderModalDeliveryMethod");
  const group = document.getElementById("deliveryAddressGroup");
  if (method && group) group.style.display = method.value === "delivery" ? "block" : "none";
}

async function submitOrder() {
  const customerName = document.getElementById("orderModalCustomerName")?.value.trim();
  if (!customerName) { showNotification("Введите ваше имя", "warning"); return; }
  if (selectedComponents.length === 0) { showNotification("Добавьте компоненты", "warning"); return; }
  const totals = calculateTotal();
  const orderData = {
    customer_name: customerName,
    customer_email: document.getElementById("orderModalCustomerEmail")?.value.trim() || null,
    customer_phone: document.getElementById("orderModalCustomerPhone")?.value.trim() || null,
    customer_address: document.getElementById("orderModalCustomerAddress")?.value.trim() || null,
    delivery_method: document.getElementById("orderModalDeliveryMethod")?.value || "pickup",
    delivery_address: document.getElementById("orderModalDeliveryAddress")?.value.trim() || null,
    payment_method: document.getElementById("orderModalPaymentMethod")?.value || "cash",
    config_name: document.getElementById("orderModalConfigName")?.value.trim() || "Моя конфигурация",
    components: selectedComponents.map(c => ({ id: parseInt(c.id), name: c.name, price: parseFloat(c.price), quantity: parseInt(c.quantity || 1) })),
    services: selectedServices.map(s => ({ id: parseInt(s.id), name: s.name, price: parseFloat(s.price) })),
    total_amount: totals.total,
    comments: document.getElementById("orderModalComments")?.value.trim() || null,
  };
  const confirmBtn = document.getElementById("confirmOrderBtn");
  if (!confirmBtn) return;
  const originalText = confirmBtn.innerHTML;
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Оформление...';
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(orderData) });
    const data = await response.json();
    if (data.success) {
      closeOrderModal();
      selectedComponents = [];
      selectedServices = [];
      updateCart();
      updateTotal();
      document.querySelectorAll(".service-checkbox").forEach(cb => cb.checked = false);
      loadComponentsData();
      updateCartBadge();
      showNotification(`Заказ №${data.orderNumber} успешно создан!`, "success");
      setTimeout(() => { if (confirm("Перейти к моим заказам?")) window.location.href = "/orders.html"; }, 500);
    } else { showNotification("Ошибка: " + data.message, "error"); }
  } catch (error) { showNotification("Ошибка при создании заказа", "error"); }
  finally { confirmBtn.disabled = false; confirmBtn.innerHTML = originalText; }
}

function renderCategoriesModern() {
  const container = document.getElementById("categoriesList");
  if (!container) return;
  if (!categories || categories.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>Нет категорий</p></div>';
    return;
  }
  container.innerHTML = categories.map(cat => `
    <div class="category-item ${selectedCategory === cat.id ? 'active' : ''}" onclick="selectCategory(${cat.id})">
      <div class="category-icon"><i class="fas ${getCategoryIcon(cat.name)}"></i></div>
      <div class="category-info">
        <h4>${escapeHtml(cat.name)}</h4>
        <p>${escapeHtml(cat.description || '')}</p>
      </div>
      <div class="category-count">${allComponents.filter(c => c.category_id === cat.id).length}</div>
    </div>
  `).join('');
  const countEl = document.getElementById("categoriesCount");
  if (countEl) countEl.textContent = categories.length;
}

function getCategoryIcon(categoryName) {
  const icons = {
    'Автоматические выключатели': 'fa-bolt',
    'Вводно-распределительные устройства': 'fa-tower-broadcast',
    'Силовые щиты': 'fa-industry',
    'Щиты освещения': 'fa-lightbulb',
    'Устройства защитного отключения': 'fa-shield-alt',
    'Контакторы и пускатели': 'fa-play-circle',
    'Шкафы и корпуса': 'fa-box'
  };
  return icons[categoryName] || 'fa-folder';
}

function renderComponentsModern() {
  const container = document.getElementById("componentsList");
  if (!container) return;
  if (!allComponents || allComponents.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-microchip"></i><p>Выберите категорию</p></div>';
    return;
  }
  container.innerHTML = allComponents.map(comp => {
    const isSelected = selectedComponents.some(c => c.id === comp.id);
    return `
      <div class="component-item" onclick="openComponentDetail(${comp.id})">
        <div class="component-info">
          <h4>${escapeHtml(comp.name)}</h4>
          <p>${escapeHtml(comp.description || '')}</p>
          <span class="stock-badge ${comp.in_stock ? '' : 'out'}">
            <i class="fas fa-${comp.in_stock ? 'check-circle' : 'times-circle'}"></i>
            ${comp.in_stock ? 'В наличии' : 'Нет в наличии'}
          </span>
        </div>
        <div class="component-actions">
          <div class="component-price">${new Intl.NumberFormat("ru-RU").format(comp.price)} ₽</div>
          <button class="add-btn" onclick="event.stopPropagation(); addToCart(${comp.id})" ${isSelected || !comp.in_stock ? 'disabled' : ''}>
            <i class="fas fa-${isSelected ? 'check' : 'plus'}"></i>
            ${isSelected ? 'Добавлено' : 'Добавить'}
          </button>
        </div>
      </div>
    `;
  }).join('');
  const countEl = document.getElementById("componentsCount");
  if (countEl) countEl.textContent = allComponents.length;
}

function renderCartModern() {
  const container = document.getElementById("selectedComponents");
  if (!container) return;
  if (selectedComponents.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-box-open"></i>
        <p>Корзина пуста</p>
        <span>Добавьте компоненты из каталога</span>
      </div>
    `;
    return;
  }
  container.innerHTML = selectedComponents.map(comp => `
    <div class="cart-item">
      <div class="cart-item-info">
        <h4>${escapeHtml(comp.name)}</h4>
        <div class="cart-item-price">${new Intl.NumberFormat("ru-RU").format(comp.price)} ₽</div>
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="changeQuantity(${comp.id}, -1)"><i class="fas fa-minus"></i></button>
          <span>${comp.quantity || 1}</span>
          <button class="quantity-btn" onclick="changeQuantity(${comp.id}, 1)"><i class="fas fa-plus"></i></button>
        </div>
      </div>
      <button class="remove-cart-btn" onclick="removeFromCart(${comp.id})">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  `).join('');
  const cartCount = document.getElementById("cartCount");
  if (cartCount) cartCount.textContent = selectedComponents.length;
}

function renderServicesModern() {
  const container = document.getElementById("servicesList");
  if (!container) return;
  if (!allServices || allServices.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Нет доступных услуг</p></div>';
    return;
  }
  container.innerHTML = allServices.map(serv => `
    <div class="service-item">
      <label>
        <input type="checkbox" class="service-checkbox" value="${serv.id}" onchange="toggleService(${serv.id}, ${serv.price}, '${serv.name.replace(/'/g, "\\'")}')">
        <span>${escapeHtml(serv.name)}</span>
      </label>
      <span class="service-price">${new Intl.NumberFormat("ru-RU").format(serv.price)} ₽</span>
    </div>
  `).join('');
}

function filterComponents() {
  const searchTerm = document.getElementById("searchComponents")?.value.toLowerCase();
  document.querySelectorAll("#componentsList .component-item").forEach(item => {
    item.style.display = !searchTerm || item.textContent.toLowerCase().includes(searchTerm) ? "" : "none";
  });
}

function initThemeToggle() {
  document.documentElement.removeAttribute("data-theme");
  localStorage.setItem("theme", "light");
  const btn = document.createElement("button");
  btn.id = "themeToggle";
  btn.className = "theme-toggle-btn";
  btn.innerHTML = '<i class="fas fa-sun"></i><i class="fas fa-moon"></i>';
  document.body.appendChild(btn);
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

function openComponentDetail(componentId) {
  const comp = allComponents.find(c => c.id === componentId);
  if (!comp) return;

  const related = allComponents.filter(c => c.category_id === comp.category_id && c.id !== comp.id).slice(0, 4);

  const imageHTML = comp.image_url ? `<img src="${comp.image_url}" alt="${comp.name}" onerror="this.style.display='none';">` : '';
  const noPhotoHTML = `<div class="no-photo" style="display: ${comp.image_url ? 'none' : 'flex'};"><i class="fas fa-microchip" style="font-size: 4rem; opacity: 0.4;"></i></div>`;

  const specsHTML = [
    { label: "Производитель", value: comp.manufacturer || "Не указан", icon: "fa-industry" },
    { label: "Категория", value: comp.category_name || "Без категории", icon: "fa-folder" },
    { label: "Мощность", value: comp.power_rating || "—", icon: "fa-bolt" },
    { label: "Напряжение", value: comp.voltage || "—", icon: "fa-plug" },
    { label: "Наличие", value: comp.in_stock ? "В наличии" : "Нет в наличии", icon: comp.in_stock ? "fa-check-circle" : "fa-times-circle" }
  ].map(s => `<div class="component-spec-item"><span class="component-spec-label"><i class="fas ${s.icon}"></i> ${s.label}</span><span class="component-spec-value">${escapeHtml(s.value)}</span></div>`).join("");

  let relatedHTML = '';
  if (related.length > 0) {
    relatedHTML = `<div class="related-section"><h4>Похожие товары</h4><div class="related-grid">${related.map(r => `<div class="related-card" onclick="openComponentDetail(${r.id})"><div class="related-card-image">${r.image_url ? `<img src="${r.image_url}" alt="${r.name}">` : '<i class="fas fa-microchip"></i>'}</div><h5>${escapeHtml(r.name)}</h5><div class="price">${new Intl.NumberFormat("ru-RU").format(r.price)} ₽</div></div>`).join("")}</div></div>`;
  }

  const html = `
    <div class="component-detail-grid">
      <div class="component-detail-image">${imageHTML}${noPhotoHTML}${!comp.in_stock ? '<div class="out-of-stock-badge">Нет в наличии</div>' : ''}</div>
      <div class="component-detail-info">
        <div class="detail-header"><h2>${escapeHtml(comp.name)}</h2>${comp.manufacturer ? `<span class="detail-manufacturer">${escapeHtml(comp.manufacturer)}</span>` : ''}</div>
        <p class="detail-description">${escapeHtml(comp.description || "Описание отсутствует")}</p>
        <div class="component-detail-price">${new Intl.NumberFormat("ru-RU").format(comp.price)} ₽ ${comp.in_stock ? '<span class="price-available">В наличии</span>' : '<span class="price-unavailable">Нет в наличии</span>'}</div>
        <div class="detail-divider"></div>
        <h4>Характеристики</h4>
        <div class="component-specs">${specsHTML}</div>
        ${relatedHTML}
        <div class="detail-actions"><button class="btn btn-primary" onclick="addToCart(${comp.id}); closeComponentDetail();" ${!comp.in_stock ? 'disabled' : ''}>Добавить в корзину</button></div>
      </div>
    </div>
  `;

  let modal = document.getElementById("componentDetailModal");
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'componentDetailModal';
    modal.innerHTML = `<div class="modal-content large"><div class="modal-header"><h2>Детали компонента</h2><span class="close" onclick="closeComponentDetail()">&times;</span></div><div id="componentDetailContent"></div><div class="modal-footer"><button class="btn btn-secondary" onclick="closeComponentDetail()">Закрыть</button></div></div>`;
    document.body.appendChild(modal);
  }

  document.getElementById("componentDetailContent").innerHTML = html;
  modal.style.display = "flex";
}

function closeComponentDetail() {
  const modal = document.getElementById("componentDetailModal");
  if (modal) modal.style.display = "none";
}

function subscribeNewsletter() {
  const email = document.getElementById("newsletterEmail")?.value.trim();
  if (!email) { showNotification("Введите email", "warning"); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showNotification("Введите корректный email", "error"); return; }
  showNotification("Спасибо за подписку!", "success");
  document.getElementById("newsletterEmail").value = "";
}

function setCategoryFilter(categoryId) {
  const catalogSelect = document.getElementById('catalogCategory');
  if (catalogSelect) {
    catalogSelect.value = categoryId;
    catalogFilters.categoryId = categoryId;
    filterCatalog();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  }
}

// ============ ГАМБУРГЕР МЕНЮ ============
var menuBtn = document.getElementById('mobileMenuBtn');
var sidebar = document.getElementById('mobileSidebar');
var overlay = document.getElementById('mobileOverlay');
var closeBtn = document.getElementById('sidebarCloseBtn');
var loginBtn = document.getElementById('sidebarLoginBtn');
var registerBtn = document.getElementById('sidebarRegisterBtn');

if (menuBtn) {
  menuBtn.onclick = function() {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
}
if (closeBtn) {
  closeBtn.onclick = function() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };
}
if (overlay) {
  overlay.onclick = function() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };
}
if (loginBtn) {
  loginBtn.onclick = function() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    showLoginModal();
  };
}
if (registerBtn) {
  registerBtn.onclick = function() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    showRegisterModal();
  };
}

document.querySelectorAll('.sidebar-link').forEach(function(link) {
  link.onclick = function() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };
});

// ============ ЗАПУСК ============
document.addEventListener("DOMContentLoaded", () => {
  loadCategoriesData();
  loadComponentsData();
  loadServicesData();
  checkAuth();
  initThemeToggle();
  
  var catalogSearch = document.getElementById("catalogSearch");
  if (catalogSearch) {
    catalogSearch.addEventListener("input", (e) => { catalogFilters.search = e.target.value; filterCatalog(); });
  }
  
  var catalogCategory = document.getElementById("catalogCategory");
  if (catalogCategory) {
    catalogCategory.addEventListener("change", (e) => { catalogFilters.categoryId = e.target.value; filterCatalog(); });
  }
  
  var orderModalClose = document.getElementById("orderModalClose");
  if (orderModalClose) orderModalClose.addEventListener("click", closeOrderModal);
  
  var cancelOrderBtn = document.getElementById("cancelOrderBtn");
  if (cancelOrderBtn) cancelOrderBtn.addEventListener("click", closeOrderModal);
  
  var confirmOrderBtn = document.getElementById("confirmOrderBtn");
  if (confirmOrderBtn) confirmOrderBtn.addEventListener("click", submitOrder);
  
  var searchComponents = document.getElementById("searchComponents");
  if (searchComponents) searchComponents.addEventListener("input", filterComponents);
  
  // Инициализация модального окна авторизации
  var modal = document.getElementById('authModal');
  var modalOverlay = document.getElementById('authModalOverlay');
  var modalCloseBtn = document.getElementById('authModalCloseBtn');
  
  if (modalCloseBtn) modalCloseBtn.onclick = closeAuthModal;
  if (modalOverlay) modalOverlay.onclick = closeAuthModal;
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
      closeAuthModal();
    }
  });
});

// Глобальные функции
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.closeAuthModal = closeAuthModal;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.login = login;
window.register = register;
window.logout = logout;
window.togglePassword = togglePassword;
window.selectCategory = selectCategory;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.toggleService = toggleService;
window.showOrderModal = showOrderModal;
window.closeOrderModal = closeOrderModal;
window.submitOrder = submitOrder;
window.toggleDeliveryAddress = toggleDeliveryAddress;
window.filterCatalog = filterCatalog;
window.openComponentDetail = openComponentDetail;
window.closeComponentDetail = closeComponentDetail;
window.subscribeNewsletter = subscribeNewsletter;
window.setCategoryFilter = setCategoryFilter;
window.updateOrderSummary = updateOrderSummary;