"use server";

import { revalidatePath } from "next/cache";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import { deleteLead, isValidCategory, updateLead, validateLeadUpdate, type CategorySlug } from "@/lib/leads";

async function requireLmsUser() {
  const lmsUser = await getCurrentLmsUser();
  if (!lmsUser) throw new Error("Unauthorized");
  return lmsUser;
}

export async function bulkUpdateStatusAction(
  category: string,
  ids: string[],
  status: string
): Promise<{ updated: number; error?: string }> {
  await requireLmsUser();
  if (!isValidCategory(category)) return { updated: 0, error: "Invalid category." };

  const validation = validateLeadUpdate({ status });
  if (!validation.valid) return { updated: 0, error: validation.errors.status ?? "Invalid status." };

  let updated = 0;
  for (const id of ids) {
    const result = await updateLead(category as CategorySlug, id, validation.data);
    if (result) updated += 1;
  }

  revalidatePath(`/lms/submissions/${category}`);
  revalidatePath("/lms");
  return { updated };
}

export async function bulkDeleteAction(category: string, ids: string[]): Promise<{ deleted: number; error?: string }> {
  await requireLmsUser();
  if (!isValidCategory(category)) return { deleted: 0, error: "Invalid category." };

  let deleted = 0;
  for (const id of ids) {
    const ok = await deleteLead(category as CategorySlug, id);
    if (ok) deleted += 1;
  }

  revalidatePath(`/lms/submissions/${category}`);
  revalidatePath("/lms");
  return { deleted };
}
