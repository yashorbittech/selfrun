import "server-only";
import * as U from "@/app/workspace/(protected)/users/actions";
import * as Brand from "@/app/workspace/(protected)/settings/branding/actions";
import * as Auto from "@/app/workspace/(protected)/settings/automations/actions";
import * as Dom from "@/app/workspace/(protected)/settings/domains/actions";
import { ALL_KNOWN_ROLES } from "@/lib/workspace/role-catalog";
import { listWorkflows, listWorkflowRuns } from "@/lib/platform/workflows";
import { EVENT_TYPES } from "@/lib/platform/events/catalog";
import { WORKFLOW_TEMPLATES } from "@/lib/platform/workflows/templates";
import { listCompanyDomains } from "@/lib/platform/domains/custom";
import { getCompanyBrand } from "@/lib/platform/branding";
import { getEntitlements } from "@/lib/platform/billing/entitlements";
import { searchActivityLog } from "@/lib/workspace/activity-log";
import * as Portal from "@/app/workspace/(protected)/portal/users/actions";
import * as Billing from "@/app/workspace/(protected)/settings/billing/actions";
import * as Sec from "@/app/workspace/(protected)/settings/security/actions";
import { listActiveSessions } from "@/lib/security/sessions";
import { ObjectId } from "mongodb";
import { getCompanySubscription } from "@/lib/platform/billing/subscription";
import { listPlans } from "@/lib/platform/billing/plans";
import { listCompanySaasInvoices } from "@/lib/platform/billing/invoices";
import { currentCompanyId } from "@/lib/platform/tenancy/context";
import { getDb } from "@/lib/mongodb";
import { markAllRead, markRead } from "@/lib/platform/notifications";
import { viaAction, f, str } from "@/lib/ai/agent/entities/helpers";
import type { ActionDef, AgentUser, EntityDef, FieldDef, Json, ReportDef } from "@/lib/ai/agent/types";

/**
 * The Workspace (company control centre) for the agent: people and their roles, the company brand and theme, automations, domains,
 * and read access to plan usage and the company-wide activity log. Passwords, keys and payment secrets are never handled here.
 */

const owner = (u: AgentUser) => u.roles.includes("super_admin");
const admin = (u: AgentUser) => owner(u) || u.roles.includes("workspace_admin");
const USER_TYPES = ["employee", "contractor", "partner", "system"];

export const WORKSPACE_ENTITIES: EntityDef[] = [
  { key: "workspace.user", panel: "workspace", label: "User", description: "People who can sign in: email, roles, status, type, last login.", collection: "admin_users", titleField: "email", search: ["email", "name"], read: "staff", allowRead: admin, hide: ["permissionOverrides", "manualOverrides", "manualRoles", "lockedUntil", "failedLoginAttempts"] },
  { key: "workspace.custom_role", panel: "workspace", label: "Custom role", description: "Roles the company built itself: name, description, the panel roles it includes and its permission rules.", collection: "custom_roles", idType: "string", titleField: "name", search: ["name", "description"], read: "staff", allowRead: owner, hide: ["nameKey"] },
  { key: "workspace.portal_user", panel: "workspace", label: "Portal account", description: "External people who sign in to the portal (applicants, interns, trainees, clients): name, email, role, status.", collection: "external_users", idType: "string", titleField: "displayName", search: ["email", "displayName", "phone"], read: "staff", allowRead: admin, hide: ["passwordHash", "failedLoginAttempts", "lockedUntil", "referralCode"] },
  { key: "workspace.my_notifications", panel: "workspace", label: "My notifications in every panel", description: "Your own notifications from all panels (Finance, Leads, Legal, Website, Support …): title, panel, whether read.", collection: "panel_notifications", idType: "string", titleField: "title", read: "any", hide: ["dedupeKey", "expiresAt"], self: (u) => ({ userId: u.id }), scope: (u) => ({ userId: u.id }) },
  { key: "workspace.notification", panel: "workspace", label: "Notification", description: "Your workspace notifications (the bell).", collection: "platform_notifications", titleField: "title", read: "any", self: (u) => ({ userId: u.id }), scope: (u) => ({ userId: u.id }) },
];

