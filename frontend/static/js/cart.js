// Корзина
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Работа с корзиной
function addToCart(product) {
cart.push(product);
updateCart();
}

function updateCart() {
    console.log('Обновление корзины. Текущие товары:', cart);
    
    // Декодируем названия перед отображением
    const decodedCart = cart.map(item => ({
        ...item,
        name: decodeURIComponent(item.name)
    }));

    // Сохраняем декодированную версию
    localStorage.setItem('cart', JSON.stringify(decodedCart));

    const cartItems = document.getElementById('cart-items');
    if (cartItems) {
        cartItems.innerHTML = decodedCart.map((item, index) => `
        <li class="cart-item">
            <div class="cart-content-wrapper">
                <img src="${item.image}" class="cart-item-thumbnail" alt="${item.name}">
                <div class="product-text-container">
                    <span class="product-name">${item.name}</span>
                    <span class="price">${item.price} руб.</span>
                </div>
                <button class="remove-btn" data-index="${index}">×</button>
            </div>
        </li>
    `).join('');
    }

    // Используем decodedCart для подсчёта!
    const total = decodedCart.reduce((sum, item) => sum + item.price, 0);
    const cartCount = document.getElementById('cart-count');
    const headerCartCount = document.getElementById('header-cart-count');
    const cartTotal = document.getElementById('cart-total');

    if (cartCount) cartCount.textContent = decodedCart.length;
    if (headerCartCount) headerCartCount.textContent = decodedCart.length;
    if (cartTotal) cartTotal.textContent = total.toFixed(2);

    // Обработчики удаления
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            cart.splice(parseInt(btn.dataset.index), 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCart();
        });
    });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
updateCart();
});

// Оформление заказа
document.getElementById('checkout-btn')?.addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    
    try {
        const response = await fetch('/web-shop-2025/api/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: cart })
        });

        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCart();
            alert('Заказ успешно оформлен!');
        }
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        alert(`Ошибка: ${error.message}`);
    }
});
