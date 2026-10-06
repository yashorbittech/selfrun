"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatLimitValue, formatMoney } from "@/lib/platform/billing/types";
import { openOrderCheckout } from "@/components/platform/billing/razorpay-checkout";
import type { UsageRow } from "@/lib/platform/billing/usage-summary";
import type { TopupQuote } from "@/lib/platform/billing/topups";

export interface UsageActions {
  quote: (limitKey: string, units: number) => Promise<{ ok: true; quote: TopupQuote } | { ok: false; error: string }>;
  start: (limitKey: string, units: number) => Promise<{ ok: true; checkout: { key: string; orderId: string; name: string; description: string; amount: number; currency: string; prefill: { name: string; email: string } } } | { ok: false; error: string }>;
  confirm: (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => Promise<{ ok: true; message: string } | { ok: false; error: string }>;
}

const fmtUsed = (key: string, v: number) => (key === "seats" || key === "customDomains" ? String(v) : formatLimitValue(key, v));

function Pack({ row, actions, onDone }: { row: UsageRow; actions: UsageActions; onDone: (m: { ok: boolean; text: string }) => void }) {
  const t = row.topup!;
  const [units, setUnits] = useState(1);
  const [quote, setQuote] = useState<TopupQuote | null>(null);
  const [busy, start] = useTransition();
  useEffect(() => {
    let alive = true;
    actions.quote(row.limitKey, units).then((r) => alive && setQuote(r.ok ? r.quote : null));
    return () => {
      alive = false;
    };
  }, [actions, row.limitKey, units]);

  function pay() {
    start(async () => {
      const res = await actions.start(row.limitKey, units);
      if (!res.ok) return onDone({ ok: false, text: res.error });
      let failed: string | null = null;
      const c = res.checkout;
      const response = await openOrderCheckout({ key: c.key, orderId: c.orderId, amount: c.amount, currency: c.currency, name: c.name, description: c.description, prefill: c.prefill, onPaymentFailed: (m) => (failed = m) });
      if (!response) return onDone({ ok: false, text: failed ?? "Checkout closed — nothing was charged." });
      const done = await actions.confirm(response);
      onDone(done.ok ? { ok: true, text: done.message } : { ok: false, text: done.error });
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
      <div className="flex items-center gap-1" role="group" aria-label={`Packs of ${t.unitLabel}`}>
        <button type="button" className="size-8 rounded-lg border bg-background font-bold" onClick={() => setUnits((u) => Math.max(1, u - 1))} aria-label="Fewer">−</button>
        <input type="number" min={1} max={t.max} value={units} onChange={(e) => setUnits(Math.min(t.max, Math.max(1, Math.floor(Number(e.target.value) || 1))))} className="h-8 w-16 rounded-lg border bg-background text-center text-sm font-semibold" aria-label="Number of packs" />
        <button type="button" className="size-8 rounded-lg border bg-background font-bold" onClick={() => setUnits((u) => Math.min(t.max, u + 1))} aria-label="More">+</button>
      </div>
      <p className="text-sm">
        <b>{units} × {t.unitLabel}</b> = +{formatLimitValue(row.limitKey, units * t.unitSize)}
        <span className="block text-xs text-muted-foreground">{t.kind === "monthly" ? "Added for this month" : "Added for good"} · one-time payment</span>
      </p>
      <Button type="button" size="sm" className="ml-auto" disabled={busy || !quote} onClick={pay}>
        {busy ? "Opening…" : quote ? `Pay ${formatMoney(quote.total, quote.currency)}` : "…"}
      </Button>
      {quote && <p className="w-full text-xs text-muted-foreground">{formatMoney(quote.net, quote.currency)} + {quote.gstRatePercent}% GST ({formatMoney(quote.gst, quote.currency)})</p>}
    </div>
  );
}

/** This month's use of every paid service against the limits, with a one-time "add more" for each (never for users: that is a bigger plan). */
export default function UsageTopups({ rows, actions, canBuy }: { rows: UsageRow[]; actions: UsageActions; canBuy: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {rows.map((r) => {
          const tone = r.percent >= 90 ? "bg-destructive" : r.percent >= 70 ? "bg-amber-500" : "bg-primary";
          return (
            <li key={r.limitKey} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{r.label}{r.provider ? <span className="ml-2 text-xs font-normal text-muted-foreground">via {r.provider}</span> : null}</p>
                <p className="text-sm tabular-nums"><b>{fmtUsed(r.limitKey, r.used)}</b><span className="text-muted-foreground"> of {r.limit === null ? "Unlimited" : r.limit === 0 ? "Not included" : fmtUsed(r.limitKey, r.limit)}</span></p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={r.percent} aria-valuemin={0} aria-valuemax={100} aria-label={r.label}>
                <div className={cn("h-full rounded-full transition-all duration-700", tone)} style={{ width: `${r.limit === null ? 0 : Math.max(r.percent, r.used > 0 ? 2 : 0)}%` }} />
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {r.note}
                {r.limitKey === "seats" && <span className="font-semibold text-foreground">To add people, upgrade the plan above.</span>}
                {r.topup && !r.comingSoon && canBuy && r.limit !== null && (
                  <button type="button" onClick={() => setOpen(open === r.limitKey ? null : r.limitKey)} className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/40 px-2.5 py-1 font-bold text-primary hover:bg-primary/10">
                    <Plus className="size-3" /> Add more
                  </button>
                )}
              </p>
              {open === r.limitKey && r.topup && <Pack row={r} actions={actions} onDone={(m) => { setNote(m); if (m.ok) { setOpen(null); router.refresh(); } }} />}
            </li>
          );
        })}
      </ul>
      {note && <p className={cn("text-sm", note.ok ? "text-muted-foreground" : "text-destructive")} role="status">{note.text}</p>}
    </div>
  );
}
