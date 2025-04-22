// Корзина
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Загрузка товаров
async function loadProducts() {
    const response = await fetch('/api/products');
    const products = await response.json();
    const container = document.getElementById('products-list');
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.image ? 
                `<img src="/static/uploads/${product.image.split('/').pop()}" class="product-image" alt="${product.name}">` : 
                '<div class="product-image" style="background: #eee;"></div>'
            }
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.price} руб.</p>
                <button class="btn btn-accent buy-btn" 
                    data-id="${product.id}"
                    data-name="${product.name}"
                    data-price="${product.price}">
                    Купить
                </button>
            </div>
        </div>
    `).join('');

    // Обработчики кнопок
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addToCart({
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: parseFloat(btn.dataset.price)
            });
        });
    });
}

// Работа с корзиной
function addToCart(product) {
    cart.push(product);
    updateCart();
}

function updateCart() {
    // Сохранение
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Обновление UI в корзине
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = cart.map((item, index) => `
        <li class="cart-item">
            <span>${item.name} - ${item.price} руб.</span>
            <button class="remove-btn" data-index="${index}">×</button>
        </li>
    `).join('');

    // Обновление счётчиков
    const itemCount = cart.length;
    document.getElementById('cart-count').textContent = itemCount;
    document.getElementById('header-cart-count').textContent = itemCount; // Новый счётчик в шапке
    document.getElementById('cart-total').textContent = 
        cart.reduce((sum, item) => sum + item.price, 0);
    
    // Обработчики удаления
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            cart.splice(btn.dataset.index, 1);
            updateCart();
        });
    });
}

// Оформление заказа
document.getElementById('checkout-btn').addEventListener('click', async () => {
    if (cart.length === 0) return alert('Корзина пуста!');
    
    try {
        const response = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart })
        });
        
        if (response.ok) {
            cart = [];
            updateCart();
            alert('Заказ оформлен!');
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCart();
});