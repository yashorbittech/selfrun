import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import NewLeadForm from "./NewLeadForm";

export const metadata = { title: "New lead · Lead Management" };

export default function NewLeadPage() {
  return (
    <div className="space-y-4">
<PanelPageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/lms" },
          { label: "Lead Management", href: "/lms/leads" },
          { label: "New lead" },
        ]}
        title={<>New lead</>}
        description={<>Creates a lead and a portal account (with a temporary password). Use for phone/walk-in enquiries that never hit a
        website form.</>}
      />
<div className="relative mx-auto max-w-xl space-y-4">
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewLeadForm />
        </CardContent>
      </GlassCard>
    </div>
</div>
  );
}
