import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Copy, Pencil, Archive, ArchiveRestore, Trash2, Rocket, CalendarClock, CalendarX, Plus, Film, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PageHeader, SectionCard, Notice, EmptyState } from "@/components/smms/SmmsUi";
import { PlatformChip, StatusBadge, MediaThumb } from "@/components/smms/SmmsBits";
import ActionButton from "@/components/smms/ActionButton";
import GenerateBar from "@/components/smms/GenerateBar";
import CampaignStrategyEditor from "@/components/smms/CampaignStrategyEditor";
import NewAdForm from "@/components/smms/NewAdForm";
import LmsLinker from "@/components/smms/LmsLinker";
import VersionHistory from "@/components/smms/VersionHistory";
import { getViewer, can } from "@/lib/smms/viewer";
import { getCampaign } from "@/lib/smms/campaigns";
import { listAdsForCampaign } from "@/lib/smms/ads";
import { getMediaMany, toMediaCard } from "@/lib/smms/media";
import { listVersions } from "@/lib/smms/generations";
import { paidPerformance } from "@/lib/smms/analytics";
import { listLiveOffers, listClientChoices } from "@/lib/smms/brand";
import { listCampaigns as listLmsCampaigns } from "@/lib/campaigns";
import { isOpenAIConfigured } from "@/lib/openai";
import { PLATFORM_META, findFormat } from "@/lib/smms/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  archiveCampaignAction,
  createAdAction,
  deleteCampaignAction,
  duplicateCampaignAction,
  generateCampaignAction,
  linkLmsCampaignsAction,
  setCampaignLifecycleAction,
} from "@/app/smms/(protected)/actions";

