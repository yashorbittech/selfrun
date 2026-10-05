import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { requireWorkspaceAccess } from "@/lib/workspace/access";
import { getCompanyUsage } from "@/lib/workspace/company";
import { BILLING_SETTINGS_PATH } from "@/lib/platform/billing/enforce";
import type { UsageMeter } from "@/lib/platform/billing/usage-report";

export const metadata: Metadata = { title: "Usage", robots: { index: false, follow: false } };

const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const LEVEL: Record<UsageMeter["level"], { bar: string; note: string | null }> = {
  ok: { bar: "bg-primary", note: null },
  near: { bar: "bg-amber-500", note: "Close to the limit" },
  over: { bar: "bg-destructive", note: "Limit reached" },
};

function Meter({ id, label, hint, unit, meter }: { id: string; label: string; hint: string; unit: string; meter: UsageMeter }) {
  const pct = meter.limit === null ? 0 : meter.limit === 0 ? (meter.used > 0 ? 100 : 0) : Math.min(100, Math.round((meter.used / meter.limit) * 100));
  const level = LEVEL[meter.level];
  return (
    <div id={id} data-level={meter.level} className="space-y-2 rounded-xl border border-border/60 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm tabular-nums">
          <span className="font-semibold">{fmt(meter.used)}</span>
          <span className="text-muted-foreground">
            {" "}
            / {meter.limit === null ? "Unlimited" : fmt(meter.limit)} {unit}
          </span>
        </p>
      </div>
      {meter.limit !== null && (
        <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${level.bar}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {hint}
        {level.note && <span className="ml-1 font-medium text-foreground">{level.note}.</span>}
      </p>
    </div>
  );
}

/** What this company uses against its plan's limits. Read-only; the numbers are the ones enforcement uses. */
export default async function UsagePage() {
  await requireWorkspaceAccess("company.usage");
  const usage = await getCompanyUsage();

  return (
    <div className="min-h-screen bg-muted/70 px-4 py-10 dark:bg-background">
      <div className="space-y-4">
<PanelPageHeader
          breadcrumbs={[{ label: "Company settings", href: "/workspace/settings" }, { label: "Usage" }]}
          title={<>Usage</>}
          description={<>{usage.status === "internal" ? "Your workspace has no plan limits." : `What your workspace uses against the limits of your ${usage.planName ?? "current"} plan, including add-ons.`}</>}
        />
<div className="space-y-4">
        <GlassCard interactive={false}>
          <CardContent className="space-y-3">
            <Meter id="usage-seats" label="Seats" unit="users" hint="Active accounts that can sign in. Training students don't take a seat." meter={usage.seats} />
            <Meter id="usage-ai" label="AI tokens this month" unit="tokens" hint="Used by the AI assistants across your panels. Resets on the 1st." meter={usage.aiTokens} />
            <Meter id="usage-storage" label="File storage" unit="MB" hint="Documents and files uploaded across your panels." meter={usage.storageMb} />
            {usage.status !== "internal" && (
              <Link id="usage-upgrade-link" href={BILLING_SETTINGS_PATH} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Change plan or add capacity
                <ArrowRight className="size-4" />
              </Link>
            )}
          </CardContent>
        </GlassCard>
      </div>
</div>
    </div>
  );
}
