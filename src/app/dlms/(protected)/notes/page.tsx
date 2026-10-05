import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/dlms/DlmsUi";
import DlmsFilterBar, { type FilterField } from "@/components/dlms/DlmsFilterBar";
import { NotesList } from "@/components/dlms/RecordTables";
import { NoteDialog } from "@/components/dlms/RecordDialogs";
import { getViewer } from "@/lib/dlms/viewer";
import { listNotes } from "@/lib/dlms/records";
import { buildVaultUi } from "@/lib/dlms/ui";
import { NOTE_TYPES } from "@/lib/dlms/constants";
import { SCOPE_OPTIONS, STATUS_OPTIONS, queryFrom, visibleClientOptions, type SearchParams } from "@/lib/dlms/page";

export default async function NotesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/dlms/login");
  const sp = await searchParams;
  const [rows, ui, clients] = await Promise.all([listNotes(viewer, queryFrom(sp)), buildVaultUi(viewer), visibleClientOptions(viewer)]);
  const fields: FilterField[] = [
    { key: "q", label: "Search", type: "search", placeholder: "Title or text…" },
    { key: "scope", label: "Ownership", type: "select", options: SCOPE_OPTIONS, allLabel: "Company & clients" },
    { key: "client", label: "Client", type: "select", options: clients, allLabel: "All clients" },
    { key: "category", label: "Type", type: "select", options: NOTE_TYPES, allLabel: "All types" },
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS, allLabel: "Active" },
  ];
  const canAdd = ui.create && (ui.writeCompany || ui.clients.length > 0);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Notes"
        crumbs={[{ label: "Notes" }]}
        description="Access instructions, setup and deployment notes, and other important company or client information."
        actions={canAdd && <NoteDialog ui={ui} trigger={<Button size="sm"><Plus className="size-3.5" data-icon="inline-start" />Add note</Button>} />}
      />
      <DlmsFilterBar fields={fields} values={{ q: sp.q ?? "", scope: sp.scope ?? "", client: sp.client ?? "", category: sp.category ?? "", status: sp.status ?? "" }} />
      <SectionCard title={`${rows.length} note${rows.length === 1 ? "" : "s"}`}>
        <NotesList rows={rows} ui={ui} />
      </SectionCard>
    </div>
  );
}
