import { getCurrentChatUser } from "@/lib/messenger-auth";
import ChannelScreen from "@/components/messenger/ChannelScreen";

export const dynamic = "force-dynamic";

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentChatUser();
  if (!user) return null;
  return <ChannelScreen slug={slug} user={user} expectKind="team" browseHref="/messenger/channels" />;
}
