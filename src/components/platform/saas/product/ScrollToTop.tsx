"use client";

import { useEffect } from "react";

const FLAG = "sr-product-hop";

/**
 * Moving between products (sidebar, previous/next) skips the hero banner and lands on the section menu.
 * Arriving from anywhere else, such as the products listing, shows the page from the top, hero included.
 */
export default function ScrollToTop({ pageKey }: { pageKey: string }) {
  useEffect(() => {
    const mark = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("a[data-product-link]")) {
        try { sessionStorage.setItem(FLAG, "1"); } catch { /* storage blocked: the hero simply shows */ }
      }
    };
    document.addEventListener("click", mark, true);
    return () => document.removeEventListener("click", mark, true);
  }, []);

  useEffect(() => {
    let hop = false;
    try { hop = sessionStorage.getItem(FLAG) === "1"; sessionStorage.removeItem(FLAG); } catch { /* ignore */ }
    if (!hop || window.location.hash) return;
    const nav = document.querySelector("[data-product-nav]");
    if (!nav) return;
    const stick = parseFloat(getComputedStyle(nav).top) || 0;
    const top = nav.getBoundingClientRect().top + window.scrollY - stick + 24;
    window.scrollTo({ top, left: 0, behavior: "instant" });
  }, [pageKey]);
  return null;
}
