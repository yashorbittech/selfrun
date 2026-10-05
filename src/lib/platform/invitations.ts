import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { currentCompanyId } from "@/lib/platform/tenancy/context";
import { getCompany } from "@/lib/platform/tenancy/companies";
import { createEmployee } from "@/lib/hrms/employees";
import { hashPassword } from "@/lib/lms-auth";
import { sendEmail } from "@/lib/platform/email";
import { renderEmail } from "@/lib/platform/email/template";
import { ROLE_PRESETS, rolesForPreset } from "@/lib/platform/onboarding/catalog";
import { rolesUseSeat, seatBlockReason } from "@/lib/platform/billing/enforce";

/**
 * Team invitations. Company-scoped (`company_invitations` goes through the
 * scoped data layer), so a token only resolves on the inviting company's own
 * host. Accepting creates the HRMS employee record AND the linked login in
 * one go — the invitee is a real employee in every panel from first sign-in.
 */

const COLLECTION = "company_invitations";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface Invitation {
  _id: string;
  tokenHash: string;
  email: string;
  name: string;
  preset: string;
  roles: string[];
  departmentId: string | null;
  designationId: string | null;
  /** Platform Panel role granted on acceptance (owner company only; see console/roles.ts). */
  platformRoleId?: string | null;
  invitedBy: string;
  status: "pending" | "accepted" | "revoked";
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

let indexed = false;
async function col() {
  const c = (await getDb()).collection<Invitation>(COLLECTION);
  if (!indexed) {
    indexed = true;
    await Promise.all([c.createIndex({ tokenHash: 1 }, { unique: true }), c.createIndex({ email: 1, status: 1 })]).catch(() => {});
  }
  return c;
}

export interface InviteInput {
  email: string;
  name: string;
  preset: string;
  departmentId?: string | null;
  designationId?: string | null;
  /** Also grant this Platform Panel role on acceptance (owner company only). */
  platformRoleId?: string | null;
}

export type InviteResult = { ok: true; email: string } | { ok: false; error: string };

/** `baseUrl` = this company's workspace origin, where the accept link must point. */
export async function inviteTeammate(input: InviteInput, inviter: { id: string; email: string }, baseUrl: string): Promise<InviteResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!EMAIL_RE.test(email)) return { ok: false, error: `"${input.email}" isn't a valid email address.` };
  const roles = rolesForPreset(input.preset);
  if (!roles) return { ok: false, error: "Choose a role." };

  const db = await getDb();
  if (await db.collection("admin_users").findOne({ email }, { projection: { _id: 1 } })) return { ok: false, error: `${email} already has an account in this workspace.` };

  // Outstanding invitations count as promised seats (a re-invite replaces its own earlier one).
  if (rolesUseSeat(roles)) {
    const reinvite = (await (await col()).countDocuments({ email, status: "pending", expiresAt: { $gt: new Date() } })) > 0;
    const seatBlock = await seatBlockReason(reinvite ? 0 : 1, { countPendingInvites: true });
    if (seatBlock) return { ok: false, error: seatBlock };
  }

  const c = await col();
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  // Re-inviting replaces the earlier pending invite (and invalidates its link).
  await c.updateMany({ email, status: "pending" }, { $set: { status: "revoked" } });
  await c.insertOne({
    _id: randomUUID(),
    tokenHash: sha256(token),
    email,
    name,
    preset: input.preset,
    roles,
    departmentId: input.departmentId || null,
    designationId: input.designationId || null,
    platformRoleId: input.platformRoleId || null,
    invitedBy: inviter.id,
    status: "pending",
    createdAt: now,
    expiresAt: new Date(now.getTime() + TTL_MS),
    acceptedAt: null,
  });

  const company = await getCompany(await currentCompanyId());
  const companyName = company?.name ?? "your company";
  const presetLabel = ROLE_PRESETS.find((p) => p.value === input.preset)?.label ?? "team member";
  const { html, text } = renderEmail({
    brand: companyName,
    heading: `Join ${companyName}`,
    paragraphs: [`Hi${name ? ` ${name}` : ""},`, `${inviter.email} invited you to ${companyName}'s workspace as ${presetLabel}. Set your password to get started.`],
    action: { label: "Accept invitation", url: `${baseUrl}/workspace/invite?token=${token}` },
    footnote: "This invitation expires in 7 days.",
  });
  const sent = await sendEmail({ to: email, subject: `You're invited to join ${companyName}`, html, text, replyTo: inviter.email });
  if (!sent.ok) {
    await c.updateOne({ tokenHash: sha256(token) }, { $set: { status: "revoked" } });
    return { ok: false, error: `Couldn't send the invitation email to ${email}. Try again shortly.` };
  }
  return { ok: true, email };
}

