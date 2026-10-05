"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import AdminDataGrid, { type AdminDataGridColumn } from "@/components/workspace/data-grid/AdminDataGrid";
import { formatDate } from "@/lib/utils";
import type { CompanyRow } from "@/lib/platform/console/companies";
import StatusBadge from "./StatusBadge";

const columns: AdminDataGridColumn<CompanyRow>[] = [
  {
    key: "name",
    label: "Company",
    render: (row) => (
      <Link href={`/platform/companies/${row.id}`} className="block hover:underline">
        <span className="font-medium text-foreground">{row.name}</span>
        <span className="block text-xs">{row.slug}</span>
      </Link>
    ),
  },
  { key: "owner", label: "Owner", render: (row) => row.ownerEmail ?? "—" },
  { key: "users", label: "Users", cellClassName: "tabular-nums", render: (row) => row.userCount },
  {
    key: "domains",
    label: "Domains",
    render: (row) =>
      row.domains.length ? (
        <span className="text-xs">
          {row.domains[0]}
          {row.domains.length > 1 && ` +${row.domains.length - 1}`}
        </span>
      ) : (
        "—"
      ),
  },
  {
    key: "onboarding",
    label: "Setup",
    render: (row) =>
      row.isPlatformOwner ? (
        "—"
      ) : (
        <span className="text-xs tabular-nums">
          {row.onboarding.done}/{row.onboarding.total}
          {row.onboarding.completedAt ? " · done" : row.onboarding.dismissedAt ? " · skipped" : ""}
        </span>
      ),
  },
  { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} isPlatformOwner={row.isPlatformOwner} /> },
];

export default function CompaniesGrid({
  rows,
  total,
  page,
  totalPages,
  filters,
  hasActiveFilters,
}: {
  rows: CompanyRow[];
  total: number;
  page: number;
  totalPages: number;
  filters: ReactNode;
  hasActiveFilters: boolean;
}) {
  return (
    <AdminDataGrid
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      total={total}
      page={page}
      totalPages={totalPages}
      emptyLabel="No companies match these filters."
      filters={filters}
      filterTitle="Companies"
      filterSubtitle={`${total} compan${total === 1 ? "y" : "ies"}`}
      filterIcon={Building2}
      hasActiveFilters={hasActiveFilters}
      rowActions={(row) => (
        <Link href={`/platform/companies/${row.id}`} aria-label={`Open ${row.name}`} className="text-muted-foreground hover:text-foreground">
          <ChevronRight className="size-4" />
        </Link>
      )}
    />
  );
}
