import "server-only";
import { getPlatformDb } from "@/lib/platform/tenancy/platform-db";
import { COMPANIES_COLLECTION } from "@/lib/platform/tenancy/companies";
import { USAGE_SERVICES, formatMoney, type UsageService } from "@/lib/platform/billing/types";
import { getCompanySubscription, updateCompanySubscription } from "@/lib/platform/billing/subscription";
import { getPlan } from "@/lib/platform/billing/plans";
import { getBillingSettings } from "@/lib/platform/billing/settings";
import { createOrder, fetchOrder, razorpayConfigured, razorpayKeyId, verifyOrderSignature } from "@/lib/platform/billing/razorpay";
import { recordPlatformAudit } from "@/lib/platform/audit";
import { taxOn } from "@/lib/platform/billing/gst";

/**
 * Extra usage bought once ("top-ups"). Users are never sold this way: more people needs a bigger plan. A pack adds `unitSize` to a limit
 * (storage, AI tokens, emails, voice minutes, custom domains, SMS) for a one-time payment through a Razorpay order, tax added at the
 * platform's GST rate. Monthly resources (tokens, emails, minutes) get the extra for the month they were bought; storage and domains keep it.
 * Prices come from `USAGE_SERVICES` and can be overridden per resource in `platform_settings` (`_id: "topups"`, `{ [limitKey]: { price?, unitSize?, max?, enabled? } }`).
 */

const ORDERS = "billing_topup_orders";
const SETTINGS = "platform_settings";

export interface TopupOption {
  limitKey: string;
  label: string;
  provider: string | null;
  unit: string;
  note: string;
  kind: "monthly" | "permanent";
  unitSize: number;
  unitLabel: string;
  /** Per pack, paise, before GST. */
  price: number;
  max: number;
  comingSoon: boolean;
}

type Override = { price?: number; unitSize?: number; max?: number; enabled?: boolean };

export async function getTopupCatalog(): Promise<TopupOption[]> {
  let overrides: Record<string, Override> = {};
  try {
    const doc = await (await getPlatformDb()).collection<{ _id: string } & Record<string, unknown>>(SETTINGS).findOne({ _id: "topups" as never });
    if (doc) overrides = doc as unknown as Record<string, Override>;
  } catch {
    // defaults
  }
  return USAGE_SERVICES.flatMap((u: UsageService) => {
    if (!u.topup) return [];
    const o = overrides[u.limitKey] ?? {};
    if (o.enabled === false) return [];
    const unitSize = Number.isFinite(o.unitSize) && (o.unitSize as number) > 0 ? (o.unitSize as number) : u.topup.unitSize;
    return [
      {
        limitKey: u.limitKey,
        label: u.label,
        provider: u.provider,
        unit: u.unit,
        note: u.note,
        kind: u.topup.kind,
        unitSize,
        unitLabel: unitSize === u.topup.unitSize ? u.topup.unitLabel : `${unitSize.toLocaleString("en-IN")} ${u.unit}`,
        price: Number.isFinite(o.price) && (o.price as number) >= 0 ? (o.price as number) : u.topup.price,
        max: Number.isFinite(o.max) && (o.max as number) > 0 ? (o.max as number) : u.topup.max,
        comingSoon: u.comingSoon === true,
      },
    ];
  });
}

export interface TopupQuote {
  limitKey: string;
  units: number;
  /** What it adds, in the limit's own unit. */
  amount: number;
  net: number;
  gst: number;
  gstRatePercent: number;
  total: number;
  currency: string;
}

export async function quoteTopup(limitKey: string, units: number): Promise<{ ok: true; quote: TopupQuote; option: TopupOption } | { ok: false; error: string }> {
  const option = (await getTopupCatalog()).find((o) => o.limitKey === limitKey);
  if (!option) return { ok: false, error: "That can't be bought separately." };
  if (option.comingSoon) return { ok: false, error: `${option.label} isn't available yet.` };
  const n = Math.floor(Number(units));
  if (!Number.isFinite(n) || n < 1 || n > option.max) return { ok: false, error: `Choose between 1 and ${option.max.toLocaleString("en-IN")} packs.` };
  const settings = await getBillingSettings();
  const rate = settings.tax.gstRatePercent;
  const net = n * option.price;
  const gst = taxOn(net, rate);
  return { ok: true, option, quote: { limitKey, units: n, amount: n * option.unitSize, net, gst, gstRatePercent: rate, total: net + gst, currency: settings.billing.currency } };
}

export interface TopupCheckout {
  key: string;
  orderId: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  prefill: { name: string; email: string };
}

async function orders() {
  return (await getPlatformDb()).collection<{ _id: string; companyId: string; limitKey: string; units: number; amount: number; kind: "monthly" | "permanent"; month: string; paid: number; currency: string; status: "created" | "paid"; createdAt: Date }>(ORDERS);
}

