const CACHE_NAME = "spotsy-discgolf-pages-v2";

function scopedUrl(path = "") {
  return new URL(path, self.registration.scope).toString();
}

self.addEventListener("install", (event) => {
  const assets = [scopedUrl(), scopedUrl("index.html"), scopedUrl("manifest.json")];
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(assets)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("firestore") ||
    event.request.url.includes("googleapis")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

self.addEventListener("push", (event) => {
  const data = event.data
    ? event.data.json()
    : { title: "Spotsy Disc Golf", body: "New casual round posted!" };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
    }),
  );
});
