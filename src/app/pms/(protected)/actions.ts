"use server";

import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getCurrentPmsUser } from "@/lib/pms-auth";
import { destroySessionsEverywhere } from "@/lib/cross-module-sso";

/**
 * Centralized logout: destroys this account's session in EVERY panel (not
 * just PMS's own), on every device — see `cross-module-sso.ts`.
 */
export async function pmsLogoutAction(): Promise<void> {
  const user = await getCurrentPmsUser();
  if (user && ObjectId.isValid(user.id)) {
    await destroySessionsEverywhere(new ObjectId(user.id));
  }
  redirect("/workspace/login");
}
