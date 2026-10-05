"use server";

import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { destroySessionsEverywhere } from "@/lib/cross-module-sso";

/**
 * Centralized logout: destroys this account's session in EVERY panel (not
 * just HRMS's own), on every device — see `cross-module-sso.ts`.
 */
export async function hrmsLogoutAction(): Promise<void> {
  const user = await getCurrentHrmsUser();
  if (user && ObjectId.isValid(user.id)) {
    await destroySessionsEverywhere(new ObjectId(user.id));
  }
  redirect("/workspace/login");
}
