const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

app.use(cors({ origin: "http://localhost:3001" }));
app.use(express.json());

const JWT_SECRET = "super_secret_keyboard_key";
const REFRESH_SECRET = "super_secret_refresh_key";
const ACCESS_EXPIRES_IN = "15s";
const REFRESH_EXPIRES_IN = "7d";

// База пользователей (сразу с ролями для удобства проверки) [cite: 419]
let users = [
    { id: '1', email: 'admin@test.ru', first_name: 'Шеф', last_name: 'Админов', password: bcrypt.hashSync('123', 10), role: 'admin' },
    { id: '2', email: 'seller@test.ru', first_name: 'Олег', last_name: 'Продавец', password: bcrypt.hashSync('123', 10), role: 'seller' },
    { id: '3', email: 'user@test.ru', first_name: 'Иван', last_name: 'Покупатель', password: bcrypt.hashSync('123', 10), role: 'user' }
];
const refreshTokens = new Set();

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

// Генерация токенов (теперь включает role) 
function generateAccessToken(user) {
    return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}
function generateRefreshToken(user) {
    return jwt.sign({ sub: user.id, email: user.email, role: user.role }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

// Проверка авторизации [cite: 449-467]
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "Нет доступа" });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) { return res.status(401).json({ error: "Токен недействителен" }); }
}

// Проверка ролей 
function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Вам запрещен доступ к этому действию (Forbidden)" });
        }
        next();
    };
}

// --- МАРШРУТЫ АВТОРИЗАЦИИ (Гость) --- [cite: 772]
app.post("/api/auth/register", async (req, res) => {
    const { email, first_name, last_name, password } = req.body;
    if (users.find(u => u.email === email)) return res.status(400).json({ error: "Пользователь уже есть" });
    const newUser = { id: nanoid(6), email, first_name, last_name, password: await bcrypt.hash(password, 10), role: 'user' }; // По умолчанию user [cite: 496]
    users.push(newUser);
    res.status(201).json({ id: newUser.id, email: newUser.email, role: newUser.role });
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: "Неверные данные" });
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);
    res.json({ accessToken, refreshToken });
});

app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken || !refreshTokens.has(refreshToken)) return res.status(401).json({ error: "Недействительный токен" });
    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find(u => u.id === payload.sub);
        refreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);
        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) { res.status(401).json({ error: "Токен истек" }); }
});

app.get("/api/auth/me", authMiddleware, (req, res) => { // Пользователь [cite: 772]
    const user = users.find(u => u.id === req.user.sub);
    res.json({ id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role });
});

// --- МАРШРУТЫ ПОЛЬЗОВАТЕЛЕЙ (Только Админ) --- [cite: 772-773, 776]
app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => res.json(users.map(u => ({ id: u.id, email: u.email, first_name: u.first_name, role: u.role }))));
app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => res.json(users.find(u => u.id === req.params.id)));
app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({error: "Не найдено"});
    Object.assign(user, { role: req.body.role || user.role });
    res.json(user);
});
app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    users = users.filter(u => u.id !== req.params.id);
    res.status(204).send();
});

// --- МАРШРУТЫ ТОВАРОВ --- [cite: 773]
app.get('/api/products', (req, res) => res.json(products)); // Все
app.get('/api/products/:id', (req, res) => res.json(products.find(u => u.id === req.params.id))); // Все

// Продавец и Админ [cite: 770, 773]
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const newProduct = { id: nanoid(6), ...req.body, price: Number(req.body.price), stock: Number(req.body.stock) };
    products.push(newProduct);
    res.status(201).json(newProduct);
});
app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const product = products.find(u => u.id === req.params.id);
    Object.assign(product, req.body);
    res.json(product);
});

// Только Админ [cite: 773]
app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    products = products.filter(u => u.id !== req.params.id);
    res.status(204).send();
});

app.listen(port, () => console.log(`Сервер запущен: http://localhost:${port}`));