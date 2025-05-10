// Конфигурация
const BASE_URL = 'https://ast-backend-rw3h.onrender.com';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

if (document.getElementById('header-cart-count')) {
    document.getElementById('header-cart-count').textContent = cart.length;
}

// Глобальные методы
window.updateCartUI = updateCartUI;
window.addToCart = (product) => {
  document.dispatchEvent(new CustomEvent('cartNeedsUpdate', {
    detail: product,
    bubbles: true,
    composed: true
  }));
};

// Обработчики событий добавления в корзину
document.addEventListener('cartNeedsUpdate', (e) => {
  cart.push({...e.detail, id: Number(e.detail.id)});
  updateCartUI();
  showNotification(e.detail.name);
});

window.addEventListener('storage', (e) => {
  if (e.key === 'cart') {
    cart = JSON.parse(e.newValue || '[]');
    updateCartUI();
  }
});

// Функция добавления в корзину
function addToCart(product) {
    // Приводим ID к числу для единообразия
    cart.push({
        ...product,
        id: Number(product.id)
    });
    updateCart();
}

// Обновление товаров в корзине при их внутреннем изменении
let cachedProducts = [];
// Валидация корзины
const validateCart = async () => {
  try {
    if (!cachedProducts.length) {
      cachedProducts = await (await fetch(`${BASE_URL}/api/products`)).json();
    }
    
    const validIds = new Set(cachedProducts.map(p => String(p.id)));
    const removedItems = cart.filter(item => !validIds.has(String(item.id)));
    
    cart = cart
      .filter(item => validIds.has(String(item.id)))
      .map(item => {
        const product = cachedProducts.find(p => String(p.id) === String(item.id));
        return product ? {...item, price: product.price} : item;
      });

    if (removedItems.length) {
      console.log("Удалены неактуальные товары:", removedItems);
      alert(`Удалено ${removedItems.length} неактуальных товаров.`);
    }
    
    updateCartUI();
  } catch (error) {
    console.error("Ошибка валидации:", error);
  }
};


// Обновление отображения корзины
// Главная функция обновления UI
const updateCartUI = () => {
  // Сохраняем корзину
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Обновляем счётчики
  document.querySelectorAll('#header-cart-count, #cart-count').forEach(el => {
    if (el) el.textContent = cart.length;
  });

  // Обновляем список товаров (если на странице корзины)
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

  // Обработчики удаления
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.splice(parseInt(btn.dataset.index), 1);
      updateCartUI();
    });
  });
};

// Оформление заказа
const setupCheckout = () => {
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (!cart.length) return alert('Корзина пуста!');
      
      try {
        const response = await fetch(`${BASE_URL}/api/order`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({items: cart})
        });
        
        if (!response.ok) throw new Error(await response.text());
        
        cart = [];
        updateCartUI();
        alert('Заказ оформлен!');
      } catch (error) {
        console.error('Ошибка:', error);
        alert(`Ошибка: ${error.message}`);
      }
    });
  }
};

// Уведомление
const showNotification = (productName) => {
  const notification = document.createElement('div');
  notification.className = 'position-fixed bottom-0 end-0 p-3';
  notification.innerHTML = `
    <div class="alert alert-success alert-dismissible fade show" role="alert">
      <strong>${productName}</strong> добавлен в корзину!
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  validateCart();
  setupCheckout();
});
