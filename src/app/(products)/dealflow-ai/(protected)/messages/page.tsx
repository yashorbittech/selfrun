import { requireLmsPage } from "@/lib/lms-auth";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Breadcrumbs from "@/components/products/dealflow-ai/Breadcrumbs";
import { listLeadConversations } from "@/lib/lead-management/messages";
import LmsMessagesInbox from "./LmsMessagesInbox";

export const dynamic = "force-dynamic";

export default async function LmsMessagesPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  await requireLmsPage("VIEW_LEADS");
  const { lead } = await searchParams;
  const conversations = await listLeadConversations();

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <LmsMessagesInbox conversations={conversations} initialLeadId={lead} />
    </div>
  );
}
