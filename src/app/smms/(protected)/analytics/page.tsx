import Link from "next/link";
import { redirect } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import TimeSeriesChart from "@/components/lms/TimeSeriesChart";
import { PageHeader, SectionCard, Notice } from "@/components/smms/SmmsUi";
import SmmsFilterBar from "@/components/smms/SmmsFilterBar";
import { MeterRow, PlatformChip, KindChip } from "@/components/smms/SmmsBits";
import { getViewer, can } from "@/lib/smms/viewer";
import { getAnalytics } from "@/lib/smms/analytics";
import { formatCompact, formatCurrency } from "@/lib/utils";

const n = (v: number) => v.toLocaleString("en-IN");

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/smms/login");
  if (!can(viewer, "VIEW_ANALYTICS")) redirect("/smms");
  const sp = await searchParams;
  const from = sp.from ? new Date(`${sp.from}T00:00:00`) : undefined;
  const to = sp.to ? new Date(`${sp.to}T23:59:59.999`) : undefined;
  const a = await getAnalytics(from, to);
  const maxEng = Math.max(1, ...a.byPlatform.map((p) => p.metrics.engagements));
  const totalPublished = a.byPlatform.reduce((s, p) => s + p.published, 0);

  return (
    <div className="space-y-4">
      <PageHeader title="Analytics" crumbs={[{ label: "Analytics" }]} description="Organic post performance recorded per platform, and paid campaign results from the LMS ad imports." />
      <SmmsFilterBar values={{ from: sp.from ?? "", to: sp.to ?? "" }} fields={[{ key: "from", label: "Published from", type: "date" }, { key: "to", label: "to", type: "date" }]} />
      {totalPublished === 0 && <Notice tone="info">No published posts in this range yet. Performance appears once posts are published and their numbers recorded (Publishing → Record performance).</Notice>}

      <SectionCard title="Organic performance by platform" description="Sum across published platform versions">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Platform</TableHead><TableHead className="text-right">Published</TableHead><TableHead className="text-right">Impressions</TableHead><TableHead className="text-right">Reach</TableHead><TableHead className="text-right">Engagements</TableHead><TableHead className="text-right">Clicks</TableHead><TableHead className="text-right">Video views</TableHead><TableHead className="text-right">Conversions</TableHead><TableHead className="text-right">Eng. rate</TableHead></TableRow></TableHeader>
            <TableBody>
              {a.byPlatform.map((p) => (
                <TableRow key={p.platform}>
                  <TableCell><PlatformChip platform={p.platform} full /></TableCell>
                  <TableCell className="text-right tabular-nums">{p.published}</TableCell>
                  <TableCell className="text-right tabular-nums">{n(p.metrics.impressions)}</TableCell>
                  <TableCell className="text-right tabular-nums">{n(p.metrics.reach)}</TableCell>
                  <TableCell className="text-right tabular-nums">{n(p.metrics.engagements)}</TableCell>
                  <TableCell className="text-right tabular-nums">{n(p.metrics.clicks)}</TableCell>
                  <TableCell className="text-right tabular-nums">{n(p.metrics.videoViews)}</TableCell>
                  <TableCell className="text-right tabular-nums">{n(p.metrics.conversions)}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.metrics.reach > 0 ? `${((p.metrics.engagements / p.metrics.reach) * 100).toFixed(1)}%` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Engagements by platform">
          <div className="space-y-2.5">{a.byPlatform.map((p) => <MeterRow key={p.platform} label={<PlatformChip platform={p.platform} full />} value={p.metrics.engagements} max={maxEng} />)}</div>
        </SectionCard>
        <SectionCard title="Image vs video" description="Published versions">
          <table className="w-full text-xs">
            <thead><tr className="text-muted-foreground"><th className="py-1 text-left font-medium">Type</th><th className="text-right font-medium">Posts</th><th className="text-right font-medium">Reach</th><th className="text-right font-medium">Eng.</th><th className="text-right font-medium">Avg eng.</th></tr></thead>
            <tbody>
              {a.byType.map((t) => (
                <tr key={t.type} className="border-t border-border/40">
                  <td className="py-1.5"><KindChip kind={t.type} /></td>
                  <td className="text-right tabular-nums">{t.posts}</td>
                  <td className="text-right tabular-nums">{formatCompact(t.reach)}</td>
                  <td className="text-right tabular-nums">{formatCompact(t.engagements)}</td>
                  <td className="text-right tabular-nums">{t.posts ? Math.round(t.engagements / t.posts) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
        <SectionCard title="Published per week" description="Platform versions published">
          <TimeSeriesChart data={a.weekly.map((w) => ({ date: w.week, count: w.published }))} />
        </SectionCard>
      </div>

      <SectionCard title="Top posts" description="By recorded engagements">
        {a.topPosts.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No recorded performance yet.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Post</TableHead><TableHead>Platform</TableHead><TableHead className="text-right">Impressions</TableHead><TableHead className="text-right">Reach</TableHead><TableHead className="text-right">Engagements</TableHead><TableHead className="text-right">Clicks</TableHead></TableRow></TableHeader>
            <TableBody>
              {a.topPosts.map((p) => (
                <TableRow key={`${p._id}-${p.platform}`}>
                  <TableCell><Link href={`/smms/posts/${p._id}`} className="hover:text-primary">{p.title}</Link> <KindChip kind={p.contentType} /></TableCell>
                  <TableCell><PlatformChip platform={p.platform} /></TableCell>
                  <TableCell className="text-right tabular-nums">{n(p.impressions)}</TableCell>
                  <TableCell className="text-right tabular-nums">{n(p.reach)}</TableCell>
                  <TableCell className="text-right tabular-nums">{n(p.engagements)}</TableCell>
                  <TableCell className="text-right tabular-nums">{n(p.clicks)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <SectionCard title="Paid campaign performance" description={a.paid.totals.linkedCampaigns ? `${a.paid.totals.linkedCampaigns} SMMS campaign(s) linked to LMS ad imports · ${formatCurrency(a.paid.totals.spend, a.paid.totals.currency)} spend · CTR ${a.paid.totals.ctr ?? "—"}% · ROAS ${a.paid.totals.roas ?? "—"}×` : "No campaign is linked to LMS ad-platform data yet (Campaign → Performance)."}>
        {a.paid.rows.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Ad platform data</TableHead><TableHead className="text-right">Spend</TableHead><TableHead className="text-right">Impr.</TableHead><TableHead className="text-right">Clicks</TableHead><TableHead className="text-right">Leads</TableHead><TableHead className="text-right">Conv.</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">ROAS</TableHead></TableRow></TableHeader>
              <TableBody>
                {a.paid.rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell><Link href={`/smms/campaigns/${r.smmsCampaignId}`} className="hover:text-primary">{r.smmsCampaignName}</Link></TableCell>
                    <TableCell className="text-xs">{r.name} <span className="text-muted-foreground uppercase">{r.platform}</span></TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(r.spend, r.currency)}</TableCell>
                    <TableCell className="text-right tabular-nums">{n(r.impressions)}</TableCell>
                    <TableCell className="text-right tabular-nums">{n(r.clicks)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.leadsAttributed}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.completed}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(r.revenue, r.currency)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.roas === null ? "—" : `${r.roas}×`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
