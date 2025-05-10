const API_BASE_URL = window.BASE_URL || 'https://ast-backend-rw3h.onrender.com/web-shop-2025';

const updateOrdersUI = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/orders`);
    const orders = await response.json();
    
    // Группировка заказов по дате/времени
    const groupedOrders = {};
    orders.forEach(order => {
      const key = order.order_date;
      if (!groupedOrders[key]) {
        groupedOrders[key] = {
          date: order.order_date,
          items: [],
          total: 0
        };
      }
      groupedOrders[key].items.push(order);
      groupedOrders[key].total += order.price;
    });
    
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = Object.keys(groupedOrders).length ? 
      Object.values(groupedOrders).map(orderGroup => `
        <div class="order-item">
          <div class="order-header">
            <span class="order-date">${new Date(orderGroup.date).toLocaleString('ru-RU')}</span>
          </div>
          <div class="order-products">
            ${orderGroup.items.map(item => `
              <div class="order-product">
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

document.addEventListener('DOMContentLoaded', () => {
  updateOrdersUI();
  
  // Обновляем счетчик корзины
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const counter = document.getElementById('header-cart-count');
  if (counter) counter.textContent = cart.length;
});
