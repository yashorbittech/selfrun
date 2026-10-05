"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceAction } from "@/lib/workspace/access";
import { deleteAdminDocument, type DocumentModule } from "@/lib/workspace/documents";

function revalidate() {
  revalidatePath("/workspace/account/documents");
}

export async function deleteAdminDocumentAction(
  module: DocumentModule,
  id: string,
  ownerId: string
): Promise<{ ok: boolean }> {
  const admin = await requireWorkspaceAction("account.documents");
  const result = await deleteAdminDocument(module, id, ownerId, admin.id);
  if (result.ok) revalidate();
  return result;
}

export async function bulkDeleteAdminDocumentsAction(
  rows: { module: DocumentModule; id: string; ownerId: string }[]
): Promise<{ deleted: number }> {
  const admin = await requireWorkspaceAction("account.documents");
  let deleted = 0;
  for (const row of rows) {
    const result = await deleteAdminDocument(row.module, row.id, row.ownerId, admin.id);
    if (result.ok) deleted += 1;
  }
  revalidate();
  return { deleted };
}
