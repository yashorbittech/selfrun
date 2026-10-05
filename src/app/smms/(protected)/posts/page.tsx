import PanelTabs from "@/components/platform/panel/PanelTabs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Share2, ChevronLeft, ChevronRight, List, CalendarDays } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import GlassCard from "@/components/lms/GlassCard";
import { PageHeader, EmptyState } from "@/components/smms/SmmsUi";
import SmmsFilterBar from "@/components/smms/SmmsFilterBar";
import { PlatformChip, StatusBadge, KindChip } from "@/components/smms/SmmsBits";
import { getViewer, can } from "@/lib/smms/viewer";
import { listPosts, calendarPosts, type PostDoc } from "@/lib/smms/posts";
import { listCampaignOptions } from "@/lib/smms/campaigns";
import { CONTENT_STATUSES, POST_PLATFORMS, PLATFORM_META, STATUS_META } from "@/lib/smms/constants";
import { cn, formatDateTime } from "@/lib/utils";

function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7)); // Monday-first
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function when(p: PostDoc): Date | null {
  return p.publishedAt ?? p.scheduledAt ?? p.plannedAt ?? null;
}

export default async function PostsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/smms/login");
  if (!can(viewer, "MANAGE_POSTS") && !can(viewer, "VIEW_CAMPAIGNS")) redirect("/smms");
  const sp = await searchParams;
  const view = sp.view === "calendar" ? "calendar" : "list";
  const page = Math.max(Number(sp.page) || 1, 1);
  const campaigns = await listCampaignOptions();
  const qs = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(Object.entries(sp).filter((e): e is [string, string] => !!e[1]));
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) q.delete(k);
      else q.set(k, v);
    }
    return `/smms/posts?${q}`;
  };

  let body: React.ReactNode;
  if (view === "calendar") {
    const now = new Date();
    const [y, m] = (sp.month ?? `${now.getFullYear()}-${now.getMonth() + 1}`).split("-").map(Number);
    const year = y || now.getFullYear();
    const month = (m || now.getMonth() + 1) - 1;
    const days = monthGrid(year, month);
    const posts = await calendarPosts(days[0], new Date(days[41].getTime() + 86400000));
    const byDay = new Map<string, PostDoc[]>();
    for (const p of posts) {
      const d = when(p);
      if (!d) continue;
      if (sp.platform && !p.platforms.includes(sp.platform as never)) continue;
      const k = dayKey(d);
      byDay.set(k, [...(byDay.get(k) ?? []), p]);
    }
    const prev = new Date(year, month - 1, 1);
    const next = new Date(year, month + 1, 1);
    body = (
      <GlassCard interactive={false}>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Link href={qs({ month: `${prev.getFullYear()}-${prev.getMonth() + 1}` })} className={buttonVariants({ variant: "outline", size: "sm" })}><ChevronLeft className="size-3.5" /></Link>
            <p className="text-sm font-semibold">{new Date(year, month, 1).toLocaleString("en-US", { month: "long", year: "numeric" })}</p>
            <Link href={qs({ month: `${next.getFullYear()}-${next.getMonth() + 1}` })} className={buttonVariants({ variant: "outline", size: "sm" })}><ChevronRight className="size-3.5" /></Link>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[11px]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="px-1 font-semibold text-muted-foreground">{d}</div>)}
            {days.map((d) => {
              const items = byDay.get(dayKey(d)) ?? [];
              const inMonth = d.getMonth() === month;
              return (
                <div key={d.toISOString()} className={cn("min-h-24 rounded-lg border border-border/40 p-1", inMonth ? "bg-background/60" : "bg-muted/30 text-muted-foreground")}>
                  <p className="mb-0.5 px-0.5 font-semibold">{d.getDate()}</p>
                  <div className="space-y-0.5">
                    {items.slice(0, 4).map((p) => (
                      <Link key={p._id} href={`/smms/posts/${p._id}`} className="block truncate rounded px-1 py-0.5 hover:bg-primary/10" title={`${p.title} · ${STATUS_META[p.status].label}${p.status !== "scheduled" && !p.publishedAt ? " (planned)" : ""}`}>
                        <span className={cn("mr-1 inline-block size-1.5 rounded-full", p.status === "published" ? "bg-emerald-500" : p.status === "scheduled" ? "bg-amber-500" : p.status === "failed" ? "bg-rose-500" : "bg-slate-400")} />
                        {`${when(p)!.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} ${p.title}`}
                      </Link>
                    ))}
                    {items.length > 4 && <p className="px-1 text-muted-foreground">{`+${items.length - 4} more`}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">Dots: green published · amber scheduled · red failed · grey planned (brief date, not scheduled).</p>
        </CardContent>
      </GlassCard>
    );
  } else {
    const r = await listPosts({ q: sp.q, status: sp.status, platform: sp.platform, contentType: sp.type, campaignId: sp.campaign, page });
    body = (
      <>
        <GlassCard interactive={false}>
          <CardContent>
            {r.items.length === 0 ? (
              <EmptyState icon={<Share2 className="size-5" />} title="No posts here">{can(viewer, "MANAGE_POSTS") ? "Create a post — pick platforms, describe the topic and let OpenAI write a version for each platform." : "Posts your team creates will appear here."}</EmptyState>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Post</TableHead><TableHead>Platforms</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>When</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
                <TableBody>
                  {r.items.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="max-w-sm">
                        <Link href={`/smms/posts/${p._id}`} className="font-medium hover:text-primary">{p.title}</Link>
                        <p className="truncate text-[11px] text-muted-foreground">{p.idea || p.topic}</p>
                      </TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{p.variants.map((v) => <span key={v.platform} className={v.publish.state === "published" ? "" : v.publish.state === "failed" ? "opacity-100" : "opacity-60"}><PlatformChip platform={v.platform} /></span>)}</div></TableCell>
                      <TableCell><KindChip kind={p.contentType} /></TableCell>
                      <TableCell><StatusBadge status={p.status} />{p.status === "scheduled" && !p.approvedBy && <p className="text-[10px] text-amber-600">needs approval</p>}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{p.publishedAt ? `Published ${formatDateTime(p.publishedAt)}` : p.scheduledAt ? formatDateTime(p.scheduledAt) : p.plannedAt ? `Planned ${formatDateTime(p.plannedAt)}` : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(p.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </GlassCard>
        {r.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{`Page ${page} of ${r.totalPages} · ${r.total} posts`}</span>
            <div className="flex gap-2">
              <Link href={qs({ page: String(Math.max(page - 1, 1)) })} className={buttonVariants({ variant: "outline", size: "sm" })}><ChevronLeft className="size-3.5" />Previous</Link>
              <Link href={qs({ page: String(Math.min(page + 1, r.totalPages)) })} className={buttonVariants({ variant: "outline", size: "sm" })}>Next<ChevronRight className="size-3.5" /></Link>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Social Media Posts"
        crumbs={[{ label: "Social Media Posts" }]}
        description="One idea, adapted per platform for Instagram, Facebook, YouTube, LinkedIn and Google Business Profile."
        actions={
          <>
            <PanelTabs label="Posts view" active={view} tabs={[{ key: "list", label: "List", icon: <List className="size-3.5" />, href: qs({ view: null, page: null }) }, { key: "calendar", label: "Calendar", icon: <CalendarDays className="size-3.5" />, href: qs({ view: "calendar", page: null }) }]} />
            {can(viewer, "MANAGE_POSTS") && <Button nativeButton={false} render={<Link href="/smms/posts/new" />}><Plus className="size-4" /> New post</Button>}
          </>
        }
      />
      <SmmsFilterBar
        values={{ q: sp.q ?? "", status: sp.status ?? "", platform: sp.platform ?? "", type: sp.type ?? "", campaign: sp.campaign ?? "" }}
        fields={
          view === "calendar"
            ? [{ key: "platform", label: "Platform", type: "select", options: POST_PLATFORMS.map((p) => ({ value: p, label: PLATFORM_META[p].label })) }]
            : [
                { key: "q", label: "Search", type: "search", placeholder: "Title, topic, idea" },
                { key: "status", label: "Status", type: "select", options: [...CONTENT_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label })), { value: "all", label: "All incl. archived" }], allLabel: "All active" },
                { key: "platform", label: "Platform", type: "select", options: POST_PLATFORMS.map((p) => ({ value: p, label: PLATFORM_META[p].label })) },
                { key: "type", label: "Media", type: "select", options: [{ value: "image", label: "Image" }, { value: "video", label: "Video" }] },
                { key: "campaign", label: "Campaign", type: "select", options: campaigns.map((c) => ({ value: c._id, label: c.name })) },
              ]
        }
      />
      {body}
    </div>
  );
}
