import Link from "next/link";
import {
  GraduationCap,
  UserRound,
  Layers,
  CalendarCheck,
  Award,
  Wallet,
  FolderKanban,
  ClipboardList,
  CalendarClock,
} from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import ProgressBar from "@/components/pms/ProgressBar";
import { ProgressRing, InfoCard, PortalPageHeader, LinkPill } from "@/components/portal/widgets";
import LeadStageCard from "@/components/portal/LeadStageCard";
import type { LearnerOverview } from "@/lib/portal/student";
import type { PortalLeadView } from "@/lib/portal/lead";
import { cn } from "@/lib/utils";

function summarisePayments(payments: LearnerOverview["payments"]) {
  let paid = 0;
  let pending = 0;
  for (const p of payments) {
    paid += (p as { paidAmount?: number }).paidAmount ?? 0;
    pending += (p as { pendingAmount?: number }).pendingAmount ?? 0;
  }
  const status =
    pending > 0 && paid > 0
      ? "Partly paid"
      : pending > 0
        ? "Due"
        : payments.length > 0
          ? "Cleared"
          : "—";
  return { paid, pending, status };
}

export default function LearnerDashboard({
  data,
  role,
  firstName,
  leadView,
}: {
  data: LearnerOverview;
  role: "intern" | "trainee";
  firstName: string;
  leadView?: PortalLeadView | null;
}) {
  const { overview, attendance } = data;
  const primary = overview.enrollments.find((e) => e.status === "active") ?? overview.enrollments[0] ?? null;
  const pay = summarisePayments(data.payments);
  const isIntern = role === "intern";
  const dueAssignments = data.assignments.filter((a) => !a.submission || a.submission.status === "resubmit");

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <PortalPageHeader
        title={`Welcome, ${firstName}`}
        subtitle={primary ? `${primary.programName} · ${primary.batchName}` : "Your training overview"}
      />

      {leadView && <LeadStageCard view={leadView} compact />}

      {/* HERO — differs by role */}
      {isIntern ? (
        <GlassCard>
          <CardContent className="flex flex-col items-center gap-6 py-6 sm:flex-row sm:items-center sm:gap-10">
            <ProgressRing value={overview.averageProgress} label="Internship" />
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <HeroStat icon={UserRound} label="Mentor" value={primary?.mentorName ?? "To be assigned"} />
              <HeroStat icon={Layers} label="Batch" value={primary ? `${primary.batchName} (${primary.batchCode})` : "—"} />
              <HeroStat icon={CalendarCheck} label="Attendance" value={`${attendance.ratePercent}%`} />
              <HeroStat icon={Award} label="Certificate" value={data.certificates.length > 0 ? "Issued" : `${overview.averageProgress}% to eligibility`} />
            </div>
          </CardContent>
        </GlassCard>
      ) : (
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-base">Training progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.enrollments.map((e) => (
              <div key={e.enrollmentId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{e.programName}</span>
                  <span className="text-muted-foreground">{e.progressPercent}%</span>
                </div>
                <ProgressBar value={e.progressPercent} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {e.batchName} · {e.startDate ?? "TBD"} → {e.endDate ?? "TBD"} · Mentor: {e.mentorName ?? "TBD"}
                </p>
              </div>
            ))}
            {overview.enrollments.length === 0 && <p className="text-sm text-muted-foreground">Not enrolled in a program yet.</p>}
          </CardContent>
        </GlassCard>
      )}

      <KpiGrid>
        <KpiCard label="Overall Progress" value={overview.averageProgress} suffix="%" accent icon={<GraduationCap className="size-4" />} />
        <KpiCard label="Attendance" value={attendance.ratePercent} suffix="%" icon={<CalendarCheck className="size-4" />} />
        <KpiCard label="Assignments Due" value={dueAssignments.length} tone={dueAssignments.length > 0 ? "down" : undefined} icon={<ClipboardList className="size-4" />} />
        <KpiCard label="Certificates" value={data.certificates.length} icon={<Award className="size-4" />} />
      </KpiGrid>

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="size-4" /> Live projects
            </CardTitle>
            <LinkPill href="/portal/projects">All →</LinkPill>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.projects.length === 0 && <p className="text-sm text-muted-foreground">No projects assigned yet.</p>}
            {data.projects.slice(0, 4).map((p) => (
              <div key={p._id} className="rounded-xl border border-border/50 px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium text-foreground">{p.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground capitalize">{p.status.replace(/_/g, " ")}</span>
                </div>
                <ProgressBar value={p.progress ?? 0} className="mt-1.5" />
              </div>
            ))}
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4" /> Upcoming classes
            </CardTitle>
            <LinkPill href="/portal/schedule">Schedule →</LinkPill>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.batchIds.length === 0 && <p className="text-sm text-muted-foreground">No batch yet.</p>}
            <ScheduleStrip batchIds={data.batchIds} />
          </CardContent>
        </GlassCard>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard title="Assignments due">
          {dueAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing due — nice work.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {dueAssignments.slice(0, 5).map((a) => (
                <li key={a._id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-foreground">{a.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{a.dueDate ?? "no date"}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/portal/assignments" className="mt-2 block text-xs font-medium text-primary hover:underline">
            Open assignments →
          </Link>
        </InfoCard>

        <InfoCard title="Payment status">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-4" />
            </span>
            <div>
              <p className={cn("font-semibold", pay.status === "Due" ? "text-destructive" : "text-foreground")}>{pay.status}</p>
              {pay.pending > 0 && <p className="text-xs text-muted-foreground">₹{pay.pending.toLocaleString("en-IN")} outstanding</p>}
            </div>
          </div>
          <Link href="/portal/payments" className="mt-2 block text-xs font-medium text-primary hover:underline">
            View payments →
          </Link>
        </InfoCard>

        <InfoCard title="Certificate progress">
          <ProgressBar value={overview.averageProgress} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {data.certificates.length > 0
              ? `${data.certificates.length} certificate${data.certificates.length === 1 ? "" : "s"} issued`
              : "Issued on programme completion"}
          </p>
          <Link href="/portal/certificates" className="mt-2 block text-xs font-medium text-primary hover:underline">
            Certificates →
          </Link>
        </InfoCard>
      </div>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

async function ScheduleStrip({ batchIds }: { batchIds: string[] }) {
  const { getLearnerSchedule } = await import("@/lib/portal/student");
  const { upcoming } = await getLearnerSchedule(batchIds);
  if (upcoming.length === 0) return <p className="text-sm text-muted-foreground">No upcoming classes.</p>;
  return (
    <ul className="space-y-1.5 text-sm">
      {upcoming.slice(0, 5).map((c) => (
        <li key={c._id} className="flex items-center justify-between gap-2">
          <span className="truncate text-foreground">{c.topic}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {c.date}
            {c.startTime ? ` · ${c.startTime}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
