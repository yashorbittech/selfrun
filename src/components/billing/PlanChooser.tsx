"use client";

import type { BillingInterval } from "@/lib/platform/billing/types";
import type { ShowcasePlan } from "@/lib/platform/billing/showcase";
import PlanShowcase from "@/components/billing/PlanShowcase";

/** The in-app plan cards. Choosing one selects it in the checkout section of the same page (`BillingManager`) and scrolls there. */
export default function PlanChooser({ plans, currentPlanId, interval }: { plans: ShowcasePlan[]; currentPlanId: string; interval: BillingInterval }) {
  return (
    <PlanShowcase
      plans={plans}
      currentPlanId={currentPlanId}
      defaultInterval={interval}
      contactHref="/support"
      onSelect={(planId, iv) => {
        window.dispatchEvent(new CustomEvent("billing:select-plan", { detail: { planId, interval: iv } }));
        document.getElementById("billing-checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    />
  );
}
