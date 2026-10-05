import { notFound, redirect } from "next/navigation";
import { Copy, Archive, ArchiveRestore, Trash2, Rocket, CalendarClock, CalendarX, XCircle } from "lucide-react";
import { PageHeader, SectionCard, Notice } from "@/components/smms/SmmsUi";
import { PlatformChip, StatusBadge, KindChip } from "@/components/smms/SmmsBits";
import ActionButton from "@/components/smms/ActionButton";
import InputDialogButton from "@/components/smms/InputDialogButton";
import GenerateBar from "@/components/smms/GenerateBar";
import AdEditor from "@/components/smms/AdEditor";
import AdaptButton from "@/components/smms/AdaptButton";
import VersionHistory from "@/components/smms/VersionHistory";
import { getViewer, can } from "@/lib/smms/viewer";
import { getCampaign } from "@/lib/smms/campaigns";
import { getAd } from "@/lib/smms/ads";
import { getMediaMany, getMedia, toMediaCard } from "@/lib/smms/media";
import { listVersions } from "@/lib/smms/generations";
import { getBrandSnapshot } from "@/lib/smms/brand";
import { isOpenAIConfigured } from "@/lib/openai";
import { defaultScheduleInput } from "@/lib/smms/page-data";
import { formatDateTime } from "@/lib/utils";
import { archiveAdAction, deleteAdAction, duplicateAdAction, generateAdAction, markAdLiveAction, scheduleAdAction } from "@/app/smms/(protected)/actions";

export const maxDuration = 180;

