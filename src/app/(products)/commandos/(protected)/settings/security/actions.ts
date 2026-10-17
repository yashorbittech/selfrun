"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { clearAllSessionCookies } from "@/lib/cross-module-sso";
import { confirmTwoFactorSetup, disableTwoFactor, startTwoFactorSetup } from "@/lib/security/two-factor";
import { revokeOtherSessions, revokeSession, signOutEverywhere } from "@/lib/security/sessions";

async function me(): Promise<ObjectId> {
  const user = await getCurrentHubUser();
  if (!user || !ObjectId.isValid(user.id)) redirect("/commandos/login");
  return new ObjectId(user.id);
}

/** Ends one listed sign-in of the signed-in account. Ending the one in use goes to the sign-in page. */
export async function revokeSessionAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const adminId = await me();
  const res = await revokeSession(adminId, String(id ?? ""));
  if (!res.ok) return { ok: false, error: "That sign-in has already ended." };
  if (res.self) {
    await clearAllSessionCookies();
    redirect("/commandos/login");
  }
  revalidatePath("/commandos/settings/security");
  revalidatePath("/commandos/account/sessions");
  return { ok: true };
}

/** Every device except the one in use. */
export async function signOutOthersAction(): Promise<{ ok: true; count: number }> {
  const count = await revokeOtherSessions(await me());
  revalidatePath("/commandos/settings/security");
  revalidatePath("/commandos/account/sessions");
  return { ok: true, count };
}

/** Every device, including this one. */
export async function signOutEverywhereAction(): Promise<void> {
  await signOutEverywhere(await me());
  redirect("/commandos/login");
}

/** Two-step sign-in: step 1 — a secret and a QR code for the authenticator app. */
export async function startTwoFactorAction(): Promise<{ ok: true; secret: string; qr: string } | { ok: false; error: string }> {
  const user = await getCurrentHubUser();
  if (!user || !ObjectId.isValid(user.id)) redirect("/commandos/login");
  return startTwoFactorSetup(new ObjectId(user.id), user.email);
}

/** Step 2 — the first code from the app turns it on and returns the recovery codes (shown once). */
export async function confirmTwoFactorAction(code: string): Promise<{ ok: true; recovery: string[] } | { ok: false; error: string }> {
  const adminId = await me();
  const res = await confirmTwoFactorSetup(adminId, String(code ?? ""));
  if (res.ok) {
    revalidatePath("/commandos/settings/security");
    revalidatePath("/commandos/account/sessions");
  }
  return res;
}

/** Turns two-step off for the signed-in person (needs a valid code or recovery code). */
export async function disableTwoFactorAction(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await disableTwoFactor(await me(), String(code ?? ""));
  if (res.ok) {
    revalidatePath("/commandos/settings/security");
    revalidatePath("/commandos/account/sessions");
  }
  return res;
}
