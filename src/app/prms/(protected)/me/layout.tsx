import { redirect } from "next/navigation";
import { getCurrentPrmsUser } from "@/lib/prms-auth";

/**
 * Employee self-service portal (`/prms/me/*`). Any signed-in PRMS user can use
 * it — employees live here exclusively; staff see it alongside the full panel.
 */
export default async function PortalPrmsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentPrmsUser();
  if (!user) redirect("/prms/login");
  return <>{children}</>;
}
