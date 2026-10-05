"use server";

import { getCurrentLmsUser } from "@/lib/lms-auth";
import { createSavedFilter, deleteSavedFilter } from "@/lib/saved-filters";

async function requireLmsUser() {
  const lmsUser = await getCurrentLmsUser();
  if (!lmsUser) throw new Error("Unauthorized");
  return lmsUser;
}

export async function saveFilterAction(name: string, params: Record<string, string>): Promise<{ error?: string; id?: string }> {
  const lmsUser = await requireLmsUser();
  if (!name.trim()) return { error: "Name is required." };
  const id = await createSavedFilter(lmsUser.id, name, params);
  return { id };
}

export async function deleteSavedFilterAction(id: string): Promise<{ error?: string }> {
  const lmsUser = await requireLmsUser();
  const ok = await deleteSavedFilter(lmsUser.id, id);
  if (!ok) return { error: "Not found." };
  return {};
}
