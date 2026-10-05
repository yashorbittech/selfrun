/* Service worker of the installed app (panels hosts only; the website never registers it).
 *
 *  - Offline: a navigation that fails shows /offline.html. Nothing about a signed-in session is ever cached: pages and API
 *    responses always come from the network, so a shared device never shows the previous person's data.
 *  - Speed: immutable build files (/_next/static/) and the app icons are cached.
 *  - Push: shows notifications, opens the right page on tap, and re-subscribes if the browser rotates the subscription.
 */
const VERSION = "v1";
const STATIC_CACHE = `app-static-${VERSION}`;
const SHELL_CACHE = `app-shell-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.add(new Request(OFFLINE_URL, { cache: "reload" }))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== STATIC_CACHE && key !== SHELL_CACHE) await caches.delete(key);
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
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
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network only; the offline page when the network is down.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return (await event.preloadResponse) || (await fetch(req));
        } catch {
          return (await (await caches.open(SHELL_CACHE)).match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
    return;
  }

  // Immutable build output: cache first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // App icons: stale while revalidate.
  if (url.pathname.startsWith("/pwa/icons/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const refresh = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || refresh;
      }),
    );
  }
  // Everything else (API calls, RSC payloads, uploads) goes straight to the network, uncached.
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "New notification", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "New notification";
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, {
        body: data.body || "",
        icon: "/pwa/icons/192.png",
        badge: "/pwa/icons/96.png",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        data: { url: data.url || "/workspace/notifications", category: data.category || null },
        requireInteraction: data.category === "alerts",
      });
      // A dot on the home-screen icon until the app is opened (where supported).
      if (self.navigator && self.navigator.setAppBadge) await self.navigator.setAppBadge().catch(() => {});
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = (event.notification.data && event.notification.data.url) || "/workspace/notifications";
  // Same-site paths only.
  const target = new URL(raw.startsWith("/") && !raw.startsWith("//") ? raw : "/workspace/notifications", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of windows) {
        if (new URL(w.url).origin === self.location.origin) {
          await w.focus();
          if ("navigate" in w) await w.navigate(target).catch(() => {});
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});

// The browser rotated the subscription: get a new one and tell the server (the session cookie rides along).
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cfg = await (await fetch("/api/push/config", { credentials: "same-origin" })).json();
        if (!cfg.enabled || !cfg.publicKey) return;
        const pad = "=".repeat((4 - (cfg.publicKey.length % 4)) % 4);
        const raw = atob((cfg.publicKey + pad).replace(/-/g, "+").replace(/_/g, "/"));
        const key = Uint8Array.from(raw, (c) => c.charCodeAt(0));
        const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        await fetch("/api/push/subscribe", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      } catch {
        /* the person can turn notifications on again from Notification settings */
      }
    })(),
  );
});
