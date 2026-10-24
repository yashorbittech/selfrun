"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Grid2X2, Search, X } from "lucide-react";
import type { PanelMeta } from "@/lib/platform/panels/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ProductLogo from "@/components/products/ProductLogo";

export default function ProductLauncher({ currentPanel, products: panelList }: { currentPanel: string; products: PanelMeta[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const products = useMemo(
    () => [...panelList].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    [panelList],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return q
      ? products.filter((product) => `${product.name} ${product.description}`.toLocaleLowerCase().includes(q))
      : products;
  }, [products, query]);

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setQuery(""); }}>
      <SheetTrigger
        render={
          <button
            type="button"
            title="Browse products"
            aria-label="Browse all products"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Grid2X2 className="size-[18px]" />
          </button>
        }
      />
      <SheetContent side="right" className="w-[min(24rem,calc(100vw-1rem))] gap-0 overflow-hidden border-border/70 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border/60 px-5 py-5 pr-14">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle className="text-base font-semibold">All products</SheetTitle>
              <SheetDescription className="mt-1 text-xs">Switch to another product in your workspace.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="border-b border-border/50 p-3">
          <label className="flex h-9 items-center gap-2 rounded-xl border border-border/60 bg-background px-3 text-muted-foreground focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a product"
              aria-label="Find a product"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="rounded p-0.5 hover:bg-muted"><X className="size-3.5" /></button>}
          </label>
        </div>

        <div className="grid flex-1 grid-cols-3 content-start gap-1 overflow-y-auto p-3">
          {filtered.map((product) => {
            const isCurrent = product.key === currentPanel;
            const tile = (
              <>
                <span className="relative flex size-12 items-center justify-center transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-110">
                  <ProductLogo productKey={product.key} size={48} className="drop-shadow-md" />
                  {isCurrent && <span className="absolute right-0 top-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-popover" />}
                </span>
                <span className="w-full truncate text-center text-[11px] font-medium leading-tight transition-colors group-hover:text-primary">{product.shortName || product.name}</span>
                {isCurrent ? (
                  <span className="text-[9px] font-medium leading-none text-primary">Current</span>
                ) : !product.available ? (
                  <span className="text-[9px] font-medium leading-none text-muted-foreground">Unavailable</span>
                ) : null}
              </>
            );
            const className = `group relative flex min-h-[6.35rem] flex-col items-center justify-start gap-2 rounded-2xl p-2.5 text-foreground transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${!product.available ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`;

            return product.available ? (
              <Link key={product.key} href={product.route} aria-label={product.name} className={className} onClick={() => setOpen(false)}>
                {tile}
              </Link>
            ) : (
              <div key={product.key} aria-label={`${product.name} is unavailable`} aria-disabled="true" className={className}>
                {tile}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">No products match your search.</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
