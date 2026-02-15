const express = require('express');
const app = express();
const port = 3000;

// Middleware для парсинга JSON
app.use(express.json());

// Подключаем статические файлы из папки public
app.use(express.static('public'));

// Начальный массив товаров (Porsche)
let products = [
    { id: 1, name: 'Porsche GT3RS', price: 750000 },
    { id: 2, name: 'Porsche 911', price: 350000 },
    { id: 3, name: 'Porsche Macan', price: 225000 },
    { id: 4, name: 'Porsche Panamera', price: 200000 },
    { id: 5, name: 'Porsche Cayenne', price: 250000 },
];

// ============== API Routes ==============

// Получить все товары
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Получить товар по id
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    res.json(product);
});

// Добавить новый товар
app.post('/api/products', (req, res) => {
    const { name, price } = req.body;
    
    if (!name || !price) {
        return res.status(400).json({ message: 'Необходимо указать название и стоимость' });
    }
    
    const newProduct = {
        id: Date.now(),
        name,
        price: Number(price)
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// Обновить товар
app.patch('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    
    if (!product) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    const { name, price } = req.body;
    
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = Number(price);
    
    res.json(product);
});

// Удалить товар
app.delete('/api/products/:id', (req, res) => {
    const productIndex = products.findIndex(p => p.id == req.params.id);
    
    if (productIndex === -1) {
        return res.status(404).json({ message: 'Товар не найден' });
    }
    
    products.splice(productIndex, 1);
    res.json({ message: 'Товар успешно удален' });
});

// Запуск сервера
app.listen(port, () => {
    console.log(` Сервер запущен на http://localhost:${port}`);
    console.log(` API доступно по адресу http://localhost:${port}/api/products`);
    console.log(` Интерфейс доступен по адресу http://localhost:${port}`);
});