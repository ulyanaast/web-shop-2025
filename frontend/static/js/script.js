// Глобальный доступ
window.addToCart = function(product) {
    console.log("Добавляем товар:", product);
    
    // Создаём и отправляем событие
    const event = new CustomEvent('cartNeedsUpdate', {
        detail: {
            ...product,
            id: Number(product.id) // Приводим ID к числу
        },
        bubbles: true,
        composed: true
    });
    
    document.dispatchEvent(event);
};
// Глобальная функция для обновления счётчиков
window.updateCartCounters = function(count) {
    const headerCounter = document.getElementById('header-cart-count');
    if (headerCounter) headerCounter.textContent = count;
};

// DOM элементы (кэшируем для производительности)
const elements = {
    productsList: document.getElementById('products-list'),
    cartCount: document.getElementById('cart-count'),
    headerCartCount: document.getElementById('header-cart-count'),
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    checkoutBtn: document.getElementById('checkout-btn')
};

// Загрузка товаров
async function loadProducts() {
    try {
        console.log("Загрузка товаров с сервера...");
        const response = await fetch('https://ast-backend-rw3h.onrender.com/api/products', {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
        const products = await response.json();
        if (!elements.productsList) {
            throw new Error("Контейнер для товаров не найден");
        }
        renderProducts(products);
    } catch (error) {
        console.error("Ошибка при загрузке товаров:", error);
        showError(error);
    }
}

// Рендер товаров
function renderProducts(products) {
    if (products.length === 0) {
        elements.productsList.innerHTML = '<div class="alert alert-info">Товары отсутствуют</div>';
        return;
    }

    elements.productsList.innerHTML = products.map(product => `
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

    // Добавляем обработчики для всех кнопок "Купить"
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.addToCart({
                id: btn.dataset.id,
                name: decodeURIComponent(btn.dataset.name),
                price: parseFloat(btn.dataset.price),
                image: btn.dataset.image
            });
        });
    }); // <- Здесь была лишняя скобка
}

// Обработка ошибок
function showError(error) {
    if (elements.productsList) {
        elements.productsList.innerHTML = `
            <div class="alert alert-danger">
                Не удалось загрузить товары. Пожалуйста, попробуйте позже.<br>
                ${error.message}
            </div>
        `;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('products-list')) loadProducts();
});
