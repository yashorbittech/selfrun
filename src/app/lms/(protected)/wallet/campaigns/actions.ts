"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import { validateCampaignInput, type ReferralCampaignWriteInput } from "@/lib/wallet/campaign-validation";
import { createCampaign, updateCampaign, deleteCampaign, getCampaign } from "@/lib/wallet/campaigns";

async function requireLmsUser() {
  const user = await getCurrentLmsUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function saveCampaignAction(id: string | null, input: Partial<ReferralCampaignWriteInput>): Promise<{ error?: string; fieldErrors?: Record<string, string> }> {
  const user = await requireLmsUser();
  const v = validateCampaignInput(input);
  if (!v.valid) return { error: "Please fix the highlighted fields.", fieldErrors: v.errors };
  if (id) {
    if (!(await updateCampaign(id, v.data, user.id))) return { error: "Campaign not found." };
  } else {
    await createCampaign(v.data, user.id);
  }
  revalidatePath("/lms/wallet/campaigns");
  redirect("/lms/wallet/campaigns");
}

export async function toggleCampaignAction(id: string, isActive: boolean): Promise<{ error?: string }> {
  const user = await requireLmsUser();
  const c = await getCampaign(id);
  if (!c) return { error: "Campaign not found." };
  await updateCampaign(id, { name: c.name, isActive, qualifyingEvent: c.qualifyingEvent, referrerAudience: c.referrerAudience, maxReferralsPerReferrer: c.maxReferralsPerReferrer, startsAt: c.startsAt?.toISOString() ?? null, endsAt: c.endsAt?.toISOString() ?? null }, user.id);
  revalidatePath("/lms/wallet/campaigns");
  return {};
}

export async function deleteCampaignAction(id: string): Promise<{ error?: string }> {
  const user = await requireLmsUser();
  if (!(await getCampaign(id))) return { error: "Campaign not found." };
  await deleteCampaign(id, user.id);
  revalidatePath("/lms/wallet/campaigns");
  return {};
}
