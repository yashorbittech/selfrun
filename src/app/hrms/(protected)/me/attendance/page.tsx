import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import ClockWidget from "@/components/hrms/ClockWidget";
import AttendanceCalendar from "@/components/hrms/AttendanceCalendar";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { getClockState, todayIsWorkingDay } from "@/lib/hrms/self-service";
import { getEmployeeMonth } from "@/lib/hrms/attendance";
import { todayDateString } from "@/lib/hrms/time";

export default async function MyAttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await getCurrentHrmsUser();
  const employeeId = user!.employeeId!;
  const sp = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : todayDateString().slice(0, 7);

  const [clock, today, monthData] = await Promise.all([
    getClockState(employeeId),
    todayIsWorkingDay(),
    getEmployeeMonth(employeeId, month),
  ]);

  return (
    <div className="space-y-5">
      <PanelPageHeader
        title={<>My Attendance</>}
        description={<>Clock in and out, and review your month.</>}
      />

      <PanelListFilters>
<ClockWidget
        dayLabel={today.label}
        working={today.working}
        checkIn={clock.checkIn}
        checkOut={clock.checkOut}
        workedMinutes={clock.workedMinutes}
        locked={clock.locked}
      />

      <GlassCard interactive={false}>
        <CardHeader><CardTitle>Monthly View</CardTitle></CardHeader>
        <CardContent>
          <AttendanceCalendar month={month} cells={monthData.cells} summary={monthData.summary} />
        </CardContent>
      </GlassCard>
</PanelListFilters>
    </div>
  );
}
