import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import { PortalPageHeader } from "@/components/portal/widgets";
import PortalTestsNav from "@/components/ots/PortalTestsNav";
import CertificateList from "@/components/ots/CertificateList";
import { guardPortalPage } from "@/lib/portal/guard";
import { TEST_TAKER_ROLES } from "@/lib/portal-roles";
import { resolveTaker } from "@/lib/ots/taker";
import { candidateCertificates } from "@/lib/ots/candidate";
import { brandedMetadata } from "@/lib/platform/branding/metadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => brandedMetadata("Test Certificates · {brand} {panel:portal}");

export default async function PortalTestCertificatesPage() {
  await guardPortalPage(...TEST_TAKER_ROLES);
  const taker = await resolveTaker("portal");
  const certs = taker ? await candidateCertificates(taker) : [];
  return (
    <div className="space-y-5">
      <PortalPageHeader title="Test Certificates" subtitle="Certificates from certification tests you passed — each one verifiable online." />
      <PanelListFilters>
<PortalTestsNav active="certificates" />
      <CertificateList certs={certs} />
</PanelListFilters>
    </div>
  );
}
