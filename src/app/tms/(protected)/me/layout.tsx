import { redirect } from "next/navigation";
import { getCurrentTmsUser } from "@/lib/tms-auth";

/**
 * Student portal (`/tms/me/*`). Any signed-in TMS user linked to a student
 * record can use it; staff see it alongside the full panel. An account with no
 * `studentId` is sent back to the dashboard.
 */
export default async function PortalTmsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentTmsUser();
  if (!user) redirect("/tms/login");
  if (!user.studentId) redirect("/tms");
  return <>{children}</>;
}
