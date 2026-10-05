import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { Plus, Pencil, Handshake, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import PrmsDataTable from "@/components/prms/PrmsDataTable";
import ThirdPartyForm from "@/components/prms/ThirdPartyForm";
import DeleteRowButton from "@/components/prms/DeleteRowButton";
import { ResourceStatusBadge } from "@/components/prms/StatusBadges";
import { RenewalHint } from "@/components/prms/RenewalHint";
import { deleteThirdPartyAction } from "./actions";
import { getCurrentPrmsUser } from "@/lib/prms-auth";
import { canManageProcurement } from "@/lib/prms-roles";
import { searchThirdPartyServices, countThirdPartyServices } from "@/lib/prms/third-party-services";
import { listVendorOptions } from "@/lib/prms/vendors";
import { RESOURCE_STATUSES, isValidResourceStatus, formatMoney, type ResourceStatus } from "@/lib/prms/constants";

export default async function ThirdPartyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentPrmsUser();
  const canManage = user ? canManageProcurement(user) : false;

  const page = Math.max(Number(sp.page) || 1, 1);
  const status = sp.status && isValidResourceStatus(sp.status) ? (sp.status as ResourceStatus) : undefined;
  const sortBy = sp.sortBy || "renewalDate";
  const sortDir = sp.sortDir === "desc" ? "desc" : "asc";

  const [result, vendors, total] = await Promise.all([
    searchThirdPartyServices({ search: sp.search, filters: status ? { status } : {}, page, pageSize: 20, sortBy, sortDir }),
    listVendorOptions(),
    countThirdPartyServices(),
  ]);
  const monthly = result.items.reduce((s, r) => s + r.monthlyCost, 0);
  const vOpts = vendors.map((v) => ({ _id: v._id, companyName: v.companyName }));

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "PRMS", href: "/prms" }, { label: "Third-Party Services" }]}
        title={<>Third-Party Services</>}
        description={<>{total} outsourced service{total === 1 ? "" : "s"}.</>}
        actions={<>{canManage && (
          <ThirdPartyForm
            vendors={vOpts}
            trigger={
              <Button type="button" size="sm">
                <Plus className="size-3.5" data-icon="inline-start" />
                New Service
              </Button>
            }
          />
        )}</>}
      />

      <KpiGrid>
        <KpiCard label="Services" value={total} accent icon={<Handshake className="size-4" />} />
        <KpiCard label="Monthly Cost (page)" value={<span>{formatMoney(monthly)}</span>} icon={<Coins className="size-4" />} />
      </KpiGrid>

      <PrmsDataTable
        columns={[
          { key: "name", header: "Service", sortable: true },
          { key: "type", header: "Type" },
          { key: "provider", header: "Provider" },
          { key: "monthly", header: "Monthly", align: "right" },
          { key: "renewal", header: "Renewal" },
          { key: "status", header: "Status" },
          ...(canManage ? [{ key: "_actions", header: "", align: "right" as const }] : []),
        ]}
        rows={result.items.map((r) => ({
          id: r._id,
          cells: {
            name: r.name,
            type: r.serviceType,
            provider: r.provider,
            monthly: formatMoney(r.monthlyCost, r.currency),
            renewal: <RenewalHint date={r.renewalDate} autoRenew={r.autoRenew} />,
            status: <ResourceStatusBadge status={r.status} />,
            _actions: canManage ? (
              <span className="flex justify-end gap-1">
                <ThirdPartyForm row={r} vendors={vOpts} trigger={<Button type="button" variant="ghost" size="icon-xs" aria-label="Edit"><Pencil className="size-3.5" /></Button>} />
                <DeleteRowButton id={r._id} label={r.name} action={deleteThirdPartyAction} />
              </span>
            ) : null,
          },
        }))}
        filters={[{ key: "status", label: "Status", value: sp.status ?? "", options: RESOURCE_STATUSES.map((s) => ({ value: s.value, label: s.label })) }]}
        search={sp.search ?? ""}
        searchPlaceholder="Name, type, provider"
        sortBy={sortBy}
        sortDir={sortDir}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        emptyLabel="No services match these filters."
      />
    </div>
  );
}
