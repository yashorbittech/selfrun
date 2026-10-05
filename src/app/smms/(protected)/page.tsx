import PanelFilterBar from "@/components/platform/panel/PanelFilterBar";
import Link from "next/link";
import PanelDashboardHeader from "@/components/platform/panel/PanelDashboardHeader";
import { redirect } from "next/navigation";
import { Megaphone, FilePen, CalendarClock, Send, LayoutGrid, Eye, MousePointerClick, Users, Target, Heart, Sparkles, Plus } from "lucide-react";
import KpiGrid from "@/components/lms/KpiGrid";
import KpiCard from "@/components/lms/KpiCard";
import { PageHeader, SectionCard, Notice } from "@/components/smms/SmmsUi";
import { MeterRow, PlatformChip, StatusBadge } from "@/components/smms/SmmsBits";
import { Button } from "@/components/ui/button";
import { getViewer, can } from "@/lib/smms/viewer";
import { getDashboard } from "@/lib/smms/analytics";
import { isOpenAIConfigured } from "@/lib/openai";
import { PLATFORM_META, CONTENT_STATUSES, GENERATOR_TYPES, type Platform } from "@/lib/smms/constants";
import { formatCompact, formatDateTime, formatCurrency } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = { campaign_strategy: "Campaign strategy", image_ad: "Image ad", video_ad: "Video ad", post: "Post", post_variant: "Platform version", image: "AI image", creative_prompt: "Creative prompt", ...Object.fromEntries(GENERATOR_TYPES.map((g) => [g.value, g.label])) };

function genHref(g: { targetType: string; targetId: string }) {
  if (g.targetType === "campaign") return `/smms/campaigns/${g.targetId}`;
  if (g.targetType === "post") return `/smms/posts/${g.targetId}`;
  if (g.targetType === "media") return `/smms/media?open=${g.targetId}`;
  if (g.targetType === "workspace") return "/smms/ai";
  return null;
}

