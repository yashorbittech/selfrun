"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  currency: string;
  prices: { monthly: number | null; yearly: number | null };
  trialDays: number;
  highlights: string[];
  isDefault: boolean;
}

function money(paise: number, currency: string) {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(paise / 100);
}

export default function PricingTable({ plans }: { plans: PricingPlan[] }) {
  const hasYearly = plans.some((p) => p.prices.yearly !== null);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const featured = plans.find((p) => p.isDefault)?.id ?? plans[Math.floor(plans.length / 2)]?.id;
  return (
    <div className="space-y-10">
      {hasYearly && (
        <div className="mx-auto flex w-fit gap-1 rounded-xl border p-1" role="group" aria-label="Billing cycle">
          {(["monthly", "yearly"] as const).map((c) => (
            <button key={c} type="button" aria-pressed={cycle === c} onClick={() => setCycle(c)} className="rounded-lg px-5 py-2 text-sm font-bold transition-colors" style={cycle === c ? { background: "var(--sr-primary)", color: "#fff" } : { color: "var(--sr-muted)" }}>
              {c === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          const price = p.prices[cycle] ?? p.prices.monthly;
          const shown = p.prices[cycle] !== null ? cycle : "monthly";
          const isFeatured = p.id === featured;
          return (
            <div key={p.id} className="sr-card relative flex flex-col gap-5" style={isFeatured ? { borderColor: "var(--sr-primary)", boxShadow: "0 24px 50px -28px rgba(67,56,202,.6)" } : undefined}>
              {isFeatured && <span className="sr-chip absolute -top-3 left-6" style={{ background: "var(--sr-primary)", color: "#fff" }}>Most popular</span>}
              <div className="space-y-1">
                <h2 className="sr-h3">{p.name}</h2>
                <p className="text-sm sr-muted">{p.description}</p>
              </div>
              <div>
                {price !== null ? (
                  <p><span className="sr-display text-4xl font-extrabold">{money(price, p.currency)}</span> <span className="sr-muted">/ {shown === "monthly" ? "month" : "year"}</span></p>
                ) : (
                  <p className="sr-display text-2xl font-extrabold">Contact us</p>
                )}
                <p className="mt-1 text-xs sr-muted">{p.trialDays > 0 ? `${p.trialDays}-day free trial · ` : ""}Taxes extra where applicable</p>
              </div>
              <Link href="/signup" className={`sr-btn ${isFeatured ? "sr-btn-primary" : "sr-btn-ghost"}`}>{p.trialDays > 0 ? "Start free trial" : "Get started"}</Link>
              <ul className="space-y-2.5 text-[15px]">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5"><Check className="sr-check mt-1 size-4" aria-hidden />{h}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
