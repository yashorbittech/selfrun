import { PLAN_FLAGS, USAGE_SERVICES, formatLimitValue, type BillingInterval, type Plan } from "@/lib/platform/billing/types";
import { planPrice } from "@/lib/platform/billing/pricing";

/**
 * A plan as the pricing screens show it (the marketing page and the in-app plan chooser share it). Pure and serialisable: built on the
 * server from the catalogue, drawn by `PlanShowcase`. Prices in paise, before tax. `list` = the "usual" price shown struck through.
 */
export interface ShowcasePlan {
  id: string;
  name: string;
  description: string;
  currency: string;
  kind: "free" | "paid" | "contact";
  offer: Record<BillingInterval, number | null>;
  list: Record<BillingInterval, number | null>;
  offerLabel: string;
  seats: number | null;
  panels: string;
  flags: string[];
  highlights: string[];
  /** Every paid service with this plan's allowance, in `USAGE_SERVICES` order (seats excluded: it is shown as "Up to N users"). */
  limits: { key: string; label: string; provider: string | null; value: string; included: boolean }[];
  popular: boolean;
}

export function buildShowcase(plans: Plan[]): ShowcasePlan[] {
  const paid = plans.filter((p) => !p.lifetimeFree && !p.contactSales);
  const popularId = paid.length >= 3 ? paid[Math.floor(paid.length / 2)]._id : (paid[0]?._id ?? "");
  return plans.map((p) => ({
    id: p._id,
    name: p.name,
    description: p.description,
    currency: p.currency,
    kind: p.contactSales ? "contact" : p.lifetimeFree ? "free" : "paid",
    offer: { monthly: planPrice(p, "monthly"), yearly: planPrice(p, "yearly") },
    list: { monthly: p.listPrices?.monthly ?? null, yearly: p.listPrices?.yearly ?? null },
    offerLabel: p.offerLabel ?? "",
    seats: p.limits.seats ?? null,
    panels: p.modules === "all" ? "Every panel" : `${p.modules.length} panels + the essentials`,
    flags: (p.flags ?? []).flatMap((f) => PLAN_FLAGS.find((d) => d.key === f)?.label ?? []),
    highlights: p.highlights ?? [],
    limits: USAGE_SERVICES.filter((u) => u.limitKey !== "seats").map((u) => {
      const v = p.limits[u.limitKey];
      return { key: u.limitKey, label: u.label, provider: u.provider, value: u.comingSoon && (v === 0 || v === undefined) ? "Coming soon" : formatLimitValue(u.limitKey, v ?? (u.limitKey in p.limits ? null : 0)), included: v === null || (typeof v === "number" && v > 0) };
    }),
    popular: p._id === popularId,
  }));
}
