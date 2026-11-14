const CACHE = "hanzi-handwriting-v1";
// 仅缓存自身 HTML / 图标 / manifest；第三方 CDN 资源走网络（更新备差）
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // 仅拦截同源请求，CDN(googlefonts/jsdelivr) 走网络策略并缓存成功后副本
  if (url.origin !== self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((hit) =>
        fetch(e.request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, copy));
            }
            return res;
          })
          .catch(() => hit)
      )
    );
    return;
  }
  // 同源页面走优先网络、兜底缓存（保证更新）；图标走优先缓存
  const isIcon = url.pathname.endsWith(".png");
  e.respondWith(
    (isIcon ? Promise.resolve(caches.match(e.request)) : Promise.resolve(null)).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request));
    })
  );
});