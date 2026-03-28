const CACHE_NAME = 'venols-erp-v1'

// Recursos del app shell que se cachean al instalar
const APP_SHELL = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/favicon.png',
  '/logo-final-3.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// Instalar: pre-cachear el app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

// Activar: limpiar caches viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: estrategia por tipo de request
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // API calls → Network first, sin cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: 'Sin conexión' }), { headers: { 'Content-Type': 'application/json' } })))
    return
  }

  // Recursos estáticos (_next/static) → Cache first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        return res
      }))
    )
    return
  }

  // Páginas → Network first, fallback a cache
  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return res
      })
      .catch(() => caches.match(request))
  )
})
