const CACHE_NAME = "mqulima-cache-v4";
const ASSETS_TO_CACHE = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass intercepting in local development mode to avoid Vite HMR / hot-reload conflicts
  if (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1") {
    return;
  }

  // Avoid intercepting non-GET requests, non-http/https protocols, or DevTools only-if-cached cross-origin probes
  if (
    event.request.method !== "GET" ||
    !url.protocol.startsWith("http") ||
    (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin")
  ) {
    return;
  }

  // Bypass API endpoints, server functions, authentication, account/checkout routes, and admin panels
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_server/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/admin/") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/payments") ||
    url.searchParams.has("_t")
  ) {
    return;
  }

  // Network-First for HTML navigation/page requests (so they get fresh content when online, fallback to cache when offline)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh page
          if (response.status === 200) {
            const responseCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseCopy);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try the cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback for navigation requests if nothing is cached
            return caches.match("/");
          });
        }),
    );
    return;
  }

  // Only handle Cache-First for true static assets; never intercept document/prefetch/route fetches as assets
  const isStaticAsset =
    ["style", "script", "image", "font", "manifest"].includes(event.request.destination) ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(?:js|mjs|css|png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|eot|webmanifest)(\?.*)?$/i.test(
      url.pathname,
    );

  if (!isStaticAsset) {
    return;
  }

  // Cache-First for static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Cache static assets dynamically if they are from our origin
          if (response.status === 200 && url.origin === self.location.origin) {
            const responseCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseCopy);
            });
          }
          return response;
        })
        .catch((error) => {
          if (error && error.name !== "AbortError") {
            console.warn("Service worker fetch failed for asset:", event.request.url, error);
          }
          if (self.navigator && self.navigator.onLine === false) {
            return new Response("Asset not available offline", {
              status: 503,
              statusText: "Service Unavailable",
              headers: { "Content-Type": "text/plain" },
            });
          }
          return Response.error();
        });
    }),
  );
});

// Push notification event listener
self.addEventListener("push", (event) => {
  let data = { title: "Mqulima Alert", body: "New farming updates are available for your area!" };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Mqulima Alert", body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1",
    },
    actions: [
      { action: "explore", title: "Open Mqulima" },
      { action: "close", title: "Close" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event listener
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    }),
  );
});
