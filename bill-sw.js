const CACHE_NAME = 'fss-billing-v2';
const CORE_ASSETS = [
  'bill.html',
  'bill-history.html',
  'dashboard.html',
  'assets/images/site-logo.jpg',
  'assets/js/html2canvas.min.js',
  'assets/js/jspdf.umd.min.js',
  'assets/js/chart.umd.min.js',
  'assets/fonts/poppins.css',
  'assets/fonts/poppins-400.woff2',
  'assets/fonts/poppins-500.woff2',
  'assets/fonts/poppins-600.woff2',
  'assets/fonts/poppins-700.woff2',
  'assets/fonts/poppins-800.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // let CDN/font requests pass through as-is

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
