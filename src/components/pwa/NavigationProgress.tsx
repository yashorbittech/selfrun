"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A thin progress bar at the top of the window that starts the moment a link to another page of the app is clicked and ends when the
 * new page has arrived. Without it a click on a menu item shows nothing until the server has answered, and people click again.
 * Panels hosts only (mounted from the root layout there). Pure client, no data; gives up after 15 s so it can never stick.
 */
function Bar() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [pending, setPending] = useState(false);
  const [label, setLabel] = useState("");

  // A new location arrived: done.
  useEffect(() => setPending(false), [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setLabel((a.getAttribute("aria-label") || a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 28));
      setPending(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setPending(false), 15000);
    return () => clearTimeout(t);
  }, [pending]);

  // The page answers the click at once, before the server has said anything: a bar along the top and a pill that says the next page is
  // on its way (the pill fades in after a moment, so quick navigations stay clean).
  if (!pending) return null;
  return (
    <>
      <div aria-hidden className="app-nav-bar">
        <div className="app-nav-bar-fill" />
      </div>
      <div role="status" aria-live="polite" className="app-nav-pill">
        <span className="app-nav-spin" aria-hidden />
        {label ? `Opening ${label}…` : "Opening…"}
      </div>
    </>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
