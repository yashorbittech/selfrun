import { Briefcase, CalendarClock, FileCheck2, MessageSquareText, PartyPopper, XCircle } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { HiringTimeline, InfoCard, PortalPageHeader, LinkPill } from "@/components/portal/widgets";
import { getCareerApplicationStatusMeta } from "@/lib/career-application-status";
import { offerStatusMeta } from "@/lib/hrms/offers-status";
import { cn } from "@/lib/utils";
import type { ApplicantOverview } from "@/lib/portal/applicant";
import type { PortalLeadView } from "@/lib/portal/lead";

function dt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * Applicant dashboard — a hiring-progress timeline is the hero, everything else
 * hangs off the current stage.
 */
export default function ApplicantDashboard({
  data,
  firstName,
  leadView,
}: {
  data: ApplicantOverview;
  firstName: string;
  leadView?: PortalLeadView | null;
}) {
  const statusMeta = getCareerApplicationStatusMeta(data.status);
  const offer = data.offer;
  const timelineSteps = leadView ? leadView.stageTimeline : data.timeline;
  const rejected = leadView ? leadView.lead.status === "lost" : data.rejected;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <PortalPageHeader
        title={`Hi ${firstName}`}
        subtitle={`Your application for ${data.positionTitle}`}
        action={
          <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", statusMeta.badgeClass)}>{statusMeta.label}</span>
        }
      />

      {rejected && (
        <GlassCard interactive={false} className="border-destructive/30">
          <CardContent className="flex items-center gap-3 py-4 text-sm">
            <XCircle className="size-5 shrink-0 text-destructive" />
            <p className="text-muted-foreground">
              We won&apos;t be moving forward with this application. Thank you for your interest — you&apos;re welcome to apply
              for other roles.
            </p>
          </CardContent>
        </GlassCard>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* hero: the timeline — driven by Lead Management when available */}
        <GlassCard>
          <CardHeader>
            <CardTitle>Hiring progress</CardTitle>
          </CardHeader>
          <CardContent>
            <HiringTimeline steps={timelineSteps} rejected={rejected} />
          </CardContent>
        </GlassCard>

        <div className="space-y-5">
          <InfoCard title="Position applied">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="size-4" />
              </span>
              <div>
                <p className="font-semibold text-foreground">{data.positionTitle}</p>
                <p className="text-xs text-muted-foreground">Applied {new Date(data.appliedOn).toLocaleDateString()}</p>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Recruiter updates">
            <div className="flex items-start gap-3 text-sm">
              <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground">
                {data.recruiterNote || "No message from the recruiter yet. We'll notify you the moment there's an update."}
              </p>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground/70">Last updated {new Date(data.lastUpdate).toLocaleString()}</p>
          </InfoCard>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {/* upcoming interviews */}
        <GlassCard className="md:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Upcoming interviews</CardTitle>
            <LinkPill href="/portal/interviews">All interviews →</LinkPill>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingInterviews.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
            )}
            {data.upcomingInterviews.slice(0, 3).map((iv) => (
              <div key={iv._id} className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarClock className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{iv.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {dt(iv.scheduledAt)} · {iv.mode === "onsite" ? iv.location || "On-site" : iv.mode === "video" ? "Video call" : "Phone"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </GlassCard>

        {/* offer status */}
        <InfoCard title="Offer status">
          {offer ? (
            <div className="space-y-1.5 text-sm">
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", offerStatusMeta(offer.status).badgeClass)}>
                {offerStatusMeta(offer.status).label}
              </span>
              {offer.annualCtc != null && <p className="text-muted-foreground">CTC: ₹{offer.annualCtc.toLocaleString("en-IN")} / year</p>}
              {offer.proposedJoiningDate && <p className="text-muted-foreground">Proposed joining: {offer.proposedJoiningDate}</p>}
              {offer.status === "accepted" && (
                <p className="flex items-center gap-1 pt-1 font-medium text-green-600 dark:text-green-400">
                  <PartyPopper className="size-3.5" /> Congratulations!
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No offer yet. It appears here once recruitment extends one.</p>
          )}
        </InfoCard>
      </div>

      {/* required documents */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">Required documents</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {data.requiredDocuments.map((d) => (
            <div key={d.name} className="flex items-center gap-2.5 rounded-xl border border-border/50 px-3 py-2 text-sm">
              <FileCheck2 className={cn("size-4 shrink-0", d.provided ? "text-green-500" : "text-muted-foreground/50")} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-foreground">{d.name}</span>
                {d.note && <span className="block truncate text-[11px] text-muted-foreground">{d.note}</span>}
              </span>
              <span className={cn("shrink-0 text-[11px] font-semibold", d.provided ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                {d.provided ? "Received" : "Pending"}
              </span>
            </div>
          ))}
        </CardContent>
      </GlassCard>
    </div>
  );
}
