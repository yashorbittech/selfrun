import { NextRequest } from "next/server";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";

/**
 * Guards HRMS-only API routes (e.g. the employee CSV export). Accepts either a
 * logged-in HRMS session cookie or an `HRMS_API_SECRET` bearer token for
 * cron / external tooling. Mirrors `src/lib/api-auth.ts`.
 */
export async function isAuthorizedHrmsRequest(req: NextRequest): Promise<boolean> {
  const secret = process.env.HRMS_API_SECRET;
  const authHeader = req.headers.get("authorization");
  if (secret && authHeader === `Bearer ${secret}`) return true;

  // The panel session, or the Workspace session of an account with this panel's role.
  return (await getCurrentHrmsUser()) !== null;
}
