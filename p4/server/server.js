const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt'); // Для хеширования паролей [cite: 1756]
const jwt = require('jsonwebtoken'); // Для токенов [cite: 2207]
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(cors({ origin: "http://localhost:3001" }));
app.use(express.json());

// Секретный ключ для подписи токенов и время их жизни [cite: 2211-2214]
const JWT_SECRET = "super_secret_keyboard_key";
const ACCESS_EXPIRES_IN = "1h";

// База данных пользователей
let users = [];

// База данных клавиатур
// База данных клавиатур
let products = [
    { id: nanoid(6), name: 'Keychron K2', description: '75% компактная беспроводная механика.', price: 99, stock: 15, rating: 4.8, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80' },
    { id: nanoid(6), name: 'Logitech MX Keys', description: 'Идеальная для офиса и кодинга.', price: 120, stock: 40, rating: 4.7, image: 'https://cs8.pikabu.ru/post_img/big/2018/04/16/6/1523871530172953311.png' },
    { id: nanoid(6), name: 'Razer BlackWidow', description: 'RGB подсветка и зеленые свичи.', price: 140, stock: 10, rating: 4.5, image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80' },
    { id: nanoid(6), name: 'Anne Pro 2', description: '60% клавиатура с Bluetooth.', price: 89, stock: 25, rating: 4.6, image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80' },
    { id: nanoid(6), name: 'Custom Tofu65', description: 'Алюминиевый корпус, смазанные свичи.', price: 250, stock: 5, rating: 5.0, image: 'https://www.clife.ru/upload/medialibrary/e20/vavmilo_panda_5.jpg' },
    { id: nanoid(6), name: 'Ducky One 3', description: 'Яркий дизайн Daybreak.', price: 110, stock: 12, rating: 4.8, image: 'https://c.dns-shop.ru/thumb/st1/fit/760/600/acaa6ab4bf32e6c4f4e47cdefd0f77af/q93_80094218430a68fef24f13248249c4646919701e2d2673efe12ec49e32449feb.jpg' },
    { id: nanoid(6), name: 'NuPhy Air75', description: 'Ультратонкая механика.', price: 130, stock: 20, rating: 4.7, image: 'https://cubiq.ru/wp-content/uploads/2023/07/gmng-gg-kb505xw.jpg' },
    { id: nanoid(6), name: 'HyperX Alloy', description: 'Красные линейные переключатели.', price: 100, stock: 30, rating: 4.7, image: 'https://cdn.prod.website-files.com/65f1868446603b58c3d61088/6936e052f0928a67348562b2_1.webp' },
    { id: nanoid(6), name: 'Akko 3068B', description: 'Винтажный дизайн, PBT кейкапы.', price: 95, stock: 18, rating: 4.5, image: 'https://cdn.prod.website-files.com/65f1868446603b58c3d61080/6934572207251499f3e3cb0f_Frame%202136139239.webp' },
    { id: nanoid(6), name: 'CyberBoard R3', description: 'LED экран и беспроводная зарядка.', price: 500, stock: 2, rating: 5.0, image: 'https://cdn.prod.website-files.com/65f1868446603b58c3d61080/66586a9dbdde40d6ae4272cd_KD___LUN%20(6).webp' }
];

// ==========================================
// MIDDLEWARE ДЛЯ ПРОВЕРКИ ТОКЕНА [cite: 2351]
// ==========================================
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" "); // Ожидаем формат Bearer <token> [cite: 2354]

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Отсутствует или неверен Authorization header" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET); // Валидируем токен [cite: 2362]
        req.user = payload; 
        next();
    } catch (err) {
        return res.status(401).json({ error: "Токен недействителен или истек" });
    }
}

// ==========================================
// МАРШРУТЫ АВТОРИЗАЦИИ (Практика 7 и 8)
// ==========================================

