import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import HolidayManager from "@/components/hrms/HolidayManager";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canManageHolidays } from "@/lib/hrms-roles";
import { listHolidays, listHolidayYears, serializeHoliday } from "@/lib/hrms/holidays";

export default async function HolidaysPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const user = await getCurrentHrmsUser();
  const canManage = !!user && canManageHolidays(user);

  const sp = await searchParams;
  const thisYear = new Date().getUTCFullYear();
  const activeYear = Number(sp.year) && Number(sp.year) > 2000 ? Number(sp.year) : thisYear;

  const [holidays, years] = await Promise.all([listHolidays(activeYear), listHolidayYears()]);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "HRMS", href: "/hrms" }, { label: "Holidays" }]}
        title={<>Holiday Calendar</>}
        description={<>Company-wide holidays. Excluded from working-day counts in attendance and leave.</>}
      />

      <PanelListFilters>
<HolidayManager
        holidays={holidays.map(serializeHoliday).map((h) => ({ _id: h._id, date: h.date, name: h.name, type: h.type }))}
        years={years}
        activeYear={activeYear}
        canManage={canManage}
      />
</PanelListFilters>
    </div>
  );
}
