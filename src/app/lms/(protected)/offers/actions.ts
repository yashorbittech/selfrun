"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import { validateCampaignInput, type CampaignWriteInput, type CampaignFaqInput } from "@/lib/offers/campaign-validation";
import { createCampaign, updateCampaign, deleteCampaign, getCampaign } from "@/lib/offers/campaigns";

async function requireLmsUser() {
  const user = await getCurrentLmsUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function touch() {
  revalidatePath("/lms/offers");
}

export interface CampaignFormInput extends Omit<Partial<CampaignWriteInput>, "faqs"> {
  faqs?: CampaignFaqInput[];
}

export async function saveCampaignAction(
  id: string | null,
  input: CampaignFormInput
): Promise<{ error?: string; fieldErrors?: Record<string, string> }> {
  const user = await requireLmsUser();
  const validation = validateCampaignInput(input);
  if (!validation.valid) return { error: "Please fix the highlighted fields.", fieldErrors: validation.errors };

  if (id) {
    const updated = await updateCampaign(id, validation.data, user.id);
    if (!updated) return { error: "Campaign not found." };
  } else {
    await createCampaign(validation.data, user.id);
  }
  touch();
  redirect("/lms/offers");
}

export async function deleteCampaignAction(id: string): Promise<{ error?: string }> {
  const user = await requireLmsUser();
  const existing = await getCampaign(id);
  if (!existing) return { error: "Campaign not found." };
  await deleteCampaign(id, user.id);
  touch();
  return {};
}
