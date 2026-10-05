"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiOption {
  value: string;
  label: string;
  /** Options with the same group are listed under a heading. */
  group?: string;
}

/**
 * A searchable multi-select: pick any number of options from a long list. Chips show the choices, the panel has a
 * search box and (optionally) grouped options with per-group "all / none". Each choice is also rendered as a hidden
 * input named `name`, so a plain <form> submission carries them all.
 */
export default function SearchMultiSelect({
  name, options, values, onChange, placeholder, searchPlaceholder = "Search…", emptyText = "Nothing matches your search.", disabled, invalid, id,
  max, customPrefix, cleanCustom,
}: {
  name: string;
  options: MultiOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  /** At most this many choices (custom ones included). */
  max?: number;
  /** When set, people can type their own entry; it is stored as `<customPrefix><text>`. */
  customPrefix?: string;
  /** Cleans typed text (returns "" to reject). */
  cleanCustom?: (text: string) => string;
}) {
  const auto = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const selected = useMemo(() => new Set(values), [values]);
  const labelOf = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);
  const nameOf = (v: string) => labelOf.get(v) ?? (customPrefix && v.startsWith(customPrefix) ? v.slice(customPrefix.length) : v);
  const atMax = max !== undefined && values.length >= max;

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  useEffect(() => {
    if (open) search.current?.focus();
  }, [open]);

  const q = query.trim().toLowerCase();
  const shown = useMemo(() => (q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.group?.toLowerCase().includes(q)) : options), [options, q]);
  const groups = useMemo(() => {
    const map = new Map<string, MultiOption[]>();
    for (const o of shown) {
      const g = o.group ?? "";
      map.set(g, [...(map.get(g) ?? []), o]);
    }
    return [...map.entries()];
  }, [shown]);

  const toggle = (v: string) => {
    if (selected.has(v)) return onChange(values.filter((x) => x !== v));
    if (atMax) return;
    onChange([...values, v]);
  };
  // A typed entry: matches an existing option exactly → pick that one; otherwise add it as custom.
  const typed = customPrefix && cleanCustom ? cleanCustom(query) : "";
  const exact = typed ? options.find((o) => o.label.toLowerCase() === typed.toLowerCase()) : undefined;
  const addTyped = () => {
    if (!typed || atMax) return;
    const value = exact ? exact.value : `${customPrefix}${typed}`;
    if (!selected.has(value)) onChange([...values, value]);
    setQuery("");
    search.current?.focus();
  };
  const setGroup = (items: MultiOption[], on: boolean) => {
    const ids = new Set(items.map((i) => i.value));
    const add = items.map((i) => i.value).filter((v) => !selected.has(v));
    const room = max === undefined ? add.length : Math.max(0, max - values.length);
    onChange(on ? [...values, ...add.slice(0, room)] : values.filter((v) => !ids.has(v)));
  };
  const controlId = id ?? auto;

  return (
    <div ref={root} className="relative">
      {values.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
      <div
        id={controlId}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id ?? auto}-list`}
        aria-haspopup="listbox"
        aria-invalid={invalid || undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && (open ? close() : setOpen(true))}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
          if (e.key === "Escape") close();
        }}
        className={cn(
          "flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30",
          invalid && "border-destructive",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {values.length === 0 && <span className="px-1 text-muted-foreground">{placeholder}</span>}
        {values.slice(0, 4).map((v) => (
          <span key={v} className="inline-flex max-w-full items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-foreground">
            <span className="truncate">{nameOf(v)}</span>
            <button type="button" aria-label={`Remove ${nameOf(v)}`} onClick={(e) => { e.stopPropagation(); toggle(v); }} className="rounded hover:text-destructive">
              <X className="size-3" />
            </button>
          </span>
        ))}
        {values.length > 4 && <span className="px-1 text-xs text-muted-foreground">+{values.length - 4} more</span>}
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </div>

      {open && (
        <div id={`${id ?? auto}-list`} className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl" role="listbox" aria-multiselectable="true">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTyped();
                }
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {max !== undefined && <span className={cn("shrink-0 text-xs tabular-nums", atMax ? "font-medium text-primary" : "text-muted-foreground")}>{values.length}/{max}</span>}
            {values.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">Clear</button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {customPrefix && typed && !exact && (
              <button type="button" onClick={addTyped} disabled={atMax} className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm font-medium text-primary hover:bg-muted/60 disabled:opacity-50">
                <Plus className="size-4" /> Add “{typed}” as your own
              </button>
            )}
            {customPrefix && !typed && (
              <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">Can&apos;t find yours? Type it above and press Enter — you can add your own.</p>
            )}
            {groups.length === 0 && !typed && <p className="px-3 py-4 text-center text-sm text-muted-foreground">{emptyText}</p>}
            {groups.map(([group, items]) => {
              const all = items.every((i) => selected.has(i.value));
              return (
                <div key={group || "all"}>
                  {group && (
                    <div className="sticky top-0 z-10 flex items-center justify-between bg-popover/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                      <span className="truncate">{group}</span>
                      <button type="button" onClick={() => setGroup(items, !all)} className="shrink-0 normal-case text-primary hover:underline">{all ? "None" : "All"}</button>
                    </div>
                  )}
                  {items.map((o) => {
                    const on = selected.has(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="option"
                        aria-selected={on}
                        onClick={() => toggle(o.value)}
                        disabled={!on && atMax}
                        className="flex w-full items-start gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border", on ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                          {on && <Check className="size-3" />}
                        </span>
                        <span>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
