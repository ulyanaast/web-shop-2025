// Конфигурация
const BASE_URL = 'https://ast-backend-rw3h.onrender.com';

// Главная функция обновления UI
const updateOrdersUI = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/orders`);
    const orders = await response.json();
    
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = orders.length ? 
      orders.map(order => `
        <div class="order-item">
          <div class="order-header">
            <span class="order-date">${new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div class="order-products">
            ${order.items.map(item => `
              <div class="order-product">
                <img src="${item.image?.startsWith('http') ? item.image : 
                  `${BASE_URL}${item.image?.startsWith('/') ? '' : '/'}${item.image || '/static/uploads/no-image.jpg'}`}" 
                     class="order-product-thumbnail" alt="${item.name || 'Товар'}">
                <div class="order-product-info">
                  <span class="order-product-name">${item.name || 'Без названия'}</span>
                  <span class="order-product-price">${item.price || 0} руб.</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="order-footer">
            <span class="order-total">Итого: ${order.total || 0} руб.</span>
          </div>
        </div>
      `).join('') : 
      '<div class="empty-orders">У вас пока нет заказов</div>';
  } catch (error) {
    console.error("Ошибка загрузки заказов:", error);
    const ordersList = document.getElementById('orders-list');
    if (ordersList) ordersList.innerHTML = '<div class="empty-orders">Ошибка загрузки заказов</div>';
  }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  updateOrdersUI();
});