const act = (key: string, label: string, description: string, params: FieldDef[], run: (v: Json, u: AgentUser) => Promise<unknown>, success: string, opts: { destructive?: boolean; allow?: (u: AgentUser) => boolean } = {}): ActionDef => ({
  key, panel: "workspace", label, description, params, level: "any", allow: opts.allow ?? admin, destructive: opts.destructive, run: (v, u) => viaAction(() => run(v, u), success),
});

const ROLES = `Role values: ${ALL_KNOWN_ROLES.join(", ")}`;

export const WORKSPACE_ACTIONS: ActionDef[] = [
  act("workspace.invite_user", "Invite a person", `Create their login by email with roles; they get an invitation. ${ROLES}.`, [f.email("email", "Email", true), f.list("roles", "Roles (see the list in the description)"), f.enum("userType", "Type", USER_TYPES), f.text("notes", "Notes")], async (v) => {
    const r = await U.createAdminUserAction(String(v.email ?? ""), (v.roles as string[]) ?? [], (str(v.userType) as never) ?? undefined, str(v.notes) ?? undefined);
    return r.ok ? { ok: true, result: "Invitation sent." } : r;
  }, "Invitation sent.", { destructive: true }),
  act("workspace.set_user_roles", "Change a person's roles", `Replace the roles of a person (they gain or lose access to panels). ${ROLES}.`, [f.ref("userId", "User (workspace.user id)", "workspace.user", true), f.list("roles", "New roles", )], (v) => U.updateAdminUserRolesAction(String(v.userId), (v.roles as string[]) ?? []), "Roles updated.", { destructive: true }),
  act("workspace.deactivate_user", "Deactivate a person", "Remove a person's access (their data stays); they can be reactivated.", [f.ref("userId", "User id", "workspace.user", true)], (v) => U.deactivateAdminUserAction(String(v.userId)), "User deactivated.", { destructive: true }),
  act("workspace.reactivate_user", "Reactivate a person", "Restore a deactivated person's access (optionally with these roles).", [f.ref("userId", "User id", "workspace.user", true), f.list("roles", "Roles to restore")], (v) => U.reactivateAdminUserAction(String(v.userId), (v.roles as string[]) ?? undefined), "User reactivated."),
  act("workspace.set_user_type", "Set a person's type and notes", "Employee, contractor, partner or system account.", [f.ref("userId", "User id", "workspace.user", true), f.enum("userType", "Type", USER_TYPES, true), f.text("notes", "Notes")], (v) => U.setUserTypeAndNotesAction(String(v.userId), v.userType as never, str(v.notes) ?? undefined), "Saved."),
  act("workspace.save_branding", "Change the company name display and logo", "The two-part brand name (primary + accent) shown in headers, and an optional logo URL.", [f.str("namePrimary", "Name (first part)", true), f.str("nameAccent", "Name (accent part)"), f.str("logoUrl", "Logo URL (leave out to keep)")], async (v) => {
    const cur = await getCompanyBrand();
    return Brand.saveBrandingAction({ namePrimary: String(v.namePrimary ?? ""), nameAccent: String(v.nameAccent ?? ""), logoUrl: str(v.logoUrl) ?? ((cur as unknown as Json).logoUrl as string | null) ?? null });
  }, "Branding saved.", { allow: owner }),
  act("workspace.apply_theme", "Switch the company theme", "Pick a theme by key; it becomes the look of the website and every panel.", [f.str("themeKey", "Theme key", true)], (v) => Brand.applyThemeAction(String(v.themeKey)), "Theme applied.", { allow: owner }),
  act("workspace.add_automation_template", "Add a ready-made automation", `Add one of the templates (${WORKFLOW_TEMPLATES.map((t) => t.key).join(", ")}).`, [f.str("templateKey", "Template key", true)], (v) => Auto.addTemplateAction(String(v.templateKey)), "Automation added.", { allow: owner }),
  act("workspace.save_automation", "Create or edit an automation", `A rule: trigger event → conditions → up to 5 actions. Events: ${EVENT_TYPES.map((e) => e.type).join(", ")}. Actions: {type:"notify", target:"role"|"user", value, title, body} · {type:"email", to, subject, body} · {type:"whatsapp", to, body} · {type:"webhook", url}. Use {{field}} in text.`, [f.str("automationId", "Automation id to edit (leave out to create)"), f.str("name", "Name", true), f.bool("enabled", "Enabled"), f.str("trigger", "Trigger event", true), f.json("conditions", "Conditions: [{field, op: eq|neq|contains|gt|lt, value}]"), f.json("actions", "Actions", true)], (v) => Auto.saveAutomationAction(str(v.automationId), { name: v.name, enabled: v.enabled !== false, trigger: v.trigger, conditions: (v.conditions as unknown[]) ?? [], actions: v.actions }), "Automation saved.", { allow: owner, destructive: true }),
  act("workspace.set_automation_enabled", "Turn an automation on or off", "Enable or pause an automation.", [f.str("automationId", "Automation id", true), f.bool("enabled", "Enabled")], (v) => Auto.toggleAutomationAction(String(v.automationId), v.enabled !== false), "Automation updated.", { allow: owner }),
  act("workspace.delete_automation", "Delete an automation", "Delete an automation.", [f.str("automationId", "Automation id", true)], (v) => Auto.deleteAutomationAction(String(v.automationId)), "Automation deleted.", { allow: owner, destructive: true }),
  act("workspace.test_automation", "Send a test run of an automation", "Fire an automation once with sample data to check it works.", [f.str("automationId", "Automation id", true)], (v) => Auto.testAutomationAction(String(v.automationId)), "Test sent.", { allow: owner }),
  act("workspace.add_domain", "Connect a custom domain", "Add your own domain; DNS records to publish are returned.", [f.str("host", "Domain, e.g. example.com", true)], (v) => Dom.addDomainAction(String(v.host)), "Domain added.", { allow: owner, destructive: true }),
  act("workspace.verify_domain", "Check a domain's DNS", "Re-check a pending domain after you published its DNS records.", [f.str("host", "Domain", true)], (v) => Dom.verifyDomainAction(String(v.host)), "Checked.", { allow: owner }),
  act("workspace.set_primary_domain", "Make a domain the primary address", "Choose which verified domain is the main address.", [f.str("host", "Domain", true)], (v) => Dom.setPrimaryDomainAction(String(v.host)), "Primary domain set.", { allow: owner, destructive: true }),
  act("workspace.remove_domain", "Disconnect a custom domain", "Remove a custom domain (it also leaves the hosting provider).", [f.str("host", "Domain", true)], (v) => Dom.removeDomainAction(String(v.host)), "Domain removed.", { allow: owner, destructive: true }),
  act("workspace.set_permission_overrides", "Fine-tune one person's permissions", "Switch individual capabilities on or off for one person (keys like pms.canManageClients; see the permission list in Workspace → Users). Only the keys you send change; `true`/`false` overrides their role, `null` clears an override.", [f.ref("userId", "User id", "workspace.user", true), f.json("overrides", "Object of {permissionKey: true|false|null}", true)], async (v) => {
    const cur = await (await getDb()).collection("admin_users").findOne({ _id: new ObjectId(String(v.userId)) }, { projection: { permissionOverrides: 1, manualOverrides: 1, customRoleIds: 1 } });
    // Only the hand-set rules (custom roles' own rules must not be copied onto the person).
    const hasCustom = ((cur?.customRoleIds as string[] | undefined) ?? []).length > 0;
    const next: Record<string, boolean> = { ...(((cur?.manualOverrides ?? (hasCustom ? {} : cur?.permissionOverrides)) as Record<string, boolean>) ?? {}) };
    for (const [k, val] of Object.entries((v.overrides as Json) ?? {})) { if (val === null) delete next[k]; else if (typeof val === "boolean") next[k] = val; }
    return U.updateAdminUserPermissionOverridesAction(String(v.userId), next);
  }, "Permissions updated.", { allow: owner, destructive: true }),
  act("workspace.set_user_custom_roles", "Give a person custom roles", "Replace the custom roles (workspace.custom_role ids) a person holds. Their other roles are not touched. Roles carrying permission rules need the Super Admin.", [f.ref("userId", "User (workspace.user id)", "workspace.user", true), f.list("customRoleIds", "Custom role ids")], async (v) => {
    const cur = await (await getDb()).collection("admin_users").findOne({ _id: new ObjectId(String(v.userId)) }, { projection: { roles: 1, manualRoles: 1, customRoleIds: 1 } });
    const manual = (cur?.manualRoles as string[] | undefined) ?? (((cur?.customRoleIds as string[] | undefined) ?? []).length === 0 ? ((cur?.roles as string[] | undefined) ?? []) : []);
    return U.updateAdminUserRolesAction(String(v.userId), manual, (v.customRoleIds as string[]) ?? []);
  }, "Custom roles updated.", { destructive: true }),
  act("workspace.bulk_deactivate_users", "Deactivate several people", "Remove access for many people at once (their data stays).", [f.list("userIds", "User ids")], (v) => U.bulkDeactivateAdminUsersAction((v.userIds as string[]) ?? []), "Users deactivated.", { destructive: true }),
  act("workspace.bulk_reactivate_users", "Reactivate several people", "Restore access for many people at once.", [f.list("userIds", "User ids")], (v) => U.bulkReactivateAdminUsersAction((v.userIds as string[]) ?? []), "Users reactivated.", { destructive: true }),
  act("workspace.set_portal_user_status", "Suspend or restore a portal account", "A suspended external person cannot sign in to the portal.", [f.ref("userId", "Portal account id", "workspace.portal_user", true), f.enum("status", "Status", ["active", "suspended"], true)], (v) => Portal.updatePortalUserStatusAction(String(v.userId), v.status as "active"), "Portal account updated.", { destructive: true }),
  act("workspace.force_logout_portal_user", "Sign a portal account out everywhere", "Ends all of that external person's sessions.", [f.ref("userId", "Portal account id", "workspace.portal_user", true)], (v) => Portal.forceLogoutPortalUserAction(String(v.userId)), "Signed out.", { destructive: true }),
  act("workspace.save_billing_details", "Change the company's invoice details", "Legal name, GSTIN, address, state and email printed on subscription invoices.", [f.str("legalName", "Legal name"), f.str("gstin", "GSTIN"), f.text("address", "Address"), f.str("state", "State"), f.email("email", "Billing email")], (v) => Billing.saveBillingDetailsAction({ legalName: str(v.legalName) ?? undefined, gstin: str(v.gstin) ?? undefined, address: str(v.address) ?? undefined, state: str(v.state) ?? undefined, email: str(v.email) ?? undefined }), "Billing details saved.", { allow: owner, destructive: true }),
  act("workspace.change_plan", "Change the company's plan", "Move to another plan (see workspace.subscription for plans and prices). Paying for a first subscription, or a card payment, is completed on the Billing screen.", [f.str("planId", "Plan id", true), f.enum("interval", "Billing interval", ["monthly", "yearly"], true), f.str("couponCode", "Coupon code")], (v) => Billing.changePlanAction(String(v.planId), v.interval as "monthly", str(v.couponCode)), "Plan changed.", { allow: owner, destructive: true }),
  act("workspace.cancel_subscription", "Cancel the subscription at period end", "The company keeps access until the paid period ends.", [], () => Billing.cancelSubscriptionAction(), "Subscription will end at the period end.", { allow: owner, destructive: true }),
  act("workspace.mark_notifications_read", "Mark my notifications as read", "Mark one notification (give its id) or all of them as read.", [f.str("id", "Notification id (leave out for all)")], async (v, u) => { if (str(v.id)) await markRead(u.id, String(v.id)); else await markAllRead(u.id); return { ok: true }; }, "Marked as read.", { allow: () => true }),
  act("workspace.revoke_session", "End one of your sign-ins", "Sign one of your own listed devices out (ids from workspace.my_sessions).", [f.str("sessionId", "Session id", true)], (v) => Sec.revokeSessionAction(String(v.sessionId)), "Signed out.", { allow: () => true, destructive: true }),
  act("workspace.sign_out_other_devices", "Sign out all my other devices", "Ends every sign-in of yours except this one.", [], () => Sec.signOutOthersAction(), "Other devices signed out.", { allow: () => true, destructive: true }),
];

