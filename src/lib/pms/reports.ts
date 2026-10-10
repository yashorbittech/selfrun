import "server-only";
import { getProject } from "@/lib/pms/projects";
import { getClient } from "@/lib/pms/clients";
import { listProjectMembers } from "@/lib/pms/project-members";
import { computeProjectFinancials, type ProjectFinancials } from "@/lib/pms/costing";
import { projectLoggedHours } from "@/lib/pms/timesheets";
import { taskCountsByStatus, listTasks } from "@/lib/pms/tasks";
import { getEmployee, employeeFullName } from "@/lib/hrms/employees";
import { TASK_STATUSES, getProjectStatusMeta } from "@/lib/pms/constants";

export interface EmployeeContribution {
  employeeId: string;
  name: string;
  role: string;
  hours: number;
  billableHours: number;
  costRate: number;
  billRate: number;
  cost: number;
  revenue: number;
}

export interface ProjectReport {
  generatedAt: string;
  range: { dateFrom?: string; dateTo?: string };
  summary: {
    projectCode: string;
    name: string;
    client: string;
    manager: string;
    status: string;
    statusLabel: string;
    priority: string;
    startDate: string | null;
    endDate: string | null;
    progressPercent: number;
    currency: string;
  };
  financials: ProjectFinancials;
  taskProgress: { status: string; label: string; count: number }[];
  totalTasks: number;
  doneTasks: number;
  contributions: EmployeeContribution[];
}

export async function buildProjectReport(
  projectId: string,
  range: { dateFrom?: string; dateTo?: string } = {}
): Promise<ProjectReport | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const [client, members, financials, hours, taskCounts, tasks] = await Promise.all([
    getClient(project.clientId),
    listProjectMembers(projectId),
    computeProjectFinancials(projectId, range),
    projectLoggedHours(projectId, range),
    taskCountsByStatus(projectId),
    listTasks(projectId, {}),
  ]);
  if (!financials) return null;

  const manager = project.projectManagerId ? await getEmployee(project.projectManagerId) : null;

  const contributions: EmployeeContribution[] = await Promise.all(
    hours.byEmployee.map(async (row): Promise<EmployeeContribution> => {
      const member = members.find((m) => m.employeeId === row.employeeId);
      const emp = member ? null : await getEmployee(row.employeeId);
      const costRate = member?.costRate ?? financials.avgCostRate;
      const billRate = member?.billableRate ?? financials.avgBillRate;
      return {
        employeeId: row.employeeId,
        name: member?.employeeName ?? (emp ? employeeFullName(emp) : "Unknown"),
        role: member?.role ?? "contributor",
        hours: row.hours,
        billableHours: row.billableHours,
        costRate,
        billRate,
        cost: Math.round(row.hours * costRate),
        revenue: Math.round(row.billableHours * billRate),
      };
    })
  );
  contributions.sort((a, b) => b.hours - a.hours);

  const taskProgress = TASK_STATUSES.map((s) => ({ status: s.value, label: s.label, count: taskCounts[s.value] ?? 0 }));
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;

  return {
    generatedAt: new Date().toISOString(),
    range,
    summary: {
      projectCode: project.projectCode,
      name: project.name,
      client: client?.companyName ?? "—",
      manager: manager ? employeeFullName(manager) : "Unassigned",
      status: project.status,
      statusLabel: getProjectStatusMeta(project.status).label,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      progressPercent: project.progressPercent,
      currency: project.currency,
    },
    financials,
    taskProgress,
    totalTasks,
    doneTasks,
    contributions,
  };
}
