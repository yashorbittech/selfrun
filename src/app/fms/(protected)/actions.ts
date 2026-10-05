"use server";

import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { destroySessionsEverywhere } from "@/lib/cross-module-sso";

/**
 * Centralized logout: destroys this account's session in EVERY panel (not
 * just FMS's own), on every device — see `cross-module-sso.ts`.
 */
export async function fmsLogoutAction(): Promise<void> {
  const user = await getCurrentFmsUser();
  if (user && ObjectId.isValid(user.id)) {
    await destroySessionsEverywhere(new ObjectId(user.id));
  }
  redirect("/workspace/login");
}
