"use server";

import { revalidatePath } from "next/cache";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { canManageSettings } from "@/lib/tms-roles";
import { updateTmsSettings, normalizeSettingsInput } from "@/lib/tms/settings";
import { recordAudit } from "@/lib/tms/audit";

export interface SettingsActionResult {
  ok: boolean;
  error?: string;
}

export async function saveTmsSettingsAction(input: Record<string, unknown>): Promise<SettingsActionResult> {
  const user = await getCurrentTmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canManageSettings(user)) throw new Error("Forbidden");

  const data = normalizeSettingsInput(input);
  await updateTmsSettings(data, user.id);
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "update",
    entity: "settings",
    entityId: "config",
    entityLabel: "TMS settings",
    summary: `${data.technologySuggestions.length} track suggestions · default ${data.defaultCurrency}`,
  });
  revalidatePath("/tms/settings");
  revalidatePath("/tms/programs");
  return { ok: true };
}
