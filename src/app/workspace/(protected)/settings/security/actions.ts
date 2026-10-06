"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { clearAllSessionCookies } from "@/lib/cross-module-sso";
import { revokeOtherSessions, revokeSession, signOutEverywhere } from "@/lib/security/sessions";

async function me(): Promise<ObjectId> {
  const user = await getCurrentHubUser();
  if (!user || !ObjectId.isValid(user.id)) redirect("/workspace/login");
  return new ObjectId(user.id);
}

/** Ends one listed sign-in of the signed-in account. Ending the one in use goes to the sign-in page. */
export async function revokeSessionAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const adminId = await me();
  const res = await revokeSession(adminId, String(id ?? ""));
  if (!res.ok) return { ok: false, error: "That sign-in has already ended." };
  if (res.self) {
    await clearAllSessionCookies();
    redirect("/workspace/login");
  }
  revalidatePath("/workspace/settings/security");
  revalidatePath("/workspace/account/sessions");
  return { ok: true };
}

/** Every device except the one in use. */
export async function signOutOthersAction(): Promise<{ ok: true; count: number }> {
  const count = await revokeOtherSessions(await me());
  revalidatePath("/workspace/settings/security");
  revalidatePath("/workspace/account/sessions");
  return { ok: true, count };
}

/** Every device, including this one. */
export async function signOutEverywhereAction(): Promise<void> {
  await signOutEverywhere(await me());
  redirect("/workspace/login");
}
