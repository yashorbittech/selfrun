"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { currentCompanyId } from "@/lib/platform/tenancy/context";
import { enqueueBuild } from "@/lib/apps/enqueue";
import { getAppSettings, saveAppSettings } from "@/lib/pwa/store";
import type { GenerationScope } from "@/lib/apps/types";

async function requireOwner() {
  const user = await getCurrentHubUser();
  if (!user) redirect("/workspace/login");
  if (!user.roles.includes("super_admin")) redirect("/workspace");
}

/** Manual generation: starts a build of the apps in `scope` right now. */
export async function buildAppsAction(scope: GenerationScope): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  await requireOwner();
  const safe: GenerationScope = scope === "desktop" || scope === "mobile" ? scope : "all";
  const res = await enqueueBuild(await currentCompanyId(), "manual", { force: true, scope: safe });
  revalidatePath("/workspace/settings/apps");
  if (res.ok) return { ok: true, message: "Building. This usually takes 10 to 20 minutes." };
  return res.reason === "in-progress" ? { ok: true, message: "A build is already running." } : { ok: false, error: res.message };
}

/** The "generate automatically" switch. */
export async function setAutomaticAction(on: boolean): Promise<{ ok: true }> {
  await requireOwner();
  const { settings } = await getAppSettings();
  await saveAppSettings({ ...settings, generation: { ...settings.generation, automatic: on === true } });
  revalidatePath("/workspace/settings/apps");
  return { ok: true };
}