export async function listPendingInvitations(opts: { platformOnly?: boolean } = {}): Promise<Pick<Invitation, "_id" | "email" | "name" | "preset" | "platformRoleId" | "createdAt" | "expiresAt">[]> {
  return (await col())
    .find(
      { status: "pending", expiresAt: { $gt: new Date() }, ...(opts.platformOnly ? { platformRoleId: { $nin: [null, ""] } } : {}) },
      { projection: { email: 1, name: 1, preset: 1, platformRoleId: 1, createdAt: 1, expiresAt: 1 } },
    )
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
}

export async function revokeInvitation(id: string): Promise<void> {
  await (await col()).updateOne({ _id: id, status: "pending" }, { $set: { status: "revoked" } });
}

export async function describeInvitation(token: string): Promise<{ email: string; name: string; companyName: string } | null> {
  const inv = await (await col()).findOne({ tokenHash: sha256(token), status: "pending", expiresAt: { $gt: new Date() } });
  if (!inv) return null;
  const company = await getCompany(await currentCompanyId());
  return { email: inv.email, name: inv.name, companyName: company?.name ?? "" };
}

export type AcceptResult = { ok: true; adminId: ObjectId } | { ok: false; error: string };

export async function acceptInvitation(token: string, input: { name: string; password: string }): Promise<AcceptResult> {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (input.password.length < 10) return { ok: false, error: "Use at least 10 characters for your password." };

  const c = await col();
  const db = await getDb();
  const users = db.collection("admin_users");
  const pending = await c.findOne({ tokenHash: sha256(token), status: "pending", expiresAt: { $gt: new Date() } }, { projection: { email: 1 } });
  if (pending && (await users.findOne({ email: pending.email }, { projection: { _id: 1 } }))) return { ok: false, error: "An account with this email already exists — sign in instead." };

  const invRoles = pending ? ((await c.findOne({ tokenHash: sha256(token) }, { projection: { roles: 1 } }))?.roles ?? []) : [];
  if (pending && rolesUseSeat(invRoles) && (await seatBlockReason(1))) {
    return { ok: false, error: "This workspace has no free user seats right now. Ask your admin to free a seat or add seats, then try the link again." };
  }

  // Claim atomically so a double submit can't create two accounts.
  const inv = await c.findOneAndUpdate({ tokenHash: sha256(token), status: "pending", expiresAt: { $gt: new Date() } }, { $set: { status: "accepted", acceptedAt: new Date() } });
  if (!inv) return { ok: false, error: "This invitation has expired or was already used. Ask your admin to send a new one." };

  // HRMS employee record first (skipped for a pure Company Admin with no employee roles), then the linked login.
  const needsEmployee = !inv.roles.includes("super_admin");
  const [firstName, ...rest] = name.split(/\s+/);
  // Someone imported or added in HR beforehand already has an employee record: link it instead of creating a second one.
  const existingEmployee = needsEmployee ? await db.collection<{ _id: string }>("hrms_employees").findOne({ workEmail: inv.email, deletedAt: null }, { projection: { _id: 1 } }) : null;
  const employee = existingEmployee
    ? existingEmployee
    : needsEmployee
    ? await createEmployee(
        {
          firstName,
          lastName: rest.join(" "),
          workEmail: inv.email,
          status: "active",
          personal: { dateOfBirth: null, gender: null, maritalStatus: null, personalEmail: null, phone: null, addressLine: null, city: null, state: null, postalCode: null, photoKey: null },
          professional: { departmentId: inv.departmentId, designationId: inv.designationId, teamId: null, reportingManagerId: null, employmentType: null, workLocation: null, joiningDate: new Date().toISOString().slice(0, 10), probationEndDate: null, relievingDate: null },
          emergencyContacts: [],
        },
        inv.invitedBy,
      )
    : null;

  const adminId = new ObjectId();
  await users.insertOne({
    _id: adminId,
    email: inv.email,
    name,
    passwordHash: hashPassword(input.password),
    roles: inv.roles,
    permissionOverrides: {},
    employeeId: employee?._id ?? null,
    mustChangePassword: false,
    // The invitation link was sent to this address, so it is verified by accepting.
    emailVerified: true,
    emailVerifiedAt: new Date(),
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    lastLoginAt: null,
    ...(inv.platformRoleId ? { platformRoleId: inv.platformRoleId, platformGrantedAt: new Date(), platformGrantedBy: inv.invitedBy } : {}),
  });
  if (employee) await db.collection("hrms_employees").updateOne({ _id: employee._id as never }, { $set: { adminUserId: inv.email } });
  return { ok: true, adminId };
}
