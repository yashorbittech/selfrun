import { NextResponse } from "next/server";
import { getViewer, can } from "@/lib/ots/viewer";
import { resolveTaker } from "@/lib/ots/taker";
import { getCertificate } from "@/lib/ots/certificates";
import { getOtsSettings } from "@/lib/ots/settings";
import { renderOtsCertificatePdf } from "@/components/ots/CertificatePdf";
import { companySiteUrl } from "@/lib/platform/tenancy/site-url";

type Context = { params: Promise<{ id: string }> };

/** Certificate PDF: staff with report / certificate rights, or the certificate's own holder (OTS or Portal session). */
export async function GET(_req: Request, { params }: Context) {
  const { id } = await params;
  const cert = await getCertificate(id);
  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const viewer = await getViewer();
  const isStaff = !!viewer && (can(viewer, "VIEW_REPORTS") || can(viewer, "GENERATE_CERTIFICATE") || can(viewer, "REVOKE_CERTIFICATE"));
  let isOwner = false;
  if (!isStaff) {
    const [staffTaker, portalTaker] = await Promise.all([resolveTaker("staff"), resolveTaker("portal")]);
    isOwner = [staffTaker, portalTaker].some((t) => t?.keys.includes(cert.candidateKey));
  }
  if (!isStaff && !isOwner) return NextResponse.json({ error: viewer ? "Forbidden" : "Unauthorized" }, { status: viewer ? 403 : 401 });
  if (cert.revoked && !isStaff) return NextResponse.json({ error: "This certificate has been revoked." }, { status: 410 });
  const [settings, siteUrl] = await Promise.all([getOtsSettings(), companySiteUrl()]);
  const buffer = await renderOtsCertificatePdf({
    certificateNumber: cert.certificateNumber,
    verificationCode: cert.verificationCode,
    verifyUrl: `${siteUrl}/verify/${cert.verificationCode}`,
    candidateName: cert.candidateName,
    testName: cert.testName,
    title: cert.title,
    score: cert.score,
    totalMarks: cert.totalMarks,
    percentage: cert.percentage,
    issuedOn: cert.issuedOn,
    validUntil: cert.validUntil,
    organization: cert.organization,
    signatoryName: settings.signatoryName,
    signatoryTitle: settings.signatoryTitle,
  });
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${cert.certificateNumber}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
