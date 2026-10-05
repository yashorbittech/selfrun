"use client";

import { usePanels } from "@/components/platform/PanelsProvider";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, ShieldCheck, Layers, UserCheck, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { ROLE_GROUPS } from "@/lib/workspace/role-catalog";

export default function UsersFilterBar({
  initialSearch,
  initialRole,
  initialPanel,
  initialStatus,
  initialUserType,
}: {
  initialSearch: string;
  initialRole: string;
  initialPanel: string;
  initialStatus: string;
  initialUserType: string;
}) {
  // Panel names come from the Panel Registry, like every other listing.
  const allPanels = usePanels();
  const panelOptions = Object.values(allPanels)
    .sort((a, b) => a.order - b.order);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initialSearch);

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== initialSearch) updateParams({ search: searchInput || undefined });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="flex items-center gap-3 flex-wrap w-full">
      {/* Search Input */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">Search</label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search email, notes, ID..."
            className="h-9 w-56 pl-8 text-xs rounded-xl border-border/50 bg-background focus-visible:border-primary focus-visible:ring-primary/40"
          />
        </div>
      </div>

      {/* Panel Filter Dropdown */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">Panel Access</label>
        <Select
          value={initialPanel || "all"}
          onValueChange={(val: string | null) => updateParams({ panel: !val || val === "all" ? undefined : val })}
        >
          <SelectTrigger className="w-44 h-9 text-xs rounded-xl border-border/50 bg-background focus-visible:border-primary focus-visible:ring-primary/40">
            <Layers className="size-3.5 mr-1.5 text-primary shrink-0" />
            <SelectValue placeholder="All Panels" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">All Panels</SelectItem>
            <SelectItem value="admin">Super Admin Panel</SelectItem>
            {panelOptions.map((p) => (
              <SelectItem key={p.key} value={p.key}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Account Status Filter */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">Status</label>
        <Select
          value={initialStatus || "all"}
          onValueChange={(val: string | null) => updateParams({ status: !val || val === "all" ? undefined : val })}
        >
          <SelectTrigger className="w-36 h-9 text-xs rounded-xl border-border/50 bg-background focus-visible:border-primary focus-visible:ring-primary/40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" /> Active Users
              </span>
            </SelectItem>
            <SelectItem value="deactivated">
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <XCircle className="size-3" /> Deactivated
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Category Filter */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">Category</label>
        <Select
          value={initialUserType || "all"}
          onValueChange={(val: string | null) => updateParams({ userType: !val || val === "all" ? undefined : val })}
        >
          <SelectTrigger className="w-40 h-9 text-xs rounded-xl border-border/50 bg-background focus-visible:border-primary focus-visible:ring-primary/40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="employee">Employee (Internal)</SelectItem>
            <SelectItem value="contractor">Contractor / Freelancer</SelectItem>
            <SelectItem value="partner">External Partner</SelectItem>
            <SelectItem value="system">System Account</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Granular Role Filter */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">Specific Role</label>
        <Select
          value={initialRole || "all"}
          onValueChange={(val: string | null) => updateParams({ role: !val || val === "all" ? undefined : val })}
        >
          <SelectTrigger className="w-44 h-9 text-xs rounded-xl border-border/50 bg-background focus-visible:border-primary focus-visible:ring-primary/40">
            <ShieldCheck className="size-3.5 mr-1 text-muted-foreground shrink-0" />
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            {ROLE_GROUPS.map((g) => (
              <SelectGroup key={g.module}>
                <SelectSeparator />
                <SelectLabel>{allPanels[g.panel]?.name ?? g.module}</SelectLabel>
                {g.roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
