"use server";

import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { destroySessionsEverywhere } from "@/lib/cross-module-sso";

/**
 * Centralized logout: destroys this account's session in EVERY panel (not
 * just PRMS's own), on every device — see `cross-module-sso.ts`.
 */
export async function prmsLogoutAction(): Promise<void> {
  const user = await getCurrentPrmsUser();
  if (user && ObjectId.isValid(user.id)) {
    await destroySessionsEverywhere(new ObjectId(user.id));
  }
  redirect("/workspace/login");
}
