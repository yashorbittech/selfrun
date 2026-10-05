import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound, redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import ProjectForm from "@/components/pms/ProjectForm";
import { getCurrentPmsUser } from "@/lib/pms-auth";
import { canManageProjects } from "@/lib/pms-roles";
import { getProject, serializeProject } from "@/lib/pms/projects";
import { listClientOptions } from "@/lib/pms/clients";
import { listEmployeeOptions } from "@/lib/hrms/employees";
import { getPmsSettings } from "@/lib/pms/settings";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentPmsUser();
  if (!user || !canManageProjects(user)) redirect(`/pms/projects/${id}`);

  const [project, clients, employees, settings] = await Promise.all([
    getProject(id),
    listClientOptions(),
    listEmployeeOptions(),
    getPmsSettings(),
  ]);
  if (!project) notFound();

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[
          { label: "PMS", href: "/pms" },
          { label: "Projects", href: "/pms/projects" },
          { label: project.name, href: `/pms/projects/${id}` },
          { label: "Edit" },
        ]}
        title={<>Edit Project</>}
        description={<>{project.projectCode}</>}
      />

      <ProjectForm
        project={serializeProject(project)}
        clients={clients.map((c) => ({ _id: c._id, label: c.companyName, sub: c.clientCode }))}
        employees={employees.map((e) => ({ _id: e._id, label: e.name, sub: e.employeeCode }))}
        categories={settings.categories}
        technologySuggestions={settings.technologySuggestions}
        defaultCurrency={settings.defaultCurrency}
      />
    </div>
  );
}
