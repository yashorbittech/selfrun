import { getOffers } from "@/lib/saas/offers";
import OfferBar from "@/components/saas/OfferBar";
import OfferPopup from "@/components/saas/OfferPopup";
import OfferAd, { type AdSlide } from "@/components/saas/OfferAd";

/** The strip above the header (`bar`) and the pop-up (`popup`), both drawn from the live plan catalogue. */
export async function OfferTopBar() {
  const o = await getOffers();
  const headline = o.topPct > 0 ? `${o.label}: save up to ${o.topPct}% on every paid plan` : "Free forever — full access, every feature unlocked";
  const sub = o.topPct > 0 ? "Every panel and every feature on every plan." : "AI built in. Every panel included. Set up in minutes — no card needed.";
  return <OfferBar headline={headline} sub={sub} endsAt={o.endsAt} cta={o.topPct > 0 ? "Claim offer" : "Get started free"} href={o.topPct > 0 ? "/offers" : "/signup"} />;
}

export async function OfferPopupHost() {
  const o = await getOffers();
  return (
    <OfferPopup
      label={o.topPct > 0 ? o.label : "Start free"}
      topPct={o.topPct}
      plans={o.plans.map((p) => ({ name: p.name, price: p.price, list: p.list, pct: p.pct }))}
      endsAt={o.endsAt}
      freeLine={"Full access to every panel and feature, AI included — start in minutes, no card needed."}
    />
  );
}

/** The ad that closes each page: slides built from the live plan catalogue. */
export async function OfferAdHost() {
  const o = await getOffers();
  const slides: AdSlide[] = [];
  if (o.topPct > 0) slides.push({ kind: "launch", label: o.label, pct: o.topPct, plan: o.topPlan, plans: o.plans.map((p) => ({ name: p.name, price: p.price, list: p.list, pct: p.pct })) });
  const spot = o.plans.find((p) => p.popular) ?? o.plans[0];
  if (spot) slides.push({ kind: "plan", name: spot.name, price: spot.price, list: spot.list, save: spot.save, pct: spot.pct, seats: spot.seats, popular: spot.popular });
  const y = [...o.yearly].sort((a, b) => b.yearly.pct - a.yearly.pct)[0];
  if (y) slides.push({ kind: "yearly", plan: y.name, save: y.yearly.vsMonthly, perMonth: y.yearly.perMonth, monthly: y.price });
  slides.push({ kind: "free", line: "Free forever · full access · AI built in · every feature unlocked. No card needed." });
  return <OfferAd slides={slides} endsAt={o.endsAt} />;
}
