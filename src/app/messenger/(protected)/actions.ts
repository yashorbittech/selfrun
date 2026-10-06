"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getCurrentChatUser } from "@/lib/messenger-auth";
import { goOffline } from "@/lib/messenger/presence";
import { markRead, markAllRead } from "@/lib/messenger/notifications";
import { signOutThisDevice } from "@/lib/security/sessions";

/**
 * Centralized logout: destroys this account's session in EVERY panel (not
 * just Messenger's own), on every device — see `cross-module-sso.ts`.
 */
export async function messengerLogoutAction(): Promise<void> {
  const user = await getCurrentChatUser();
  if (user) {
    await goOffline(user.id).catch(() => {});
    if (ObjectId.isValid(user.id)) {
      await signOutThisDevice(new ObjectId(user.id));
    }
  }
  redirect("/workspace/login");
}

export async function markNotificationsReadAction(ids: string[]): Promise<{ ok: boolean }> {
  const user = await getCurrentChatUser();
  if (!user) return { ok: false };
  await markRead(ids, user.id);
  revalidatePath("/messenger/notifications");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{ ok: boolean }> {
  const user = await getCurrentChatUser();
  if (!user) return { ok: false };
  await markAllRead(user.id);
  revalidatePath("/messenger/notifications");
  return { ok: true };
}
