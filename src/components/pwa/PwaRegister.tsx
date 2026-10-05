"use client";

import { useEffect } from "react";
import { initInstallCapture, isDesktopApp } from "@/lib/pwa/client";

/**
 * Mounted only on panels hosts (the app), never on a website. Registers the service worker, keeps it fresh, captures the
 * browser's install prompt, and clears the home-screen badge when the app is opened.
 */
export default function PwaRegister() {
  useEffect(() => {
    // The desktop app is its own app: no service worker, no install prompt.
    if (isDesktopApp()) return;
    initInstallCapture();
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        if (cancelled) return;
        // Check for a new version whenever the app comes back to the foreground.
        const check = () => document.visibilityState === "visible" && reg.update().catch(() => {});
        document.addEventListener("visibilitychange", check);
        reg.addEventListener("updatefound", () => {
          const next = reg.installing;
          next?.addEventListener("statechange", () => {
            if (next.state === "installed" && navigator.serviceWorker.controller) next.postMessage("SKIP_WAITING");
          });
        });
      })
      .catch(() => {});

    const clearBadge = () => {
      if (document.visibilityState === "visible") (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.().catch(() => {});
    };
    clearBadge();
    document.addEventListener("visibilitychange", clearBadge);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", clearBadge);
    };
  }, []);
  return null;
}
