import "server-only";
import { getStandardPlans } from "@/lib/platform/billing/plans";
import { buildShowcase, type ShowcasePlan } from "@/lib/platform/billing/showcase";
import { formatMoney } from "@/lib/platform/billing/types";
import { SAAS_BRAND } from "@/lib/saas/brand";

/**
 * The offers of the product, read from the plan catalogue: nothing here is written by hand. An offer is a plan whose real price is
 * below its list price (the same numbers the pricing page shows), a yearly price below twelve monthly ones, or the free plan.
 */
export interface PlanOffer {
  id: string;
  name: string;
  label: string;
  /** Formatted prices. */
  price: string;
  list: string;
  save: string;
  pct: number;
  /** Yearly alternative, when the plan offers it. */
  yearly: { price: string; vsMonthly: string; perMonth: string; pct: number } | null;
  seats: string;
  popular: boolean;
}

export interface Offers {
  plans: PlanOffer[];
  /** The biggest discount among the plans (0 when none has one). */
  topPct: number;
  topPlan: string;
  /** The label the catalogue gives the offer ("Launch offer"), or a generic one. */
  label: string;
  free: ShowcasePlan | null;
  /** Epoch ms of the offer's end (always in the future): `SAAS_OFFER_ENDS_AT` when set, otherwise the end of the current month. */
  endsAt: number | null;
  allPlans: ShowcasePlan[];
}

const IST = 5.5 * 3600_000;
/** The configured end date while it is in the future; otherwise the last moment of the current month (India time), so the offer runs in monthly cycles. */
function offerEnd(): number {
  const set = SAAS_BRAND.offerEndsAt ? Date.parse(SAAS_BRAND.offerEndsAt) : NaN;
  if (Number.isFinite(set) && set > Date.now()) return set;
  const d = new Date(Date.now() + IST);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - 1 - IST;
}

export async function getOffers(): Promise<Offers> {
  const all = buildShowcase(await getStandardPlans().catch(() => []));
  const paid = all.filter((p) => p.kind === "paid");
  const plans: PlanOffer[] = paid.flatMap((p) => {
    const m = p.offer.monthly;
    const l = p.list.monthly;
    if (!m || !l || l <= m) return [];
    const y = p.offer.yearly;
    return [{
      id: p.id, name: p.name, label: p.offerLabel || "Offer",
      price: formatMoney(m, p.currency), list: formatMoney(l, p.currency), save: formatMoney(l - m, p.currency), pct: Math.round((1 - m / l) * 100),
      yearly: y && m * 12 > y ? { price: formatMoney(y, p.currency), vsMonthly: formatMoney(m * 12 - y, p.currency), perMonth: formatMoney(Math.round(y / 12), p.currency), pct: Math.round((1 - y / (m * 12)) * 100) } : null,
      seats: p.seats ? `Up to ${p.seats.toLocaleString("en-IN")} ${p.seats === 1 ? "user" : "users"}` : "Unlimited users",
      popular: p.popular,
    }];
  });
  const top = plans.reduce<PlanOffer | null>((a, b) => (!a || b.pct > a.pct ? b : a), null);
  const end = offerEnd();
  return {
    plans,
    topPct: top?.pct ?? 0,
    topPlan: top?.name ?? "",
    label: plans.find((p) => p.label !== "Offer")?.label ?? "Launch offer",
    free: all.find((p) => p.kind === "free") ?? null,
    endsAt: end,
    allPlans: all,
  };
}
