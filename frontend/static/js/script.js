// Корзина
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Загрузка товаров
async function loadProducts() {
    try {
        console.log("Загрузка товаров с сервера...");
        const response = await fetch('https://ast-backend-rw3h.onrender.com/api/products', {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log("Статус ответа:", response.status);

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const products = await response.json();
        console.log('Полученные товары:', products);

        const container = document.getElementById('products-list');
        if (!container) {
            throw new Error("Контейнер для товаров не найден");
        }

        if (!Array.isArray(products)) {
            throw new Error("Данные не являются массивом");
        }

        if (products.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Товары отсутствуют</div>';
            return;
        }

        // Рендер товаров (адаптированный под публичную версию)
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
                            data-name="${encodeURIComponent(product.name)}"
                            data-price="${product.price}"
                            data-image="${product.image || ''}">
                            Купить
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Обработчики кнопок "Купить"
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                addToCart({
                    id: btn.dataset.id,
                    name: decodeURIComponent(btn.dataset.name), // Декодируем название
                    price: parseFloat(btn.dataset.price),
                    image: btn.dataset.image
                });
            });
        });

    } catch (error) {
        console.error("Ошибка при загрузке товаров:", error);
        const container = document.getElementById('products-list');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    Не удалось загрузить товары. Пожалуйста, попробуйте позже.<br>
                    ${error.message}
                </div>
            `;
        }
    }
}

// Добавление в корзину + уведомление
function addToCart(product) {
    cart.push(product);
    updateCart();
    showCartNotification(product.name);
}

// Уведомление о добавлении
function showCartNotification(productName) {
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
}

// Обновление корзины (с сохранением в localStorage)
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Обновление списка товаров в корзине
    const cartItems = document.getElementById('cart-items');
    if (cartItems) {
        cartItems.innerHTML = cart.map((item, index) => `
            <li class="cart-item d-flex justify-content-between align-items-center p-2 mb-2 bg-white rounded">
                <span>${item.name} - ${item.price} руб.</span>
                <button class="btn btn-danger btn-sm rounded-circle remove-btn" data-index="${index}">×</button>
            </li>
        `).join('');

        // Обработчики удаления
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                cart.splice(parseInt(btn.dataset.index), 1);
                updateCart();
            });
        });
    }

    // Обновление счетчиков
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cart-count')?.textContent = cart.length;
    document.getElementById('header-cart-count')?.textContent = cart.length;
    document.getElementById('cart-total')?.textContent = total.toFixed(2);
}

// Оформление заказа (с проверкой на существование кнопки)
const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
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
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('products-list')) {
        loadProducts();
    }
    updateCart();
});
