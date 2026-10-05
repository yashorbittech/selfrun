import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { requireWorkspaceAccess } from "@/lib/workspace/access";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { searchMeetings } from "@/lib/workspace/teamchat";
import MeetingsFilterBar from "./MeetingsFilterBar";
import MeetingsGrid from "./MeetingsGrid";

export default async function AdminMeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  await requireWorkspaceAccess("manage.teamchat.meetings");
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);

  const { items, total, totalPages } = await searchMeetings({
    page,
    pageSize: 20,
    search: sp.search,
    status: sp.status,
  });

  const hasActiveFilters = Boolean(sp.search || sp.status);

  const exportParams = new URLSearchParams();
  if (sp.search) exportParams.set("search", sp.search);
  if (sp.status) exportParams.set("status", sp.status);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "Workspace", href: "/workspace" }, { label: "Team Chat", panel: "messenger" }, { label: "Meetings" }]}
        title={<>Meetings</>}
        description={<>{total} meeting{total === 1 ? "" : "s"}.</>}
      />

      <MeetingsGrid
        rows={items}
        total={total}
        page={page}
        totalPages={totalPages}
        hasActiveFilters={hasActiveFilters}
        exportHref={`/api/workspace/teamchat/meetings/export?${exportParams.toString()}`}
        filters={<MeetingsFilterBar initialSearch={sp.search ?? ""} initialStatus={sp.status ?? ""} />}
      />
    </div>
  );
}
