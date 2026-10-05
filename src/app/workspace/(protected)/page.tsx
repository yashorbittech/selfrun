import { currentCompanyId } from "@/lib/platform/tenancy/context";
import { listPanels, unavailablePanelKeys } from "@/lib/platform/panels/store";
import PanelDashboardHeader from "@/components/platform/panel/PanelDashboardHeader";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, UserCheck, SearchX } from "lucide-react";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { getWorkspaceNav } from "@/lib/workspace/access";
import { loadExecutiveOverview } from "@/lib/workspace/executive-overview";
import { getPanelHeadlineStats, isPanelKey, panelConfigs, type PanelKey } from "@/lib/workspace/panel-analytics";
import ExecutiveSection from "@/components/workspace/ExecutiveSection";
import { AnalyticsFilterBar } from "@/components/workspace/AnalyticsFilterBar";
import { PanelPerformanceMatrix } from "@/components/workspace/CommandCenterSections";
import { PanelAnalyticsBlock } from "./analytics/[panel]/PanelAnalyticsBlock";

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.split(/[._-]/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || email;
}

const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function HubDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentHubUser();
  if (!user) redirect("/workspace/login");
  if (user.mustChangePassword) redirect("/workspace/change-password");

  const sp = await searchParams;
  const q = first(sp.q)?.trim().toLowerCase() ?? "";
  const onlyPanel = first(sp.panel);

  // The matrix numbers come from the executive loader (null for anyone without the Command Center permission).
  const executive = await loadExecutiveOverview(
    { roles: user.roles, permissionOverrides: user.permissionOverrides ?? null },
    { dateFrom: first(sp.dateFrom), dateTo: first(sp.dateTo), granularity: first(sp.granularity) },
  );

  // Which panels this person gets comes from the Workspace navigation (roles, permission overrides, plan, switched-on panels).
  const session = await getWorkspaceNav();
  const allowed = new Set(session?.nav.allowed ?? []);
  const locked = session?.nav.lockedPanels ?? [];
  const PANEL_CONFIGS = await panelConfigs();
  const [registry, unavailable] = await Promise.all([listPanels(), currentCompanyId().then(unavailablePanelKeys)]);
  const registryNames = Object.fromEntries(registry.map((p) => [p.key, p.name]));
  const analyticsKeys = Object.keys(PANEL_CONFIGS) as PanelKey[];
  // Every panel the Panel Registry lists (and that is switched on for this company), in its display order.
  const shownPanels = registry.filter((p) => !unavailable.has(p.key));
  const visibleKeys = shownPanels.map((p) => p.key).filter((k) => allowed.has(`analytics.${k}`) || allowed.has(`panel.${k}`));

  const matches = (k: string) => {
    const reg = registry.find((p) => p.key === k);
    const c = (PANEL_CONFIGS as Record<string, { label: string; description: string }>)[k];
    const label = reg?.name ?? c?.label ?? k;
    const description = reg?.description ?? c?.description ?? "";
    return (!onlyPanel || onlyPanel === k) && (!q || label.toLowerCase().includes(q) || k.includes(q) || description.toLowerCase().includes(q));
  };
  const sections = visibleKeys.filter((k): k is PanelKey => isPanelKey(k) && allowed.has(`analytics.${k}`) && matches(k));
  const matrixPanels = visibleKeys.filter(matches);
  const matrixLocked = locked.filter((k) => shownPanels.some((p) => p.key === k) && matches(k));
  const panelKeys = shownPanels.map((p) => p.key);

  const headline = Object.fromEntries(
    await Promise.all(matrixPanels.filter(isPanelKey).map(async (k) => [k, await getPanelHeadlineStats(k, { dateFrom: first(sp.dateFrom), dateTo: first(sp.dateTo) })] as const)),
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative space-y-6">
      <PanelDashboardHeader
        breadcrumbs={[{ label: "Workspace", href: "/workspace" }, { label: "Dashboard" }]}
        title={`${greeting}, ${nameFromEmail(user.email)}`}
        description={`Your company's panels, analytics and activity in one place · ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
        actions={
          <Link
            href="/hrms/me"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md transition-all hover:scale-[1.02] hover:bg-primary/90"
          >
            <UserCheck className="size-4" />
            My Attendance Portal
          </Link>
        }
        filters={
          <AnalyticsFilterBar
            title="Whole Dashboard Search & Filter"
            fields={[
              { key: "q", label: "Search panels", type: "text", placeholder: "Search any panel, e.g. finance, leads, SEO…" },
              { key: "panel", label: "Panel", type: "select", options: shownPanels.map((p) => ({ label: p.name, value: p.key })) },
            ]}
          />
        }
      />

      {/* ── Section 1: whole-dashboard search & filter + panel performance matrix ── */}
      <section id="dashboard-overview" data-section="overview" className="space-y-6 rounded-3xl border border-border/60 border-t-2 border-t-primary/60 bg-muted/70 dark:bg-[color-mix(in_oklch,var(--background)_82%,black)] p-5 shadow-sm sm:p-6">
        <PanelPerformanceMatrix modules={executive?.modules} stats={headline} panels={matrixPanels} locked={matrixLocked} names={registryNames} unavailable={[...unavailable]} registry={shownPanels.map((p) => ({ key: p.key, name: p.name, description: p.description, route: p.route }))} />
      </section>

      {/* ── Section 2: one analytics block per panel ── */}
      {sections.length === 0 ? (
        <ExecutiveSection title="Panel analytics">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
            <SearchX className="size-6" />
            {q || onlyPanel ? "No panel matches your search." : "No panel analytics are available for your account yet."}
          </div>
        </ExecutiveSection>
      ) : (
        sections.map((k) => (
          <div key={k} className="rounded-3xl border border-border/60 border-t-2 border-t-primary/60 bg-muted/70 dark:bg-[color-mix(in_oklch,var(--background)_82%,black)] p-5 shadow-sm sm:p-6">
            <PanelAnalyticsBlock panel={k} user={user} sp={sp} prefix={k} compact />
          </div>
        ))
      )}
    </div>
  );
}
