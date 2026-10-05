import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import DashboardSection from "@/components/platform/panel/DashboardSection";
import Link from "next/link";
import {
  FolderKanban,
  ListChecks,
  CheckCircle2,
  Clock3,
  Clock,
  CalendarClock,
  CalendarDays,
  Gauge,
  AlarmClock,
} from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import TimeSeriesChart from "@/components/lms/TimeSeriesChart";
import CategoryBarChart from "@/components/lms/CategoryBarChart";
import PmsDashboardFilters from "@/components/pms/PmsDashboardFilters";
import ProgressBar from "@/components/pms/ProgressBar";
import { ProjectStatusBadge, TaskStatusBadge, ProjectHealthBadge } from "@/components/pms/StatusBadges";
import { getCurrentPmsUser } from "@/lib/pms-auth";
import { getEmployeeDashboard } from "@/lib/pms/employee-dashboard";
import { getTimesheetStatusMeta, type ProjectHealth } from "@/lib/pms/constants";
import { isValidDateRangePreset, resolveDateRangePreset, type DateRangePreset } from "@/lib/date-ranges";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

function parseDateParam(v: string | undefined, end = false): Date | undefined {
  if (!v) return undefined;
  const d = new Date(`${v}${end ? "T23:59:59.999" : "T00:00:00"}`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function EmployeeDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentPmsUser();
  if (!user?.employeeId) return null;

  const rangeParam: DateRangePreset =
    sp.range && isValidDateRangePreset(sp.range) ? sp.range : sp.dateFrom || sp.dateTo ? "custom" : "last30";
  let from: Date | undefined;
  let to: Date | undefined;
  if (rangeParam === "custom") {
    from = parseDateParam(sp.dateFrom);
    to = parseDateParam(sp.dateTo, true);
  } else {
    const r = resolveDateRangePreset(rangeParam)!;
    from = r.from;
    to = r.to;
  }
  const dateFrom = (from ?? new Date()).toISOString().slice(0, 10);
  const dateTo = (to ?? new Date()).toISOString().slice(0, 10);

  const d = await getEmployeeDashboard(user.employeeId, { dateFrom, dateTo });

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "PMS", href: "/pms" }, { label: "My Dashboard" }]}
        title={<>Hi, {user.email.split("@")[0]}</>}
        description={<>Your projects, tasks and logged hours at a glance.</>}
      />

      <PmsDashboardFilters
        range={rangeParam}
        dateFrom={dateFrom}
        dateTo={dateTo}
        hasActiveFilters={Boolean(sp.range || sp.dateFrom || sp.dateTo)}
      />

      <DashboardSection>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Work</h2>
        <KpiGrid>
          <KpiCard label="Assigned Projects" value={d.assignedProjects} accent icon={<FolderKanban className="size-4" />} />
          <KpiCard label="Active Tasks" value={d.activeTasks} icon={<ListChecks className="size-4" />} />
          <KpiCard label="Completed Tasks" value={d.completedTasks} icon={<CheckCircle2 className="size-4" />} />
          <KpiCard label="Pending Tasks" value={d.pendingTasks} icon={<Clock3 className="size-4" />} />
        </KpiGrid>
      </DashboardSection>

      <DashboardSection>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Hours</h2>
        <KpiGrid>
          <KpiCard label="Today" value={d.todayHours} suffix="h" icon={<Clock className="size-4" />} />
          <KpiCard label="This Week" value={d.weekHours} suffix="h" icon={<CalendarClock className="size-4" />} />
          <KpiCard label="This Month" value={d.monthHours} suffix="h" icon={<CalendarDays className="size-4" />} />
          <KpiCard label="Productivity" value={d.productivity} suffix="%" icon={<Gauge className="size-4" />} />
        </KpiGrid>
      </DashboardSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <CardHeader><CardTitle>Weekly Hours Trend</CardTitle></CardHeader>
          <CardContent><TimeSeriesChart data={d.hoursTrend} /></CardContent>
        </GlassCard>
        <GlassCard>
          <CardHeader><CardTitle>Project-wise Hours</CardTitle></CardHeader>
          <CardContent><CategoryBarChart data={d.hoursByProject} /></CardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>My Project Progress</CardTitle>
          <Link href="/pms/me/projects" className="text-sm font-medium text-primary hover:underline">All projects →</Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {d.projects.length === 0 && <p className="text-sm text-muted-foreground">You’re not assigned to any projects yet.</p>}
          {d.projects.slice(0, 5).map((p) => (
            <Link
              key={p._id}
              href={`/pms/projects/${p._id}`}
              className="block rounded-lg border border-border/60 p-3 text-sm transition-colors hover:bg-muted/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 truncate font-medium">{p.name}</span>
                <div className="flex items-center gap-1.5">
                  <ProjectHealthBadge health={p.health as ProjectHealth} />
                  <ProjectStatusBadge status={p.status} />
                </div>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {p.clientName} · {p.myLoggedHours}h logged
                {p.remainingHours != null ? ` · ${p.remainingHours}h remaining` : ""}
              </p>
              <ProgressBar value={p.progressPercent} className="mt-2" />
            </Link>
          ))}
        </CardContent>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlarmClock className="size-4" /> Upcoming Deadlines</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {d.upcomingDeadlines.length === 0 && <p className="text-sm text-muted-foreground">No task deadlines coming up.</p>}
            {d.upcomingDeadlines.map((t) => (
              <Link
                key={t.id}
                href={`/pms/projects/${t.projectId}/tasks/${t.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-2.5 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 truncate">{t.title}</span>
                <span className={cn("shrink-0 text-xs", t.overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                  {formatDate(t.date)}
                </span>
              </Link>
            ))}
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Tasks</CardTitle>
            <Link href="/pms/me/tasks" className="text-sm font-medium text-primary hover:underline">All →</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.recentTasks.length === 0 && <p className="text-sm text-muted-foreground">Nothing assigned yet.</p>}
            {d.recentTasks.map((t) => (
              <Link
                key={t.id}
                href={`/pms/projects/${t.projectId}/tasks/${t.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-2.5 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 truncate">{t.title}</span>
                <TaskStatusBadge status={t.status} />
              </Link>
            ))}
          </CardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent Timesheet Entries</CardTitle>
          <Link href="/pms/me/timesheet" className="text-sm font-medium text-primary hover:underline">Timesheet →</Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {d.recentEntries.length === 0 && <p className="text-sm text-muted-foreground">No hours logged yet.</p>}
          {d.recentEntries.map((e) => {
            const meta = getTimesheetStatusMeta(e.status);
            return (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-2.5 text-sm">
                <div className="min-w-0">
                  <span className="font-medium">{e.hours}h</span>
                  <span className="text-muted-foreground"> · {formatDateTime(e.date)}{e.billable ? " · billable" : ""}</span>
                  {e.description && <div className="truncate text-xs text-muted-foreground">{e.description}</div>}
                </div>
                <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-xs", meta.badgeClass)}>{meta.label}</span>
              </div>
            );
          })}
        </CardContent>
      </GlassCard>
    </div>
  );
}
