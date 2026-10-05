import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Link from "next/link";
import { Building2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import FmsDataTable from "@/components/fms/FmsDataTable";
import { VendorCategoryBadge } from "@/components/prms/StatusBadges";
import { listVendors, totalPayables } from "@/lib/fms/vendors";
import { getVendorStatusMeta, isValidVendorStatus, VENDOR_STATUSES, VENDOR_CATEGORIES } from "@/lib/prms/constants";
import { formatMoney } from "@/lib/fms/constants";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const status = sp.status && isValidVendorStatus(sp.status) ? sp.status : undefined;
  const category = sp.category && VENDOR_CATEGORIES.some((c) => c.value === sp.category) ? (sp.category as (typeof VENDOR_CATEGORIES)[number]["value"]) : undefined;
  const sortBy = (sp.sortBy as "createdAt" | "companyName" | "vendorCode" | "rating" | "status") || "companyName";
  const sortDir = sp.sortDir === "desc" ? "desc" : "asc";

  const [result, payables] = await Promise.all([
    listVendors({ search: sp.search, status, category, page, pageSize: 20, sortBy, sortDir }),
    totalPayables(),
  ]);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "FMS", href: "/fms" }, { label: "Vendors" }]}
        title={<>Vendors</>}
        description={<>Financial view over PRMS&apos;s vendor records — {result.total} vendor{result.total === 1 ? "" : "s"}.</>}
      />

      <KpiGrid>
        <KpiCard label="Total Vendors" value={result.total} accent icon={<Building2 className="size-4" />} />
        <KpiCard label="Total Payables (Outstanding)" value={<span>{formatMoney(payables)}</span>} tone={payables > 0 ? "down" : undefined} icon={<Clock className="size-4" />} />
      </KpiGrid>

      <FmsDataTable
        columns={[
          { key: "company", header: "Company", sortable: true },
          { key: "code", header: "Code" },
          { key: "category", header: "Category" },
          { key: "paid", header: "Paid", align: "right" },
          { key: "outstanding", header: "Outstanding", align: "right" },
          { key: "status", header: "Status" },
        ]}
        rows={result.items.map((v) => ({
          id: v._id,
          href: `/fms/vendors/${v._id}`,
          cells: {
            company: v.companyName,
            code: v.vendorCode,
            category: <VendorCategoryBadge category={v.category} />,
            paid: formatMoney(v.financials.totalPaid, v.currency),
            outstanding: formatMoney(v.financials.totalOutstanding, v.currency),
            status: <Badge className={getVendorStatusMeta(v.status).badgeClass}>{getVendorStatusMeta(v.status).label}</Badge>,
          },
        }))}
        filters={[
          { key: "status", label: "Status", value: sp.status ?? "", options: VENDOR_STATUSES.map((s) => ({ value: s.value, label: s.label })) },
          { key: "category", label: "Category", value: sp.category ?? "", options: VENDOR_CATEGORIES.map((c) => ({ value: c.value, label: c.label })) },
        ]}
        search={sp.search ?? ""}
        searchPlaceholder="Company, code, GSTIN, contact"
        sortBy={sortBy}
        sortDir={sortDir}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        emptyLabel="No vendors found — vendor records are created in PRMS."
      />

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="size-3.5" />
        Vendor records are owned by PRMS. Create or edit a vendor at{" "}
        <Link href="/prms/vendors" className="text-primary hover:underline">/prms/vendors</Link>.
      </p>
    </div>
  );
}
