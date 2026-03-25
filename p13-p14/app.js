const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');

// Загрузка задач из памяти
// Загрузка задач из памяти
// Загрузка задач из памяти
function loadTodos() {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    list.innerHTML = todos.map((todo, index) => `
        <li class="todo-item">
            <span>${todo}</span>
            <button class="button primary" onclick="deleteTodo(${index})">Удалить</button>
        </li>
    `).join('');
}

// Добавление задачи
function addTodo(text) {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    todos.push(text);
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTodos();
}

// Удаление задачи
window.deleteTodo = function(index) {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    todos.splice(index, 1);
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTodos();
}

// Обработка формы
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) addTodo(text);
    input.value = '';
});

// Запускаем отрисовку при загрузке
loadTodos();

// Регистрация Service Worker (Магия PWA начинается здесь!)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ ServiceWorker успешно зарегистрирован. Область:', registration.scope);
        } catch (err) {
            console.error('❌ Ошибка регистрации ServiceWorker:', err);
        }
    });
}