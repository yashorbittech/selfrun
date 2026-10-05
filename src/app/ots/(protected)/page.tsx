import Link from "next/link";
import PanelDashboardHeader from "@/components/platform/panel/PanelDashboardHeader";
import { redirect } from "next/navigation";
import {
  FileCheck2,
  PencilLine,
  BookCheck,
  Zap,
  Lock,
  Archive,
  Send,
  Hourglass,
  PlayCircle,
  CheckCheck,
  CalendarX2,
  XCircle,
  Trophy,
  Users,
  Briefcase,
  GraduationCap,
  Building2,
  IdCard,
  Gauge,
  Percent,
  TrendingUp,
  TrendingDown,
  Timer,
  ArrowUpToLine,
  ArrowDownToLine,
  Plus,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import KpiGrid from "@/components/lms/KpiGrid";
import KpiCard from "@/components/lms/KpiCard";
import KpiLink from "@/components/sop/KpiLink";
import { Button } from "@/components/ui/button";
import PanelFilterBar from "@/components/platform/panel/PanelFilterBar";
import { BarsChart, DonutChart } from "@/components/sop/SopCharts";
import { AttemptTrendChart, DistributionChart, PassFailChart } from "@/components/ots/OtsCharts";
import { PageHeader, SectionCard, Chip } from "@/components/ots/OtsUi";
import { getViewer, can } from "@/lib/ots/viewer";
import { getDashboard } from "@/lib/ots/analytics";
import { getDirectory } from "@/lib/ots/people";
import { listTestOptions } from "@/lib/ots/tests";
import { listCategories } from "@/lib/ots/categories";
import { navCounts } from "@/lib/ots/page-data";
import { ASSIGNMENT_STATUSES, CANDIDATE_KINDS, fmtDuration, fmtPct, fmtMarks, labelOf, SUBMIT_REASONS } from "@/lib/ots/constants";
import { formatDateTime } from "@/lib/utils";

export default async function OtsDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/ots/login");
  if (!can(viewer, "VIEW_REPORTS") && !can(viewer, "VIEW_TESTS")) redirect("/ots/my-tests");
  const sp = await searchParams;
  const f = { from: sp.from, to: sp.to, testId: sp.testId, categoryId: sp.categoryId, kind: sp.kind, departmentId: sp.departmentId, designationId: sp.designationId, status: sp.status };
  const [d, dir, tests, cats, counts] = await Promise.all([getDashboard(f), getDirectory(), listTestOptions(), listCategories("test"), navCounts(viewer)]);
  const t = d.tests;
  const a = d.assignments;
  const p = d.performance;
  const u = d.users;
  const reports = can(viewer, "VIEW_REPORTS");

  return (
    <div className="space-y-4">
      <PanelDashboardHeader
        title="Assessment Overview"
        breadcrumbs={[{ label: "Online Tests", href: "/ots" }, { label: "Dashboard" }]}
        description="Track tests, assignments and results across employees, applicants and students, and spot who needs evaluation or follow-up."
        filters={reports && (
          <PanelFilterBar
          presets
          fields={[
            { key: "from", label: "From", type: "date" },
            { key: "to", label: "To", type: "date" },
            { key: "departmentId", label: "Department", type: "select", options: dir.departments },
            { key: "designationId", label: "Role", type: "select", options: dir.designations },
            { key: "testId", label: "Test", type: "select", options: tests },
            { key: "kind", label: "User type", type: "select", options: CANDIDATE_KINDS.map((k) => ({ value: k.value, label: k.label })) },
            { key: "categoryId", label: "Test category", type: "select", options: cats.map((c) => ({ value: c._id, label: c.name })) },
            { key: "status", label: "Status", type: "select", options: ASSIGNMENT_STATUSES.map((s) => ({ value: s.value, label: s.label })) },
          ]}
        />
        )}
        actions={
          <>
            {can(viewer, "CREATE_TEST") && (
              <Button nativeButton={false} render={<Link href="/ots/tests/new" />}>
                <Plus className="size-4" /> New test
              </Button>
            )}
            {can(viewer, "ASSIGN_TEST") && (
              <Button variant="outline" nativeButton={false} render={<Link href="/ots/assignments/new" />}>
                <Send className="size-4" /> Assign test
              </Button>
            )}
          </>
        }
      />

      {(counts.myOpen > 0 || counts.toEvaluate > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {counts.myOpen > 0 && (
            <Link href="/ots/my-tests" className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm transition-colors hover:bg-primary/10">
              <ClipboardList className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 font-semibold text-foreground">{`${counts.myOpen} test${counts.myOpen === 1 ? "" : "s"} assigned to you`}</span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )}
          {counts.toEvaluate > 0 && can(viewer, "EVALUATE_ANSWERS") && (
            <Link href="/ots/results?status=pending_evaluation" className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm transition-colors hover:bg-amber-500/15">
              <Hourglass className="size-5 shrink-0 text-amber-600" />
              <span className="min-w-0 flex-1 font-semibold text-foreground">{`${counts.toEvaluate} attempt${counts.toEvaluate === 1 ? "" : "s"} waiting for manual evaluation`}</span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )}
        </div>
      )}

      <SectionCard title="Tests" description="Draft → Published → Active → Completed/Closed → Archived">
        <KpiGrid cols={6}>
          <KpiLink href="/ots/tests?status=all" label="Total Tests" value={t.total} accent icon={<FileCheck2 className="size-4" />} />
          <KpiLink href="/ots/tests?status=draft" label="Draft" value={t.draft} icon={<PencilLine className="size-4" />} />
          <KpiLink href="/ots/tests?status=published" label="Published (upcoming)" value={t.published} icon={<BookCheck className="size-4" />} />
          <KpiLink href="/ots/tests?status=active" label="Active" value={t.active} tone={t.active > 0 ? "up" : undefined} icon={<Zap className="size-4" />} />
          <KpiLink href="/ots/tests?status=closed" label="Completed / Closed" value={t.closed} icon={<Lock className="size-4" />} />
          <KpiLink href="/ots/tests?status=archived" label="Archived" value={t.archived} icon={<Archive className="size-4" />} />
        </KpiGrid>
      </SectionCard>

      {reports && (
        <>
          <SectionCard title="Assignments">
            <KpiGrid>
              <KpiLink href="/ots/assignments" label="Total Assignments" value={a.total} accent icon={<Send className="size-4" />} />
              <KpiLink href="/ots/assignments?status=assigned" label="Pending Attempts" value={a.pending} icon={<Hourglass className="size-4" />} />
              <KpiLink href="/ots/assignments?status=in_progress" label="In Progress" value={a.inProgress} icon={<PlayCircle className="size-4" />} />
              <KpiLink href="/ots/assignments?status=finished" label="Completed" value={a.completed} icon={<CheckCheck className="size-4" />} />
              <KpiLink href="/ots/assignments?status=expired" label="Expired" value={a.expired} tone={a.expired > 0 ? "down" : undefined} icon={<CalendarX2 className="size-4" />} />
              <KpiLink href="/ots/results?result=pass" label="Passed" value={a.passed} tone="up" icon={<Trophy className="size-4" />} />
              <KpiLink href="/ots/results?result=fail" label="Failed" value={a.failed} tone={a.failed > 0 ? "down" : undefined} icon={<XCircle className="size-4" />} />
              <KpiLink href="/ots/results?status=pending_evaluation" label="Awaiting Evaluation" value={a.awaitingEvaluation} icon={<Hourglass className="size-4" />} />
            </KpiGrid>
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="People Assigned">
              <KpiGrid className="lg:grid-cols-3">
                <KpiLink href="/ots/assignments?kind=employee" label="Employees" value={u.employees} icon={<Users className="size-4" />} />
                <KpiLink href="/ots/assignments?kind=applicant" label="Applicants" value={u.applicants} icon={<Briefcase className="size-4" />} />
                <KpiLink href="/ots/assignments?kind=student" label="Students" value={u.students} icon={<GraduationCap className="size-4" />} />
                <KpiLink href="/ots/analytics?groupBy=department" label="Departments Covered" value={u.departments} icon={<Building2 className="size-4" />} />
                <KpiLink href="/ots/analytics?groupBy=designation" label="Roles Covered" value={u.roles} icon={<IdCard className="size-4" />} />
              </KpiGrid>
            </SectionCard>
            <SectionCard title="Performance" description={`${p.attempts} evaluated attempt${p.attempts === 1 ? "" : "s"}${sp.from || sp.to ? " in the selected dates" : ""}`}>
              <KpiGrid className="lg:grid-cols-3">
                <KpiCard label="Average Score" value={<span>{fmtMarks(p.avgScore)}</span>} icon={<Gauge className="size-4" />} />
                <KpiCard label="Average %" value={<span>{fmtPct(p.avgPercentage)}</span>} icon={<Percent className="size-4" />} />
                <KpiCard label="Pass Rate" value={<span>{fmtPct(p.passRate)}</span>} tone={p.passRate !== null && p.passRate >= 70 ? "up" : undefined} icon={<TrendingUp className="size-4" />} />
                <KpiCard label="Failure Rate" value={<span>{fmtPct(p.failRate)}</span>} tone={p.failRate !== null && p.failRate > 40 ? "down" : undefined} icon={<TrendingDown className="size-4" />} />
                <KpiCard label="Avg Completion Time" value={<span>{fmtDuration(p.avgTimeSec)}</span>} icon={<Timer className="size-4" />} />
                <KpiCard label="Highest / Lowest" value={<span>{`${fmtPct(p.highest)} / ${fmtPct(p.lowest)}`}</span>} icon={p.highest !== null ? <ArrowUpToLine className="size-4" /> : <ArrowDownToLine className="size-4" />} />
              </KpiGrid>
            </SectionCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Submissions" description="Attempts submitted per week, last 12 weeks">
              <AttemptTrendChart data={d.charts.trend} />
            </SectionCard>
            <SectionCard title="Score Distribution" description="Evaluated attempts by percentage band">
              <DistributionChart data={d.charts.distribution} />
            </SectionCard>
            <SectionCard title="Assignment Status" description="Click a slice to open the list">
              <DonutChart data={d.charts.assignmentStatus} emptyLabel="Nothing assigned yet." />
            </SectionCard>
            <SectionCard title="Pass / Fail by Test">
              <PassFailChart data={d.charts.passFailByTest} />
            </SectionCard>
            <SectionCard title="Average % by Department" description="Employees' scored results — click to analyse">
              <BarsChart data={d.charts.byDepartment} suffix="%" max={100} emptyLabel="No employee results yet." />
            </SectionCard>
            <SectionCard title="Average % by Test">
              <BarsChart data={d.charts.byTest} suffix="%" max={100} emptyLabel="No results yet." />
            </SectionCard>
            <SectionCard title="Candidates by Type">
              <DonutChart data={d.charts.byKind} emptyLabel="Nothing assigned yet." />
            </SectionCard>
            <SectionCard title="Test Status">
              <DonutChart data={d.charts.testStatus} emptyLabel="No tests yet." />
            </SectionCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <SectionCard title="Recently Created Tests">
              <ul className="divide-y divide-border/40 text-sm">
                {d.recent.tests.length === 0 && <li className="py-2 text-xs text-muted-foreground">None yet.</li>}
                {d.recent.tests.map((x) => (
                  <li key={x._id} className="py-1.5">
                    <Link href={`/ots/tests/${x._id}`} className="block truncate hover:text-primary">{x.name}</Link>
                    <p className="text-[11px] text-muted-foreground">{`${x.code} · ${formatDateTime(x.createdAt)}`}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard title="Recently Assigned">
              <ul className="divide-y divide-border/40 text-sm">
                {d.recent.dispatches.length === 0 && <li className="py-2 text-xs text-muted-foreground">None yet.</li>}
                {d.recent.dispatches.map((x) => (
                  <li key={x._id} className="py-1.5">
                    <Link href={`/ots/assignments?dispatchId=${x._id}`} className="block truncate hover:text-primary">{x.targetSummary || "Assignment"}</Link>
                    <p className="text-[11px] text-muted-foreground">{`${x.created} assigned · ${formatDateTime(x.createdAt)}`}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard title="Recently Completed">
              <ul className="divide-y divide-border/40 text-sm">
                {d.recent.completed.length === 0 && <li className="py-2 text-xs text-muted-foreground">None yet.</li>}
                {d.recent.completed.map((x) => (
                  <li key={x.attemptId} className="py-1.5">
                    <Link href={`/ots/results/${x.attemptId}`} className="block truncate hover:text-primary">{`${x.who} · ${x.testName}`}</Link>
                    <p className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                      {x.status === "pending_evaluation" ? <Chip tone="amber">Awaiting evaluation</Chip> : x.passed ? <Chip tone="green">{fmtPct(x.percentage)} · Pass</Chip> : <Chip tone="rose">{fmtPct(x.percentage)} · Fail</Chip>}
                      {x.reason && x.reason !== "MANUAL" && <Chip tone="amber">{SUBMIT_REASONS[x.reason]}</Chip>}
                      <span>{formatDateTime(x.at)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard title="Recent Certificates">
              <ul className="divide-y divide-border/40 text-sm">
                {d.recent.certificates.length === 0 && <li className="py-2 text-xs text-muted-foreground">None yet.</li>}
                {d.recent.certificates.map((x) => (
                  <li key={x._id} className="py-1.5">
                    <Link href={`/ots/certificates?q=${encodeURIComponent(x.certificateNumber)}`} className="block truncate hover:text-primary">{`${x.candidateName} · ${x.testName}`}</Link>
                    <p className="text-[11px] text-muted-foreground">{`${x.certificateNumber} · ${formatDateTime(x.issuedOn)}${x.revoked ? " · revoked" : ""}`}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
          <p className="text-[11px] text-muted-foreground">{`Candidate types: ${CANDIDATE_KINDS.map((k) => `${k.label} (${k.source})`).join(" · ")}. ${labelOf(ASSIGNMENT_STATUSES, "completed")} counts include submitted and evaluated assignments.`}</p>
        </>
      )}
    </div>
  );
}
