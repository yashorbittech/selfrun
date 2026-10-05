import { guardPortalPage } from "@/lib/portal/guard";
import { getActivePortalLead } from "@/lib/portal/lead";
import { PortalPageHeader } from "@/components/portal/widgets";
import EmptyPortalState from "@/components/portal/EmptyPortalState";
import PortalMessagesThread from "./PortalMessagesThread";
import { brandedMetadata } from "@/lib/platform/branding/metadata";
import { getCompanyBrand } from "@/lib/platform/branding";

export const dynamic = "force-dynamic";
export const generateMetadata = () => brandedMetadata("Messages · {brand} {panel:portal}");

export default async function MessagesPage() {
  const brand = await getCompanyBrand();
  const user = await guardPortalPage();
  const view = await getActivePortalLead(user);
  if (!view) return <EmptyPortalState title="No messages" body={`Messages from the ${brand.name} team appear here.`} />;

  return (
    <div className="space-y-5 lg:">
      <PortalPageHeader title="Messages" subtitle={`Chat directly with your ${brand.name} team`} />
      <PortalMessagesThread initialMessages={view.messages} />
    </div>
  );
}
