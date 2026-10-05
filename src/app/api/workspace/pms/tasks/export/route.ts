import { NextRequest, NextResponse } from "next/server";
import { authorizeWorkspaceApi } from "@/lib/workspace/access";
import { exportAllTasks } from "@/lib/workspace/pms-work-items";
import { exportProjects } from "@/lib/pms/projects";
import { listEmployeeOptions } from "@/lib/hrms/employees";
import { isValidTaskStatus, isValidPriority, getTaskStatusMeta, getPriorityMeta, type TaskStatus, type Priority } from "@/lib/pms/constants";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await authorizeWorkspaceApi("manage.pms.tasks");
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const priority = sp.get("priority");
  const idsParam = sp.get("ids");
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : undefined;

  const rows = await exportAllTasks({
    search: sp.get("search") ?? undefined,
    status: status && isValidTaskStatus(status) ? (status as TaskStatus) : undefined,
    priority: priority && isValidPriority(priority) ? (priority as Priority) : undefined,
    ids,
  });

  const [projects, employees] = await Promise.all([
    exportProjects({ ids: Array.from(new Set(rows.map((r) => r.projectId))) }),
    listEmployeeOptions(),
  ]);
  const projectName = new Map(projects.map((p) => [p._id, p.name]));
  const empName = new Map(employees.map((e) => [e._id, e.name]));

  const csv = toCsv(rows, [
    { header: "Task Code", value: (r) => r.taskCode },
    { header: "Title", value: (r) => r.title },
    { header: "Project", value: (r) => projectName.get(r.projectId) ?? "" },
    { header: "Status", value: (r) => getTaskStatusMeta(r.status).label },
    { header: "Priority", value: (r) => getPriorityMeta(r.priority).label },
    { header: "Assignee", value: (r) => (r.assigneeId ? empName.get(r.assigneeId) ?? "" : "") },
    { header: "Due Date", value: (r) => r.dueDate ?? "" },
    { header: "Created At", value: (r) => new Date(r.createdAt).toISOString() },
  ]);

  const filename = `admin-pms-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
