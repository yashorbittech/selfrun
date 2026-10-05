"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import { deleteLead, isValidCategory, updateLead, validateLeadUpdate, type CategorySlug } from "@/lib/leads";

// Every action here independently re-checks the session — the page that
// renders the form is already gated, but per Next's own guidance, render-time
// gating alone is not a security boundary for the action endpoint itself.
async function requireLmsUser() {
  const lmsUser = await getCurrentLmsUser();
  if (!lmsUser) throw new Error("Unauthorized");
  return lmsUser;
}

export async function updateStatusAction(category: string, id: string, status: string): Promise<{ error?: string }> {
  await requireLmsUser();
  if (!isValidCategory(category)) return { error: "Invalid category." };

  const validation = validateLeadUpdate({ status });
  if (!validation.valid) return { error: validation.errors.status ?? "Invalid status." };

  const updated = await updateLead(category as CategorySlug, id, validation.data);
  if (!updated) return { error: "Submission not found." };

  revalidatePath(`/lms/submissions/${category}/${id}`);
  revalidatePath(`/lms/submissions/${category}`);
  revalidatePath("/lms");
  return {};
}

export async function updateDealValueAction(category: string, id: string, dealValue: string): Promise<{ error?: string }> {
  await requireLmsUser();
  if (!isValidCategory(category)) return { error: "Invalid category." };

  const validation = validateLeadUpdate({ dealValue: dealValue === "" ? null : dealValue });
  if (!validation.valid) return { error: validation.errors.dealValue ?? "Invalid amount." };

  const updated = await updateLead(category as CategorySlug, id, validation.data);
  if (!updated) return { error: "Submission not found." };

  revalidatePath(`/lms/submissions/${category}/${id}`);
  revalidatePath("/lms/campaigns");
  revalidatePath("/lms/campaigns/leads");
  return {};
}

export async function updateNotesAction(category: string, id: string, notes: string): Promise<{ error?: string }> {
  await requireLmsUser();
  if (!isValidCategory(category)) return { error: "Invalid category." };

  const validation = validateLeadUpdate({ notes });
  if (!validation.valid) return { error: validation.errors.notes ?? "Invalid notes." };

  const updated = await updateLead(category as CategorySlug, id, validation.data);
  if (!updated) return { error: "Submission not found." };

  revalidatePath(`/lms/submissions/${category}/${id}`);
  return {};
}

export async function deleteSubmissionAction(category: string, id: string): Promise<void> {
  await requireLmsUser();
  if (!isValidCategory(category)) throw new Error("Invalid category.");

  await deleteLead(category as CategorySlug, id);
  revalidatePath(`/lms/submissions/${category}`);
  revalidatePath("/lms");
  redirect(`/lms/submissions/${category}`);
}

/** Same delete, but for callers already on the list (e.g. the row Sheet) that
 * want to close/refresh in place instead of being navigated. */
export async function deleteSubmissionInPlaceAction(category: string, id: string): Promise<{ error?: string }> {
  await requireLmsUser();
  if (!isValidCategory(category)) return { error: "Invalid category." };

  const deleted = await deleteLead(category as CategorySlug, id);
  if (!deleted) return { error: "Submission not found." };

  revalidatePath(`/lms/submissions/${category}`);
  revalidatePath("/lms");
  return {};
}
