"use server";

import { getCurrentLmsUser } from "@/lib/lms-auth";
import { createPortalSession, setPortalSessionCookie, externalUsers } from "@/lib/portal-auth";
import { setActivePortalLead } from "@/lib/portal/lead";

/**
 * Impersonation server action — mints a real portal_session for the given
 * external user and drops the portal_session cookie in the current browser,
 * so the LMS admin is immediately signed in as that portal user.
 *
 * Security:
 *  - Requires a valid LMS session (`getCurrentLmsUser`). Unauthenticated
 *    callers get { ok: false, error: "Unauthorized" }.
 *  - Only active accounts can be impersonated. Suspended accounts are blocked.
 *  - If leadId is passed, sets activeLeadId and account role to match that lead.
 *  - The minted session is a normal 12-hour portal session (no "remember me"),
 *    identical in shape to what the portal login page creates.
 *  - No existing portal session is invalidated — the new cookie simply
 *    overwrites any prior portal_session cookie in the browser.
 */
export interface ImpersonateTargetOptions {
  externalUserId?: string;
  leadId?: string;
  applicationId?: string;
  studentId?: string;
  clientId?: string;
  email?: string;
}

export async function loginAsPortalUserAction(
  target: string | ImpersonateTargetOptions,
  leadIdParam?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  // 1. Guard — must be a signed-in LMS user.
  const lmsUser = await getCurrentLmsUser();
  if (!lmsUser) return { ok: false, error: "Unauthorized" };

  const opts: ImpersonateTargetOptions =
    typeof target === "string" ? { externalUserId: target, leadId: leadIdParam } : target;

  const col = await externalUsers();
  let user: any = null;
  let targetLeadId = opts.leadId ?? leadIdParam;

  // Resolving by leadId first if provided
  if (targetLeadId) {
    const { getLeadRecord } = await import("@/lib/lead-management/records");
    const lead = await getLeadRecord(targetLeadId);
    if (lead) {
      user = await col.findOne({ _id: lead.externalUserId });
    }
  }

  // Resolving by externalUserId
  if (!user && opts.externalUserId) {
    user = await col.findOne({ _id: opts.externalUserId });
  }

  // Resolving by applicationId
  if (!user && opts.applicationId) {
    user = await col.findOne({ $or: [{ applicationId: opts.applicationId }, { _id: opts.applicationId }] });
    if (!user) {
      const { getApplication } = await import("@/lib/career-applications");
      const app = await getApplication(opts.applicationId).catch(() => null);
      if (app?.email) {
        user = await col.findOne({ email: app.email.trim().toLowerCase() });
      }
    }
  }

  // Resolving by studentId
  if (!user && opts.studentId) {
    user = await col.findOne({ studentId: opts.studentId });
  }

  // Resolving by clientId
  if (!user && opts.clientId) {
    user = await col.findOne({ clientId: opts.clientId });
  }

  // Resolving by email
  if (!user && opts.email) {
    user = await col.findOne({ email: opts.email.trim().toLowerCase() });
  }

  if (!user) return { ok: false, error: "No portal account found for this user." };
  if (user.status === "suspended") {
    return { ok: false, error: "This portal account is suspended and cannot be accessed." };
  }

  // 3. If a target lead is specified, set it as active lead & align user role to match.
  if (targetLeadId) {
    await setActivePortalLead(user._id, targetLeadId);
  }

  // 4. Mint a real portal session (12 h, no remember-me) and set the cookie.
  const { token } = await createPortalSession(user._id, false);
  await setPortalSessionCookie(token, false);

  return { ok: true };
}
