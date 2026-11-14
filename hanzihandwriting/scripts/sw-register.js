// 服务注册：PWA 离线缓存
if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}