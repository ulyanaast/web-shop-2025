const API_BASE_URL = window.BASE_URL || 'https://ast-backend-rw3h.onrender.com';

// Идентификатор устройства
const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
};

const updateOrdersUI = async () => {
  try {
  const deviceId = getDeviceId();
  const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
      headers: {
          'X-Device-ID': deviceId
      }
  });
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/orders`);
    const orders = await response.json();
    
    const groupedOrders = groupOrdersByDate(orders);
    const ordersList = document.getElementById('orders-list');
    
    ordersList.innerHTML = Object.keys(groupedOrders).length ? 
      Object.values(groupedOrders).map(orderGroup => `
        <div class="order-item">
          <div class="order-header">
            <span class="order-date">${new Date(orderGroup.date).toLocaleString('ru-RU')}</span>
          </div>
          <div class="order-products">
            ${orderGroup.items.map(item => `
              <div class="order-product">
                <img src="${item.image?.startsWith('http') ? item.image : 
                  `${API_BASE_URL}${item.image?.startsWith('/') ? '' : '/'}${item.image || '/static/uploads/no-image.jpg'}`}" 
                     class="order-product-thumbnail" alt="${item.product_name || 'Товар'}">
                <div class="order-product-info">
                  <span class="order-product-name">${item.product_name || 'Без названия'}</span>
                  <span class="order-product-price">${item.price || 0} руб.</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="order-footer">
            <span class="order-total">Итого: ${orderGroup.total || 0} руб.</span>
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

function groupOrdersByDate(orders) {
  const grouped = {};
  orders.forEach(order => {
    const key = order.order_date;
    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        items: [],
        total: 0
      };
    }
    grouped[key].items.push(order);
    grouped[key].total += order.price;
  });
  return grouped;
}

document.addEventListener('DOMContentLoaded', () => {
  updateOrdersUI();
  
  // Обновляем счетчик корзины
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const counter = document.getElementById('header-cart-count');
  if (counter) counter.textContent = cart.length;
});