export const WORKSPACE_REPORTS: ReportDef[] = [
  { key: "workspace.subscription", panel: "workspace", label: "Subscription and invoices", description: "The company's subscription (plan, status, renewal, billing details), the plans on offer, and invoices issued to it.", level: "any", allow: owner, params: [], run: async () => { const id = await currentCompanyId(); return JSON.parse(JSON.stringify({ subscription: await getCompanySubscription(id), plans: (await listPlans({ activeOnly: true })), invoices: await listCompanySaasInvoices(id) })) as Json; } },
  { key: "workspace.my_sessions", panel: "workspace", label: "My sign-ins", description: "Your own signed-in devices (to end one).", level: "any", params: [], run: async (_v, u) => JSON.parse(JSON.stringify({ sessions: await listActiveSessions(new ObjectId(u.id)) })) as Json },
  { key: "workspace.automations", panel: "workspace", label: "Automations", description: "Your automations with their triggers, actions and last run; add a workflow id for its recent runs.", level: "any", allow: owner, params: [f.str("automationId", "Show the runs of this automation")], run: async (v) => (str(v.automationId) ? { runs: await listWorkflowRuns(String(v.automationId), 20) } : { automations: (await listWorkflows()).map((w) => ({ id: w.id, name: w.name, enabled: w.enabled, trigger: w.trigger, actions: w.actions.map((a) => a.type), lastRun: w.lastRun })) }) as unknown as Json },
  { key: "workspace.domains", panel: "workspace", label: "Domains", description: "The workspace's addresses and their verification / SSL state.", level: "any", allow: owner, params: [], run: async () => ({ domains: await listCompanyDomains() }) as unknown as Json },
  { key: "workspace.plan_usage", panel: "workspace", label: "Plan and usage", description: "The company's plan, limits (seats, AI tokens, storage) and which panels are included.", level: "any", allow: admin, params: [], run: async () => (await getEntitlements()) as unknown as Json },
  { key: "workspace.activity", panel: "workspace", label: "Company-wide activity log", description: "Who did what across every panel (search by person or action).", level: "any", allow: admin, params: [f.str("search", "Search text, e.g. an email")], run: async (v) => ({ items: (await searchActivityLog({ search: str(v.search) ?? "", pageSize: 30 })).items }) as unknown as Json },
  { key: "workspace.event_catalog", panel: "workspace", label: "Automation events and templates", description: "The events an automation can trigger on, and the ready-made templates.", level: "any", allow: owner, params: [], run: async () => ({ events: EVENT_TYPES.map((e) => ({ type: e.type, label: e.label })), templates: WORKFLOW_TEMPLATES.map((t) => ({ key: t.key, title: (t as unknown as Json).title })) }) as unknown as Json },
];
