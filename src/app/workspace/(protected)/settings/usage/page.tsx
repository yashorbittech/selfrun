import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Info } from "lucide-react";
import { requireWorkspaceAccess } from "@/lib/workspace/access";
import { BILLING_SETTINGS_PATH } from "@/lib/platform/billing/enforce";
import { getMetricDetail, getPeopleUsage, getPersonDetail, getUsageOverview } from "@/lib/platform/billing/usage-history";
import { isUsageMetricKey } from "@/lib/platform/billing/usage-history-shared";
import { DetailView, OverviewCards, PeoplePanel, PersonView } from "@/components/workspace/usage/UsageExplorer";

export const metadata: Metadata = { title: "Usage & limits", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Everything the workspace uses against its plan: the position of every meter, and for each one the full history — by day, by feature,
 * month by month and every single use. The numbers are the ones enforcement uses, so what is shown here is what is applied.
 */
export default async function UsagePage({ searchParams }: { searchParams: Promise<{ metric?: string; period?: string; person?: string }> }) {
  await requireWorkspaceAccess("company.usage");
  const sp = await searchParams;
  const metric = isUsageMetricKey(sp.metric) ? sp.metric : "ai";
  const [overview, detail, people] = await Promise.all([getUsageOverview(), getMetricDetail(metric, sp.period), getPeopleUsage(sp.period)]);
  const person = sp.person && sp.person.length <= 120 ? await getPersonDetail(sp.person, sp.period) : null;
  const worst = overview.metrics.filter((m) => m.level !== "ok");

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "Company settings", href: "/workspace/settings" }, { label: "Usage & limits" }]}
        title={<>Usage &amp; limits</>}
        description={
          overview.plan.unlimited
            ? <>Your workspace has no plan limits. Everything it uses is still recorded below.</>
            : <>What your workspace uses against your <strong>{overview.plan.name ?? "current"}</strong> plan — now, day by day, and month by month. Monthly allowances reset on <strong>{overview.period.resetsOn}</strong>.</>
        }
        actions={!overview.plan.unlimited && (
          <Link href={BILLING_SETTINGS_PATH} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Change plan or add capacity <ArrowRight className="size-4" />
          </Link>
        )}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground"><CalendarClock className="size-3.5" />{overview.period.label}</span>
        <span>Day {overview.period.dayOfPeriod} of {overview.period.daysTotal}</span>
        <span>{overview.period.daysLeft} day{overview.period.daysLeft === 1 ? "" : "s"} until monthly allowances reset ({overview.period.resetsOn})</span>
        {overview.plan.trialDaysLeft !== null && <span>Trial: {overview.plan.trialDaysLeft} day{overview.plan.trialDaysLeft === 1 ? "" : "s"} left</span>}
        {overview.historySince && <span className="inline-flex items-center gap-1"><Info className="size-3" />Itemised history since {overview.historySince}</span>}
      </div>

      {worst.length > 0 && (
        <div role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
          <p className="font-medium">{worst.some((m) => m.level === "over") ? "A limit has been reached" : "You're close to a limit"}</p>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {worst.map((m) => <li key={m.key}>{m.label}: {m.level === "over" ? "limit reached" : `${m.percent}% used`} — <Link href={`?metric=${m.key}#details`} scroll={false} className="text-primary underline">see details</Link></li>)}
          </ul>
        </div>
      )}

      <OverviewCards overview={overview} selected={metric} period={detail.period} />
      <PeoplePanel people={people} metric={metric} />
      {person && <PersonView person={person} metric={metric} backHref={`?metric=${metric}&period=${detail.period}#people`} />}
      <DetailView detail={detail} overview={overview} />
    </div>
  );
}
