// ВАЖНО: Мы поменяли версию кэша на v2, чтобы браузер понял, что файлы обновились!
const CACHE_NAME = 'todo-cache-v4'; 

const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',           // Добавили манифест
    '/icons/icon-192x192.png',  // Добавили иконки
    '/icons/icon-256x256.png',
    '/icons/icon-512x512.png',
    'https://unpkg.com/chota@latest'
];
// ... дальше оставь код Service Worker без изменений (события install, activate, fetch)

// Этап 1: Установка (сохраняем файлы в кэш)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Этап 2: Активация (чистим старые кэши, если обновилась версия)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

// Этап 3: Перехват запросов (отдаем из кэша, если нет интернета)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});