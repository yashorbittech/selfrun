import "server-only";
import { randomUUID } from "node:crypto";
import { getPlatformDb } from "@/lib/platform/tenancy/platform-db";
import { sendEmail } from "@/lib/platform/email";
import { saasContact } from "@/lib/saas/brand";

/** Demo requests and contact messages sent from the product website by people who are not (yet) a company. */
export const INQUIRIES_COLLECTION = "saas_inquiries";

export type InquiryKind = "demo" | "contact";

export interface Inquiry {
  _id: string;
  kind: InquiryKind;
  name: string;
  email: string;
  company: string;
  phone: string;
  teamSize: string;
  interest: string;
  message: string;
  status: "new" | "contacted" | "closed";
  createdAt: Date;
}

export interface InquiryInput {
  kind: InquiryKind;
  name: string;
  email: string;
  company: string;
  phone: string;
  teamSize: string;
  interest: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export function parseInquiry(kind: InquiryKind, fd: FormData): { ok: true; value: InquiryInput } | { ok: false; error: string; field: string } {
  const value: InquiryInput = {
    kind,
    name: clip(fd.get("name"), 120),
    email: clip(fd.get("email"), 200).toLowerCase(),
    company: clip(fd.get("company"), 160),
    phone: clip(fd.get("phone"), 40),
    teamSize: clip(fd.get("teamSize"), 40),
    interest: clip(fd.get("interest"), 120),
    message: clip(fd.get("message"), 3000),
  };
  if (value.name.length < 2) return { ok: false, error: "Please enter your name.", field: "name" };
  if (!EMAIL_RE.test(value.email)) return { ok: false, error: "Please enter a valid work email.", field: "email" };
  if (kind === "demo" && value.company.length < 2) return { ok: false, error: "Please enter your company name.", field: "company" };
  if (kind === "contact" && value.message.length < 10) return { ok: false, error: "Please tell us a little more about how we can help.", field: "message" };
  return { ok: true, value };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** Stores the inquiry and tells the sales/support mailbox. Storage is what matters: a failed email never fails the request. */
export async function saveInquiry(input: InquiryInput, host: string): Promise<void> {
  const doc: Inquiry = { _id: randomUUID(), ...input, status: "new", createdAt: new Date() };
  await (await getPlatformDb()).collection<Inquiry>(INQUIRIES_COLLECTION).insertOne(doc);
  const contact = saasContact(host);
  const title = input.kind === "demo" ? "New demo request" : "New contact message";
  const rows: [string, string][] = [["Name", input.name], ["Email", input.email], ["Company", input.company], ["Phone", input.phone], ["Team size", input.teamSize], ["Interested in", input.interest], ["Message", input.message]];
  await sendEmail({
    to: input.kind === "demo" ? contact.sales : contact.hello,
    subject: `${title}: ${input.name}${input.company ? ` (${input.company})` : ""}`,
    html: `<h2>${title}</h2><table cellpadding="6">${rows.filter(([, v]) => v).map(([k, v]) => `<tr><td><strong>${esc(k)}</strong></td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`,
    text: rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n"),
    replyTo: input.email,
  }).catch(() => {});
}
