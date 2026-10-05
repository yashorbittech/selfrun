import { NextResponse } from "next/server";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { hasTmsStaffRole } from "@/lib/tms-roles";
import { certificateWithMeta } from "@/lib/tms/certificates";
import { getTmsSettings } from "@/lib/tms/settings";
import { renderCertificatePdf } from "@/components/tms/CertificatePdf";
import { companySiteUrl } from "@/lib/platform/tenancy/site-url";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Context) {
  const user = await getCurrentTmsUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cert = await certificateWithMeta(id);
  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isStaff = hasTmsStaffRole(user.roles);
  const isOwner = user.studentId === cert.studentId;
  if (!isStaff && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (cert.revoked && !isStaff) return NextResponse.json({ error: "This certificate has been revoked." }, { status: 410 });

  const [settings, siteUrl] = await Promise.all([getTmsSettings(), companySiteUrl()]);
  const buffer = await renderCertificatePdf({
    certificateNumber: cert.certificateNumber,
    verificationCode: cert.verificationCode,
    verifyUrl: `${siteUrl}/verify/${cert.verificationCode}`,
    typeLabel: cert.typeLabel,
    studentName: cert.studentName,
    programName: cert.programName,
    batchName: cert.batchName,
    title: cert.title,
    issuedOn: cert.issuedOn,
    grade: cert.grade,
    institute: {
      name: settings.institute.name,
      addressLine: settings.institute.addressLine,
      city: settings.institute.city,
      signatoryName: settings.institute.signatoryName,
      signatoryTitle: settings.institute.signatoryTitle,
    },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${cert.certificateNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
