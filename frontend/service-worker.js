"use strict";

const CACHE_NAME = "arete-shell-v11-appwrite";
const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/css/main.css",
  "./assets/icons/arete-icon-192.png",
  "./assets/icons/arete-icon-512.png",
  "./assets/js/config/runtime-config.js",
  "./assets/js/config/constants.js",
  "./assets/js/core/helpers.js",
  "./assets/js/services/appwrite-client.js",
  "./assets/js/core/pwa.js",
  "./assets/js/data/state-models.js",
  "./assets/js/features/navigation.js",
  "./assets/js/features/events.js",
  "./assets/js/render/render.js",
  "./assets/js/features/patient-actions.js",
  "./assets/js/pdf/clinical-pdf.js",
  "./assets/js/bootstrap.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok && url.origin === self.location.origin) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request))
  );
});
