const CACHE_NAME = 'deepseek-coder-v1';
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
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});