export default async function AdPage({ params }: { params: Promise<{ id: string; adId: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/smms/login");
  if (!can(viewer, "VIEW_CAMPAIGNS")) redirect("/smms");
  const { id, adId } = await params;
  const [c, ad] = await Promise.all([getCampaign(id), getAd(adId)]);
  if (!c || !ad || ad.campaignId !== id) notFound();
  const [media, thumb, versions, brand] = await Promise.all([getMediaMany(ad.mediaIds), ad.thumbnailId ? getMedia(ad.thumbnailId) : null, listVersions("ad", adId), getBrandSnapshot()]);
  const locked = ad.status === "archived" || ad.status === "published" || c.status === "archived";
  const canEdit = can(viewer, "CREATE_ADS") && !locked;
  const hasContent = Boolean(ad.content.headline || ad.content.primaryText);

  return (
    <div className="space-y-4">
      <PageHeader
        title={ad.name}
        crumbs={[{ label: "Campaigns & Ads", href: "/smms/campaigns" }, { label: c.name, href: `/smms/campaigns/${id}` }, { label: ad.name }]}
        description={
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={ad.status} />
            <PlatformChip platform={ad.platform} full />
            <KindChip kind={ad.format} />
            {ad.scheduledAt && ad.status === "scheduled" && <span>{`· go-live ${formatDateTime(ad.scheduledAt)}`}</span>}
            {ad.externalRef && <span>{`· live as ${ad.externalRef}`}</span>}
          </span>
        }
        actions={
          <>
            {can(viewer, "CREATE_ADS") && c.status !== "archived" && <ActionButton action={duplicateAdAction.bind(null, id, adId, undefined)} success="Duplicated" redirectPrefix={`/smms/campaigns/${id}/ads/`}><Copy className="size-3.5" /> Duplicate</ActionButton>}
            {can(viewer, "CREATE_ADS") && c.status !== "archived" && <AdaptButton campaignId={id} adId={adId} platforms={c.platforms} current={ad.platform} canGenerate={can(viewer, "GENERATE_AI_CONTENT") && (await isOpenAIConfigured())} />}
            {!locked && can(viewer, "SCHEDULE_POSTS") && (ad.status === "scheduled" ? (
              <ActionButton action={scheduleAdAction.bind(null, id, adId, null)} success="Unscheduled"><CalendarX className="size-3.5" /> Unschedule</ActionButton>
            ) : (
              <InputDialogButton title="Schedule go-live" description="Put this ad on the calendar. Publishers are reminded when it's due — the ad itself is launched by hand in the ads manager." inputLabel="Go-live date & time" inputType="datetime-local" defaultValue={defaultScheduleInput(ad.scheduledAt)} required submitLabel="Schedule" success="Scheduled" action={scheduleAdAction.bind(null, id, adId)}>
                <CalendarClock className="size-3.5" /> Schedule
              </InputDialogButton>
            ))}
            {!locked && can(viewer, "PUBLISH_CONTENT") && (
              <>
                <InputDialogButton variant="default" title="Mark this ad as live" description="Confirm you've launched it in the platform's ads manager. Optionally paste the ad's id or URL there." inputLabel="Ad id or URL (optional)" placeholder="e.g. 120210000000000 or https://…" submitLabel="Mark live" success="Marked live" action={markAdLiveAction.bind(null, id, adId)}>
                  <Rocket className="size-3.5" /> Mark live
                </InputDialogButton>
                {ad.status === "scheduled" && <ActionButton action={markAdLiveAction.bind(null, id, adId, "", true)} success="Marked failed"><XCircle className="size-3.5" /> Mark failed</ActionButton>}
              </>
            )}
            {can(viewer, "CREATE_ADS") && c.status !== "archived" && (ad.status === "archived" ? (
              <ActionButton action={archiveAdAction.bind(null, id, adId, false)} success="Restored"><ArchiveRestore className="size-3.5" /> Restore</ActionButton>
            ) : (
              <ActionButton action={archiveAdAction.bind(null, id, adId, true)} success="Archived"><Archive className="size-3.5" /> Archive</ActionButton>
            ))}
            {can(viewer, "DELETE_CAMPAIGNS") && (
              <ActionButton variant="destructive" aria-label="Delete ad" action={deleteAdAction.bind(null, id, adId)} success="Ad deleted" redirectTo={`/smms/campaigns/${id}`} confirm={{ title: "Delete this ad?", description: `“${ad.name}” will be removed. Its media stays in the library.`, confirmLabel: "Delete" }}>
                <Trash2 className="size-3.5" />
              </ActionButton>
            )}
          </>
        }
      />
      {ad.status === "published" && <Notice tone="ok">This ad is live — its content is locked as a record of what ran. Duplicate it to make changes.</Notice>}
      {ad.status === "archived" && <Notice tone="warn">Archived — restore it to edit.</Notice>}

      <GenerateBar
        hasContent={hasContent}
        label={`Generate ${ad.format} ad with AI`}
        generate={generateAdAction.bind(null, id, adId)}
        disabled={!canEdit || !can(viewer, "GENERATE_AI_CONTENT") || !(await isOpenAIConfigured())}
        disabledReason={!(await isOpenAIConfigured()) ? "OpenAI isn't connected for this workspace (Settings → Integrations)." : locked ? "This ad is locked in its current state." : "You can view this ad but not generate content for it."}
      />

      <AdEditor
        key={ad.updatedAt.toISOString()}
        campaignId={id}
        adId={adId}
        platforms={c.platforms}
        header={{ name: ad.name, platform: ad.platform, format: ad.format, formatKey: ad.formatKey }}
        content={ad.content}
        media={media.map(toMediaCard)}
        thumbnail={thumb ? toMediaCard(thumb) : null}
        brand={brand.companyName}
        landingPage={c.landingPage}
        canEdit={canEdit}
        canGenerate={can(viewer, "GENERATE_AI_CONTENT") && (await isOpenAIConfigured())}
        canUpload={can(viewer, "MANAGE_MEDIA")}
      />

      <SectionCard title="Version history" description="Every AI generation and saved edit of this ad.">
        <VersionHistory targetType="ad" targetId={adId} campaignId={id} versions={versions} canRestore={canEdit} />
      </SectionCard>
    </div>
  );
}