export async function startTopupCheckout(companyId: string, input: { limitKey: string; units: number }, actorId = "system"): Promise<{ ok: true; checkout: TopupCheckout } | { ok: false; error: string }> {
  if (!(await razorpayConfigured())) return { ok: false, error: "Online payments aren't configured yet. Please contact support." };
  const sub = await getCompanySubscription(companyId);
  if (!sub) return { ok: false, error: "Unknown workspace." };
  if (sub.status === "internal") return { ok: false, error: "Your workspace has no limits, so there is nothing to add." };
  if (sub.status === "suspended" || sub.status === "canceled") return { ok: false, error: "Renew your plan first, then add usage." };
  const plan = await getPlan(sub.planId);
  if (plan && plan.limits[input.limitKey] === null) return { ok: false, error: "Your plan already has no limit on this." };
  const q = await quoteTopup(String(input.limitKey ?? ""), Number(input.units));
  if (!q.ok) return q;
  const company = await (await getPlatformDb()).collection<{ _id: string; name: string }>(COMPANIES_COLLECTION).findOne({ _id: companyId }, { projection: { name: 1 } });
  const month = new Date().toISOString().slice(0, 7);
  try {
    const order = await createOrder({ amount: q.quote.total, currency: q.quote.currency, receipt: `tu_${companyId.slice(0, 8)}_${Date.now().toString(36)}`, notes: { purpose: "usage_topup", companyId, limitKey: q.quote.limitKey, units: String(q.quote.units) } });
    await (await orders()).insertOne({ _id: order.id, companyId, limitKey: q.quote.limitKey, units: q.quote.units, amount: q.quote.amount, kind: q.option.kind, month, paid: q.quote.total, currency: q.quote.currency, status: "created", createdAt: new Date() });
    await recordPlatformAudit({ actorId, companyId, action: "topup.checkout.start", target: { type: "subscription", id: companyId }, details: { limitKey: q.quote.limitKey, units: q.quote.units, total: q.quote.total, orderId: order.id } });
    const details = sub.billingDetails;
    return {
      ok: true,
      checkout: {
        key: await razorpayKeyId(),
        orderId: order.id,
        name: company?.name ?? "Workspace",
        description: `${q.quote.units} × ${q.option.unitLabel} of ${q.option.label.toLowerCase()} · ${formatMoney(q.quote.total, q.quote.currency)} incl. ${q.quote.gstRatePercent}% GST`,
        amount: q.quote.total,
        currency: q.quote.currency,
        prefill: { name: details?.legalName ?? company?.name ?? "", email: details?.email ?? "" },
      },
    };
  } catch (err) {
    console.error("[topup] could not create the order", err);
    return { ok: false, error: "We couldn't start the payment. Please try again." };
  }
}

/** Adds a paid order's usage to the company's subscription — exactly once. */
async function creditOrder(orderId: string, paymentId: string, actorId: string): Promise<boolean> {
  const col = await orders();
  const claimed = await col.findOneAndUpdate({ _id: orderId, status: "created" }, { $set: { status: "paid" } });
  if (!claimed) return false; // already credited
  const sub = await getCompanySubscription(claimed.companyId);
  if (!sub) return false;
  const topups = [...(sub.topups ?? []), { id: orderId, limitKey: claimed.limitKey, amount: claimed.amount, kind: claimed.kind, month: claimed.kind === "monthly" ? claimed.month : null, paymentId, paid: claimed.paid, at: new Date() }];
  await updateCompanySubscription(claimed.companyId, { topups });
  await recordPlatformAudit({ actorId, companyId: claimed.companyId, action: "topup.paid", target: { type: "subscription", id: claimed.companyId }, details: { limitKey: claimed.limitKey, amount: claimed.amount, paid: claimed.paid, orderId, paymentId } });
  return true;
}

/** Called with Razorpay Checkout's handler response; the extra is added only after the signature AND Razorpay's own record agree. */
export async function confirmTopup(companyId: string, response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }, actorId = "system"): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const orderId = String(response?.razorpay_order_id ?? "");
  const paymentId = String(response?.razorpay_payment_id ?? "");
  if (!(await verifyOrderSignature(orderId, paymentId, String(response?.razorpay_signature ?? "")))) return { ok: false, error: "We couldn't verify this payment. If you were charged, it will be added automatically within a few minutes." };
  const mine = await (await orders()).findOne({ _id: orderId, companyId });
  if (!mine) return { ok: false, error: "This payment belongs to a different workspace." };
  try {
    const entity = await fetchOrder(orderId);
    if (entity.status !== "paid" || entity.amount !== mine.paid) return { ok: false, error: "Razorpay hasn't confirmed the payment yet. It will be added automatically once it does." };
  } catch {
    return { ok: false, error: "Payment received, but we couldn't confirm it yet. It will be added automatically." };
  }
  await creditOrder(orderId, paymentId, actorId);
  return { ok: true, message: "Payment received — your extra usage is added." };
}

/** Picks up payments whose checkout window was closed before the confirmation ran (called when the billing page opens). */
export async function reconcileTopups(companyId: string): Promise<void> {
  try {
    const open = await (await orders()).find({ companyId, status: "created", createdAt: { $gt: new Date(Date.now() - 3 * 86_400_000) } }).limit(10).toArray();
    for (const o of open) {
      const entity = await fetchOrder(o._id).catch(() => null);
      if (entity?.status === "paid" && entity.amount === o.paid) await creditOrder(o._id, "reconciled", "system");
    }
  } catch {
    // best effort
  }
}