// 1. Регистрация [cite: 2116]
app.post("/api/auth/register", async (req, res) => {
    // В качестве логина используем email [cite: 2123]
    const { email, first_name, last_name, password } = req.body;

    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }

    const exists = users.find(u => u.email === email);
    if (exists) return res.status(400).json({ error: "Пользователь с таким email уже существует" });

    // Хешируем пароль (10 раундов соли) [cite: 1760]
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
        id: nanoid(6),
        email,
        first_name,
        last_name,
        password: passwordHash // Сохраняем только хеш! [cite: 1726]
    };

    users.push(newUser);
    res.status(201).json({ id: newUser.id, email: newUser.email, message: "Пользователь зарегистрирован" });
});

// 2. Вход (Логин) [cite: 2116]
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: "Введите email и пароль" });

    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: "Неверные учетные данные" });

    // Сравниваем введенный пароль с хешем из БД [cite: 1773]
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Неверные учетные данные" });

    // Выдаем токен [cite: 2254]
    const accessToken = jwt.sign(
        { sub: user.id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: ACCESS_EXPIRES_IN }
    );

    res.status(200).json({ accessToken });
});

// 3. Получение текущего пользователя (Защищенный маршрут) [cite: 2525]
app.get("/api/auth/me", authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    res.json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name });
});

// ==========================================
// МАРШРУТЫ ТОВАРОВ (CRUD) [cite: 2116]
// ==========================================

// Публичные маршруты
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock, image } = req.body;
    const newProduct = {
        id: nanoid(6), name, category, description, price: Number(price), stock: Number(stock), rating: 0, image
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// ЗАЩИЩЕННЫЕ МАРШРУТЫ ТОВАРОВ 
// Теперь для их выполнения нужен токен!
app.get('/api/products/:id', authMiddleware, (req, res) => {
    const product = products.find(u => u.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Не найдено" });
    res.json(product);
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
    const product = products.find(u => u.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Не найдено" });

    const { name, category, description, price, stock, image } = req.body;
    if (name) product.name = name;
    if (category) product.category = category;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (stock) product.stock = Number(stock);
    if (image) product.image = image;

    res.json(product);
});

// Добавим и PATCH для совместимости с нашим старым React-фронтендом
app.patch('/api/products/:id', authMiddleware, (req, res) => {
    const product = products.find(u => u.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Не найдено" });
    Object.assign(product, req.body);
    res.json(product);
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
    products = products.filter(u => u.id !== req.params.id);
    res.status(204).send();
});

// ==========================================
// SWAGGER ДОКУМЕНТАЦИЯ
// ==========================================
const swaggerDocument = {
    openapi: '3.0.0',
    info: { title: 'API Магазина (Auth + JWT)', version: '1.0.0' },
    servers: [{ url: `http://localhost:${port}` }],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
        }
    },
    paths: {
        '/api/auth/register': {
            post: {
                summary: 'Регистрация', tags: ['Auth'],
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, first_name: { type: 'string' }, last_name: { type: 'string' }, password: { type: 'string' } } } } } },
                responses: { '201': { description: 'Успешно' } }
            }
        },
        '/api/auth/login': {
            post: {
                summary: 'Вход', tags: ['Auth'],
                requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
                responses: { '200': { description: 'Выдает accessToken' } }
            }
        },
        '/api/auth/me': {
            get: {
                summary: 'Профиль', tags: ['Auth'], security: [{ bearerAuth: [] }],
                responses: { '200': { description: 'Данные юзера' } }
            }
        },
        '/api/products': {
            get: { summary: 'Все товары', tags: ['Products'], responses: { '200': { description: 'Успех' } } }
        },
        '/api/products/{id}': {
            get: { summary: 'Товар по ID', tags: ['Products'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Успех' } } },
            put: { summary: 'Обновить товар', tags: ['Products'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Успех' } } },
            delete: { summary: 'Удалить товар', tags: ['Products'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Успех' } } }
        }
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}`);
    console.log(`Swagger: http://localhost:${port}/api-docs`);
});