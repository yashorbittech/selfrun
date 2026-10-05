import Link from "next/link";
import { FolderKanban, Flag, CalendarClock, Package, FileText, ReceiptText, TrendingUp } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import ProgressBar from "@/components/pms/ProgressBar";
import { InfoCard, PortalPageHeader, LinkPill } from "@/components/portal/widgets";
import LeadStageCard from "@/components/portal/LeadStageCard";
import type { ClientOverview } from "@/lib/portal/client";
import type { PortalLeadView } from "@/lib/portal/lead";

function money(n: number, currency: string) {
  return `${currency === "INR" ? "₹" : currency + " "}${Math.round(n).toLocaleString("en-IN")}`;
}

/** Client dashboard — a project portfolio grid, then delivery + financial rails. */
export default function ClientDashboard({
  data,
  firstName,
  leadView,
}: {
  data: ClientOverview;
  firstName: string;
  leadView?: PortalLeadView | null;
}) {
  const inv = data.invoiceSummary;
  const allMilestones = data.projects.flatMap((p) =>
    p.milestones.map((m) => ({ ...m, projectName: p.project.name }))
  );
  const dueMilestones = allMilestones
    .filter((m) => m.status !== "completed")
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  const pendingDeliverables = data.projects.flatMap((p) =>
    p.pendingDeliverables.map((m) => ({ name: m.name, project: p.project.name }))
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <PortalPageHeader
        title={`Hello, ${firstName}`}
        subtitle={`${data.client.companyName} · ${data.projects.length} project${data.projects.length === 1 ? "" : "s"}`}
        action={
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-1.5">
            <TrendingUp className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{data.overallProgress}%</span>
            <span className="text-xs text-muted-foreground">overall</span>
          </div>
        }
      />

      {leadView && <LeadStageCard view={leadView} compact />}

      {/* portfolio grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.projects.map(({ project }) => (
          <Link
            key={project._id}
            href="/portal/projects"
            className="group rounded-2xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FolderKanban className="size-4" />
              </span>
              <span className="text-[11px] font-medium text-muted-foreground capitalize">{project.status.replace(/_/g, " ")}</span>
            </div>
            <p className="mt-2 truncate font-semibold text-foreground">{project.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {project.projectCode}
              {project.endDate ? ` · due ${project.endDate}` : ""}
            </p>
            <ProgressBar value={project.progressPercent ?? 0} className="mt-3" />
          </Link>
        ))}
        {data.projects.length === 0 && (
          <GlassCard interactive={false} className="sm:col-span-2 lg:col-span-3">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">No projects yet.</CardContent>
          </GlassCard>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* milestones + meetings */}
        <div className="space-y-5">
          <GlassCard>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flag className="size-4" /> Milestones due
              </CardTitle>
              <LinkPill href="/portal/milestones">All milestones →</LinkPill>
            </CardHeader>
            <CardContent className="space-y-2">
              {dueMilestones.length === 0 && <p className="text-sm text-muted-foreground">No open milestones.</p>}
              {dueMilestones.slice(0, 5).map((m) => (
                <div key={m._id} className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.projectName}
                      {m.dueDate ? ` · ${m.dueDate}` : ""}
                      {m.overdue ? " · overdue" : ""}
                    </p>
                  </div>
                  <span className="w-24 shrink-0">
                    <ProgressBar value={m.progressPercent} showLabel={false} />
                  </span>
                </div>
              ))}
            </CardContent>
          </GlassCard>

          <GlassCard>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4" /> Upcoming meetings &amp; reviews
              </CardTitle>
              <LinkPill href="/portal/meetings">All →</LinkPill>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.upcomingMeetings.length === 0 && <p className="text-sm text-muted-foreground">Nothing on the calendar.</p>}
              {data.upcomingMeetings.slice(0, 4).map((mt, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2 text-sm">
                  <CalendarClock className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-foreground">{mt.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{mt.date}</span>
                </div>
              ))}
            </CardContent>
          </GlassCard>
        </div>

        {/* invoice summary + deliverables + docs */}
        <div className="space-y-5">
          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="size-4" /> Invoice summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <Row label="Contract value" value={money(inv.contractValue, inv.currency)} strong />
              <Row label="Billed to date" value={money(inv.billed, inv.currency)} accent />
              <Row label="In progress" value={money(inv.inProgress, inv.currency)} />
              <Row label="Not started" value={money(inv.notStarted, inv.currency)} />
              <div className="border-t border-border/60 pt-2">
                <Row label="Outstanding" value={money(inv.outstanding, inv.currency)} strong />
              </div>
              <Link href="/portal/invoices" className="block pt-1 text-xs font-medium text-primary hover:underline">
                Invoice detail →
              </Link>
            </CardContent>
          </GlassCard>

          <InfoCard title="Pending deliverables">
            {pendingDeliverables.length === 0 ? (
              <p className="text-sm text-muted-foreground">All caught up.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {pendingDeliverables.slice(0, 5).map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Package className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-foreground">{d.name}</span>
                    <span className="ml-auto shrink-0 truncate text-[11px] text-muted-foreground">{d.project}</span>
                  </li>
                ))}
              </ul>
            )}
          </InfoCard>

          <InfoCard title="Shared documents">
            {data.sharedDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents shared yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {data.sharedDocuments.slice(0, 4).map((d) => (
                  <li key={d._id} className="flex items-center gap-2">
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                    <a href={`/api/portal/download/project/${d._id}`} target="_blank" rel="noreferrer" className="truncate text-foreground hover:text-primary hover:underline">
                      {d.title || d.filename}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/portal/documents" className="mt-2 block text-xs font-medium text-primary hover:underline">
              All documents →
            </Link>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          accent
            ? "bg-gradient-to-r from-primary to-[color:var(--color-brand-accent)] bg-clip-text font-bold text-transparent"
            : strong
              ? "font-bold text-foreground"
              : "font-medium text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
