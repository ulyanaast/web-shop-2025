// Конфигурация
const BASE_URL = 'https://ast-backend-rw3h.onrender.com';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Функция для показа уведомления
const showRemovedNotification = (removedItems) => {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `
    <p>${removedItems.length} товар(ов) больше не доступны</p>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Главная функция обновления UI
const updateCartUI = () => {
  localStorage.setItem('cart', JSON.stringify(cart));
  document.querySelectorAll('#header-cart-count, #cart-count').forEach(el => {
    if (el) el.textContent = cart.length;
  });

  const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);
  const cartTotalEl = document.getElementById('cart-total');
  if (cartTotalEl) cartTotalEl.textContent = total;

  const cartItems = document.getElementById('cart-items');
  if (!cartItems) return;

  cartItems.innerHTML = cart.length ? 
    cart.map((item, index) => `
      <li class="cart-item">
        <div class="cart-content-wrapper">
          <img src="${item.image?.startsWith('http') ? item.image : 
            `${BASE_URL}${item.image?.startsWith('/') ? '' : '/'}${item.image || '/static/uploads/no-image.jpg'}`}" 
               class="cart-item-thumbnail" alt="${item.name || 'Товар'}">
          <div class="product-text-container">
            <span class="product-name">${item.name || 'Без названия'}</span>
            <span class="price">${item.price || 0} руб.</span>
          </div>
          <button class="remove-btn" data-index="${index}">×</button>
        </div>
      </li>
    `).join('') : 
    '<div class="empty-cart">Корзина пуста</div>';

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.splice(parseInt(btn.dataset.index), 1);
      updateCartUI();
    });
  });
};

// Валидация корзины
const validateCart = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/products`);
    const products = await response.json();
    
    const validIds = new Set(products.map(p => String(p.id)));
    const removedItems = cart.filter(item => !validIds.has(String(item.id)));
    
    if (removedItems.length) {
      cart = cart.filter(item => validIds.has(String(item.id)));
      updateCartUI();
      showRemovedNotification(removedItems);
    }
  } catch (error) {
    console.error("Ошибка валидации:", error);
  }
};

// Оформление заказа
const setupCheckout = () => {
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (!cart.length) return alert('Корзина пуста!');
      
      const deviceId = localStorage.getItem('device_id') || 
                      'device-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', deviceId);
      
      try {
        const response = await fetch(`${BASE_URL}/api/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Device-ID': deviceId
            },
            body: JSON.stringify({items: cart}),
            mode: 'cors'
        });
        
        if (!response.ok) throw new Error(await response.text());
        
        // Показываем уведомление об успешном заказе
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = '<p>Заказ успешно оформлен!</p>';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
        
        // Очищаем корзину
        cart = [];
        localStorage.removeItem('cart');
        updateCartUI();

      } catch (error) {
        console.error('Ошибка:', error);
        alert(`Ошибка: ${error.message}`);
      }
    });
  }
};

// Обработчик добавления товаров
document.addEventListener('cartNeedsUpdate', (e) => {
  cart.push({
    id: Number(e.detail.id),
    name: e.detail.name,
    price: parseFloat(e.detail.price),
    image: e.detail.image
  });
  updateCartUI();
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  validateCart();
  setupCheckout();
});

if (document.getElementById('header-cart-count')) {
  document.getElementById('header-cart-count').textContent = cart.length;
}
