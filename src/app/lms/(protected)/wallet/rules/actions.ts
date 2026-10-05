"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import { validateRewardRuleInput, type RewardRuleWriteInput } from "@/lib/wallet/reward-rule-validation";
import { createRewardRule, updateRewardRule, deleteRewardRule, getRewardRule } from "@/lib/wallet/reward-rules";

async function requireLmsUser() {
  const user = await getCurrentLmsUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function saveRewardRuleAction(
  id: string | null,
  input: Partial<RewardRuleWriteInput>
): Promise<{ error?: string; fieldErrors?: Record<string, string> }> {
  const user = await requireLmsUser();
  const validation = validateRewardRuleInput(input);
  if (!validation.valid) return { error: "Please fix the highlighted fields.", fieldErrors: validation.errors };

  if (id) {
    const updated = await updateRewardRule(id, validation.data, user.id);
    if (!updated) return { error: "Rule not found." };
  } else {
    await createRewardRule(validation.data, user.id);
  }
  revalidatePath("/lms/wallet/rules");
  redirect("/lms/wallet/rules");
}

export async function deleteRewardRuleAction(id: string): Promise<{ error?: string }> {
  const user = await requireLmsUser();
  if (!(await getRewardRule(id))) return { error: "Rule not found." };
  await deleteRewardRule(id, user.id);
  revalidatePath("/lms/wallet/rules");
  return {};
}
