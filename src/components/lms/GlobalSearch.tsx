"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { globalLmsSearchAction } from "@/app/lms/(protected)/search-actions";
import type { GlobalSearchResult } from "@/lib/lms-search";

const MIN_QUERY_LENGTH = 2;

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Debounced fetch synced to the query text — a canonical effect use case
    // (fetching derived-from-props/state data), hence the local lint exceptions below.
    if (query.trim().length < MIN_QUERY_LENGTH) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const r = await globalLmsSearchAction(query);
      if (!cancelled) {
        setResult(r);
        setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setResult(null);
    router.push(href);
  }

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH;
  const hasResults = result && (result.leads.length > 0 || result.applications.length > 0);

  return (
    <div className="relative w-full min-w-0">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search leads, applicants…"
        className="h-8 w-full min-w-0 rounded-xl border-border/50 bg-background pl-8 text-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
      />

      {showDropdown && (
        <div className="lms-surface absolute top-full left-0 z-50 mt-1.5 max-h-96 w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-border bg-popover/95 p-1.5 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur-xl">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && result && !hasResults && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matches for &ldquo;{query}&rdquo;</p>
          )}
          {!loading &&
            result?.leads.map((group) => (
              <div key={group.category} className="mb-1">
                <p className="px-1.5 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.label}</p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(`/lms/submissions/${group.category}/${item.id}`)}
                    className="flex w-full flex-col items-start rounded-md px-1.5 py-1.5 text-left hover:bg-muted/60"
                  >
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{item.email || item.phone}</span>
                  </button>
                ))}
              </div>
            ))}
          {!loading && result && result.applications.length > 0 && (
            <div>
              <p className="px-1.5 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Career Applications</p>
              {result.applications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(`/lms/careers/applicants/${item.id}`)}
                  className="flex w-full flex-col items-start rounded-md px-1.5 py-1.5 text-left hover:bg-muted/60"
                >
                  <span className="truncate font-medium">{item.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{item.positionTitle}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
