import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { listLeadConversations } from "@/lib/lead-management/messages";
import LmsMessagesInbox from "./LmsMessagesInbox";

export const dynamic = "force-dynamic";

export default async function LmsMessagesPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const { lead } = await searchParams;
  const conversations = await listLeadConversations();

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-3">
      <PanelPageHeader title={<>Messages</>} description={<>Two-way conversations with leads and portal users.</>} />
      <LmsMessagesInbox conversations={conversations} initialLeadId={lead} />
    </div>
  );
}
