"use server";

import { revalidatePath } from "next/cache";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import { adjustWalletManually } from "@/lib/wallet/adjustments";
import { freezeWallet, unfreezeWallet } from "@/lib/wallet/wallets";
import { reverseTransaction, reverseReferralRewards, refundRedemption } from "@/lib/wallet/reversals";
import { runExpirySweep } from "@/lib/wallet/expiry";
import { rewardReferral, rejectReferral } from "@/lib/wallet/referrals";

async function requireLmsUser() {
  const user = await getCurrentLmsUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function adjustWalletAction(input: {
  userId: string;
  direction: "credit" | "debit";
  amount: number;
  reason: string;
}): Promise<{ error?: string }> {
  const user = await requireLmsUser();
  const res = await adjustWalletManually({ ...input, actorId: user.id });
  if (!res.ok) return { error: res.error };
  revalidatePath(`/lms/wallet/users/${input.userId}`);
  revalidatePath("/lms/wallet/ledger");
  return {};
}

export async function setWalletFrozenAction(userId: string, frozen: boolean): Promise<{ error?: string }> {
  const user = await requireLmsUser();
  if (frozen) await freezeWallet(userId, user.id);
  else await unfreezeWallet(userId, user.id);
  revalidatePath(`/lms/wallet/users/${userId}`);
  return {};
}

export async function approveReferralAction(referralId: string): Promise<{ error?: string }> {
  const user = await requireLmsUser();
  const ok = await rewardReferral(referralId, undefined, user.id);
  if (!ok) return { error: "This referral can't be approved (already processed?)." };
  revalidatePath("/lms/wallet/referrals");
  return {};
}

export async function rejectReferralAction(referralId: string, reason: string): Promise<{ error?: string }> {
  const user = await requireLmsUser();
  if (reason.trim().length < 5) return { error: "A reason of at least 5 characters is required." };
  const ok = await rejectReferral(referralId, user.id, reason.trim());
  if (!ok) return { error: "This referral can't be rejected in its current state — reverse it instead if it was already rewarded." };
  revalidatePath("/lms/wallet/referrals");
  return {};
}

export async function reverseReferralAction(referralId: string, reason: string): Promise<{ error?: string }> {
  const user = await requireLmsUser();
  const res = await reverseReferralRewards(referralId, user.id, reason);
  if (!res.ok) return { error: res.error };
  revalidatePath("/lms/wallet/referrals");
  revalidatePath("/lms/wallet/ledger");
  return {};
}

export async function reverseTransactionAction(txId: string, reason: string): Promise<{ error?: string }> {
  const user = await requireLmsUser();
  const res = await reverseTransaction(txId, user.id, reason);
  if (!res.ok) return { error: res.error };
  revalidatePath("/lms/wallet/ledger");
  revalidatePath("/lms/wallet/users", "layout");
  return {};
}

export async function refundRedemptionAction(txId: string, reason: string): Promise<{ error?: string }> {
  const user = await requireLmsUser();
  const res = await refundRedemption(txId, user.id, reason);
  if (!res.ok) return { error: res.error };
  revalidatePath("/lms/wallet/ledger");
  revalidatePath("/lms/wallet/users", "layout");
  return {};
}

export async function runExpirySweepAction(): Promise<{ error?: string }> {
  await requireLmsUser();
  await runExpirySweep();
  revalidatePath("/lms/wallet");
  return {};
}
