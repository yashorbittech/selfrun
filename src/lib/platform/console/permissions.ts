/**
 * Platform Panel permission catalogue — pure data + checks, safe to import
 * from client components (for hiding buttons) as well as the server.
 *
 * A permission is `<area>.<verb>`. Within an area, `manage` implies every
 * other verb, and any verb implies `read`. The wildcard `*` (Platform Owner)
 * grants everything, including permissions added to this list later.
 */

export const PERMISSION_GROUPS = [
  {
    area: "Tenants",
    permissions: [
      { key: "companies.read", label: "View companies" },
      { key: "companies.status", label: "Suspend / reactivate companies" },
      { key: "companies.manage", label: "Manage companies (all company actions)" },
      { key: "signups.read", label: "View sign-ups" },
      { key: "signups.manage", label: "Approve / reject sign-ups, change sign-up mode" },
      { key: "domains.read", label: "View domains & SSL" },
      { key: "domains.manage", label: "Manage domains & SSL" },
    ],
  },
  {
    area: "Panels",
    permissions: [
      { key: "panels.read", label: "View the Panel Registry and which panels each company has" },
      { key: "panels.manage", label: "Create, edit, switch on/off and delete panels (everywhere or per company)" },
    ],
  },
  {
    area: "Billing",
    permissions: [
      { key: "plans.read", label: "View plans & pricing" },
      { key: "plans.manage", label: "Manage plans & pricing" },
      { key: "subscriptions.read", label: "View subscriptions" },
      { key: "subscriptions.manage", label: "Manage subscriptions" },
      { key: "invoices.read", label: "View SaaS invoices" },
      { key: "invoices.manage", label: "Manage SaaS invoices" },
      { key: "coupons.read", label: "View coupons" },
      { key: "coupons.manage", label: "Manage coupons & discounts" },
      { key: "addons.read", label: "View add-ons" },
      { key: "addons.manage", label: "Manage add-ons" },
      { key: "payments.read", label: "View payments" },
      { key: "payments.manage", label: "Manage payments & Razorpay" },
      { key: "tax.read", label: "View tax & invoicing settings" },
      { key: "tax.manage", label: "Change tax & invoicing settings" },
    ],
  },
  {
    area: "Analytics",
    permissions: [
      { key: "revenue.read", label: "View revenue & subscription analytics" },
      { key: "usage.read", label: "View usage & limits" },
    ],
  },
  {
    area: "Support",
    permissions: [
      { key: "support.read", label: "View Help & Support requests from all companies" },
      { key: "support.manage", label: "Reply to, assign and resolve requests; manage help content and support settings" },
    ],
  },
  {
    area: "Administration",
    permissions: [
      { key: "users.read", label: "View platform users & roles" },
      { key: "users.manage", label: "Manage platform users & roles" },
      { key: "integrations.read", label: "View integrations" },
      { key: "integrations.manage", label: "Manage integrations" },
      { key: "settings.read", label: "View platform settings" },
      { key: "settings.manage", label: "Change platform settings" },
      { key: "audit.read", label: "View & export the audit log" },
    ],
  },
] as const;

export type PlatformPermission = (typeof PERMISSION_GROUPS)[number]["permissions"][number]["key"];

export const ALL_PERMISSIONS: PlatformPermission[] = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));
const KNOWN = new Set<string>(ALL_PERMISSIONS);

export function isPlatformPermission(key: string): key is PlatformPermission {
  return KNOWN.has(key);
}

/** Whether a permission set (a role's `permissions`) allows `perm`. */
export function hasPermission(granted: readonly string[] | null | undefined, perm: PlatformPermission): boolean {
  if (!granted || granted.length === 0) return false;
  if (granted.includes("*") || granted.includes(perm)) return true;
  const [area, verb] = perm.split(".");
  if (granted.includes(`${area}.manage`)) return true;
  // Any verb in the area implies read.
  if (verb === "read") return granted.some((g) => g.startsWith(`${area}.`));
  return false;
}

/** Every catalogue permission a set grants — `*` expanded, implications applied. */
export function effectivePermissions(granted: readonly string[]): PlatformPermission[] {
  return ALL_PERMISSIONS.filter((p) => hasPermission(granted, p));
}

/** Whether `actor` holds every permission in `wanted` (no privilege escalation). */
export function coversPermissions(actor: readonly string[], wanted: readonly string[]): boolean {
  if (actor.includes("*")) return true;
  if (wanted.includes("*")) return false;
  return wanted.every((w) => isPlatformPermission(w) && hasPermission(actor, w));
}

/** Read-only across the whole panel. */
export const VIEWER_PERMISSIONS: PlatformPermission[] = ALL_PERMISSIONS.filter((p) => p.endsWith(".read"));

/**
 * The permission each Platform Panel route needs to be viewed. Pages use the
 * `.read` key; their mutating actions use the matching `.manage` (or narrower) key.
 */
export const ROUTE_PERMISSIONS: Record<string, PlatformPermission | null> = {
  "/platform": null, // any platform user
  "/platform/companies": "companies.read",
  "/platform/panels": "panels.read",
  "/platform/signups": "signups.read",
  "/platform/domains": "domains.read",
  "/platform/plans": "plans.read",
  "/platform/subscriptions": "subscriptions.read",
  "/platform/invoices": "invoices.read",
  "/platform/coupons": "coupons.read",
  "/platform/addons": "addons.read",
  "/platform/payments": "payments.read",
  "/platform/settings/billing": "tax.read",
  "/platform/revenue": "revenue.read",
  "/platform/usage": "usage.read",
  "/platform/support": "support.read",
  "/platform/support/help": "support.read",
  "/platform/support/settings": "support.read",
  "/platform/users": "users.read",
  "/platform/integrations": "integrations.read",
  "/platform/audit": "audit.read",
  "/platform/settings": "settings.read",
};
