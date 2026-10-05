import { getCurrentChatUser } from "@/lib/messenger-auth";
import { listMemberChannels, serializeChannel } from "@/lib/messenger/channels";
import { provisionAllProjectChannels } from "@/lib/messenger/projects";
import ConversationList, { type ConversationRow } from "@/components/messenger/ConversationList";

export const dynamic = "force-dynamic";

export default async function ProjectChannelsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentChatUser();
  if (!user) return null;

  // Reconcile every PMS project's channel + membership. Throttled to once / 10 min.
  await provisionAllProjectChannels();

  const channels = await listMemberChannels(user.id, "project");
  const serialized = await Promise.all(channels.map((c) => serializeChannel(c, user.id)));

  const rows: ConversationRow[] = serialized.map((c) => ({
    href: `/messenger/projects/${c.slug}`,
    key: c._id,
    title: c.name,
    subtitle: c.lastMessagePreview ?? c.topic ?? c.description,
    timestamp: c.lastActivityAt,
    unread: c.unread,
    channelVisibility: "private",
    kind: "channel",
  }));

  return (
    <div className="flex h-full overflow-hidden rounded-2xl border border-border/40 bg-background/95 backdrop-blur-md dark:bg-card/85">
      <aside className="hidden w-72 shrink-0 border-r border-border/60 sm:block">
        <ConversationList
          rows={rows}
          header="Project Channels"
          emptyLabel="No project channels yet. They appear automatically once you're on a PMS project team."
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
