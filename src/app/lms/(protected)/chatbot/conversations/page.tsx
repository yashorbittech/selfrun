import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import ConversationsDataTable from "@/components/lms/ConversationsDataTable";
import { searchConversations, getConversationSourcePages } from "@/lib/chat-conversations";

function parseDateParam(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}${endOfDay ? "T23:59:59.999" : "T00:00:00"}`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

const SORT_FIELDS = ["lastActivityAt", "startedAt", "messageCount"] as const;

export default async function ConversationsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    device?: string;
    sourcePage?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortDir?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const sortBy = (SORT_FIELDS as readonly string[]).includes(sp.sortBy ?? "")
    ? (sp.sortBy as (typeof SORT_FIELDS)[number])
    : "lastActivityAt";
  const sortDir = sp.sortDir === "asc" ? "asc" : "desc";

  const [{ items, total, totalPages }, sourcePages] = await Promise.all([
    searchConversations({
      page,
      pageSize: 20,
      search: sp.search,
      device: sp.device,
      sourcePage: sp.sourcePage,
      dateFrom: parseDateParam(sp.dateFrom),
      dateTo: parseDateParam(sp.dateTo, true),
      sortBy,
      sortDir,
    }),
    getConversationSourcePages(),
  ]);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/lms" },
          { label: "AI Chatbot", href: "/lms/chatbot" },
          { label: "Conversations" },
        ]}
        title={<>Conversations</>}
        description={<>{total} conversation{total === 1 ? "" : "s"} · click a row for the full transcript</>}
      />

      <ConversationsDataTable
        items={items}
        total={total}
        page={page}
        totalPages={totalPages}
        sourcePages={sourcePages}
        initialSearch={sp.search ?? ""}
        initialDevice={sp.device ?? ""}
        initialSourcePage={sp.sourcePage ?? ""}
        initialDateFrom={sp.dateFrom ?? ""}
        initialDateTo={sp.dateTo ?? ""}
        initialSortBy={sortBy}
        initialSortDir={sortDir}
      />
    </div>
  );
}
