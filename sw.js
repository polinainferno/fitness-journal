// Service Worker для офлайн-работы

const CACHE_NAME = 'fitness-journal-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/themes.css',
    '/css/components.css',
    '/js/app.js',
    '/js/db.js',
    '/js/utils.js',
    '/js/onboarding.js',
    '/js/exercises.js',
    '/js/calendar.js',
    '/js/recommendations.js',
    '/js/progress.js',
    '/js/profile.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Установка Service Worker — кэшируем файлы
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Кэширование файлов');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Ошибка кэширования:', error);
            })
    );
});

// Активация — удаляем старые кэши
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Перехват запросов — отдаём из кэша или из сети
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Если файл есть в кэше — отдаём его
                if (response) {
                    return response;
                }
                // Если нет — идём в сеть
                return fetch(event.request);
            })
            .catch((error) => {
                console.error('Ошибка загрузки:', error);
            })
    );
});