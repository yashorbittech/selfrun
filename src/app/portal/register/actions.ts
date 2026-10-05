"use server";

import { redirect } from "next/navigation";
import { registerExternalUser } from "@/lib/portal/registration";
import { createPortalSession, setPortalSessionCookie } from "@/lib/portal-auth";

export interface PortalRegisterState {
  error?: string;
}

export async function portalRegisterAction(_prev: PortalRegisterState, formData: FormData): Promise<PortalRegisterState> {
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const referralCode = formData.get("referralCode");

  if (!email || !phone || !password) return { error: "Fill in every field." };
  if (password !== confirm) return { error: "Passwords do not match." };

  const result = await registerExternalUser({ email, phone, password, referralCode: typeof referralCode === "string" ? referralCode : null });
  if (!result.ok) return { error: result.error };

  const { token } = await createPortalSession(result.userId, false);
  await setPortalSessionCookie(token, false);
  redirect("/portal");
}
