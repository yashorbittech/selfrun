"use server";

import { redirect } from "next/navigation";
import { getCurrentChatUser } from "@/lib/messenger-auth";
import { getOrCreateDirect } from "@/lib/messenger/conversations";
import { togglePinnedConversation } from "@/lib/messenger/users";
import { revalidatePath } from "next/cache";

export async function startDirectMessageAction(otherUserId: string): Promise<{ error: string } | never> {
  const user = await getCurrentChatUser();
  if (!user) redirect("/messenger/login");

  const result = await getOrCreateDirect({ id: user.id, roles: user.roles }, otherUserId);
  if (!result.ok) return { error: result.error };
  redirect(`/messenger/dm/${result.conversation._id}`);
}

export async function togglePinConversationAction(conversationId: string): Promise<{ pinned: boolean }> {
  const user = await getCurrentChatUser();
  if (!user) redirect("/messenger/login");
  const pinned = await togglePinnedConversation(user.id, conversationId);
  revalidatePath("/messenger/dm", "layout");
  return { pinned };
}
