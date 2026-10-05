import Link from "next/link";
import {
  IndianRupee,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  ReceiptText,
  Target,
  Users,
  CheckCircle2,
  Handshake,
  Rocket,
  AlarmClock,
  Gauge,
  Clock,
  GraduationCap,
  Award,
  Boxes,
  Server,
  CreditCard,
  ShoppingCart,
  Bot,
  Mic,
  MessageSquare,
  Video,
  LayoutGrid,
  FolderKanban,
  Briefcase,
  Globe,
  Landmark,
  AlertTriangle,
  AlertCircle,
  Activity,
  ArrowUpRight,
  Building2,
  UserCheck,
  ShieldCheck,
  MessagesSquare,
  LayoutDashboard,
  Lock,
  FileText,
} from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import TimeSeriesChart from "@/components/lms/TimeSeriesChart";
import CategoryBarChart from "@/components/lms/CategoryBarChart";
import ExecutiveSection from "@/components/workspace/ExecutiveSection";
import { AnalyticsFilterBar } from "@/components/workspace/AnalyticsFilterBar";
import type { CommandCenterStats } from "@/lib/workspace/command-center";
import { formatCurrency, cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Panel status grid config
// ─────────────────────────────────────────────────────────────────────────────

const PANEL_GRID = [
  {
    key: "fms",
    label: "Finance",
    icon: <Landmark className="size-5" />,
    analyticsHref: "/workspace/analytics/fms",
    panelHref: "/fms",
    color: "from-primary to-brand-accent",
  },
  {
    key: "hrms",
    label: "HR",
    icon: <Users className="size-5" />,
    analyticsHref: "/workspace/analytics/hrms",
    panelHref: "/hrms",
    color: "from-brand-deep to-primary",
  },
  {
    key: "lms",
    label: "Leads / CRM",
    icon: <LayoutGrid className="size-5" />,
    analyticsHref: "/workspace/analytics/lms",
    panelHref: "/lms",
    color: "from-primary to-brand-deep",
  },
  {
    key: "messenger",
    label: "Messenger",
    icon: <MessagesSquare className="size-5" />,
    analyticsHref: "/workspace/analytics/messenger",
    panelHref: "/messenger",
    color: "from-brand-deep to-brand-accent",
  },
  {
    key: "pms",
    label: "Projects",
    icon: <FolderKanban className="size-5" />,
    analyticsHref: "/workspace/analytics/pms",
    panelHref: "/pms",
    color: "from-brand-accent to-brand-deep",
  },
  {
    key: "portal",
    label: "Portal",
    icon: <Globe className="size-5" />,
    analyticsHref: "/workspace/analytics/portal",
    panelHref: "/portal",
    color: "from-primary/80 to-brand-deep/80",
  },
  {
    key: "prms",
    label: "Procurement",
    icon: <ShoppingCart className="size-5" />,
    analyticsHref: "/workspace/analytics/prms",
    panelHref: "/prms",
    color: "from-brand-deep/80 to-primary/80",
  },
  {
    key: "tms",
    label: "Training",
    icon: <GraduationCap className="size-5" />,
    analyticsHref: "/workspace/analytics/tms",
    panelHref: "/tms",
    color: "from-brand-accent to-primary",
  },
  {
    key: "workspace",
    label: "Workspace",
    icon: <LayoutDashboard className="size-5" />,
    analyticsHref: "/workspace/analytics/workspace",
    panelHref: "/workspace",
    color: "from-brand-deep to-brand-accent/80",
  },
  {
    key: "aibots",
    label: "AI Bots",
    icon: <Bot className="size-5" />,
    analyticsHref: "/workspace/analytics/aibots",
    panelHref: "/aibots",
    color: "from-primary to-brand-accent",
  },
  {
    key: "cms",
    label: "Website CMS",
    icon: <Globe className="size-5" />,
    analyticsHref: "/workspace/analytics/cms",
    panelHref: "/cms",
    color: "from-brand-deep to-primary",
  },
  {
    key: "dlms",
    label: "Digi Locker",
    icon: <Boxes className="size-5" />,
    analyticsHref: "/workspace/analytics/dlms",
    panelHref: "/dlms",
    color: "from-primary to-brand-deep",
  },
  {
    key: "ots",
    label: "Online Tests",
    icon: <GraduationCap className="size-5" />,
    analyticsHref: "/workspace/analytics/ots",
    panelHref: "/ots",
    color: "from-brand-accent to-brand-deep",
  },
  {
    key: "seo",
    label: "SEO",
    icon: <Activity className="size-5" />,
    analyticsHref: "/workspace/analytics/seo",
    panelHref: "/seo",
    color: "from-primary to-brand-accent",
  },
  {
    key: "smms",
    label: "Social Media",
    icon: <MessagesSquare className="size-5" />,
    analyticsHref: "/workspace/analytics/smms",
    panelHref: "/smms",
    color: "from-brand-deep to-primary",
  },
  {
    key: "sop",
    label: "SOPs",
    icon: <ReceiptText className="size-5" />,
    analyticsHref: "/workspace/analytics/sop",
    panelHref: "/sop",
    color: "from-primary to-brand-deep",
  },
  {
    key: "lpms",
    label: "Legal & Documents",
    icon: <FileText className="size-5" />,
    analyticsHref: "/workspace/analytics/lpms",
    panelHref: "/lpms",
    color: "from-brand-deep to-brand-accent",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Module stat map (from command-center `modules` array)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The executive part of the dashboard (`/workspace`) — the former Command
 * Center page, moved here as one component: financial position, business and
 * area KPIs, financial intelligence, and the panel performance matrix.
 *
 * Presentational only. The data arrives from `loadExecutiveOverview`
 * (`src/lib/workspace/executive-overview.ts`), which returns `null` for anyone
 * without the Command Center permission — the dashboard renders this component
 * only when it got data, so no figure reaches a viewer who may not see it.
 */
export default function CommandCenterSections({ stats, companyName }: { stats: CommandCenterStats; companyName: string }) {
  // Build quick stat lookup from module summaries
  const moduleStats = Object.fromEntries(stats.modules.map((m) => [m.key, m.stats]));

  return (
    <section id="executive-overview" data-section="executive-overview" className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">Company overview</h2>
        <p className="text-sm text-muted-foreground">
          Real-time executive overview aggregated live across every {companyName} system.{" "}
          <span className="text-xs opacity-60">Updated {new Date(stats.generatedAt).toLocaleTimeString("en-IN")}</span>
        </p>
      </div>

      {/* Date range and granularity of the executive figures below */}
      <AnalyticsFilterBar title="Company overview filters" />

      {/* ── FMS Top-Line Financial KPIs ── */}
      <ExecutiveSection title="Financial Position (FMS Ledger)" description="Real ledger-backed figures from the Finance Management System.">
        <KpiGrid>
          <KpiCard label="Ledger Revenue" value={stats.finance.totalRevenue} format="currency" accent icon={<IndianRupee className="size-4" />} />
          <KpiCard label="Ledger Expenses" value={stats.finance.totalExpenses} format="currency" icon={<ReceiptText className="size-4" />} />
          <KpiCard label="Net Profit" value={stats.finance.netProfit} format="currency" tone={stats.finance.netProfit >= 0 ? "up" : "down"} icon={<PiggyBank className="size-4" />} />
          <KpiCard label="Cash + Bank" value={stats.finance.totalCash + stats.finance.totalBankBalance} format="currency" icon={<Wallet className="size-4" />} />
          <KpiCard label="Accounts Receivable" value={stats.finance.accountsReceivable} format="currency" icon={<TrendingUp className="size-4" />} />
          <KpiCard label="Accounts Payable" value={stats.finance.accountsPayable} format="currency" icon={<TrendingDown className="size-4" />} />
          <KpiCard label="Pending Approvals" value={stats.finance.pendingApprovals} tone={stats.finance.pendingApprovals > 0 ? "down" : undefined} icon={<AlarmClock className="size-4" />} />
          <KpiCard label="Overdue Invoices" value={stats.finance.overdueInvoices} tone={stats.finance.overdueInvoices > 0 ? "down" : undefined} icon={<AlertTriangle className="size-4" />} />
        </KpiGrid>
      </ExecutiveSection>

      {/* ── Business Overview (derived) ── */}
      <ExecutiveSection title="Business Overview" description="Composite figures derived from PMS, TMS, and CRM activity.">
        <KpiGrid>
          <KpiCard label="Total Revenue" value={stats.business.totalRevenue} format="currency" accent icon={<IndianRupee className="size-4" />} />
          <KpiCard label="Monthly Revenue" value={stats.business.monthlyRevenue} format="currency" icon={<Wallet className="size-4" />} />
          <KpiCard label="Annual Revenue" value={stats.business.annualRevenue} format="currency" icon={<TrendingUp className="size-4" />} />
          <KpiCard label="Gross Profit" value={stats.business.grossProfit} format="currency" tone={stats.business.grossProfit >= 0 ? "up" : "down"} icon={<PiggyBank className="size-4" />} />
          <KpiCard label="Net Profit" value={stats.business.netProfit} format="currency" tone={stats.business.netProfit >= 0 ? "up" : "down"} icon={<PiggyBank className="size-4" />} />
          <KpiCard label="Profit Margin" value={stats.business.profitMarginPercent} suffix="%" tone={stats.business.profitMarginPercent >= 0 ? "up" : "down"} icon={<Percent className="size-4" />} />
          <KpiCard label="Total Expenses" value={stats.business.totalExpenses} format="currency" icon={<ReceiptText className="size-4" />} />
        </KpiGrid>
      </ExecutiveSection>

      {/* ── Financial Charts ── */}
      <ExecutiveSection title="Financial Intelligence" description="Company-wide revenue, expense, and profit trend — all-time, by month.">
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
            <CardContent><TimeSeriesChart data={stats.financial.revenueTrend} /></CardContent>
          </GlassCard>
          <GlassCard>
            <CardHeader><CardTitle>Expense Trend</CardTitle></CardHeader>
            <CardContent><TimeSeriesChart data={stats.financial.expenseTrend} /></CardContent>
          </GlassCard>
          <GlassCard>
            <CardHeader><CardTitle>Profit / Loss Trend</CardTitle></CardHeader>
            <CardContent><TimeSeriesChart data={stats.financial.profitTrend} /></CardContent>
          </GlassCard>
          <GlassCard>
            <CardHeader><CardTitle>Expense by Category</CardTitle></CardHeader>
            <CardContent><CategoryBarChart data={stats.financial.expenseByCategory} /></CardContent>
          </GlassCard>
        </div>
      </ExecutiveSection>

      {/* ── Sales & CRM ── */}
      <ExecutiveSection title="Sales & CRM">
        <KpiGrid>
          <KpiCard label="Total Leads" value={stats.salesCrm.totalLeads} accent icon={<Target className="size-4" />} />
          <KpiCard label="New Leads Today" value={stats.salesCrm.newLeadsToday} icon={<Target className="size-4" />} />
          <KpiCard label="Conversion Rate" value={stats.salesCrm.conversionRate} suffix="%" icon={<Percent className="size-4" />} />
          <KpiCard label="Active Clients" value={stats.salesCrm.activeClients} icon={<Users className="size-4" />} />
          <KpiCard label="Closed Deals" value={stats.salesCrm.closedDeals} icon={<CheckCircle2 className="size-4" />} />
          <KpiCard label="Pipeline Value" value={stats.salesCrm.pipelineValue} format="currency" icon={<Handshake className="size-4" />} />
          <KpiCard label="Won Value" value={stats.salesCrm.wonValue} format="currency" icon={<Handshake className="size-4" />} />
        </KpiGrid>
      </ExecutiveSection>

      {/* ── Operations ── */}
      <ExecutiveSection title="Operations">
        <KpiGrid>
          <KpiCard label="Active Projects" value={stats.operations.activeProjects} accent icon={<Rocket className="size-4" />} />
          <KpiCard label="Completed Projects" value={stats.operations.completedProjects} icon={<CheckCircle2 className="size-4" />} />
          <KpiCard label="Overdue Projects" value={stats.operations.overdueProjects} tone={stats.operations.overdueProjects > 0 ? "down" : undefined} icon={<AlarmClock className="size-4" />} />
          <KpiCard label="Team Utilization" value={stats.operations.teamUtilization} suffix="%" icon={<Gauge className="size-4" />} />
          <KpiCard label="Billable Hours" value={Math.round(stats.operations.billableHours)} suffix="h" icon={<Clock className="size-4" />} />
          <KpiCard label="Non-Billable Hours" value={Math.round(stats.operations.nonBillableHours)} suffix="h" icon={<Clock className="size-4" />} />
        </KpiGrid>
      </ExecutiveSection>

      {/* ── Training ── */}
      <ExecutiveSection title="Training">
        <KpiGrid>
          <KpiCard label="Active Students" value={stats.training.activeStudents} accent icon={<GraduationCap className="size-4" />} />
          <KpiCard label="Industrial Training" value={stats.training.industrialStudents} icon={<GraduationCap className="size-4" />} />
          <KpiCard label="Internship Students" value={stats.training.internshipStudents} icon={<GraduationCap className="size-4" />} />
          <KpiCard label="Placement Rate" value={stats.training.placementRate} suffix="%" icon={<Award className="size-4" />} />
          <KpiCard label="Training Revenue" value={stats.training.trainingRevenue} format="currency" icon={<IndianRupee className="size-4" />} />
        </KpiGrid>
      </ExecutiveSection>

      {/* ── Procurement ── */}
      <ExecutiveSection title="Procurement">
        <KpiGrid>
          <KpiCard label="Total Spend" value={stats.procurement.totalProcurementSpend} format="currency" accent icon={<ShoppingCart className="size-4" />} />
          <KpiCard label="Infrastructure Cost" value={stats.procurement.infrastructureCost} format="currency" icon={<Server className="size-4" />} />
          <KpiCard label="SaaS Cost" value={stats.procurement.saasCost} format="currency" icon={<CreditCard className="size-4" />} />
          <KpiCard label="Asset Value" value={stats.procurement.assetValue} format="currency" icon={<Boxes className="size-4" />} />
          <KpiCard label="Pending Purchase Orders" value={stats.procurement.pendingPurchaseOrders} icon={<ReceiptText className="size-4" />} />
        </KpiGrid>
      </ExecutiveSection>

      {/* ── AI & Communication ── */}
      <ExecutiveSection title="AI & Communication">
        <KpiGrid>
          <KpiCard label="AI Chat Sessions" value={stats.aiComms.aiChatSessions} accent icon={<Bot className="size-4" />} />
          <KpiCard label="Voice AI Usage" value={stats.aiComms.voiceAiUsage} icon={<Mic className="size-4" />} />
          <KpiCard label="Internal Messages Today" value={stats.aiComms.internalMessages} icon={<MessageSquare className="size-4" />} />
          <KpiCard label="Active Meetings" value={stats.aiComms.activeMeetings} icon={<Video className="size-4" />} />
        </KpiGrid>
      </ExecutiveSection>

      <PanelPerformanceMatrix modules={stats.modules} />
    </section>
  );
}

/**
 * The Panel Performance Matrix: one card per panel with its live headline numbers and Analytics / Open links.
 * `modules` is absent for people without the Command Center permission (cards then show links only);
 * `panels` limits and `locked` marks panels outside the plan (Open becomes an upgrade link).
 */
export function PanelPerformanceMatrix({
  modules,
  stats,
  panels,
  locked,
  query,
  names,
  unavailable,
  registry,
}: {
  modules?: CommandCenterStats["modules"];
  /** Headline figures per panel key (take precedence over `modules`). */
  stats?: Record<string, { label: string; value: number }[]>;
  /** Panel keys this person may see; omitted = all. */
  panels?: string[];
  locked?: string[];
  /** Case-insensitive text matched against the panel name. */
  query?: string;
  /** Panel Registry names, so every card is titled like the panel everywhere else. */
  names?: Record<string, string>;
  /** Panels the platform switched off (for everyone or this company): their cards are not shown at all. */
  unavailable?: string[];
  /** The Panel Registry's panels: one card each, in order — including panels that have no analytics of their own. */
  registry?: { key: string; name: string; description: string; route: string }[];
}) {
  const moduleStats = { ...Object.fromEntries((modules ?? []).map((m) => [m.key, m.stats])), ...Object.fromEntries(Object.entries(stats ?? {}).filter(([, v]) => v.length > 0)) };
  const q = query?.trim().toLowerCase();
  const base = registry
    ? registry.map((r) => {
        const known = PANEL_GRID.find((g) => g.key === r.key);
        return {
          key: r.key,
          label: r.name,
          description: r.description,
          icon: known?.icon ?? <LayoutGrid className="size-5" />,
          color: known?.color ?? "from-primary to-brand-accent",
          analyticsHref: known?.analyticsHref ?? null,
          panelHref: r.route,
        };
      })
    : PANEL_GRID.map((p) => ({ ...p, description: "", analyticsHref: p.analyticsHref as string | null }));
  const grid = base
    .map((p) => ({ ...p, label: names?.[p.key] ?? p.label }))
    .filter((p) => !unavailable?.includes(p.key))
    .filter((p) => !q || p.label.toLowerCase().includes(q) || p.key.includes(q));
  return (
      <ExecutiveSection
        title="Panel Performance Matrix"
        description="Live status across every panel. Click 'Analytics' for deep insights, 'Open' to access the live panel."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {grid.map((panel) => {
            const mStats = moduleStats[panel.key] ?? [];
            const isAllowed = panels ? panels.includes(panel.key) : true;
            const isLocked = !isAllowed || (locked?.includes(panel.key) ?? false);
            return (
              <GlassCard key={panel.key} className="h-full">
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${panel.color} text-white shadow-sm`}
                  >
                    {panel.icon}
                  </div>
                  <CardTitle className="text-base">{panel.label}</CardTitle>
                  {isLocked && <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400"><Lock className="size-2.5" />Locked</span>}
                </CardHeader>
                <CardContent className="space-y-3">
                  {!panel.analyticsHref ? (
                    <p className="flex min-h-16 items-center rounded-lg border border-border/50 px-3 py-2 text-xs text-muted-foreground">{panel.description || "This panel has no analytics of its own."}</p>
                  ) : (
                  <dl className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => {
                      const s = mStats[i];
                      return (
                        <div key={i} className="flex h-16 flex-col items-center justify-center rounded-lg border border-border/50 px-2 text-center">
                          <dd className="text-base font-bold tabular-nums text-foreground">
                            {s ? (s.value > 999 ? formatCurrency(s.value) : s.value.toLocaleString("en-IN")) : "—"}
                          </dd>
                          <dt className="mt-0.5 w-full truncate text-[10px] text-muted-foreground">{s?.label ?? "No data"}</dt>
                        </div>
                      );
                    })}
                  </dl>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    {panel.analyticsHref && (
                    <Link
                      href={isLocked ? `/workspace/upgrade?module=${panel.key}` : panel.analyticsHref}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/8 hover:border-primary/40 hover:text-primary"
                    >
                      <Activity className="size-3" />
                      Analytics
                    </Link>
                    )}
                    <Link
                      href={isLocked ? `/workspace/upgrade?module=${panel.key}` : panel.panelHref}
                      className={cn(
                        "inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                        isLocked
                          ? "bg-amber-600/90 hover:bg-amber-700 text-white shadow-sm"
                          : "bg-gradient-to-r from-primary/90 to-[var(--color-brand-accent)] text-white hover:opacity-90"
                      )}
                    >
                      {isLocked ? "Upgrade" : "Open"}
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </div>
                </CardContent>
              </GlassCard>
            );
          })}
        </div>
      </ExecutiveSection>
  );
}
