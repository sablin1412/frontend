// API URL
const API_URL = '/api/products';

// Состояние приложения
let products = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Форма добавления товара
    document.getElementById('addProductForm').addEventListener('submit', handleAddProduct);
    
    // Закрытие модального окна
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Форма редактирования
    document.getElementById('editForm').addEventListener('submit', handleEditProduct);
}

// Загрузка товаров с сервера
async function loadProducts() {
    try {
        const response = await fetch(API_URL);
        products = await response.json();
        renderProducts();
        updateStats();
        showToast('Каталог загружен', 'success');
    } catch (error) {
        showToast('Ошибка загрузки', 'error');
        console.error('Error:', error);
    }
}

// Форматирование цены в долларах
function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

// Отображение товаров в таблице
function renderProducts() {
    const tbody = document.getElementById('productsList');
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 50px;">
                    <i class="fas fa-car" style="font-size: 48px; color: #cbd5e0; margin-bottom: 10px;"></i>
                    <p style="color: #a0aec0;">Автомобилей пока нет</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>#${product.id}</td>
            <td><strong>${escapeHtml(product.name)}</strong></td>
            <td>$${formatPrice(product.price)}</td>
            <td class="actions">
                <button class="btn-edit" onclick="openEditModal(${product.id})">
                    <i class="fas fa-edit"></i>
                    Изменить
                </button>
                <button class="btn-delete" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                    Удалить
                </button>
            </td>
        </tr>
    `).join('');
}

// Обновление статистики
function updateStats() {
    document.getElementById('totalProducts').textContent = products.length;
    
    const totalPrice = products.reduce((sum, product) => sum + product.price, 0);
    document.getElementById('totalPrice').textContent = formatPrice(totalPrice);
}

// Защита от XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Добавление товара
async function handleAddProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('productName').value.trim();
    const price = document.getElementById('productPrice').value;
    
    if (!name || !price) {
        showToast('Заполните все поля', 'error');
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, price })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при добавлении');
        }
        
        const newProduct = await response.json();
        products.push(newProduct);
        renderProducts();
        updateStats();
        
        // Очистка формы
        document.getElementById('addProductForm').reset();
        
        showToast('Автомобиль добавлен!', 'success');
    } catch (error) {
        showToast('Ошибка при добавлении', 'error');
        console.error('Error:', error);
    }
}

// Открытие модального окна для редактирования
function openEditModal(id) {
    const product = products.find(p => p.id === id);
    
    if (!product) return;
    
    document.getElementById('editId').value = product.id;
    document.getElementById('editName').value = product.name;
    document.getElementById('editPrice').value = product.price;
    
    document.getElementById('editModal').classList.add('show');
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('editModal').classList.remove('show');
}

// Редактирование товара
async function handleEditProduct(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const name = document.getElementById('editName').value.trim();
    const price = document.getElementById('editPrice').value;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, price })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при обновлении');
        }
        
        const updatedProduct = await response.json();
        
        // Обновляем товар в массиве
        const index = products.findIndex(p => p.id == id);
        products[index] = updatedProduct;
        
        renderProducts();
        updateStats();
        closeModal();
        showToast('Модель обновлена!', 'success');
    } catch (error) {
        showToast('Ошибка при обновлении', 'error');
        console.error('Error:', error);
    }
}

// Удаление товара
async function deleteProduct(id) {
    if (!confirm('Вы уверены, что хотите удалить эту модель?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при удалении');
        }
        
        // Удаляем товар из массива
        products = products.filter(p => p.id !== id);
        
        renderProducts();
        updateStats();
        showToast('Модель удалена', 'success');
    } catch (error) {
        showToast('Ошибка при удалении', 'error');
        console.error('Error:', error);
    }
}

// Показ уведомлений
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}