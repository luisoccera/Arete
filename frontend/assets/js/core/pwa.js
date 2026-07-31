"use strict";

let serviceWorkerRefreshing = false;

async function registerAreteServiceWorker() {
  if (!("serviceWorker" in navigator) || !["http:", "https:"].includes(window.location.protocol)) {
    return;
  }
  try {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (serviceWorkerRefreshing) {
        return;
      }
      serviceWorkerRefreshing = true;
      window.location.reload();
    });
    await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
  } catch (error) {
    console.warn("No se pudo registrar la cache local:", error);
  }
}

void registerAreteServiceWorker();
