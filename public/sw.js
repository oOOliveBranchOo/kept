const CACHE = "kept-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS).catch(function () {});
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (/firebase|googleapis|gstatic|google\.com/.test(url.hostname)) return;

  var isAppShell =
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/kept/") ||
    url.pathname.endsWith("/kept");

  if (isAppShell) {
    e.respondWith(
      fetch(e.request, { cache: "no-store" }).catch(function () {
        return caches.match(e.request);
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var fetched = fetch(e.request).then(function (res) {
        if (res && res.status === 200 && e.request.url.startsWith(self.location.origin)) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || fetched;
    })
  );
});
