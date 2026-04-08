const CACHE_NAME = 'app-shell-v2';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v2';

// Статика, которая нужна для запуска каркаса
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    'https://unpkg.com/chota@latest'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME).map(key => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) return; // Пропускаем внешние скрипты

    // Стратегия: Network First (Сначала сеть, потом кэш) для динамических страниц в папке content/
    if (url.pathname.startsWith('/content/')) {
        event.respondWith(
            fetch(event.request).then(networkRes => {
                const resClone = networkRes.clone();
                caches.open(DYNAMIC_CACHE_NAME).then(cache => cache.put(event.request, resClone));
                return networkRes;
            }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/content/home.html')))
        );
        return;
    }

    // Стратегия: Cache First (Сначала кэш) для статического каркаса (App Shell)
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});
self.addEventListener('push', (event) => {
    let data = { title: 'Новое уведомление', body: '', reminderId: null };
    if (event.data) { data = event.data.json(); }
    
    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        data: { reminderId: data.reminderId }
    };

    // Если это именно напоминание по времени, добавляем кнопку Snooze
    if (data.reminderId) {
        options.actions = [
            { action: 'snooze', title: 'Отложить на 5 минут' }
        ];
    }
    
    event.waitUntil(self.registration.showNotification(data.title, options));
});

// Обработчик клика по уведомлению или кнопкам
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;

    if (action === 'snooze') {
        const reminderId = notification.data.reminderId;
        event.waitUntil(
            fetch(`http://localhost:3001/snooze?reminderId=${reminderId}`, { method: 'POST' })
            .then(() => notification.close())
            .catch(err => console.error('Snooze failed:', err))
        );
    } else {
        notification.close();
    }
});