"use server";

import { revalidatePath } from "next/cache";
import { requireLpmsUser } from "@/lib/lpms-auth";
import { getViewer } from "@/lib/lpms/viewer";
import { lpmsCan } from "@/lib/lpms-roles";
import {
  createDocument,
  updateDocument,
  submitForApproval,
  approveDocument,
  rejectDocument,
  publishDocument,
  archiveDocument,
  deleteDocument,
} from "@/lib/lpms/documents";
import {
  createMakerType,
  updateMakerType,
  archiveMakerType,
} from "@/lib/lpms/makers";
import {
  createTemplate,
  updateTemplate,
  archiveTemplate,
} from "@/lib/lpms/templates";
import {
  createCategory,
  updateCategory,
  archiveCategory,
} from "@/lib/lpms/categories";
import {
  createWorkflow,
  updateWorkflow,
} from "@/lib/lpms/workflows";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

// ─── Documents ────────────────────────────────────────────────────────────────

export async function createDocumentAction(data: {
  makerTypeId: string;
  templateId?: string;
  title: string;
  fieldValues?: Record<string, unknown>;
  selectedEntities?: Record<string, string[]>;
}): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "CREATE")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await createDocument(data, viewer);
  if (result.ok) revalidatePath("/lpms/documents");
  return result;
}

export async function updateDocumentAction(
  id: string,
  data: {
    blocks?: unknown[];
    headerBlocks?: unknown[];
    footerBlocks?: unknown[];
    title?: string;
    fieldValues?: Record<string, unknown>;
    selectedEntities?: Record<string, string[]>;
  }
): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "EDIT")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await updateDocument(id, data, viewer);
  if (result.ok) revalidatePath(`/lpms/documents/${id}`);
  return result;
}

export async function submitForApprovalAction(id: string): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "EDIT")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await submitForApproval(id, viewer);
  if (result.ok) {
    revalidatePath(`/lpms/documents/${id}`);
    revalidatePath("/lpms/approvals");
  }
  return result;
}

export async function approveDocumentAction(
  documentId: string,
  approvalId: string,
  notes: string
): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "APPROVE")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await approveDocument(documentId, approvalId, notes, viewer);
  if (result.ok) {
    revalidatePath(`/lpms/documents/${documentId}`);
    revalidatePath("/lpms/approvals");
  }
  return result;
}

export async function rejectDocumentAction(
  documentId: string,
  approvalId: string,
  notes: string
): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "APPROVE")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await rejectDocument(documentId, approvalId, notes, viewer);
  if (result.ok) {
    revalidatePath(`/lpms/documents/${documentId}`);
    revalidatePath("/lpms/approvals");
  }
  return result;
}

export async function publishDocumentAction(id: string): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "PUBLISH")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await publishDocument(id, viewer);
  if (result.ok) revalidatePath(`/lpms/documents/${id}`);
  return result;
}

export async function archiveDocumentAction(id: string): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "ARCHIVE")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await archiveDocument(id, viewer);
  if (result.ok) revalidatePath("/lpms/documents");
  return result;
}

export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "DELETE")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await deleteDocument(id, viewer);
  if (result.ok) revalidatePath("/lpms/documents");
  return result;
}

// ─── Maker Types ──────────────────────────────────────────────────────────────

export async function createMakerTypeAction(data: {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  fieldsSchema?: unknown[];
  outputFormats?: string[];
}): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "MANAGE_MAKERS")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await createMakerType(data, viewer);
  if (result.ok) revalidatePath("/lpms/makers");
  return result;
}

export async function updateMakerTypeAction(id: string, data: unknown): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "MANAGE_MAKERS")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await updateMakerType(id, data, viewer);
  if (result.ok) {
    revalidatePath("/lpms/makers");
    revalidatePath(`/lpms/makers/${id}`);
  }
  return result;
}

export async function archiveMakerTypeAction(id: string): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "MANAGE_MAKERS")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await archiveMakerType(id, viewer);
  if (result.ok) revalidatePath("/lpms/makers");
  return result;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function createTemplateAction(data: {
  makerTypeId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "MANAGE_TEMPLATES")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await createTemplate(data, viewer);
  if (result.ok) revalidatePath("/lpms/templates");
  return result;
}

export async function updateTemplateAction(id: string, data: unknown): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "MANAGE_TEMPLATES")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await updateTemplate(id, data, viewer);
  if (result.ok) {
    revalidatePath("/lpms/templates");
    revalidatePath(`/lpms/templates/${id}`);
  }
  return result;
}

export async function deleteTemplateAction(id: string): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "MANAGE_TEMPLATES")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await archiveTemplate(id, viewer);
  if (result.ok) revalidatePath("/lpms/templates");
  return result;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function createCategoryAction(data: {
  name: string;
  slug: string;
  color?: string;
  icon?: string;
  description?: string;
}): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "MANAGE_POLICIES")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await createCategory(data, viewer);
  if (result.ok) revalidatePath("/lpms/categories");
  return result;
}

export async function updateCategoryAction(id: string, data: unknown): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "MANAGE_POLICIES")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await updateCategory(id, data, viewer);
  if (result.ok) revalidatePath("/lpms/categories");
  return result;
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "MANAGE_POLICIES")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await archiveCategory(id, viewer);
  if (result.ok) revalidatePath("/lpms/categories");
  return result;
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export async function createWorkflowAction(data: {
  name: string;
  description?: string;
  steps?: unknown[];
  isDefault?: boolean;
}): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "MANAGE_POLICIES")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await createWorkflow(data, viewer);
  if (result.ok) revalidatePath("/lpms/workflows");
  return result;
}

export async function updateWorkflowAction(id: string, data: unknown): Promise<ActionResult> {
  const user = await requireLpmsUser();
  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, "MANAGE_POLICIES")) return { ok: false, error: "Permission denied" };
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Unauthorized" };
  const result = await updateWorkflow(id, data, viewer);
  if (result.ok) revalidatePath("/lpms/workflows");
  return result;
}
