import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import Tabs from "@/components/hrms/Tabs";
import AttendanceRegister from "@/components/hrms/AttendanceRegister";
import MonthlyAttendanceReport from "@/components/hrms/MonthlyAttendanceReport";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canManageAttendance, canViewAllEmployees } from "@/lib/hrms-roles";
import { getDailyRegister, getMonthlyReport } from "@/lib/hrms/attendance";
import { listDepartments } from "@/lib/hrms/departments";
import { isDateString, todayDateString } from "@/lib/hrms/settings";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string; month?: string; department?: string }>;
}) {
  const user = await getCurrentHrmsUser();
  const canEdit = !!user && canManageAttendance(user);
  const restrictToManagerId = user && !canViewAllEmployees(user) ? user.employeeId ?? "__none__" : undefined;

  const sp = await searchParams;
  const date = sp.date && isDateString(sp.date) ? sp.date : todayDateString();
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : todayDateString().slice(0, 7);
  const departmentId = sp.department || undefined;
  const tab = sp.tab === "report" ? "report" : "register";

  const [{ rows, dayClass }, report, departments] = await Promise.all([
    getDailyRegister(date, { departmentId, restrictToManagerId }),
    getMonthlyReport(month, { departmentId, restrictToManagerId }),
    listDepartments(),
  ]);

  const deptOpts = departments.map((d) => ({ _id: d._id, name: d.name }));

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "HRMS", href: "/hrms" }, { label: "Attendance" }]}
        title={<>Attendance</>}
        description={<>{canEdit ? "Record and correct daily attendance." : "Daily attendance overview."}</>}
      />

      <PanelListFilters>
<Tabs
        initial={tab}
        syncParam="tab"
        tabs={[
          {
            key: "register",
            label: "Daily Register",
            content: (
              <AttendanceRegister
                date={date}
                dayClass={dayClass}
                rows={rows.map((r) => ({
                  employeeId: r.employeeId,
                  employeeName: r.employeeName,
                  employeeCode: r.employeeCode,
                  departmentId: r.departmentId,
                  effectiveStatus: r.effectiveStatus,
                  record: r.record
                    ? {
                        status: r.record.status,
                        checkIn: r.record.checkIn,
                        checkOut: r.record.checkOut,
                        breakMinutes: r.record.breakMinutes,
                        workedMinutes: r.record.workedMinutes,
                        isLate: r.record.isLate,
                        lateByMinutes: r.record.lateByMinutes,
                        isEarlyDeparture: r.record.isEarlyDeparture,
                        earlyByMinutes: r.record.earlyByMinutes,
                        source: r.record.source,
                        note: r.record.note,
                      }
                    : null,
                }))}
                departments={deptOpts}
                canEdit={canEdit}
              />
            ),
          },
          {
            key: "report",
            label: "Monthly Report",
            content: <MonthlyAttendanceReport month={month} rows={report} departments={deptOpts} />,
          },
        ]}
      />
</PanelListFilters>
    </div>
  );
}
