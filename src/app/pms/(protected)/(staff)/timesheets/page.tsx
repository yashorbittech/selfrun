import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import { Clock, CheckCircle2, Hourglass, Coins, Download } from "lucide-react";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import { buttonVariants } from "@/components/ui/button";
import PmsDashboardFilters from "@/components/pms/PmsDashboardFilters";
import TimesheetReviewTable from "@/components/pms/timesheet/TimesheetReviewTable";
import { getCurrentPmsUser } from "@/lib/pms-auth";
import { canReviewTimesheets } from "@/lib/pms-roles";
import { listEntries, serializeEntry, countEntries } from "@/lib/pms/timesheets";
import { searchProjects } from "@/lib/pms/projects";
import { listTasks } from "@/lib/pms/tasks";
import { listEmployeeOptions } from "@/lib/hrms/employees";
import { isValidDateRangePreset, resolveDateRangePreset, type DateRangePreset } from "@/lib/date-ranges";

export default async function TimesheetReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; dateFrom?: string; dateTo?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentPmsUser();
  if (!user || !canReviewTimesheets(user)) redirect("/pms");

  const showAll = sp.view === "all";

  const rangeParam: DateRangePreset =
    sp.range && isValidDateRangePreset(sp.range) ? sp.range : sp.dateFrom || sp.dateTo ? "custom" : "thisMonth";
  let dateFrom: string | undefined;
  let dateTo: string | undefined;
  if (rangeParam === "custom") {
    dateFrom = sp.dateFrom;
    dateTo = sp.dateTo;
  } else {
    const r = resolveDateRangePreset(rangeParam)!;
    dateFrom = r.from.toISOString().slice(0, 10);
    dateTo = r.to.toISOString().slice(0, 10);
  }

  const [entries, submittedCount, approvedCount, employees, projectsRes] = await Promise.all([
    showAll ? listEntries({ dateFrom, dateTo, limit: 1000 }) : listEntries({ status: "submitted", limit: 1000 }),
    countEntries({ status: "submitted" }),
    countEntries({ status: "approved", dateFrom, dateTo }),
    listEmployeeOptions(),
    searchProjects({ pageSize: 1000 }),
  ]);

  const empName = new Map(employees.map((e) => [e._id, e.name]));
  const projName = new Map(projectsRes.items.map((p) => [p._id, p.name]));

  // Resolve task titles for the rows shown.
  const taskIds = Array.from(new Set(entries.map((e) => e.taskId).filter((x): x is string => Boolean(x))));
  const taskTitleById = new Map<string, string>();
  if (taskIds.length > 0) {
    const projectIds = Array.from(new Set(entries.map((e) => e.projectId)));
    const all = await Promise.all(projectIds.map((pid) => listTasks(pid, { includeSubtasks: true })));
    for (const list of all) for (const t of list) taskTitleById.set(t._id, t.title);
  }

  const totalHours = Math.round(entries.reduce((s, e) => s + e.hours, 0) * 10) / 10;
  const billableHours = Math.round(entries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0) * 10) / 10;

  const rows = entries.map((e) => ({
    ...serializeEntry(e),
    employeeName: empName.get(e.employeeId) ?? "Unknown",
    projectName: projName.get(e.projectId) ?? "Unknown",
    taskTitle: e.taskId ? taskTitleById.get(e.taskId) ?? null : null,
  }));

  const exportParams = new URLSearchParams();
  if (dateFrom) exportParams.set("dateFrom", dateFrom);
  if (dateTo) exportParams.set("dateTo", dateTo);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "PMS", href: "/pms" }, { label: "Timesheet Review" }]}
        title={<>Timesheet Review</>}
        description={<>Review and approve submitted hours for project delivery and billable tracking.</>}
        actions={<><div className="flex items-center gap-2">
          <a
            href={`/pms/timesheets${showAll ? "" : "?view=all"}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {showAll ? "Show pending only" : "Show all entries"}
          </a>
          <a href={`/api/pms/reports/portfolio?format=xlsx&${exportParams}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Download className="size-3.5" data-icon="inline-start" /> XLSX
          </a>
        </div></>}
      />

      {showAll && (
        <PmsDashboardFilters
          range={rangeParam}
          dateFrom={dateFrom ?? new Date().toISOString().slice(0, 10)}
          dateTo={dateTo ?? new Date().toISOString().slice(0, 10)}
          hasActiveFilters={Boolean(sp.range || sp.dateFrom || sp.dateTo)}
        />
      )}

      <KpiGrid>
        <KpiCard label="Awaiting Review" value={submittedCount} accent icon={<Hourglass className="size-4" />} />
        <KpiCard label="Approved (range)" value={approvedCount} icon={<CheckCircle2 className="size-4" />} />
        <KpiCard label="Hours Shown" value={totalHours} suffix="h" icon={<Clock className="size-4" />} />
        <KpiCard label="Billable Shown" value={billableHours} suffix="h" icon={<Coins className="size-4" />} />
      </KpiGrid>

      <TimesheetReviewTable entries={rows} />
    </div>
  );
}
