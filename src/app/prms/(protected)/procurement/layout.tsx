import { redirect } from "next/navigation";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { hasPrmsStaffRole } from "@/lib/prms-roles";

// The Procurement Hub lists every requisition, purchase order and vendor — staff only, like the rest of the management pages.
export default async function ProcurementLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentPrmsUser();
  if (!user) redirect("/prms/login");
  if (!hasPrmsStaffRole(user.roles)) redirect("/prms/me");
  return <>{children}</>;
}
