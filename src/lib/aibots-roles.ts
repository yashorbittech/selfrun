/**
 * AI Bots (AIBOTS) role + permission model. Like every other panel, access is
 * gated on the shared `admin_users.roles` array — there is no separate user
 * store. AIBOTS access needs an explicit `aibots_*` role (or super_admin).
 *
 * Two independent gates decide what a person can do with a bot:
 *   1. the PERMISSION (what kind of action — use / edit / manage files …), and
 *   2. the BOT'S OWN ACCESS LIST (which bots) — see `canUseBot` in
 *      `lib/aibots/bots.ts`. Anyone who can edit bots can use every bot.
 *
 * Every predicate is Super-Admin-override-aware (`resolvePermission`), so the
 * Super Admin can dial individual capabilities per user at `/workspace/users`
 * (catalog entries are derived from this file in `permission-catalog.ts`).
 *
 * Pure file (no server-only imports) so client components can hide buttons —
 * hiding a button is never the security boundary; every action / route
 * re-checks with these same functions.
 */

import { resolvePermission, type RoleContext } from "@/lib/permission-overrides";

export const AIBOTS_ROLES = ["super_admin", "aibots_admin", "aibots_manager", "aibots_user"] as const;
export type AibotsRole = (typeof AIBOTS_ROLES)[number];

export const AIBOTS_ROLE_META: Record<AibotsRole, { label: string; description: string }> = {
  super_admin: {
    label: "Super Admin",
    description: "Every AI Bots operation: create, edit and delete bots, manage knowledge bases, review all chats, settings and the activity log.",
  },
  aibots_admin: {
    label: "AI Bots Admin",
    description: "Everything a manager can do, plus deleting bots and changing AI Bots settings (models, pricing, limits).",
  },
  aibots_manager: {
    label: "AI Bots Manager",
    description: "Create and edit bots, manage their knowledge bases and access lists, review everyone's chats and read the activity log.",
  },
  aibots_user: {
    label: "AI Bots User",
    description: "Chat with the bots assigned to them (or their role): start, continue, rename and delete their own chats.",
  },
};

export const AIBOTS_PERMISSIONS = [
  "USE_BOT",
  "CREATE_BOT",
  "EDIT_BOT",
  "DELETE_BOT",
  "MANAGE_KB",
  "UPLOAD_FILES",
  "DELETE_FILES",
  "VIEW_CHATS",
  "DELETE_CHATS",
  "VIEW_AUDIT",
  "MANAGE_SETTINGS",
] as const;
export type AibotsPermission = (typeof AIBOTS_PERMISSIONS)[number];

/** Key under which the Super Admin stores an override — matches `permission-catalog.ts`. */
export const AIBOTS_PERMISSION_KEY: Record<AibotsPermission, string> = {
  USE_BOT: "aibots.canUseBots",
  CREATE_BOT: "aibots.canCreateBots",
  EDIT_BOT: "aibots.canEditBots",
  DELETE_BOT: "aibots.canDeleteBots",
  MANAGE_KB: "aibots.canManageKnowledgeBase",
  UPLOAD_FILES: "aibots.canUploadFiles",
  DELETE_FILES: "aibots.canDeleteFiles",
  VIEW_CHATS: "aibots.canViewAllChats",
  DELETE_CHATS: "aibots.canDeleteAnyChat",
  VIEW_AUDIT: "aibots.canViewAudit",
  MANAGE_SETTINGS: "aibots.canManageSettings",
};

export const AIBOTS_PERMISSION_META: Record<AibotsPermission, { label: string; description: string }> = {
  USE_BOT: { label: "Use bots", description: "Chat with the bots assigned to them or their role, and manage their own chats." },
  CREATE_BOT: { label: "Create bots", description: "Create new bots (instructions, model, access list)." },
  EDIT_BOT: { label: "Edit bots", description: "Edit any bot's details, instructions, model, access list and status. Can use every bot." },
  DELETE_BOT: { label: "Delete bots", description: "Delete a bot and its OpenAI knowledge base." },
  MANAGE_KB: { label: "Manage knowledge base", description: "Edit knowledge-base file details and enable or disable individual files." },
  UPLOAD_FILES: { label: "Upload knowledge files", description: "Upload new or replacement files to a bot's knowledge base." },
  DELETE_FILES: { label: "Delete knowledge files", description: "Remove files from a bot's knowledge base (deleted from OpenAI too)." },
  VIEW_CHATS: { label: "View all chats", description: "Read every user's chats with every bot (read-only oversight)." },
  DELETE_CHATS: { label: "Delete any chat", description: "Delete other users' chats. Everyone can always delete their own." },
  VIEW_AUDIT: { label: "View activity log", description: "Read the AI Bots activity log." },
  MANAGE_SETTINGS: { label: "Manage settings", description: "Change allowed OpenAI models, token pricing and limits." },
};

const USER: AibotsPermission[] = ["USE_BOT"];
const MANAGER: AibotsPermission[] = [...USER, "CREATE_BOT", "EDIT_BOT", "MANAGE_KB", "UPLOAD_FILES", "DELETE_FILES", "VIEW_CHATS", "VIEW_AUDIT"];
const ADMIN: AibotsPermission[] = [...AIBOTS_PERMISSIONS];

export const AIBOTS_ROLE_PERMISSIONS: Record<AibotsRole, readonly AibotsPermission[]> = {
  super_admin: ADMIN,
  aibots_admin: ADMIN,
  aibots_manager: MANAGER,
  aibots_user: USER,
};

export function isAibotsRole(value: unknown): value is AibotsRole {
  return typeof value === "string" && (AIBOTS_ROLES as readonly string[]).includes(value);
}

export function normalizeAibotsRoles(value: unknown): AibotsRole[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(isAibotsRole)));
}

/** Can open the AI Bots panel at `/aibots/*`. */
export function hasAibotsAccess(roles: readonly string[] | undefined | null): boolean {
  return normalizeAibotsRoles(roles).length > 0;
}

/** The single permission check every server action / route / page uses. */
export function aibotsCan(user: RoleContext, permission: AibotsPermission): boolean {
  return resolvePermission(user, AIBOTS_PERMISSION_KEY[permission], () =>
    normalizeAibotsRoles(user.roles).some((r) => AIBOTS_ROLE_PERMISSIONS[r].includes(permission))
  );
}

/** Oversight tier: sees platform-wide dashboard numbers instead of only their own. */
export function isAibotsManagerTier(user: RoleContext): boolean {
  return aibotsCan(user, "VIEW_CHATS") || aibotsCan(user, "EDIT_BOT");
}

export function primaryAibotsRoleLabel(roles: readonly string[]): string {
  if (roles.includes("super_admin")) return AIBOTS_ROLE_META.super_admin.label;
  const eff = normalizeAibotsRoles(roles);
  for (const r of ["aibots_admin", "aibots_manager", "aibots_user"] as const) {
    if (eff.includes(r)) return AIBOTS_ROLE_META[r].label;
  }
  return "No Access";
}
