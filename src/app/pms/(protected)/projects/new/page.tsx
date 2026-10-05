import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import ProjectForm from "@/components/pms/ProjectForm";
import { getCurrentPmsUser } from "@/lib/pms-auth";
import { canManageProjects } from "@/lib/pms-roles";
import { listClientOptions } from "@/lib/pms/clients";
import { listEmployeeOptions } from "@/lib/hrms/employees";
import { getPmsSettings } from "@/lib/pms/settings";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const user = await getCurrentPmsUser();
  if (!user || !canManageProjects(user)) redirect("/pms/projects");

  const sp = await searchParams;
  const [clients, employees, settings] = await Promise.all([
    listClientOptions(),
    listEmployeeOptions(),
    getPmsSettings(),
  ]);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "PMS", href: "/pms" }, { label: "Projects", href: "/pms/projects" }, { label: "New" }]}
        title={<>New Project</>}
        description={<>The project ID is generated automatically on save.</>}
      />

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You need at least one client before creating a project. Add one from the Clients page.
        </p>
      ) : (
        <ProjectForm
          clients={clients.map((c) => ({ _id: c._id, label: c.companyName, sub: c.clientCode }))}
          employees={employees.map((e) => ({ _id: e._id, label: e.name, sub: e.employeeCode }))}
          categories={settings.categories}
          technologySuggestions={settings.technologySuggestions}
          defaultCurrency={settings.defaultCurrency}
          defaultClientId={sp.clientId}
        />
      )}
    </div>
  );
}
