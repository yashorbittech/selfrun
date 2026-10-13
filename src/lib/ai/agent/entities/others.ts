import "server-only";
import type { EntityDef } from "@/lib/ai/agent/types";

/**
 * Read access for the panels whose write paths are not wired into the agent yet. The agent can look anything up and answer
 * questions from real records; changes still go through the panel itself. (Soft-deleted rows are excluded; the filter is a no-op
 * for collections that don't soft-delete.)
 */
export const OTHER_ENTITIES: EntityDef[] = [
  // Workspace-wide
];
