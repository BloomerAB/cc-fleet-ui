const CACHE_NAME = "claude-platform-v1"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["/", "/icon.svg"])
    ).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  // Only cache GET requests for same-origin static assets
  if (event.request.method !== "GET") return
  const url = new URL(event.request.url)
  // Don't cache API or WebSocket requests
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/ws/") || url.pathname.startsWith("/auth/")) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response.ok && url.pathname.startsWith("/assets/")) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        // Offline fallback: serve from cache or return the app shell
        caches.match(event.request).then((cached) => cached || caches.match("/"))
      )
  )
})

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "Claude Code Fleet", body: "Notification" }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(self.clients.claim().then(() => self.clients.openWindow("/")))
})
