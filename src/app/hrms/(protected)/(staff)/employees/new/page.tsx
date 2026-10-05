import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import EmployeeForm from "@/components/hrms/EmployeeForm";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canManageEmployees } from "@/lib/hrms-roles";
import { listDepartments, listDesignations, listTeams } from "@/lib/hrms/departments";
import { listEmployeeOptions } from "@/lib/hrms/employees";
import { getApplicationForConversion } from "@/lib/hrms/recruitment";

export default async function NewEmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ fromApplication?: string }>;
}) {
  const user = await getCurrentHrmsUser();
  if (!user || !canManageEmployees(user)) redirect("/hrms/employees");

  const sp = await searchParams;
  const [departments, designations, teams, managers, prefill] = await Promise.all([
    listDepartments(),
    listDesignations(),
    listTeams(),
    listEmployeeOptions(),
    sp.fromApplication ? getApplicationForConversion(sp.fromApplication) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "HRMS", href: "/hrms" }, { label: "Employees", href: "/hrms/employees" }, { label: "New" }]}
        title={<>Add Employee</>}
        description={<>A unique employee ID is generated automatically on save.</>}
      />

      <EmployeeForm
        mode="create"
        departments={departments.map((d) => ({ _id: d._id, name: d.name }))}
        designations={designations.map((d) => ({ _id: d._id, title: d.title, departmentId: d.departmentId }))}
        teams={teams.map((t) => ({ _id: t._id, name: t.name, departmentId: t.departmentId }))}
        managers={managers}
        prefill={
          prefill
            ? {
                applicationId: prefill.applicationId,
                firstName: prefill.firstName,
                lastName: prefill.lastName,
                personalEmail: prefill.personalEmail,
                phone: prefill.phone,
                positionTitle: prefill.positionTitle,
              }
            : null
        }
      />
    </div>
  );
}
