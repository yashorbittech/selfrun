"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceAction } from "@/lib/workspace/access";
import { deleteConversation, bulkDeleteConversations } from "@/lib/chat-conversations";

function revalidate() {
  revalidatePath("/workspace/chatbot/conversations");
}

export async function deleteConversationAction(id: string): Promise<{ ok: boolean }> {
  await requireWorkspaceAction("manage.chatbot.conversations");
  const ok = await deleteConversation(id);
  if (ok) revalidate();
  return { ok };
}

export async function bulkDeleteConversationsAction(ids: string[]): Promise<{ deleted: number }> {
  await requireWorkspaceAction("manage.chatbot.conversations");
  const deleted = await bulkDeleteConversations(ids);
  revalidate();
  return { deleted };
}
