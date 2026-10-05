"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePanels } from "@/components/platform/PanelsProvider";

/**
 * Keeps panel names consistent everywhere without editing every sentence. Inside a panel's screens, any of a panel's
 * registered aliases ("HRMS", "Standard Operating Procedures" …, set per panel in Platform Panel → Panels) that still
 * appears in the page text, placeholders or tooltips is shown as the panel's current registry name instead — an
 * acronym becomes the short name, a longer old name becomes the full name. Rename a panel once and the whole app follows.
 *
 * It only ever changes what is displayed: form values, code blocks, the public website and the Platform Panel itself
 * are left untouched.
 */

const SKIP = "script,style,textarea,input,select,code,pre,svg,[contenteditable='true'],[data-panel-sync='off']";
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;
const isAcronym = (a: string) => /^[A-Z]{2,6}$/.test(a);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function PanelTextSync() {
  const panels = usePanels();
  const pathname = usePathname();
  const segment = pathname?.split("/")[1] ?? "";
  const enabled = Boolean(panels[segment]) && segment !== "website";

  useEffect(() => {
    if (!enabled) return;
    const map = new Map<string, string>();
    for (const p of Object.values(panels)) {
      if (p.key === "website") continue;
      for (const alias of p.aliases ?? []) {
        const to = isAcronym(alias) ? p.shortName : p.name;
        if (alias && to && alias !== to) map.set(alias, to);
      }
    }
    if (map.size === 0) return;
    const re = new RegExp(`(?<![A-Za-z0-9])(${[...map.keys()].sort((a, b) => b.length - a.length).map(escape).join("|")})(?![A-Za-z0-9])`, "g");
    const swap = (text: string) => text.replace(re, (m) => map.get(m) ?? m);

    function fixText(node: Text) {
      const v = node.nodeValue;
      if (!v || v.length < 2 || !re.test(v)) return;
      re.lastIndex = 0;
      if (node.parentElement?.closest(SKIP)) return;
      const next = swap(v);
      if (next !== v) node.nodeValue = next;
    }
    function fixAttrs(el: Element) {
      if (el.closest(SKIP) && !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (v && re.test(v)) {
          re.lastIndex = 0;
          const next = swap(v);
          if (next !== v) el.setAttribute(a, next);
        }
        re.lastIndex = 0;
      }
    }
    function scan(root: Node) {
      if (root.nodeType === Node.TEXT_NODE) return fixText(root as Text);
      if (!(root instanceof Element)) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) fixText(n as Text);
      fixAttrs(root);
      root.querySelectorAll("[placeholder],[title],[aria-label],[alt]").forEach(fixAttrs);
    }

    // Wait until React has hydrated the page, so the text we change is never text React is about to compare.
    let observer: MutationObserver | null = null;
    let pending = new Set<Node>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      timer = null;
      const batch = pending;
      pending = new Set();
      batch.forEach((n) => n.isConnected && scan(n));
    };
    const start = setTimeout(() => {
      scan(document.body);
      observer = new MutationObserver((records) => {
        for (const r of records) {
          if (r.type === "characterData") pending.add(r.target);
          else if (r.type === "childList") r.addedNodes.forEach((n) => pending.add(n));
          else if (r.type === "attributes") pending.add(r.target);
        }
        if (!timer) timer = setTimeout(flush, 40);
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    }, 350);

    return () => {
      clearTimeout(start);
      if (timer) clearTimeout(timer);
      observer?.disconnect();
    };
  }, [enabled, panels, pathname]);

  return null;
}
