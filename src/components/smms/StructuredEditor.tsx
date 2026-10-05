"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CharCount } from "@/components/smms/SmmsBits";
import { cn } from "@/lib/utils";

/**
 * Edits AI-generated structured content field by field, driven by a spec — the
 * same component edits a campaign strategy, an ad creative or a post creative.
 * Lists are edited one item per line.
 */

export type FieldSpec =
  | { key: string; label: string; kind: "text" | "textarea"; rows?: number; limit?: number | null; placeholder?: string; wide?: boolean }
  | { key: string; label: string; kind: "list"; rows?: number; placeholder?: string; wide?: boolean }
  | { key: string; label: string; kind: "number"; wide?: boolean }
  | { key: string; label: string; kind: "objects"; itemLabel: string; fields: FieldSpec[]; wide?: true; blank: Record<string, unknown> };

type Rec = Record<string, unknown>;

function FieldInput({ spec, value, onChange, disabled, idPrefix }: { spec: FieldSpec; value: unknown; onChange: (v: unknown) => void; disabled?: boolean; idPrefix: string }) {
  const id = `${idPrefix}-${spec.key}`;
  if (spec.kind === "objects") {
    const items = Array.isArray(value) ? (value as Rec[]) : [];
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-background/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">{`${spec.itemLabel} ${i + 1}`}</span>
              {!disabled && (
                <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove ${spec.itemLabel} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
            <StructuredFields specs={spec.fields} value={item} onChange={(next) => onChange(items.map((x, j) => (j === i ? next : x)))} disabled={disabled} idPrefix={`${id}-${i}`} />
          </div>
        ))}
        {!disabled && (
          <Button type="button" variant="outline" size="xs" onClick={() => onChange([...items, { ...spec.blank }])}>
            <Plus className="size-3.5" /> {`Add ${spec.itemLabel.toLowerCase()}`}
          </Button>
        )}
      </div>
    );
  }
  if (spec.kind === "list") {
    const text = Array.isArray(value) ? (value as string[]).join("\n") : "";
    return <Textarea id={id} rows={spec.rows ?? 3} value={text} disabled={disabled} placeholder={spec.placeholder ?? "One per line"} onChange={(e) => onChange(e.target.value.split("\n"))} onBlur={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} />;
  }
  if (spec.kind === "number") {
    return <Input id={id} type="number" min={0} value={typeof value === "number" ? value : 0} disabled={disabled} onChange={(e) => onChange(Number(e.target.value) || 0)} className="w-32" />;
  }
  const str = typeof value === "string" ? value : "";
  return spec.kind === "textarea" ? (
    <Textarea id={id} rows={spec.rows ?? 3} value={str} disabled={disabled} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <Input id={id} value={str} disabled={disabled} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}

export function StructuredFields({ specs, value, onChange, disabled, idPrefix = "sf" }: { specs: FieldSpec[]; value: Rec; onChange: (v: Rec) => void; disabled?: boolean; idPrefix?: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {specs.map((spec) => {
        const v = value?.[spec.key];
        const limit = "limit" in spec ? spec.limit : null;
        return (
          <div key={spec.key} className={cn("space-y-1.5", (spec.wide || spec.kind === "objects" || spec.kind === "textarea" || spec.kind === "list") && "sm:col-span-2")}>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`${idPrefix}-${spec.key}`} className="text-xs font-medium">
                {spec.label}
              </label>
              {limit ? <CharCount value={typeof v === "string" ? v : ""} limit={limit} /> : null}
            </div>
            <FieldInput spec={spec} value={v} disabled={disabled} idPrefix={idPrefix} onChange={(next) => onChange({ ...value, [spec.key]: next })} />
          </div>
        );
      })}
    </div>
  );
}

/** Read-only rendering of any snapshot (used by version history). */
export function SnapshotView({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>;
  if (typeof value !== "object") return <span className="whitespace-pre-wrap">{String(value)}</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">—</span>;
    if (value.every((x) => typeof x !== "object")) return <span className="whitespace-pre-wrap">{value.join(depth > 0 ? ", " : "\n")}</span>;
    return (
      <ol className="space-y-2">
        {value.map((x, i) => (
          <li key={i} className="rounded-lg border border-border/40 p-2">
            <SnapshotView value={x} depth={depth + 1} />
          </li>
        ))}
      </ol>
    );
  }
  return (
    <dl className="space-y-1.5">
      {Object.entries(value as Rec).map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11px] font-semibold text-muted-foreground">{k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}</dt>
          <dd className="text-xs">
            <SnapshotView value={v} depth={depth + 1} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
