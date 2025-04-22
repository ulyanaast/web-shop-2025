// Корзина
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Загрузка товаров
async function loadProducts() {
    try {
        const response = await fetch('https://ast-backend-rw3h.onrender.com/api/products', {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const products = await response.json();
        const container = document.getElementById('products-list');
        
        container.innerHTML = products.map(product => `
            <div class="product-card">
                ${product.image ? 
                    `<img src="${product.image}" class="product-image" alt="${product.name}">` : 
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

    } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
        // Можно добавить уведомление для пользователя
        document.getElementById('products-list').innerHTML = `
            <div class="error-message">
                Не удалось загрузить товары. Пожалуйста, попробуйте позже.
            </div>
        `;
    }
}

// Работа с корзиной
function addToCart(product) {
    cart.push(product);
    updateCart();
}

function updateCart() {
    // Сохранение
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Обновление UI
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = cart.map((item, index) => `
        <li class="cart-item">
            <span>${item.name} - ${item.price} руб.</span>
            <button class="remove-btn" data-index="${index}">×</button>
        </li>
    `).join('');

    // Обновление счетчиков
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cart-count').textContent = cart.length;
    document.getElementById('header-cart-count').textContent = cart.length;
    document.getElementById('cart-total').textContent = total.toFixed(2);
    
    // Обработчики удаления
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            cart.splice(parseInt(btn.dataset.index), 1);
            updateCart();
        });
    });
}

// Оформление заказа
document.getElementById('checkout-btn').addEventListener('click', async () => {
    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    
    try {
        const response = await fetch('https://ast-backend-rw3h.onrender.com/api/order', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ items: cart })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка сервера');
        }

        const result = await response.json();
        if (result.success) {
            cart = [];
            updateCart();
            alert('Заказ успешно оформлен!');
        }
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        alert(`Ошибка: ${error.message}`);
    }
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCart();
});