export const maxDuration = 120;

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/smms/login");
  if (!can(viewer, "VIEW_CAMPAIGNS")) redirect("/smms");
  const { id } = await params;
  const c = await getCampaign(id);
  if (!c) notFound();
  const [ads, versions, perf, offers, clients, lmsOptions] = await Promise.all([
    listAdsForCampaign(id),
    listVersions("campaign", id),
    paidPerformance({ campaignId: id }),
    listLiveOffers(50),
    listClientChoices(),
    listLmsCampaigns().catch(() => []),
  ]);
  const thumbs = new Map((await getMediaMany(ads.flatMap((a) => [a.mediaIds[0], a.thumbnailId].filter((x): x is string => Boolean(x))))).map((m) => [m._id, toMediaCard(m)]));
  const canEdit = can(viewer, "EDIT_CAMPAIGNS") && c.status !== "archived";
  const canAds = can(viewer, "CREATE_ADS") && c.status !== "archived";
  const hasAi = Boolean(c.ai.summary || c.ai.adConcepts.length);
  const offer = offers.find((o) => o._id === c.offerId);
  const client = clients.find((x) => x._id === c.clientId);
  const brief: [string, string][] = [
    ["Objective", c.objective],
    ["Target audience", c.targetAudience],
    ["Industry", c.industry],
    ["Location", c.location],
    ["Budget", c.budget !== null ? formatCurrency(c.budget, c.currency) : ""],
    ["Duration", c.startDate ? `${formatDate(c.startDate)} – ${c.endDate ? formatDate(c.endDate) : "open"}` : ""],
    ["CTA", c.cta],
    ["Landing page", c.landingPage],
    ["Offer / service", c.offerService],
    ["Promoted offer", offer ? `${offer.title} (${offer.badge})` : c.offerId ? "An offer that is no longer live" : ""],
    ["Client", client?.name ?? ""],
    ["Keywords", c.keywords.join(", ")],
    ["Tone", c.tone],
    ["Language", c.language],
    ["Brand information", c.brandInfo],
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={c.name}
        crumbs={[{ label: "Campaigns & Ads", href: "/smms/campaigns" }, { label: c.name }]}
        description={
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={c.status} />
            {c.platforms.map((p) => <PlatformChip key={p} platform={p} />)}
            <span>{`· ${ads.length} ad${ads.length === 1 ? "" : "s"} · updated ${formatDateTime(c.updatedAt)}`}</span>
          </span>
        }
        actions={
          <>
            {canEdit && <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/smms/campaigns/${id}/edit`} />}><Pencil className="size-3.5" /> Edit brief</Button>}
            {can(viewer, "CREATE_CAMPAIGNS") && <ActionButton action={duplicateCampaignAction.bind(null, id)} success="Duplicated" redirectPrefix="/smms/campaigns/"><Copy className="size-3.5" /> Duplicate</ActionButton>}
            {c.status !== "archived" && c.status !== "published" && can(viewer, "SCHEDULE_POSTS") && (c.status === "scheduled" ? (
              <ActionButton action={setCampaignLifecycleAction.bind(null, id, "unschedule")} success="Launch unscheduled"><CalendarX className="size-3.5" /> Unschedule</ActionButton>
            ) : (
              <ActionButton action={setCampaignLifecycleAction.bind(null, id, "scheduled")} success="Launch scheduled for the start date"><CalendarClock className="size-3.5" /> Schedule launch</ActionButton>
            ))}
            {c.status !== "archived" && c.status !== "published" && can(viewer, "PUBLISH_CONTENT") && (
              <ActionButton variant="default" action={setCampaignLifecycleAction.bind(null, id, "published")} success="Marked as launched" confirm={{ title: "Mark this campaign as launched?", description: "SMMS never launches or spends on paid ads itself. Confirm you've set the campaign live in each ad platform's ads manager.", confirmLabel: "Mark launched" }}>
                <Rocket className="size-3.5" /> Mark launched
              </ActionButton>
            )}
            {can(viewer, "EDIT_CAMPAIGNS") && (c.status === "archived" ? (
              <ActionButton action={archiveCampaignAction.bind(null, id, false)} success="Restored"><ArchiveRestore className="size-3.5" /> Restore</ActionButton>
            ) : (
              <ActionButton action={archiveCampaignAction.bind(null, id, true)} success="Archived"><Archive className="size-3.5" /> Archive</ActionButton>
            ))}
            {can(viewer, "DELETE_CAMPAIGNS") && (
              <ActionButton variant="destructive" action={deleteCampaignAction.bind(null, id)} success="Campaign deleted" redirectTo="/smms/campaigns" confirm={{ title: "Delete this campaign?", description: `“${c.name}” and its ${ads.length} ad(s) will be removed. Generated media stays in the library.`, confirmLabel: "Delete" }} aria-label="Delete campaign">
                <Trash2 className="size-3.5" />
              </ActionButton>
            )}
          </>
        }
      />
      {c.status === "archived" && <Notice tone="warn">This campaign is archived — restore it to edit, generate or add ads.</Notice>}

      <Tabs defaultValue={hasAi ? "strategy" : "brief"}>
        <TabsList>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="strategy">AI strategy</TabsTrigger>
          <TabsTrigger value="ads">{`Ads (${ads.length})`}</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">{`History (${versions.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="brief" className="mt-4">
          <SectionCard title="Campaign brief" description="What the AI works from, together with the brand context in Settings.">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {brief.map(([k, val]) => (
                <div key={k} className={k === "Target audience" || k === "Brand information" ? "sm:col-span-2" : undefined}>
                  <dt className="text-[11px] font-semibold text-muted-foreground">{k}</dt>
                  <dd className="text-sm whitespace-pre-wrap">{val || <span className="text-muted-foreground">—</span>}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </TabsContent>

        <TabsContent value="strategy" className="mt-4 space-y-4">
          <GenerateBar
            hasContent={hasAi}
            label="Generate strategy with AI"
            generate={generateCampaignAction.bind(null, id)}
            disabled={!canEdit || !can(viewer, "GENERATE_AI_CONTENT") || !(await isOpenAIConfigured()) || c.status === "published"}
            disabledReason={!(await isOpenAIConfigured()) ? "OpenAI isn't connected for this workspace (Settings → Integrations)." : c.status === "published" ? "Launched campaigns keep their strategy — duplicate to plan a new version." : "You can read this strategy but not regenerate it."}
          />
          {hasAi && c.ai.adConcepts.length > 0 && (
            <SectionCard title="Ad concepts" description="Turn a concept into an ad draft, then generate its full creative.">
              <div className="grid gap-3 md:grid-cols-2">
                {c.ai.adConcepts.map((a, i) => (
                  <div key={i} className="rounded-xl border border-border/50 bg-background/50 p-3">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <PlatformChip platform={a.platform} />
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">{a.format === "video" ? <Film className="size-3" /> : <ImageIcon className="size-3" />}{a.format}</span>
                    </div>
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-sm">{a.headline}</p>
                    <p className="line-clamp-3 text-xs text-muted-foreground">{a.primaryText}</p>
                    {canAds && (
                      <div className="mt-2">
                        <ActionButton size="xs" action={createAdAction.bind(null, id, {}, i)} success="Ad draft created" redirectPrefix={`/smms/campaigns/${id}/ads/`}>
                          <Plus className="size-3" /> Create ad
                        </ActionButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
          {hasAi ? (
            <SectionCard title="Strategy" description="Edit anything — saving creates a new version.">
              <CampaignStrategyEditor key={versions[0]?._id ?? "none"} campaignId={id} ai={c.ai} canEdit={canEdit} />
            </SectionCard>
          ) : (
            <EmptyState title="No strategy yet">Generate one from the brief — you&apos;ll get a strategy, ideas, audiences, keywords, hashtags and ad concepts per platform.</EmptyState>
          )}
        </TabsContent>

        <TabsContent value="ads" className="mt-4 space-y-4">
          {canAds && (
            <SectionCard title="New ad" description="One platform and format per ad. Duplicate an ad to adapt it for another platform.">
              <NewAdForm campaignId={id} platforms={c.platforms} />
            </SectionCard>
          )}
          <SectionCard title="Ads">
            {ads.length === 0 ? (
              <EmptyState title="No ads yet">Create one above or from an AI ad concept.</EmptyState>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {ads.map((a) => {
                  const t = thumbs.get(a.format === "video" ? (a.thumbnailId ?? a.mediaIds[0] ?? "") : (a.mediaIds[0] ?? ""));
                  const fmt = findFormat(a.platform, a.formatKey);
                  return (
                    <Link key={a._id} href={`/smms/campaigns/${id}/ads/${a._id}`} className="group flex gap-3 rounded-xl border border-border/50 bg-background/50 p-3 transition hover:border-primary/40">
                      {t ? <MediaThumb media={t} className="size-16 shrink-0" /> : <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted">{a.format === "video" ? <Film className="size-5 text-muted-foreground" /> : <ImageIcon className="size-5 text-muted-foreground" />}</div>}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold group-hover:text-primary">{a.name}</p>
                        <div className="my-1 flex flex-wrap items-center gap-1"><PlatformChip platform={a.platform} /><StatusBadge status={a.status} /></div>
                        <p className="truncate text-[11px] text-muted-foreground">{`${a.format === "video" ? "Video" : "Image"} ad${fmt ? ` · ${fmt.width}×${fmt.height}` : ""}${a.content.headline ? ` · ${a.content.headline}` : ""}`}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="performance" className="mt-4 space-y-4">
          <SectionCard title="Linked ad-platform data" description="Spend and results live in LMS → Campaigns (CSV imports from Meta, Google and LinkedIn). Link the imported campaigns that belong to this one.">
            {can(viewer, "EDIT_CAMPAIGNS") ? (
              <LmsLinker options={lmsOptions.map((o) => ({ key: o.key, name: o.name, platform: o.platform }))} selected={c.lmsCampaignKeys} save={linkLmsCampaignsAction.bind(null, id)} />
            ) : (
              <p className="text-sm text-muted-foreground">{`${c.lmsCampaignKeys.length} linked LMS campaign(s).`}</p>
            )}
          </SectionCard>
          <SectionCard title="Performance" description={perf.rows.length ? `${formatCurrency(perf.totals.spend, perf.totals.currency)} spent · ${perf.totals.impressions.toLocaleString("en-IN")} impressions · ${perf.totals.clicks.toLocaleString("en-IN")} clicks · ${perf.totals.leads} leads` : "No imported results for the linked campaigns yet."}>
            {perf.rows.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>LMS campaign</TableHead><TableHead className="text-right">Spend</TableHead><TableHead className="text-right">Impr.</TableHead><TableHead className="text-right">Clicks</TableHead><TableHead className="text-right">CTR</TableHead><TableHead className="text-right">Leads</TableHead><TableHead className="text-right">Conv.</TableHead><TableHead className="text-right">CPL</TableHead><TableHead className="text-right">ROAS</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {perf.rows.map((r) => (
                      <TableRow key={r.key}>
                        <TableCell>{r.name} <span className="text-[11px] text-muted-foreground uppercase">{r.platform}</span></TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(r.spend, r.currency)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.impressions.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.clicks.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.ctr === null ? "—" : `${r.ctr}%`}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.leadsAttributed}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.completed}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.cpl === null ? "—" : formatCurrency(r.cpl, r.currency)}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.roas === null ? "—" : `${r.roas}×`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <SectionCard title="Strategy versions" description="Every AI generation and every saved edit. Restoring creates a new version.">
            <VersionHistory targetType="campaign" targetId={id} versions={versions} canRestore={canEdit} />
          </SectionCard>
        </TabsContent>
      </Tabs>
      <p className="text-[11px] text-muted-foreground">{`Ads are written here and launched by a person in each platform's ads manager (${c.platforms.map((p) => PLATFORM_META[p].label).join(", ")}) — SMMS never spends on ads by itself.`}</p>
    </div>
  );
}
