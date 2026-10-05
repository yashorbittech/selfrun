"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, FileText, FolderKanban, ListTodo, Loader2, Search, Target, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SearchHit, SearchType } from "@/lib/platform/search";
import { hubSearchAction } from "@/app/workspace/hub-actions";

const TYPE_META: Record<SearchType, { label: string; icon: typeof Search }> = {
  lead: { label: "Lead", icon: Target },
  client: { label: "Client", icon: Briefcase },
  project: { label: "Project", icon: FolderKanban },
  task: { label: "Task", icon: ListTodo },
  employee: { label: "Employee", icon: Users },
  invoice: { label: "Invoice", icon: FileText },
};

/** The Staff Hub's search button and Cmd/Ctrl+K palette: leads, clients, projects, tasks, employees, invoices. */
export default function HubSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function onQuery(value: string) {
    setQuery(value);
    setActive(0);
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    const ticket = ++latest.current;
    if (q.length < 2) {
      setHits([]);
      setState("idle");
      return;
    }
    setState("loading");
    timer.current = setTimeout(async () => {
      try {
        const res = await hubSearchAction(q);
        if (ticket !== latest.current) return; // a newer query is in flight
        setHits(res);
        setState("done");
      } catch {
        if (ticket === latest.current) setState("error");
      }
    }, 250);
  }

  function go(hit: SearchHit) {
    setOpen(false);
    router.push(hit.url);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(hits.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    }
  }

  return (
    <>
      <button
        type="button"
        id="hub-search-button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="inline-flex h-8 items-center gap-2 rounded-xl border border-border/50 bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:bg-input/30"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border px-1 font-sans text-[10px] sm:inline">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="top-[12%] max-w-[560px] translate-y-0 overflow-hidden" id="hub-search-dialog">
          <DialogTitle className="sr-only">Search your workspace</DialogTitle>
          <DialogDescription className="sr-only">Find leads, clients, projects, tasks, employees and invoices.</DialogDescription>
          <div className="flex items-center gap-2 border-b px-4">
            {state === "loading" ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" /> : <Search className="size-4 shrink-0 text-muted-foreground" />}
            <input
              id="hub-search-input"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search leads, clients, projects, tasks, people, invoices…"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              maxLength={80}
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls="hub-search-results"
              aria-activedescendant={hits[active] ? `hub-search-hit-${active}` : undefined}
              className="h-12 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
            />
          </div>
          <div className="max-h-[55vh] overflow-y-auto p-2" aria-live="polite">
            {state === "idle" && <p className="px-2 py-6 text-center text-sm text-muted-foreground">Type at least 2 characters.</p>}
            {state === "error" && <p className="px-2 py-6 text-center text-sm text-destructive">Search isn&apos;t available right now. Try again.</p>}
            {state === "done" && hits.length === 0 && (
              <p id="hub-search-empty" className="px-2 py-6 text-center text-sm text-muted-foreground">
                Nothing found for “{query.trim()}”.
              </p>
            )}
            {hits.length > 0 && (
              <ul id="hub-search-results" role="listbox" aria-label="Results">
                {hits.map((h, i) => {
                  const Icon = TYPE_META[h.type].icon;
                  return (
                    <li key={`${h.type}:${h.id}`} id={`hub-search-hit-${i}`} role="option" aria-selected={i === active} data-hit-type={h.type}>
                      <button
                        type="button"
                        onClick={() => go(h)}
                        onMouseEnter={() => setActive(i)}
                        className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left", i === active && "bg-muted")}
                      >
                        <Icon className="size-4 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{h.title}</span>
                          {h.subtitle && <span className="block truncate text-xs text-muted-foreground">{h.subtitle}</span>}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{TYPE_META[h.type].label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
