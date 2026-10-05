import Link from "next/link";
import { Route, MessagesSquare, FileText, Clock } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { PortalPageHeader } from "@/components/portal/widgets";
import LeadStageCard from "@/components/portal/LeadStageCard";
import LeadJourney from "@/components/portal/LeadJourney";
import type { PortalLeadView } from "@/lib/portal/lead";

const NEXT_HINT: Record<string, string> = {
  job_applicant: "Our recruitment team is reviewing your application. Interviews and your offer will appear here.",
  intern: "Your enrolment is being processed. Batch, mentor, assignments and attendance unlock once you're placed in a batch.",
  trainee: "Your enrolment is being processed. Class schedule, projects and certificates unlock once your batch starts.",
  client: "Your inquiry is with our team. Milestones, meetings, documents and invoices appear here once your project starts.",
};

/**
 * Shown before a lead is linked to a TMS student / PMS project — the person has
 * a portal account and a live journey, but no deep module data yet.
 */
export default function LeadOnlyDashboard({ view, firstName }: { view: PortalLeadView; firstName: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <PortalPageHeader title={`Welcome, ${firstName}`} subtitle={view.lead.name ? `Request ${view.lead.code}` : undefined} />

      <LeadStageCard view={view} />

      <GlassCard interactive={false}>
        <CardContent className="flex items-start gap-3 py-4 text-sm">
          <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">{NEXT_HINT[view.lead.type]}</p>
        </CardContent>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink href="/portal/journey" icon={Route} label="My Journey" hint="Full activity timeline" />
        <QuickLink href="/portal/messages" icon={MessagesSquare} label="Messages" hint={`${view.messages.length} from the team`} />
        <QuickLink href="/portal/documents" icon={FileText} label="Documents" hint="Shared files" />
      </div>

      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadJourney events={view.events.slice(-6)} />
        </CardContent>
      </GlassCard>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, hint }: { href: string; icon: typeof Route; label: string; hint: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/40">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <p className="mt-2 text-sm font-semibold text-foreground">{label}</p>
      <p className="truncate text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}
