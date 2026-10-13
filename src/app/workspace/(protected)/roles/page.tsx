import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { requireWorkspaceAccess } from "@/lib/workspace/access";
import { listAccessAudit, listCustomRoles } from "@/lib/workspace/custom-roles";
import { redirect } from "next/navigation";
import RolesManager from "./RolesManager";

export const dynamic = "force-dynamic";

export default async function CustomRolesPage() {
  const user = await requireWorkspaceAccess("company.roles");
  // Defining roles hands out permissions: Super Admin only (a delegated user manager only assigns existing roles, on the Users page).
  if (!user.roles.includes("super_admin")) redirect("/workspace/users");
  const [roles, audit] = await Promise.all([listCustomRoles(), listAccessAudit(60)]);
  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "Workspace", href: "/workspace" }, { label: "Custom roles" }]}
        title={<>Custom roles</>}
        description={<>Build roles that fit your company: choose which panels a role opens and exactly what it may do, then give it to people on the Users page. Changes apply to everyone holding the role at once.</>}
      />
      <RolesManager roles={roles} audit={audit} />
    </div>
  );
}
