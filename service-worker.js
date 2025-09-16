const CACHE_NAME = 'deepseek-coder-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/themes.css',
    '/js/app.js',
    '/js/fileHandler.js',
    '/js/githubApi.js',
    '/js/ui.js',
    '/js/storage.js',
    '/lib/prism.js',
    '/lib/prism.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .catch(error => console.log('Cache installation failed:', error))
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('api.deepseek.com')) {
        // Не кэшируем API запросы
        return fetch(event.request);
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch(() => {
                    // Возвращаем fallback для основных файлов
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