export default async function SmmsDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/smms/login");
  const d = await getDashboard({ from: sp.from, to: sp.to });
  const active = d.campaigns.published + d.campaigns.scheduled;
  const drafts = d.campaigns.draft + d.campaigns.generated + d.campaigns.edited;
  const maxPlat = Math.max(1, ...d.platformContent.map((p) => p.posts + p.ads));
  const engagement = d.postTotals.engagements || d.postTotals.likes + d.postTotals.comments + d.postTotals.shares + d.postTotals.saves;

  return (
    <div className="space-y-4">
      <PanelDashboardHeader
        filters={<PanelFilterBar
          presets
          fields={[
            { key: "from", label: "From", type: "date" },
            { key: "to", label: "To", type: "date" },
          ]}
        />}
        title="Social Media Overview"
        breadcrumbs={[{ label: "Social Media", href: "/smms" }, { label: "Dashboard" }]}
        description="Plan, publish and measure campaigns, ads and posts across Instagram, Facebook, YouTube, LinkedIn and Google."
        actions={
          <>
            {can(viewer, "MANAGE_POSTS") && (
              <Button nativeButton={false} render={<Link href="/smms/posts/new" />}>
                <Plus className="size-4" /> New post
              </Button>
            )}
            {can(viewer, "CREATE_CAMPAIGNS") && (
              <Button variant="outline" nativeButton={false} render={<Link href="/smms/campaigns/new" />}>
                <Megaphone className="size-4" /> New campaign
              </Button>
            )}
          </>
        }
      />

      {!(await isOpenAIConfigured()) && <Notice tone="warn">OpenAI isn&apos;t connected for this workspace (Settings → Integrations), so AI generation is unavailable. Everything else works.</Notice>}

      <KpiGrid>
        <KpiCard label="Active Campaigns" value={active} accent icon={<Megaphone className="size-4" />} />
        <KpiCard label="Draft Campaigns" value={drafts} icon={<FilePen className="size-4" />} />
        <KpiCard label="Scheduled Posts" value={d.posts.scheduled} icon={<CalendarClock className="size-4" />} />
        <KpiCard label="Published Posts" value={d.posts.published} icon={<Send className="size-4" />} />
        <KpiCard label="Total Ads" value={d.totalAds} icon={<LayoutGrid className="size-4" />} />
        <KpiCard label="AI Generations (30d)" value={d.ai30.runs} icon={<Sparkles className="size-4" />} />
        <KpiCard label="Failed Posts" value={d.posts.failed} tone={d.posts.failed > 0 ? "down" : undefined} icon={<Send className="size-4" />} />
        <KpiCard label="Upcoming (next)" value={d.upcoming.length} icon={<CalendarClock className="size-4" />} />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Post performance" description="Recorded per platform version of published posts">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: "Impressions", v: d.postTotals.impressions, icon: <Eye className="size-3.5" /> },
              { label: "Reach", v: d.postTotals.reach, icon: <Users className="size-3.5" /> },
              { label: "Engagement", v: engagement, icon: <Heart className="size-3.5" /> },
              { label: "Clicks", v: d.postTotals.clicks, icon: <MousePointerClick className="size-3.5" /> },
              { label: "Video views", v: d.postTotals.videoViews, icon: <Eye className="size-3.5" /> },
              { label: "Conversions", v: d.postTotals.conversions, icon: <Target className="size-3.5" /> },
            ].map((x) => (
              <div key={x.label} className="rounded-xl border border-border/40 bg-background/60 px-3 py-2">
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">{x.icon}{x.label}</p>
                <p className="text-lg font-bold tabular-nums">{formatCompact(x.v)}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Campaign performance" description={d.paid.linkedCampaigns > 0 ? `From LMS ad imports for ${d.paid.linkedCampaigns} linked campaign${d.paid.linkedCampaigns === 1 ? "" : "s"}` : "Link a campaign to its LMS ad-platform import to see spend and results"}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: "Spend", v: formatCurrency(d.paid.spend, d.paid.currency) },
              { label: "Impressions", v: formatCompact(d.paid.impressions) },
              { label: "Clicks", v: formatCompact(d.paid.clicks) },
              { label: "CTR", v: d.paid.ctr === null ? "—" : `${d.paid.ctr}%` },
              { label: "Leads", v: formatCompact(d.paid.leads) },
              { label: "Conversions", v: formatCompact(d.paid.conversions) },
            ].map((x) => (
              <div key={x.label} className="rounded-xl border border-border/40 bg-background/60 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">{x.label}</p>
                <p className="text-lg font-bold tabular-nums">{x.v}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Platform-wise content" description="Posts + ads per platform (not archived)">
          <div className="space-y-2.5">
            {d.platformContent.map((p) => (
              <MeterRow key={p.platform} label={<PlatformChip platform={p.platform} full />} value={p.posts + p.ads} max={maxPlat} hint={`${p.posts} posts · ${p.ads} ads`} />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Image vs video" description="Content by media type">
          <div className="space-y-3">
            {d.imageVsVideo.map((r) => (
              <div key={r.label} className="space-y-1.5">
                <p className="text-xs font-semibold">{r.label}</p>
                <MeterRow label="Image" value={r.image} max={Math.max(1, r.image + r.video)} />
                <MeterRow label="Video" value={r.video} max={Math.max(1, r.image + r.video)} />
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Pipeline" description="Posts and campaigns by status">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground"><th className="py-1 text-left font-medium">Status</th><th className="text-right font-medium">Posts</th><th className="text-right font-medium">Campaigns</th><th className="text-right font-medium">Ads</th></tr>
            </thead>
            <tbody>
              {CONTENT_STATUSES.map((s) => (
                <tr key={s} className="border-t border-border/40">
                  <td className="py-1.5"><StatusBadge status={s} /></td>
                  <td className="text-right tabular-nums">{d.posts[s]}</td>
                  <td className="text-right tabular-nums">{d.campaigns[s]}</td>
                  <td className="text-right tabular-nums">{d.ads[s]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Recent AI generations" description={`${d.ai30.runs} in 30 days · ${d.ai30.images} images · est. $${d.ai30.cost.toFixed(2)}`}>
          {d.recentGenerations.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing generated yet.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {d.recentGenerations.map((g) => {
                const href = genHref(g);
                const body = (
                  <>
                    <p className="truncate text-sm font-medium">{g.label || "Untitled"}</p>
                    <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                      {KIND_LABEL[g.kind] ?? g.kind}
                      {g.platform && <PlatformChip platform={g.platform} />}· {g.userEmail} · {formatDateTime(g.createdAt)}
                    </p>
                  </>
                );
                return <li key={g._id} className="py-2">{href ? <Link href={href} className="block hover:text-primary">{body}</Link> : body}</li>;
              })}
            </ul>
          )}
        </SectionCard>
        <SectionCard title="Upcoming scheduled posts" description="Only approved posts publish automatically">
          {d.upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing scheduled.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {d.upcoming.map((u) => (
                <li key={u._id} className="py-2">
                  <Link href={`/smms/posts/${u._id}`} className="block hover:text-primary">
                    <p className="truncate text-sm font-medium">{u.title}</p>
                    <p className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                      {formatDateTime(u.scheduledAt)} · {u.approved ? "approved" : "awaiting approval"} ·
                      {u.platforms.map((p) => <PlatformChip key={p} platform={p as Platform} />)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
      <p className="text-[11px] text-muted-foreground">{`Paid numbers come from the LMS ad imports (${Object.values(PLATFORM_META).filter((m) => m.lmsPlatform).length} ad platforms); organic numbers are what the team records per published post. AI cost is an estimate.`}</p>
    </div>
  );
}
