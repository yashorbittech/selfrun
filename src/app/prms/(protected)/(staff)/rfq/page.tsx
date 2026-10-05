import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { Plus, FileSpreadsheet, Send, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import PrmsDataTable from "@/components/prms/PrmsDataTable";
import RfqForm from "@/components/prms/RfqForm";
import { RfqStatusBadge } from "@/components/prms/StatusBadges";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { canManageProcurement } from "@/lib/prms-roles";
import { searchRfqs, countRfqs, serializeRfq } from "@/lib/prms/rfqs";
import { listVendorOptions } from "@/lib/prms/vendors";
import { listDepartments } from "@/lib/prms/pickers";
import { RFQ_STATUSES, isValidRfqStatus, type RfqStatus } from "@/lib/prms/constants";
import { formatDate } from "@/lib/utils";

export default async function RfqPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentPrmsUser();
  const canManage = user ? canManageProcurement(user) : false;

  const page = Math.max(Number(sp.page) || 1, 1);
  const status = sp.status && isValidRfqStatus(sp.status) ? (sp.status as RfqStatus) : undefined;
  const sortBy = sp.sortBy || "createdAt";
  const sortDir = sp.sortDir === "asc" ? "asc" : "desc";

  const [result, vendors, departments, total, sent, awarded] = await Promise.all([
    searchRfqs({ search: sp.search, status, page, pageSize: 20, sortBy, sortDir }),
    listVendorOptions({ activeOnly: true }),
    listDepartments(),
    countRfqs(),
    countRfqs({ status: "sent" }),
    countRfqs({ status: "awarded" }),
  ]);

  const vOpts = vendors.map((v) => ({ _id: v._id, companyName: v.companyName }));
  const dOpts = departments.map((d) => ({ _id: d._id, name: d.name }));

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "PRMS", href: "/prms" }, { label: "RFQ & Quotations" }]}
        title={<>RFQ &amp; Quotations</>}
        description={<>{total} RFQ{total === 1 ? "" : "s"}.</>}
        actions={<>{canManage && (
          <RfqForm
            vendors={vOpts}
            departments={dOpts}
            trigger={
              <Button type="button" size="sm">
                <Plus className="size-3.5" data-icon="inline-start" />
                New RFQ
              </Button>
            }
          />
        )}</>}
      />

      <KpiGrid>
        <KpiCard label="Total RFQs" value={total} accent icon={<FileSpreadsheet className="size-4" />} />
        <KpiCard label="Out for Quotes" value={sent} icon={<Send className="size-4" />} />
        <KpiCard label="Awarded" value={awarded} icon={<Award className="size-4" />} />
      </KpiGrid>

      <PrmsDataTable
        columns={[
          { key: "rfqCode", header: "RFQ #", sortable: true },
          { key: "title", header: "Title" },
          { key: "vendors", header: "Vendors" },
          { key: "quotes", header: "Quotes" },
          { key: "status", header: "Status" },
          { key: "created", header: "Created", sortable: true },
        ]}
        rows={result.items.map(serializeRfq).map((r) => ({
          id: r._id,
          href: `/prms/rfq/${r._id}`,
          cells: {
            rfqCode: r.rfqCode,
            title: r.title,
            vendors: r.vendorIds.length,
            quotes: r.quotations.length,
            status: <RfqStatusBadge status={r.status} />,
            created: formatDate(r.createdAt),
          },
        }))}
        filters={[{ key: "status", label: "Status", value: sp.status ?? "", options: RFQ_STATUSES.map((s) => ({ value: s.value, label: s.label })) }]}
        search={sp.search ?? ""}
        searchPlaceholder="RFQ #, title"
        sortBy={sortBy}
        sortDir={sortDir}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        emptyLabel="No RFQs match these filters."
      />
    </div>
  );
}
