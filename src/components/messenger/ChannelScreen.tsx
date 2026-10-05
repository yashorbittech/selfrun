import { notFound } from "next/navigation";
import type { CurrentChatUser } from "@/lib/messenger-auth";
import {
  getChannelBySlug,
  canAccessChannel,
  canPostInChannel,
  getMembership,
  listMembers,
  serializeChannel,
  type ChannelKind,
} from "@/lib/messenger/channels";
import { listMessages } from "@/lib/messenger/messages";
import { getChatUser } from "@/lib/messenger/users";
import { listSharedFilesForScope } from "@/lib/messenger/attachments";
import { getPresence } from "@/lib/messenger/presence";
import { scopeKey } from "@/lib/messenger/event-key";
import { isChatAdmin } from "@/lib/messenger-roles";
import ChatView from "@/components/messenger/ChatView";
import ChannelHeader from "@/components/messenger/ChannelHeader";
import ChannelWorkspace from "@/components/messenger/ChannelWorkspace";
import JoinChannelButton from "@/components/messenger/JoinChannelButton";
import JoinMeetingBanner from "@/components/messenger/call/JoinMeetingBanner";
import type { ClientMessage } from "@/components/messenger/types";

/**
 * The full conversation screen for one channel — reused by Team Channels,
 * Group Chats and Project Channels. `expectKind` guards that the slug belongs
 * to the section it was opened from.
 */
export default async function ChannelScreen({
  slug,
  user,
  expectKind,
  browseHref,
}: {
  slug: string;
  user: CurrentChatUser;
  expectKind: ChannelKind;
  browseHref: string;
}) {
  const channel = await getChannelBySlug(slug);
  if (!channel || channel.kind !== expectKind) notFound();
  if (!(await canAccessChannel(channel, user))) notFound();

  const membership = await getMembership(channel._id, user.id);
  const scope = { type: "channel" as const, id: channel._id };

  const [serialized, members, messages, me, files] = await Promise.all([
    serializeChannel(channel, user.id),
    listMembers(channel._id),
    listMessages({ scope, viewerId: user.id, limit: 40 }),
    getChatUser(user.id),
    listSharedFilesForScope(scope, 30),
  ]);
  const presence = await getPresence(members.map((m) => m.userId));

  const canPost = await canPostInChannel(channel, user);
  const isModerator = isChatAdmin(user) || membership?.role === "owner" || membership?.role === "admin";

  const memberLite = [
    { _id: user.id, displayName: me?.displayName ?? user.displayName },
    ...members.map((m) => ({ _id: m.userId, displayName: m.user?.displayName ?? "Unknown" })),
  ];

  const pinnedMessages = messages.filter((m) => channel.pinnedMessageIds.includes(m._id));

  return (
    <>
      <ChannelHeader
        channel={{
          _id: channel._id,
          name: channel.name,
          slug: channel.slug,
          description: channel.description,
          topic: channel.topic,
          visibility: channel.visibility,
          archived: channel.archivedAt !== null,
          memberCount: serialized.memberCount,
          kind: channel.kind,
        }}
        isMember={membership !== null}
        canModerate={isModerator}
        currentUserId={user.id}
        browseHref={browseHref}
      />

      {membership === null && channel.visibility === "public" && (
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-sm">
          <span className="text-muted-foreground">You&apos;re previewing this channel. Join to post and get notified.</span>
          <JoinChannelButton slug={channel.slug} />
        </div>
      )}

      <JoinMeetingBanner scope={scope} />

      <ChannelWorkspace
        chat={
          <ChatView
            scope={scope}
            scopeKey={scopeKey(scope)}
            currentUserId={user.id}
            canPost={canPost}
            members={memberLite}
            initialMessages={messages as unknown as ClientMessage[]}
            emptyState={`This is the very beginning of ${channel.kind === "group" ? channel.name : `#${channel.slug}`}.`}
          />
        }
        channelId={channel._id}
        description={channel.description}
        topic={channel.topic}
        members={members.map((m) => ({
          userId: m.userId,
          displayName: m.user?.displayName ?? "Unknown",
          title: m.user?.title ?? null,
          role: m.role,
          presence: presence[m.userId] ?? "offline",
        }))}
        pinned={pinnedMessages.map((m) => ({
          _id: m._id,
          authorName: m.author?.displayName ?? "Unknown",
          body: m.body,
          createdAt: m.createdAt,
        }))}
        files={files}
        canModerate={isModerator}
        currentUserId={user.id}
        readOnlyMembers={channel.kind === "project"}
      />
    </>
  );
}
