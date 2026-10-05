import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Link from "next/link";
import { Plus, FolderGit2, Rocket, CheckCircle2, Users } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import ProgressBar from "@/components/pms/ProgressBar";
import { LiveProjectStatusBadge } from "@/components/tms/StatusBadges";
import LiveProjectForm from "@/components/tms/LiveProjectForm";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { canManageTraining } from "@/lib/tms-roles";
import { listLiveProjects, countLiveProjects } from "@/lib/tms/projects";
import { listProgramOptions } from "@/lib/tms/programs";
import { listBatchPickerOptions } from "@/lib/tms/batches";
import { listMentorOptions } from "@/lib/tms/mentors";
import { listStudentBatchMemberships } from "@/lib/tms/enrollments";

export default async function ProjectsPage() {
  const user = await getCurrentTmsUser();
  const canManage = user ? canManageTraining(user) : false;

  const [projects, programs, batches, mentors, memberships, total, active, completed] = await Promise.all([
    listLiveProjects({}, 500),
    listProgramOptions(),
    listBatchPickerOptions(),
    listMentorOptions(),
    listStudentBatchMemberships(),
    countLiveProjects(),
    countLiveProjects({ status: "in_progress" }),
    countLiveProjects({ status: "completed" }),
  ]);

  const totalAssigned = new Set(projects.flatMap((p) => p.studentIds)).size;
  const programOptions = programs.map((p) => ({ _id: p._id, name: p.name }));
  const batchOptions = batches.map((b) => ({ _id: b._id, name: b.name, programId: b.programId }));
  const mentorOptions = mentors.map((m) => ({ _id: m._id, name: m.name }));

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "TMS", href: "/tms" }, { label: "Projects" }]}
        title={<>Live Projects</>}
        description={<>{total} project{total === 1 ? "" : "s"} assigned to students.</>}
        actions={<>{canManage && (
          <LiveProjectForm
            programs={programOptions}
            batches={batchOptions}
            mentors={mentorOptions}
            memberships={memberships.map((m) => ({ studentId: m.studentId, fullName: m.fullName, batchId: m.batchId }))}
            trigger={
              <Button type="button" size="sm">
                <Plus className="size-3.5" data-icon="inline-start" />
                New Project
              </Button>
            }
          />
        )}</>}
      />

      <PanelListFilters>
<KpiGrid>
        <KpiCard label="Total Projects" value={total} accent icon={<FolderGit2 className="size-4" />} />
        <KpiCard label="In Progress" value={active} icon={<Rocket className="size-4" />} />
        <KpiCard label="Completed" value={completed} icon={<CheckCircle2 className="size-4" />} />
        <KpiCard label="Students Assigned" value={totalAssigned} icon={<Users className="size-4" />} />
      </KpiGrid>

      <GlassCard interactive={false}>
        <CardContent className="max-h-[65vh] overflow-auto">
          {projects.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No live projects yet.{" "}
              {canManage ? "Use “New Project”." : "Your mentors will assign projects here."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Program / Batch</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.projectCode}</TableCell>
                    <TableCell>
                      <Link href={`/tms/projects/${p._id}`} className="font-medium hover:underline">{p.title}</Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.programName}
                      {p.batchName ? <div className="text-xs">{p.batchName}</div> : null}
                    </TableCell>
                    <TableCell className="tabular-nums">{p.studentIds.length}</TableCell>
                    <TableCell className="w-36"><ProgressBar value={p.progress} /></TableCell>
                    <TableCell><LiveProjectStatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </GlassCard>
</PanelListFilters>
    </div>
  );
}
