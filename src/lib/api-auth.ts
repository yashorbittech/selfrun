import { NextRequest } from "next/server";
import { getCurrentLmsUser } from "@/lib/lms-auth";

/**
 * Guards LMS-only endpoints (reading/editing/deleting stored lead PII) with
 * either a logged-in LMS session cookie (used by the /lms UI, e.g. a plain
 * <a href> resume download that can't send a custom header) or a bearer secret
 * (for external tooling/scripts). Public submission endpoints (POST) intentionally
 * skip this.
 */
export async function isAuthorizedLmsRequest(req: NextRequest): Promise<boolean> {
  const secret = process.env.LEADS_API_SECRET;
  const authHeader = req.headers.get("authorization");
  if (secret && authHeader === `Bearer ${secret}`) return true;

  // The panel session, or the Workspace session of an account with this panel's role.
  return (await getCurrentLmsUser()) !== null;
}
