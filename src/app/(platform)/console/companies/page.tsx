import type { Metadata } from "next";
import { requirePlatformPermission } from "@/lib/platform/console/access";
import { listCompanies } from "@/lib/platform/console/companies";
import PlatformPageHeader from "@/components/platform/panel/PlatformPageHeader";
import CompaniesFilterBar from "./CompaniesFilterBar";
import CompaniesGrid from "./CompaniesGrid";

export const metadata: Metadata = { title: "Companies" };

export default async function PlatformCompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requirePlatformPermission("companies.read");
  const sp = await searchParams;
  const status = sp.status === "active" || sp.status === "suspended" ? sp.status : "all";
  const list = await listCompanies({ q: sp.q, status, page: Number(sp.page) || 1 });

  return (
    <div className="space-y-6 p-1">
      <PlatformPageHeader title="Companies" description="Every company on the platform — search, open, suspend or reactivate." />
      <CompaniesGrid
          rows={list.rows}
          total={list.total}
          page={list.page}
          totalPages={list.totalPages}
          hasActiveFilters={Boolean(sp.q || status !== "all")}
          filters={<CompaniesFilterBar initialSearch={sp.q ?? ""} initialStatus={status} />}
      />
    </div>
  );
}
