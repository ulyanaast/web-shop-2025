document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    setupForm();
    setupFileButton();
});

function setupFileButton() {
    const browseBtn = document.getElementById('browse-btn');
    const fileInput = document.getElementById('image-upload');
    const fileNameSpan = document.getElementById('file-name');

    // Обработчик клика по кнопке "Выбрать файл"
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    fileInput.addEventListener('change', () => {
        fileNameSpan.textContent = fileInput.files[0]?.name || 'Файл не выбран';
    });
}

async function loadProducts() {
    try {
        const response = await fetch('/api/admin/products');
        const products = await response.json();
        const grid = document.getElementById('products-grid');
        const count = document.getElementById('products-count');
        
        grid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                ${product.image ? 
                    `<img src="${product.image}" class="product-image" alt="${product.name}">` : 
                    '<div class="no-image">Нет изображения</div>'
                }
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.price} руб.</p>
                    <button class="delete-btn" data-id="${product.id}">Удалить</button>
                </div>
            </div>
        `).join('');
        
        count.textContent = products.length;
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const productId = btn.dataset.id;
                await deleteProduct(productId);
            });
        });
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
    }
}

function setupForm() {
    const form = document.getElementById('product-form');
    const fileInput = document.getElementById('image-upload');
    const fileNameSpan = document.getElementById('file-name');

    // Обработчик выбора файла
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileNameSpan.textContent = fileInput.files[0].name;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', document.getElementById('product-name').value);
        formData.append('price', document.getElementById('product-price').value);
        
        // Добавляем только имя файла, а не сам файл
        if (fileInput.files.length > 0) {
            formData.append('image_filename', fileInput.files[0].name);
        }

        try {
            const response = await fetch('/api/admin/products', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка сервера');
            }
            
            form.reset();
            fileNameSpan.textContent = 'Файл не выбран';
            await loadProducts();
            alert('Товар успешно добавлен!');
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при добавлении: ' + error.message);
        }
    });
}

async function deleteProduct(id) {
    if (!confirm('Удалить товар?')) return;
    
    try {
        const response = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Ошибка сервера');
        await loadProducts();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось удалить товар');
    }
}