import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, GraduationCap, School, CalendarDays } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/tms/StatusBadges";
import ApplicationStatusControl from "@/components/tms/ApplicationStatusControl";
import ApplicationActions from "@/components/tms/ApplicationActions";
import ConvertApplicationForm from "@/components/tms/ConvertApplicationForm";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { canManageStudents } from "@/lib/tms-roles";
import { getApplication, serializeApplication } from "@/lib/tms/applications";
import { getProgram, listProgramOptions } from "@/lib/tms/programs";
import { listBatchesForProgram } from "@/lib/tms/batches";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  const [user, program, programs, batches] = await Promise.all([
    getCurrentTmsUser(),
    getProgram(application.programId),
    listProgramOptions(),
    listBatchesForProgram(application.programId),
  ]);

  const canManage = user ? canManageStudents(user) : false;
  const a = serializeApplication(application);
  const converted = Boolean(a.studentId);

  const convertBatchOptions = batches
    .filter((b) => b.status === "upcoming" || b.status === "running")
    .map((b) => ({
      _id: b._id,
      label: `${b.name} (${b.batchCode})`,
      full: b.availableSeats <= 0,
      seatsLeft: b.availableSeats,
    }));

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "TMS", href: "/tms" }, { label: "Applications", href: "/tms/applications" }, { label: a.fullName }]}
        title={<><span className="inline-flex flex-wrap items-center gap-2">{a.fullName}<ApplicationStatusBadge status={a.status} /></span></>}
        description={<><span className="font-mono">{a.applicationCode}</span>
            {program ? (
              <>
                {" · "}
                <Link href={`/tms/programs/${program._id}`} className="text-primary hover:underline">{program.name}</Link>
              </>
            ) : null}
            {a.source ? ` · via ${a.source}` : ""}</>}
        actions={<><div className="flex flex-wrap items-center gap-2">
          {canManage && !converted && (
            <ApplicationStatusControl applicationId={a._id} status={a.status} />
          )}
          {canManage && !converted && (
            <ConvertApplicationForm
              applicationId={a._id}
              applicantName={a.fullName}
              programName={program?.name ?? "the"}
              batches={convertBatchOptions}
              trigger={
                <Button type="button" size="sm">
                  <GraduationCap className="size-3.5" data-icon="inline-start" />
                  Convert to Student
                </Button>
              }
            />
          )}
          {canManage && <ApplicationActions application={a} programs={programs.map((p) => ({ _id: p._id, name: p.name }))} />}
        </div></>}
      />

      {converted && (
        <GlassCard interactive={false}>
          <CardContent className="flex items-center justify-between gap-3 py-4 text-sm">
            <span className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
              <GraduationCap className="size-4" />
              Converted to a student{a.convertedAt ? ` on ${formatDate(a.convertedAt)}` : ""}.
            </span>
            {a.studentId && (
              <Link href={`/tms/students/${a.studentId}`} className="text-primary hover:underline">View student →</Link>
            )}
          </CardContent>
        </GlassCard>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <a href={`mailto:${a.email}`} className="text-primary hover:underline">{a.email}</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <span>{a.mobile || "No phone"}</span>
            </div>
            <div className="flex items-center gap-2">
              <School className="size-4 shrink-0 text-muted-foreground" />
              <span>{a.college || "College not provided"}{a.graduationYear ? ` · ${a.graduationYear}` : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <span>Applied {formatDateTime(a.createdAt)}</span>
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader><CardTitle>Message &amp; notes</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Applicant message</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{a.message || "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Internal notes</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{a.notes || "—"}</p>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
