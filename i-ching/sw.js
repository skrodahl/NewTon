/* ORACULON CT-64 — service worker.
   Precache the whole app shell so the device works fully offline once installed.

   DEPLOY CHECKLIST when any of css/oraculon.css, js/oraculon.js, or fonts/fonts.css
   changes: bump THREE numbers in lockstep so installed PWAs pick up the new code
   on the next refresh:
     1. CACHE below (e.g. "oraculon-v3" → "oraculon-v4")
     2. SHELL ?v=N suffixes on the three versioned files (must match index.html)
     3. ?v=N on the matching <link>/<script> tags in index.html
   The query strings force HTTP-layer cache miss; the CACHE bump invalidates
   the SW cache and drops the old cache on activate (skipWaiting + clients.claim
   make the new SW take control immediately). Belt-and-suspenders. */
"use strict";

const CACHE = "oraculon-v34";

const SHELL = [
  "./index.html",
  "./css/oraculon.css?v=34",
  "./js/oraculon.js?v=34",
  "./manifest.webmanifest",
  "./fonts/fonts.css?v=34",
  "./fonts/XLYgIZbkc4JPUL5CVArUVL0ntn4OSFNuQsI3GA.woff2",
  "./fonts/XLYgIZbkc4JPUL5CVArUVL0ntnAOSFNuQsI.woff2",
  "./fonts/m8JUjfVPf62XiF7kO-i9aAhAfmKi2PmeBvYdbA.woff2",
  "./fonts/m8JUjfVPf62XiF7kO-i9aAhAfmyi2PmeBvY.woff2",
  "./fonts/m8JXjfVPf62XiF7kO-i9YL1la0GA1dOkDw.woff2",
  "./fonts/m8JXjfVPf62XiF7kO-i9YLNla0GA1dM.woff2",
  "./fonts/pxiKyp0ihIEF2isQFJXUdVNFKPY.woff2",
  "./fonts/pxiKyp0ihIEF2isRFJXUdVNFKPY.woff2",
  "./fonts/pxiKyp0ihIEF2isfFJXUdVNF.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon-180.png"
];

// Precache the shell. addAll is atomic — if any file 404s the install fails,
// which is what we want (a broken cache is worse than no cache).
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Drop any cache that isn't the current version, then take control immediately.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Same-origin GET: cache-first, falling back to network (and caching what we fetch).
// Navigations that fail offline fall back to the cached calculator page.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        // only cache full, basic (same-origin) 200s
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        if (req.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
