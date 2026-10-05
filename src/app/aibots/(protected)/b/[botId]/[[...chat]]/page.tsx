import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound, redirect } from "next/navigation";
import ChatWorkspace from "@/components/aibots/ChatWorkspace";
import { getViewer, can } from "@/lib/aibots/viewer";
import { getChatBot, toSummary, GENERAL_BOT_ID } from "@/lib/aibots/bots";
import { getChat, listMyChats } from "@/lib/aibots/chats";
import { workspaceMessages } from "@/lib/aibots/workspace";
import { countAssignedFiles } from "@/lib/aibots/engine";
import { isOpenAIConfigured } from "@/lib/openai";

/**
 * Any bot's workspace — or the general assistant ("Start New Chat"). One page
 * serves every bot (the bot is data), for both a fresh chat (`/aibots/b/<bot>`)
 * and an existing one (`/aibots/b/<bot>/<chat>`). Only the viewer's own chats
 * open here; others' are read-only at /aibots/chats/[id].
 */
export default async function BotWorkspacePage({ params }: { params: Promise<{ botId: string; chat?: string[] }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/aibots/login");
  const { botId, chat: segments = [] } = await params;
  if (segments.length > 1) notFound();
  const bot = await getChatBot(viewer, botId);
  if (!bot) notFound();

  const chat = segments[0] ? await getChat(viewer, segments[0]).catch(() => null) : null;
  if (segments[0] && (!chat || chat.botId !== bot._id)) notFound();
  const [chats, transcript, knowledgeFiles] = await Promise.all([
    listMyChats(viewer, bot._id),
    chat ? workspaceMessages(chat) : Promise.resolve({ messages: [], error: null }),
    bot.vectorStoreId ? countAssignedFiles(bot._id) : Promise.resolve(0),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PanelPageHeader title={<>{bot.name}</>} description={<>{chat?.title ?? "Start a new conversation."}</>} />
      <div className="min-h-0 flex-1">
    <ChatWorkspace
      bot={toSummary(bot)}
      chats={chats}
      chatId={chat?._id ?? null}
      chatTitle={chat?.title ?? null}
      initialMessages={transcript.messages}
      ownerEmail={viewer.email}
      manageHref={bot._id === GENERAL_BOT_ID ? (can(viewer, "MANAGE_SETTINGS") ? "/aibots/settings" : null) : can(viewer, "EDIT_BOT") ? `/aibots/bots/${bot._id}` : null}
      openAIReady={(await isOpenAIConfigured())}
      historyError={transcript.error}
      knowledgeFiles={knowledgeFiles}
    />
      </div>
    </div>
  );

}
