/* 小公主迷宫 Service Worker：静态资源离线缓存 */
const VERSION = 'v1';
const CACHE = 'princess-maze-' + VERSION;

const ASSETS = [
  './',
  './index.html',
  './site.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './css/base.css',
  './css/controls.css',
  './css/hud.css',
  './css/layout.css',
  './css/overlay.css',
  './js/main.js',
  './js/app.js',
  './js/config.js',
  './js/geometry/geometry.js',
  './js/geometry/intersect.js',
  './js/hero/hero.js',
  './js/hero/princess.js',
  './js/input/collision.js',
  './js/input/pointer.js',
  './js/input/route.js',
  './js/input/stroke.js',
  './js/maze/cell.js',
  './js/maze/generator.js',
  './js/maze/walls.js',
  './js/render/drawDecor.js',
  './js/render/drawMaze.js',
  './js/render/drawPath.js',
  './js/render/renderer.js',
  './js/render/theme.js',
  './js/ui/controls.js',
  './js/ui/hud.js',
  './js/ui/win.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 页面导航：网络优先，离线时回退缓存，保证上线后能拿到新版本
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 其余静态资源：缓存优先
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
      }
      return res;
    }))
  );
});