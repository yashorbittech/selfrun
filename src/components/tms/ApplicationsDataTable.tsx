"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, FileText, RotateCcw } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ApplicationStatusBadge } from "@/components/tms/StatusBadges";
import { APPLICATION_STATUSES } from "@/lib/tms/constants";
import { formatDate } from "@/lib/utils";
import type { SerializedApplication } from "@/lib/tms/applications";

export type ApplicationRow = SerializedApplication & { programName: string };

interface Props {
  items: ApplicationRow[];
  total: number;
  page: number;
  totalPages: number;
  programs: { _id: string; name: string }[];
  sources: string[];
  initial: { search: string; status: string; programId: string; source: string };
}

export default function ApplicationsDataTable({ items, total, page, totalPages, programs, sources, initial }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(initial.search);

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== initial.search) updateParams({ search: searchInput || undefined });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const hasActiveFilters = Boolean(initial.search || initial.status || initial.programId || initial.source);

  function pageHref(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/40 bg-card/90 p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <FileText className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">Search &amp; Filters</h3>
              <p className="text-xs text-muted-foreground">Track admissions pipeline by status, program and source</p>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); router.replace(pathname); }}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all"
            >
              <RotateCcw className="size-3.5" />
              Reset Filters
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Name, code, email, college" className="h-9 w-60 pl-8 rounded-xl border-border/50 bg-background focus-visible:border-primary focus-visible:ring-primary/40" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={initial.status || "all"} onValueChange={(v) => updateParams({ status: !v || v === "all" ? undefined : v })}>
                <SelectTrigger className="w-36 rounded-xl border-border/50 bg-background focus-visible:border-primary focus-visible:ring-primary/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Program</label>
              <Select value={initial.programId || "all"} onValueChange={(v) => updateParams({ programId: !v || v === "all" ? undefined : v })}>
                <SelectTrigger className="w-48 rounded-xl border-border/50 bg-background focus-visible:border-primary focus-visible:ring-primary/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All programs</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sources.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Source</label>
                <Select value={initial.source || "all"} onValueChange={(v) => updateParams({ source: !v || v === "all" ? undefined : v })}>
                  <SelectTrigger className="w-40 rounded-xl border-border/50 bg-background focus-visible:border-primary focus-visible:ring-primary/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    {sources.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
        </div>
      </div>

      <GlassCard interactive={false}>
        <CardContent className="max-h-[65vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No applications match these filters.</TableCell>
                </TableRow>
              )}
              {items.map((a) => (
                <TableRow key={a._id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.applicationCode}</TableCell>
                  <TableCell>
                    <Link href={`/tms/applications/${a._id}`} className="font-medium hover:underline">{a.fullName}</Link>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.programName}</TableCell>
                  <TableCell className="text-muted-foreground">{a.source ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                  <TableCell><ApplicationStatusBadge status={a.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </GlassCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} · {total} total</span>
          <div className="flex gap-2">
            <Link href={pageHref(Math.max(page - 1, 1))} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined}>
              <ChevronLeft className="size-3.5" data-icon="inline-start" />
              Previous
            </Link>
            <Link href={pageHref(Math.min(page + 1, totalPages))} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page >= totalPages} tabIndex={page >= totalPages ? -1 : undefined}>
              Next
              <ChevronRight className="size-3.5" data-icon="inline-end" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
