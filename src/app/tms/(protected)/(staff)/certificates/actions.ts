"use server";

import { revalidatePath } from "next/cache";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { canIssueCertificates } from "@/lib/tms-roles";
import {
  issueCertificate,
  reissueCertificate,
  setCertificateRevoked,
  deleteCertificate,
  getCertificate,
} from "@/lib/tms/certificates";
import { getStudent } from "@/lib/tms/students";
import { getProgram } from "@/lib/tms/programs";
import { validateCertificate } from "@/lib/tms/validation";
import { recordAudit } from "@/lib/tms/audit";
import { notifyStudent } from "@/lib/tms/notifications";

export interface CertActionResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
}

async function requireIssue() {
  const user = await getCurrentTmsUser();
  if (!user) throw new Error("Unauthorized");
  if (!canIssueCertificates(user)) throw new Error("Forbidden");
  return user;
}

function revalidate(id?: string) {
  revalidatePath("/tms/certificates");
  revalidatePath("/tms/me/certificates");
  revalidatePath("/tms");
  if (id) revalidatePath(`/tms/certificates/${id}`);
}

export async function issueCertificateAction(input: Record<string, unknown>): Promise<CertActionResult> {
  const user = await requireIssue();
  const v = validateCertificate(input);
  if (!v.valid) return { ok: false, fieldErrors: v.errors };

  const [student, program] = await Promise.all([getStudent(v.data.studentId), getProgram(v.data.programId)]);
  if (!student) return { ok: false, fieldErrors: { studentId: "Student not found." } };
  if (!program) return { ok: false, fieldErrors: { programId: "Program not found." } };

  const cert = await issueCertificate(v.data, user.id);
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "issue",
    entity: "certificate",
    entityId: cert._id,
    entityLabel: `${cert.certificateNumber} · ${student.fullName}`,
    summary: `${v.data.type} for ${program.name}`,
  });
  await notifyStudent(v.data.studentId, {
    type: "certificate_issued",
    title: "A certificate was issued to you",
    body: `${cert.certificateNumber} · ${program.name}`,
    link: "/tms/me/certificates",
    dedupeKey: `certificate_issued:${cert._id}`,
  });
  revalidate(cert._id);
  return { ok: true, id: cert._id };
}

export async function reissueCertificateAction(id: string): Promise<CertActionResult> {
  const user = await requireIssue();
  const before = await getCertificate(id);
  const cert = await reissueCertificate(id, user.id);
  if (!cert) return { ok: false, error: "Certificate not found." };
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "reissue",
    entity: "certificate",
    entityId: cert._id,
    entityLabel: cert.certificateNumber,
    summary: `reissued from ${before?.certificateNumber ?? "?"}`,
  });
  revalidate(cert._id);
  return { ok: true, id: cert._id };
}

export async function setCertificateRevokedAction(
  id: string,
  revoked: boolean,
  reason: string
): Promise<CertActionResult> {
  const user = await requireIssue();
  const cert = await setCertificateRevoked(id, revoked, reason.trim() || null, user.id);
  if (!cert) return { ok: false, error: "Certificate not found." };
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: revoked ? "revoke" : "update",
    entity: "certificate",
    entityId: id,
    entityLabel: cert.certificateNumber,
    summary: revoked ? `revoked: ${reason || "no reason"}` : "reinstated",
  });
  revalidate(id);
  return { ok: true, id };
}

export async function deleteCertificateAction(id: string): Promise<CertActionResult> {
  const user = await requireIssue();
  const before = await getCertificate(id);
  const ok = await deleteCertificate(id, user.id);
  if (!ok) return { ok: false, error: "Could not delete certificate." };
  await recordAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "delete",
    entity: "certificate",
    entityId: id,
    entityLabel: before?.certificateNumber ?? null,
  });
  revalidate(id);
  return { ok: true };
}
