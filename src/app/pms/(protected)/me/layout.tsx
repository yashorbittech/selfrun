import { redirect } from "next/navigation";
import { getCurrentPmsUser } from "@/lib/pms-auth";

/**
 * Employee portal (`/pms/me/*`). Any signed-in PMS user with a linked employee
 * record can use it; staff see it alongside the full panel. A staff account with
 * no `employeeId` is sent back to the dashboard.
 */
export default async function PortalPmsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentPmsUser();
  if (!user) redirect("/pms/login");
  if (!user.employeeId) redirect("/pms");
  return <>{children}</>;
}
