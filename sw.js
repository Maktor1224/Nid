// Service worker : met l'appli en cache pour qu'elle s'ouvre sans connexion.
var CACHE = 'nid-v2';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'config.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Cache d'abord (rapide, hors ligne), puis mise à jour en arrière-plan pour la prochaine ouverture.
self.addEventListener('fetch', function (e) {
  var r = e.request;
  var u = new URL(r.url);
  var ok = u.origin === location.origin || (u.origin === 'https://www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0);
  if (r.method !== 'GET' || !ok) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(r).then(function (hit) {
      var net = fetch(r).then(function (res) { if (res.ok) c.put(r, res.clone()); return res; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
