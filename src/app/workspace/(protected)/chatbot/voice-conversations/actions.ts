"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceAction } from "@/lib/workspace/access";
import { deleteVoiceConversation, bulkDeleteVoiceConversations } from "@/lib/voice-conversations";

function revalidate() {
  revalidatePath("/workspace/chatbot/voice-conversations");
}

export async function deleteVoiceConversationAction(id: string): Promise<{ ok: boolean }> {
  await requireWorkspaceAction("manage.chatbot.voice-conversations");
  const ok = await deleteVoiceConversation(id);
  if (ok) revalidate();
  return { ok };
}

export async function bulkDeleteVoiceConversationsAction(ids: string[]): Promise<{ deleted: number }> {
  await requireWorkspaceAction("manage.chatbot.voice-conversations");
  const deleted = await bulkDeleteVoiceConversations(ids);
  revalidate();
  return { deleted };
}
