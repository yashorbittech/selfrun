import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import GlassCard from "@/components/lms/GlassCard";
import { PageHeader, EmptyState } from "@/components/smms/SmmsUi";
import SmmsFilterBar from "@/components/smms/SmmsFilterBar";
import { PlatformChip, StatusBadge } from "@/components/smms/SmmsBits";
import { getViewer, can } from "@/lib/smms/viewer";
import { listCampaigns } from "@/lib/smms/campaigns";
import { adsCollection } from "@/lib/smms/ads";
import { AD_PLATFORMS, CONTENT_STATUSES, PLATFORM_META, STATUS_META } from "@/lib/smms/constants";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/smms/login");
  if (!can(viewer, "VIEW_CAMPAIGNS")) redirect("/smms");
  const sp = await searchParams;
  const page = Math.max(Number(sp.page) || 1, 1);
  const r = await listCampaigns({ q: sp.q, status: sp.status, platform: sp.platform, page });
  const ads = await adsCollection();
  const counts = await ads.aggregate<{ _id: string; n: number }>([{ $match: { campaignId: { $in: r.items.map((c) => c._id) }, deletedAt: null } }, { $group: { _id: "$campaignId", n: { $sum: 1 } } }]).toArray();
  const adCount = new Map(counts.map((c) => [c._id, c.n]));
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => !!e[1]));
    qs.set("page", String(p));
    return `/smms/campaigns?${qs}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Campaigns & Ads"
        crumbs={[{ label: "Campaigns & Ads" }]}
        description="AI-planned paid campaigns for Instagram, Facebook, YouTube, LinkedIn and Google Ads — strategy, ad copy and image/video creatives."
        actions={can(viewer, "CREATE_CAMPAIGNS") && <Button nativeButton={false} render={<Link href="/smms/campaigns/new" />}><Plus className="size-4" /> New campaign</Button>}
      />
      <SmmsFilterBar
        values={{ q: sp.q ?? "", status: sp.status ?? "", platform: sp.platform ?? "" }}
        fields={[
          { key: "q", label: "Search", type: "search", placeholder: "Name, objective, keyword" },
          { key: "status", label: "Status", type: "select", options: [...CONTENT_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label })), { value: "all", label: "All incl. archived" }], allLabel: "All active" },
          { key: "platform", label: "Platform", type: "select", options: AD_PLATFORMS.map((p) => ({ value: p, label: PLATFORM_META[p].label })) },
        ]}
      />
      <GlassCard interactive={false}>
        <CardContent>
          {r.items.length === 0 ? (
            <EmptyState icon={<Megaphone className="size-5" />} title="No campaigns yet">{can(viewer, "CREATE_CAMPAIGNS") ? "Create one — describe the brief and let OpenAI draft the strategy, ad concepts and copy." : "Campaigns created by your team will appear here."}</EmptyState>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Platforms</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ads</TableHead><TableHead>Duration</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
              <TableBody>
                {r.items.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="max-w-xs">
                      <Link href={`/smms/campaigns/${c._id}`} className="font-medium hover:text-primary">{c.name}</Link>
                      <p className="truncate text-[11px] text-muted-foreground">{[c.objective, c.offerService].filter(Boolean).join(" · ") || "—"}</p>
                    </TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{c.platforms.map((p) => <PlatformChip key={p} platform={p} />)}</div></TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-right tabular-nums">{adCount.get(c._id) ?? 0}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{c.startDate ? `${formatDate(c.startDate)} – ${c.endDate ? formatDate(c.endDate) : "open"}` : "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(c.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </GlassCard>
      {r.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{`Page ${page} of ${r.totalPages} · ${r.total} campaigns`}</span>
          <div className="flex gap-2">
            <Link href={href(Math.max(page - 1, 1))} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page <= 1}><ChevronLeft className="size-3.5" />Previous</Link>
            <Link href={href(Math.min(page + 1, r.totalPages))} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page >= r.totalPages}>Next<ChevronRight className="size-3.5" /></Link>
          </div>
        </div>
      )}
    </div>
  );
}
