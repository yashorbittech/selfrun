import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/products/dealflow-ai/Breadcrumbs";
import Tabs from "@/components/products/talentos/Tabs";
import OrgSettingsForm from "@/components/products/talentos/OrgSettingsForm";
import LeaveTypesManager from "@/components/products/talentos/LeaveTypesManager";
import PayrollConfigForm from "@/components/products/talentos/PayrollConfigForm";
import CompanyDetailsForm from "@/components/products/talentos/CompanyDetailsForm";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canManagePayrollConfig, canManageSettings } from "@/lib/hrms-roles";
import { getOrgSettings } from "@/lib/products/talentos/settings";
import { listLeaveTypes } from "@/lib/products/talentos/leave";
import { getPayrollConfig } from "@/lib/products/talentos/payroll-config";
import { getCompanyDetails } from "@/lib/products/talentos/company";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentHrmsUser();
  // Two separate permissions: the company / schedule / leave settings, and the statutory payroll rates (PF, ESI, professional tax, TDS).
  // Each tab, and the data behind it, is only for the one who holds its permission.
  const manageSettings = !!user && canManageSettings(user);
  const managePayroll = !!user && canManagePayrollConfig(user);
  if (!user || (!manageSettings && !managePayroll)) redirect("/talentos");

  const sp = await searchParams;
  const allowedTabs = [...(manageSettings ? ["company", "schedule", "leave"] : []), ...(managePayroll ? ["payroll"] : [])];
  const tab = allowedTabs.includes(sp.tab ?? "") ? sp.tab! : allowedTabs[0];

  const [settings, leaveTypes, payrollConfig, company] = await Promise.all([
    manageSettings ? getOrgSettings() : null,
    manageSettings ? listLeaveTypes(true) : [],
    managePayroll ? getPayrollConfig() : null,
    manageSettings ? getCompanyDetails() : null,
  ]);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "TalentOS", href: "/talentos" }, { label: "Settings" }]}
        title={<>Settings</>}
        description={<>Company identity, work schedule, leave configuration and payroll policy.</>}
      />

      <Tabs
        initial={tab}
        syncParam="tab"
        tabs={[
          ...(manageSettings && company && settings ? [
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
                  tan: company.tan,
                  ptRegistration: company.ptRegistration,
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
                  saturdayOffs: settings.saturdayOffs ?? [],
                  state: settings.state ?? null,
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
          ] : []),
          ...(managePayroll && payrollConfig ? [
          {
            key: "payroll",
            label: "Payroll",
            content: (
              <PayrollConfigForm config={payrollConfigView(payrollConfig)} />
            ),
          },
          ] : []),
        ]}
      />
    </div>
  );
}

function payrollConfigView(c: Awaited<ReturnType<typeof getPayrollConfig>>) {
  const { _id, updatedAt, updatedBy, ...rest } = c;
  void _id;
  void updatedAt;
  void updatedBy;
  return rest;
}
