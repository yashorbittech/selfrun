"use server";

import { redirect } from "next/navigation";
import { getCurrentHubUser } from "@/lib/hub-auth";
import {
  disconnectPaymentAccount,
  savePaymentAccount,
  testPaymentAccount,
  type PaymentAccountInput,
  type PaymentAccountResult,
} from "@/lib/platform/integrations/payments";

async function requireOwner() {
  const user = await getCurrentHubUser();
  if (!user) redirect("/workspace/login");
  if (!user.roles.includes("super_admin")) redirect("/workspace");
  return user;
}

export async function savePaymentAccountAction(input: PaymentAccountInput): Promise<PaymentAccountResult> {
  const user = await requireOwner();
  return savePaymentAccount(
    {
      keyId: String(input?.keyId ?? ""),
      keySecret: String(input?.keySecret ?? ""),
      webhookSecret: String(input?.webhookSecret ?? ""),
      payoutsEnabled: input?.payoutsEnabled === true,
      accountNumber: String(input?.accountNumber ?? ""),
    },
    { id: user.id, email: user.email },
  );
}

export async function testPaymentAccountAction(): Promise<PaymentAccountResult> {
  await requireOwner();
  return testPaymentAccount();
}

export async function disconnectPaymentAccountAction(): Promise<PaymentAccountResult> {
  const user = await requireOwner();
  return disconnectPaymentAccount({ id: user.id, email: user.email });
}
