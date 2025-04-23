// Корзина
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Загрузка товаров
async function loadProducts() {
    try {
        const response = await fetch('https://ast-backend-rw3h.onrender.com/api/products', {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'  // Убрали Content-Type для GET-запроса
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const products = await response.json();
        const container = document.getElementById('products-list');
        
        container.innerHTML = products.map(product => `
            <div class="col-sm-6 col-md-4 col-lg-3">
                <div class="card product-card h-100">
                    ${product.image ? 
                        `<img src="${product.image}" class="card-img-top p-3 bg-light object-fit-contain" alt="${product.name}" style="height: 250px">` : 
                        '<div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 250px">Нет изображения</div>'
                    }
                    <div class="card-body text-center d-flex flex-column">
                        <h3 class="card-title">${product.name}</h3>
                        <p class="card-text">${product.price} руб.</p>
                        <button class="btn btn-dark mt-auto buy-btn"
                            data-id="${product.id}"
                            data-name="${product.name}"
                            data-price="${product.price}">
                            Купить
                        </button>
                    </div>
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
        <li class="cart-item d-flex justify-content-between align-items-center p-2 mb-2 bg-white rounded">
            <span>${item.name} - ${item.price} руб.</span>
            <button class="btn btn-danger btn-sm rounded-circle remove-btn" data-index="${index}">×</button>
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
