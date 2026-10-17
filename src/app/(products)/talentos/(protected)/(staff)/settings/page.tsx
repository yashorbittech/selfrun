import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/products/dealflow-ai/Breadcrumbs";
import Tabs from "@/components/products/talentos/Tabs";
import OrgSettingsForm from "@/components/products/talentos/OrgSettingsForm";
import LeaveTypesManager from "@/components/products/talentos/LeaveTypesManager";
import PayrollConfigForm from "@/components/products/talentos/PayrollConfigForm";
import CompanyDetailsForm from "@/components/products/talentos/CompanyDetailsForm";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canManageSettings } from "@/lib/hrms-roles";
import { getOrgSettings } from "@/lib/products/talentos/settings";
import { listLeaveTypes } from "@/lib/products/talentos/leave";
import { getPayrollConfig } from "@/lib/products/talentos/payroll-config";
import { getCompanyDetails } from "@/lib/products/talentos/company";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentHrmsUser();
  if (!user || !canManageSettings(user)) redirect("/talentos");

  const sp = await searchParams;
  const tab = ["company", "schedule", "leave", "payroll"].includes(sp.tab ?? "") ? sp.tab! : "company";

  const [settings, leaveTypes, payrollConfig, company] = await Promise.all([
    getOrgSettings(),
    listLeaveTypes(true),
    getPayrollConfig(),
    getCompanyDetails(),
  ]);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "HRMS", href: "/talentos" }, { label: "Settings" }]}
        title={<>Settings</>}
        description={<>Company identity, work schedule, leave configuration and statutory payroll rates.</>}
      />

      <Tabs
        initial={tab}
        syncParam="tab"
        tabs={[
          {
            key: "company",
            label: "Company",
            content: (
              <CompanyDetailsForm
                details={{
                  name: company.name,
                  legalName: company.legalName,
                  addressLine1: company.addressLine1,
                  addressLine2: company.addressLine2,
                  city: company.city,
                  state: company.state,
                  postalCode: company.postalCode,
                  country: company.country,
                  email: company.email,
                  phone: company.phone,
                  website: company.website,
                  pan: company.pan,
                  gstin: company.gstin,
                  cin: company.cin,
                  pfEstablishmentCode: company.pfEstablishmentCode,
                  esiEstablishmentCode: company.esiEstablishmentCode,
                  lin: company.lin,
                  signatoryName: company.signatoryName,
                  signatoryDesignation: company.signatoryDesignation,
                  payslipNote: company.payslipNote,
                }}
              />
            ),
          },
          {
            key: "schedule",
            label: "Work Schedule",
            content: (
              <OrgSettingsForm
                settings={{
                  workingDays: settings.workingDays,
                  shiftStart: settings.shiftStart,
                  shiftEnd: settings.shiftEnd,
                  graceMinutes: settings.graceMinutes,
                  earlyDepartureMinutes: settings.earlyDepartureMinutes,
                  halfDayHours: settings.halfDayHours,
                  fullDayHours: settings.fullDayHours,
                  timezone: settings.timezone,
                }}
              />
            ),
          },
          {
            key: "leave",
            label: "Leave Types",
            content: (
              <LeaveTypesManager
                types={leaveTypes.map((t) => ({
                  _id: t._id,
                  code: t.code,
                  label: t.label,
                  paid: t.paid,
                  defaultAnnualQuota: t.defaultAnnualQuota,
                  allowNegativeBalance: t.allowNegativeBalance,
                  active: t.active,
                }))}
              />
            ),
          },
          {
            key: "payroll",
            label: "Payroll",
            content: (
              <PayrollConfigForm
                config={{
                  pfEmployeePercent: payrollConfig.pfEmployeePercent,
                  pfWageCeiling: payrollConfig.pfWageCeiling,
                  epsPercent: payrollConfig.epsPercent,
                  pfEmployerPercent: payrollConfig.pfEmployerPercent,
                  esiEmployeePercent: payrollConfig.esiEmployeePercent,
                  esiEmployerPercent: payrollConfig.esiEmployerPercent,
                  esiGrossThreshold: payrollConfig.esiGrossThreshold,
                  professionalTaxMonthly: payrollConfig.professionalTaxMonthly,
                  tdsRegime: payrollConfig.tdsRegime,
                  financialYearStartMonth: payrollConfig.financialYearStartMonth,
                }}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
