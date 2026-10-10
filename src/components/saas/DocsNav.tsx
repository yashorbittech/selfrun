"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, Search } from "lucide-react";
import Icon from "@/components/saas/Icon";
import type { IconKey } from "@/lib/saas/content";

export interface DocsNavPanel {
  key: string;
  name: string;
  icon: IconKey;
  groups: { name: string; items: { slug: string; name: string }[] }[];
}

/** Every panel and every guide in one collapsible tree, so readers never have to go back to the docs hub. */
export default function DocsNav({ panels, currentPanel, currentSlug }: { panels: DocsNavPanel[]; currentPanel: string; currentSlug: string }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set([currentPanel]));
  const [q, setQ] = useState("");
  const activeRef = useRef<HTMLAnchorElement>(null);
  const query = q.trim().toLowerCase();

  useEffect(() => { activeRef.current?.scrollIntoView({ block: "center" }); }, []);

  const toggle = (k: string) => setOpen((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const total = panels.reduce((a, p) => a + p.groups.reduce((b, g) => b + g.items.length, 0), 0);

  return (
    <nav aria-label="All documentation" className="flex max-h-[inherit] flex-col">
      <Link href="/docs" className="mb-3 flex items-center gap-1.5 px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" />All documentation</Link>
      <label className="relative mb-3 block px-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${total} guides…`} className="h-11 w-full rounded-xl border border-border/60 bg-muted/30 pl-9 pr-3 text-sm outline-none focus:border-primary/50" />
      </label>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {panels.map((p) => {
          const groups = query ? p.groups.map((g) => ({ ...g, items: g.items.filter((x) => x.name.toLowerCase().includes(query) || p.name.toLowerCase().includes(query)) })).filter((g) => g.items.length) : p.groups;
          if (query && !groups.length) return null;
          const isOpen = query ? true : open.has(p.key);
          const count = p.groups.reduce((a, g) => a + g.items.length, 0);
          return (
            <div key={p.key} className={`rounded-2xl ${p.key === currentPanel ? "bg-primary/[0.04]" : ""}`}>
              <button type="button" onClick={() => toggle(p.key)} aria-expanded={isOpen} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-muted/50">
                <span className="sr-icon h-8 w-8 flex-none rounded-xl"><Icon name={p.icon} className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-black">{p.name}</span></span>
                <span className="text-[11px] font-semibold text-muted-foreground">{count}</span>
                <ChevronDown className={`h-4 w-4 flex-none text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="pb-2 pl-3 pr-1">
                  {groups.map((g) => (
                    <div key={g.name} className="mt-1.5">
                      <p className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-widest text-primary">{g.name}</p>
                      <ul className="space-y-0.5 border-l border-border/60 pl-1.5">
                        {g.items.map((x) => {
                          const active = p.key === currentPanel && x.slug === currentSlug;
                          return (
                            <li key={x.slug}><Link ref={active ? activeRef : undefined} href={`/docs/${p.key}/${x.slug}`} aria-current={active ? "page" : undefined} className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${active ? "bg-primary/10 font-bold text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>{x.name}</Link></li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
