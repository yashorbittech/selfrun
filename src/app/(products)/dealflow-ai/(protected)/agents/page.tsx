import { requireLmsPage } from "@/lib/lms-auth";
import AgentsPageClient from "./AgentsPageClient";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  await requireLmsPage("VIEW_LEADS");
  return <AgentsPageClient />;
}
