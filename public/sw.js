/* ─────────────────────────────────────────────────────────
   BEAST ARENA — Service Worker
   Caching commercial-standard para carregamento instantâneo.

   Estratégia:
   • Navegação (HTML): network-first → cai no shell em cache se offline.
   • Assets com hash (js/css/imagens/fontes): cache-first (imutáveis —
     o Vite troca o nome do arquivo quando o conteúdo muda, então nunca
     servimos algo desatualizado).
   Suba o VERSION para invalidar todos os caches antigos.
───────────────────────────────────────────────────────── */
const VERSION = "beast-arena-v2";
const STATIC_CACHE = `${VERSION}-static`;

const ASSET_RE = /\.(?:js|css|png|jpe?g|svg|webp|gif|woff2?|ttf|otf|ico)$/i;

self.addEventListener("install", () => {
  // Ativa imediatamente a nova versão.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  // Só lidamos com same-origin; APIs externas (Supabase etc.) seguem direto.
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }
  if (ASSET_RE.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function networkFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (
      (await cache.match(req)) ||
      (await cache.match("/index.html")) ||
      (await cache.match("/")) ||
      Response.error()
    );
  }
}
