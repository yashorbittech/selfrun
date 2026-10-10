"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Grid3X3, LayoutDashboard, Maximize2, Search, Star, X } from "lucide-react";

export interface GalleryEntry { id: string; src: string; title: string; panelKey: string; panel: string; featured: boolean }

const PAGE = 28;

/**
 * The product gallery: a panel list beside a dense mosaic of real screens (or a uniform grid), search, and a full-screen viewer with
 * a blurred backdrop, a thumbnail strip and keyboard navigation.
 */
export default function Gallery({ items, panels, initialPanel }: { items: GalleryEntry[]; panels: { key: string; name: string; count: number }[]; initialPanel?: string }) {
  const pool = items;
  const [panel, setPanel] = useState(initialPanel && panels.some((p) => p.key === initialPanel) ? initialPanel : "all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<number | null>(null);
  const [mosaic, setMosaic] = useState(true);
  const counts = useMemo(() => { const m = new Map<string, number>(); for (const i of pool) m.set(i.panelKey, (m.get(i.panelKey) ?? 0) + 1); return m; }, [pool]);
  const shownPanels = panels.filter((p) => counts.has(p.key)).map((p) => ({ ...p, count: counts.get(p.key) ?? 0 }));
  const max = Math.max(...shownPanels.map((p) => p.count), 1);

  const list = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return pool.filter((i) => (panel === "all" || i.panelKey === panel) && terms.every((t) => `${i.title} ${i.panel}`.toLowerCase().includes(t)));
  }, [pool, panel, q]);
  const visible = list.slice(0, shown);
  const cur = open !== null ? list[open] : null;

  const move = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + list.length) % list.length)), [list.length]);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.style.overflow = prev; };
  }, [open, move]);

  const pick = (k: string) => { setPanel(k); setShown(PAGE); setOpen(null); };
  const span = (i: number) => (!mosaic ? "" : i % 7 === 0 ? "sm:col-span-2 sm:row-span-2" : i % 7 === 4 ? "sm:col-span-2" : "");

  return (
    <div className="grid gap-10 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-12">
      <aside className="xl:sticky xl:top-28 xl:self-start">
        <label className="relative mb-4 block">
          <span className="sr-only">Search the screens</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="Search screens…" className="sr-input" style={{ height: 48, paddingLeft: 42, borderRadius: 999 }} />
        </label>
        <p className="mb-3 hidden px-1 text-xs font-bold uppercase tracking-[0.18em] text-primary xl:block">Panels</p>
        <div className="sr-scroll-x flex gap-2 xl:block xl:space-y-0.5" role="tablist" aria-label="Panels">
          {[{ key: "all", name: "All screens", count: pool.length }, ...shownPanels].map((p) => {
            const on = panel === p.key;
            return (
              <button key={p.key} role="tab" aria-selected={on} onClick={() => pick(p.key)} className={`group relative shrink-0 overflow-hidden rounded-full border px-4 py-2.5 text-left text-sm font-semibold transition-all xl:flex xl:w-full xl:items-center xl:justify-between xl:rounded-xl xl:border-0 xl:px-3.5 ${on ? "border-transparent bg-foreground text-background shadow-lg xl:bg-primary/10 xl:text-primary xl:shadow-none" : "border-border/60 bg-background text-foreground hover:border-primary/50 xl:bg-transparent xl:text-muted-foreground xl:hover:bg-muted/60 xl:hover:text-foreground"}`}>
                <span className="relative z-10">{p.name}</span>
                <span className={`relative z-10 ml-2 text-xs font-bold tabular-nums ${on ? "opacity-80" : "opacity-60"}`}>{p.count}</span>
                {p.key !== "all" && <span className="absolute inset-x-3.5 bottom-1 hidden h-[3px] origin-left rounded-full bg-gradient-to-r from-primary to-brand-accent opacity-40 transition-opacity group-hover:opacity-80 xl:block" style={{ width: `calc(${(p.count / max) * 100}% - 1.75rem)` }} aria-hidden />}
              </button>
            );
          })}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Showing <b className="text-foreground">{visible.length}</b> of {list.length} real screens{panel !== "all" && <> in <b className="text-foreground">{panels.find((p) => p.key === panel)?.name}</b></>}</p>
          <div className="inline-flex rounded-full border border-border/70 bg-background p-1 shadow-sm" role="group" aria-label="Layout">
            <button type="button" onClick={() => setMosaic(true)} aria-pressed={mosaic} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${mosaic ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}><LayoutDashboard className="h-3.5 w-3.5" />Mosaic</button>
            <button type="button" onClick={() => setMosaic(false)} aria-pressed={!mosaic} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${!mosaic ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}><Grid3X3 className="h-3.5 w-3.5" />Grid</button>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="py-24 text-center text-muted-foreground">No screen matches. Try another word.</p>
        ) : (
          <div className={`grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3 ${mosaic ? "sm:auto-rows-[230px]" : ""} lg:grid-cols-3`}>
            {visible.map((it, n) => (
              <button key={it.id} type="button" onClick={() => setOpen(n)} aria-label={`Open ${it.title}`} className={`group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-border/60 bg-card text-left shadow-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/25 sm:block ${mosaic ? "sm:min-h-[230px]" : "sm:aspect-[16/10]"} ${span(n)}`}>
                {/* phones: the whole screen on top, its name beneath; larger screens: the screen fills the tile with the name over it */}
                <span className="relative block aspect-[16/10] w-full overflow-hidden bg-muted sm:absolute sm:inset-0 sm:aspect-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.src} alt={`${it.panel}: ${it.title}`} width={1280} height={800} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-left-top transition-transform duration-[900ms] group-hover:scale-[1.07]" />
                  <span className="absolute inset-0 hidden bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 transition-opacity group-hover:opacity-100 sm:block" aria-hidden />
                  {it.featured && <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />Featured</span>}
                  <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-lg transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 sm:scale-75"><Maximize2 className="h-4 w-4" /></span>
                </span>
                <span className="block p-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:p-5 sm:text-white">
                  <span className="mb-1.5 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary sm:bg-white/20 sm:text-white sm:backdrop-blur">{it.panel}</span>
                  <span className="block text-base font-black leading-tight tracking-tight sm:text-lg">{it.title}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {shown < list.length && (
          <div className="mt-10 flex justify-center">
            <button type="button" onClick={() => setShown((s) => s + PAGE)} className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-bold text-background shadow-xl transition-transform hover:scale-105">Show {Math.min(PAGE, list.length - shown)} more screens <ArrowRight className="h-4 w-4" /></button>
          </div>
        )}
      </div>

      {cur && (
        <div className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-background text-foreground" role="dialog" aria-modal="true" aria-label={cur.title}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={`bg-${cur.id}`} src={cur.src} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-background/70 to-background/90" aria-hidden />
          <div className="relative flex items-center justify-between gap-4 border-b border-border/60 bg-background/70 px-4 py-4 backdrop-blur-xl sm:px-8">
            <div className="min-w-0"><p className="truncate text-xl font-black tracking-tight">{cur.title}</p><p className="text-sm text-muted-foreground">{cur.panel} · {(open ?? 0) + 1} of {list.length}</p></div>
            <div className="flex items-center gap-2">
              <Link href={`/features/${cur.panelKey}`} className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary/50 hover:text-primary sm:inline-flex">About {cur.panel} <ArrowUpRight className="h-4 w-4" /></Link>
              <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-muted/50 transition-colors hover:border-primary/50 hover:text-primary"><X className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-4 sm:px-20" onClick={() => setOpen(null)}>
            <button type="button" onClick={(e) => { e.stopPropagation(); move(-1); }} aria-label="Previous" className="absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/80 shadow-lg backdrop-blur transition-colors hover:border-primary/50 hover:text-primary sm:left-6"><ArrowLeft className="h-5 w-5" /></button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={cur.id} src={cur.src} alt={`${cur.panel}: ${cur.title}`} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-2xl border border-border/70 bg-card object-contain shadow-[0_40px_100px_-30px] shadow-primary/40" style={{ animation: "sr-in .35s ease both" }} />
            <button type="button" onClick={(e) => { e.stopPropagation(); move(1); }} aria-label="Next" className="absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/80 shadow-lg backdrop-blur transition-colors hover:border-primary/50 hover:text-primary sm:right-6"><ArrowRight className="h-5 w-5" /></button>
          </div>
          <div className="sr-scroll-x relative flex justify-center gap-2.5 border-t border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl">
            {list.slice(Math.max(0, (open ?? 0) - 6), Math.max(0, (open ?? 0) - 6) + 13).map((t, k) => {
              const idx = Math.max(0, (open ?? 0) - 6) + k;
              return (
                <button key={t.id} type="button" onClick={() => setOpen(idx)} aria-label={t.title} className={`h-14 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition-all sm:h-16 sm:w-28 ${idx === open ? "ring-primary" : "opacity-60 ring-transparent hover:opacity-100"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.src} alt="" loading="lazy" className="h-full w-full object-cover object-left-top" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
