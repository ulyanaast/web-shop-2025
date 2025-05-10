// Конфигурация
const BASE_URL = '/web-shop-2025';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Загрузка стилей корзины
function loadCartStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${BASE_URL}/static/css/cart.css`;
    document.head.appendChild(link);
}

// Работа с корзиной
function addToCart(product) {
    // Добавляем baseUrl к путям изображений
    if (product.image && !product.image.startsWith('http')) {
        product.image = `${BASE_URL}${product.image}`;
    }
    cart.push(product);
    updateCart();
}

function updateCart() {
    const decodedCart = cart.map(item => ({
        ...item,
        name: decodeURIComponent(item.name)
    }));

    localStorage.setItem('cart', JSON.stringify(decodedCart));

    const cartItems = document.getElementById('cart-items');
    if (cartItems) {
        cartItems.innerHTML = decodedCart.map((item, index) => `
            <li class="cart-item">
                <div class="cart-content-wrapper">
                    `<img src="${item.image.startsWith('http') ? item.image : BASE_URL + item.image}" class="cart-item-thumbnail" alt="${item.name}">`
                    <div class="product-text-container">
                        <span class="product-name">${item.name}</span>
                        <span class="price">${item.price} руб.</span>
                    </div>
                    <button class="remove-btn" data-index="${index}">×</button>
                </div>
            </li>
        `).join('');
    }

    const total = decodedCart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cart-count').textContent = decodedCart.length;
    document.getElementById('header-cart-count').textContent = decodedCart.length;
    document.getElementById('cart-total').textContent = total.toFixed(2);

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            cart.splice(parseInt(btn.dataset.index), 1);
            updateCart();
        });
    });
}

// Оформление заказа
function setupCheckout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (cart.length === 0) {
                alert('Корзина пуста!');
                return;
            }
            
            try {
                const response = await fetch(`${BASE_URL}/api/order`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: cart })
                });

                if (!response.ok) throw new Error(await response.text());
                
                cart = [];
                updateCart();
                alert('Заказ успешно оформлен!');
            } catch (error) {
                console.error('Ошибка:', error);
                alert(`Ошибка: ${error.message}`);
            }
        });
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadCartStyles();
    updateCart();
    setupCheckout();
});
