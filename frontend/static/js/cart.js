// Конфигурация
const BASE_URL = 'https://ast-backend-rw3h.onrender.com';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Функция добавления в корзину
function addToCart(product) {
    // Сохраняем оригинальные данные без изменений
    cart.push(product);
    updateCart();
}

async function validateCart() {
    try {
        const response = await fetch('https://ast-backend-rw3h.onrender.com/api/products');
        const products = await response.json();
        const validIds = new Set(products.map(p => p.id));
        
        const removedItems = cart.filter(item => !validIds.has(item.id));
        cart = cart.filter(item => validIds.has(item.id));
        
        if (removedItems.length > 0) {
            alert(`Некоторые товары (${removedItems.length}) больше недоступны и удалены из корзины.`);
        }
        
        updateCart();
    } catch (error) {
        console.error("Ошибка валидации корзины:", error);
    }
}

// Обновление отображения корзины
function updateCart() {
    // Сохраняем текущую корзину
    localStorage.setItem('cart', JSON.stringify(cart));
    
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;
    
    // Очищаем корзину перед обновлением
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Корзина пуста</div>';
    } else {
        cart.forEach((item, index) => {
            const cartItem = document.createElement('li');
            cartItem.className = 'cart-item';
            
            // Формируем правильный путь к изображению
            let imageUrl = item.image;
            if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = imageUrl.startsWith('/') 
                    ? BASE_URL + imageUrl
                    : BASE_URL + '/' + imageUrl;
            }
            
            cartItem.innerHTML = `
                <div class="cart-content-wrapper">
                    <img src="${imageUrl || BASE_URL + '/static/uploads/no-image.jpg'}" 
                         class="cart-item-thumbnail" 
                         alt="${item.name || 'Товар'}">
                    <div class="product-text-container">
                        <span class="product-name">${item.name || 'Без названия'}</span>
                        <span class="price">${item.price || 0} руб.</span>
                    </div>
                    <button class="remove-btn" data-index="${index}">×</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
    }
    
    // Обновляем счётчики
    const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    document.getElementById('cart-count').textContent = cart.length;
    document.getElementById('header-cart-count').textContent = cart.length;
    document.getElementById('cart-total').textContent = total.toFixed(2);
    
    // Вешаем обработчики удаления
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            cart.splice(parseInt(btn.dataset.index), 1);
            updateCart();
        });
    });
}

// Оформление заказа (оставляем без изменений)
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
    await validateCart();
    updateCart();
    setupCheckout();
});
