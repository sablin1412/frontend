const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(cors({ origin: "http://localhost:3001" }));
app.use(express.json());

// Наша база клавиатур
let products = [
    { id: nanoid(6), name: 'Keychron K2', category: 'Mechanical', description: '75% компактная механика.', price: 99, stock: 15, rating: 4.8, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80' },
    { id: nanoid(6), name: 'Logitech MX Keys', category: 'Office', description: 'Для офиса и кодинга.', price: 120, stock: 40, rating: 4.7, image: 'https://static-sl.insales.ru/files/1/6352/16996560/original/custom-cover-1.png' },
    { id: nanoid(6), name: 'Razer BlackWidow', category: 'Gaming', description: 'RGB и зеленые свичи.', price: 140, stock: 10, rating: 4.5, image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80' },
    { id: nanoid(6), name: 'Anne Pro 2', category: 'Compact', description: '60% с Bluetooth.', price: 89, stock: 25, rating: 4.6, image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80' },
    { id: nanoid(6), name: 'Custom Tofu65', category: 'Custom', description: 'Алюминиевый корпус.', price: 250, stock: 5, rating: 5.0, image: 'https://www.clife.ru/upload/medialibrary/e20/vavmilo_panda_5.jpg' },
    { id: nanoid(6), name: 'Ducky One 3', category: 'Mechanical', description: 'Яркий дизайн Daybreak.', price: 110, stock: 12, rating: 4.8, image: 'https://cubiq.ru/wp-content/uploads/2023/07/gmng-gg-kb505xw.jpg' },
    { id: nanoid(6), name: 'NuPhy Air75', category: 'Low Profile', description: 'Ультратонкая.', price: 130, stock: 20, rating: 4.7, image: 'https://gagadget.com/media/uploads/03/30/56115-1553976960.jpeg' },
    { id: nanoid(6), name: 'HyperX Alloy', category: 'Gaming', description: 'Красные свичи.', price: 100, stock: 30, rating: 4.7, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqcGdWrtTNypHdfuJL4YsCxkbYKxdVxrFHRQ&s' },
    { id: nanoid(6), name: 'Akko 3068B', category: 'Mechanical', description: 'Винтажный дизайн.', price: 95, stock: 18, rating: 4.5, image: 'https://smartzone74.ru/uploadedFiles/eshopimages/big/Screenshot_1144.jpg' },
    { id: nanoid(6), name: 'CyberBoard R3', category: 'Premium', description: 'LED экран.', price: 500, stock: 2, rating: 5.0, image: 'https://cubiq.ru/wp-content/uploads/2026/01/10-1.jpg' }
];

// НОВЫЙ СПОСОБ: Описываем Swagger обычным JS объектом (Без багов с пробелами!)
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'API Магазина Клавиатур',
        version: '1.0.0',
        description: 'Документация CRUD операций (Без YAML)'
    },
    servers: [{ url: `http://localhost:${port}` }],
    paths: {
        '/api/products': {
            get: {
                summary: 'Получить все товары',
                tags: ['Products'],
                responses: { '200': { description: 'Успешный ответ со списком клавиатур' } }
            },
            post: {
                summary: 'Добавить новый товар',
                tags: ['Products'],
                responses: { '201': { description: 'Товар успешно создан' } }
            }
        },
        '/api/products/{id}': {
            get: {
                summary: 'Получить товар по ID',
                tags: ['Products'],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { '200': { description: 'Данные товара' }, '404': { description: 'Не найдено' } }
            },
            patch: {
                summary: 'Обновить товар',
                tags: ['Products'],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { '200': { description: 'Успешно обновлено' } }
            },
            delete: {
                summary: 'Удалить товар',
                tags: ['Products'],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { '204': { description: 'Успешно удалено' } }
            }
        }
    }
};

// Подключаем наш JS объект к Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- CRUD ОПЕРАЦИИ ---

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock, image } = req.body;
    const newProduct = {
        id: nanoid(6),
        name,
        category,
        description,
        price: Number(price),
        stock: Number(stock),
        rating: 0,
        image: image || 'https://via.placeholder.com/400x300?text=No+Image'
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(u => u.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Товар не найден" });
    res.json(product);
});

app.patch('/api/products/:id', (req, res) => {
    const product = products.find(u => u.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });

    const { name, category, description, price, stock, image } = req.body;
    if (name) product.name = name;
    if (category) product.category = category;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (stock) product.stock = Number(stock);
    if (image) product.image = image;

    res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
    products = products.filter(u => u.id !== req.params.id);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Сервер магазина запущен на http://localhost:${port}`);
    console.log(`Swagger работает на http://localhost:${port}/api-docs`);
});