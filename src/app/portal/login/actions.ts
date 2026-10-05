"use server";

import { redirect } from "next/navigation";
import {
  verifyPortalCredentials,
  createPortalSession,
  setPortalSessionCookie,
  getSessionPortalUser,
} from "@/lib/portal-auth";
import { recordPortalAudit } from "@/lib/portal/audit";

export interface PortalLoginState {
  error?: string;
}

export async function portalLoginAction(_prev: PortalLoginState, formData: FormData): Promise<PortalLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email || !password) return { error: "Enter your email and password." };

  const result = await verifyPortalCredentials(email, password);
  if (!result.ok) return { error: result.error };

  const { token } = await createPortalSession(result.userId, remember);
  await setPortalSessionCookie(token, remember);
  await recordPortalAudit({ actorId: result.userId, action: "login", entity: "account", entityId: result.userId });

  const user = await getSessionPortalUser(token);
  if (user?.mustChangePassword) redirect("/portal/change-password");
  redirect("/portal");
}
