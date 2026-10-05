import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CircleDollarSign, Layers, Building2, ListChecks } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { ProjectStatusBadge, PriorityBadge, ProjectHealthBadge } from "@/components/pms/StatusBadges";
import ProjectStatusControl from "@/components/pms/ProjectStatusControl";
import ProjectProgressControl from "@/components/pms/ProjectProgressControl";
import ProjectActions from "@/components/pms/ProjectActions";
import ProjectTeamManager from "@/components/pms/ProjectTeamManager";
import ProjectTabs from "@/components/pms/ProjectTabs";
import MilestonesManager from "@/components/pms/MilestonesManager";
import { getCurrentPmsUser } from "@/lib/pms-auth";
import { canManageProjects } from "@/lib/pms-roles";
import { checkProjectAccess } from "@/lib/pms/access";
import { getProject, serializeProject } from "@/lib/pms/projects";
import { getClient } from "@/lib/pms/clients";
import { listProjectMembers, availableEmployees } from "@/lib/pms/project-members";
import { recentActivityForProject, serializeActivityLog } from "@/lib/pms/activity";
import { taskCountsByStatus, projectHasTasks, listTasks } from "@/lib/pms/tasks";
import { listMilestones } from "@/lib/pms/milestones";
import { TASK_STATUSES } from "@/lib/pms/constants";
import { employeeFullName, getEmployee } from "@/lib/hrms/employees";
import { getProjectChannelSlug } from "@/lib/messenger/projects";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, project] = await Promise.all([getCurrentPmsUser(), getProject(id)]);
  if (!project) notFound();
  if (user && !(await checkProjectAccess(user, id)).allowed) notFound();

  const canManage = user ? canManageProjects(user) : false;
  const serialized = serializeProject(project);

  const [client, members, employees, activity, manager, taskCounts, hasTasks, milestones, topTasks] = await Promise.all([
    getClient(project.clientId),
    listProjectMembers(id),
    availableEmployees(),
    recentActivityForProject(id, 20),
    project.projectManagerId ? getEmployee(project.projectManagerId) : Promise.resolve(null),
    taskCountsByStatus(id),
    projectHasTasks(id),
    listMilestones(id),
    listTasks(id, {}),
  ]);
  const totalTasks = Object.values(taskCounts).reduce((s, n) => s + n, 0);
  const messengerSlug = await getProjectChannelSlug(id).catch(() => null);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[
          { label: "PMS", href: "/pms" },
          { label: "Projects", href: "/pms/projects" },
          { label: project.name },
        ]}
        title={<><span className="inline-flex flex-wrap items-center gap-2">{project.name}<PriorityBadge priority={project.priority} />
            <ProjectHealthBadge health={serialized.health} /></span></>}
        description={<><span className="font-mono">{project.projectCode}</span>
            {client ? (
              <>
                {" · "}
                <Link href={`/pms/clients/${client._id}`} className="hover:text-primary hover:underline">
                  {client.companyName}
                </Link>
              </>
            ) : null}
            {project.category ? ` · ${project.category}` : ""}</>}
        actions={<><div className="flex flex-wrap items-center gap-2">
          {canManage ? (
            <ProjectStatusControl projectId={id} status={project.status} />
          ) : (
            <ProjectStatusBadge status={project.status} />
          )}
          {canManage && (
            <Link href={`/pms/costing/${id}`} className="text-sm font-medium text-primary hover:underline">
              Costing &amp; Reports →
            </Link>
          )}
          {messengerSlug && (
            <Link href={`/messenger/projects/${messengerSlug}`} className="text-sm font-medium text-primary hover:underline">
              Team channel →
            </Link>
          )}
          {canManage && <ProjectActions projectId={id} projectName={project.name} />}
        </div></>}
      />

      <ProjectTabs projectId={id} />

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard>
          <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-3.5" />
              {project.startDate ? formatDate(project.startDate) : "No start"} → {project.endDate ? formatDate(project.endDate) : "No end"}
            </p>
            <p className="flex items-center gap-2">
              <CircleDollarSign className="size-3.5" />
              {project.estimatedBudget != null ? formatCurrency(project.estimatedBudget, project.currency) : "No budget set"}
            </p>
            <p className="flex items-center gap-2">
              <Building2 className="size-3.5" />
              PM: {manager ? employeeFullName(manager) : "Unassigned"}
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
          <CardContent>
            <ProjectProgressControl
              projectId={id}
              progressPercent={project.progressPercent}
              editable={canManage}
              taskDriven={hasTasks}
            />
          </CardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><ListChecks className="size-4" /> Tasks ({totalTasks})</CardTitle>
          <Link href={`/pms/projects/${id}/board`} className="text-sm font-medium text-primary hover:underline">
            Open board →
          </Link>
        </CardHeader>
        <CardContent>
          {totalTasks === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tasks yet. <Link href={`/pms/projects/${id}/board`} className="text-primary hover:underline">Add the first one</Link>.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {TASK_STATUSES.map((s) => (
                <Link
                  key={s.value}
                  href={`/pms/projects/${id}/tasks`}
                  className="rounded-lg border border-border/60 p-3 text-center transition-colors hover:bg-muted/50"
                >
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">{taskCounts[s.value] ?? 0}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </GlassCard>

      {project.technologies.length > 0 && (
        <GlassCard>
          <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="size-4" /> Technology Stack</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {project.technologies.map((t) => (
              <span key={t} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{t}</span>
            ))}
          </CardContent>
        </GlassCard>
      )}

      {project.description && (
        <GlassCard>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap text-muted-foreground">{project.description}</CardContent>
        </GlassCard>
      )}

      <MilestonesManager
        projectId={id}
        milestones={milestones}
        tasks={topTasks.map((t) => ({ _id: t._id, title: t.title, taskCode: t.taskCode }))}
        canManage={canManage}
      />

      <ProjectTeamManager
        projectId={id}
        currency={project.currency}
        members={members.map((m) => ({
          _id: m._id,
          employeeId: m.employeeId,
          employeeName: m.employeeName,
          employeeCode: m.employeeCode,
          role: m.role,
          allocationPercent: m.allocationPercent,
          billableRate: m.billableRate,
          costRate: m.costRate,
          active: m.active,
        }))}
        employees={employees.map((e) => ({ _id: e._id, name: e.name, employeeCode: e.employeeCode }))}
        canManage={canManage}
        managerEmployeeId={project.projectManagerId}
      />

      <GlassCard>
        <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {activity.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
          {activity.map((a) => {
            const s = serializeActivityLog(a);
            return (
              <div key={s._id} className="flex items-start gap-3 rounded-lg border border-border/60 p-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="capitalize text-foreground">
                    {s.action.replace(/_/g, " ")}
                    {s.summary ? <span className="text-muted-foreground"> — {s.summary}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.actorEmail ?? "system"} · {formatDateTime(s.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </GlassCard>
    </div>
  );
}
