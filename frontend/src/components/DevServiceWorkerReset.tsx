"use client";

import { useEffect } from "react";

const DEV_CACHE_PREFIXES = ["string-tracker-static-"];

function isDevHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function DevServiceWorkerReset() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!("serviceWorker" in navigator) || !("caches" in window)) return;
    if (!isDevHost(window.location.hostname)) return;

    const reset = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      const cacheKeys = await caches.keys();
      const targets = cacheKeys.filter((key) =>
        DEV_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))
      );
      await Promise.all(targets.map((key) => caches.delete(key)));
    };

    void reset();
  }, []);

  return null;
}
