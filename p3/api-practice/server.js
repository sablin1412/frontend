const express = require('express');
const app = express();
const port = 3000;

// Разрешаем серверу понимать JSON (данные в формате текста)
app.use(express.json());

// Наша база данных (пока просто в оперативной памяти)
let users = [
    { id: 1, name: 'Петр', age: 16 },
    { id: 2, name: 'Иван', age: 18 },
    { id: 3, name: 'Дарья', age: 20 },
];

// 1. Показать всех пользователей
app.get('/users', (req, res) => {
    res.json(users);
});

// 2. Добавить нового пользователя
app.post('/users', (req, res) => {
    const { name, age } = req.body;
    const newUser = {
        id: Date.now(), // генерируем уникальный ID
        name,
        age
    };
    users.push(newUser); // добавляем в массив
    res.status(201).json(newUser);
});

// 3. Удалить пользователя по ID
app.delete('/users/:id', (req, res) => {
    // Фильтруем массив, оставляя всех, кроме удаляемого
    users = users.filter(u => u.id != req.params.id);
    res.send('Ok');
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер работает по адресу http://localhost:${port}`);
});