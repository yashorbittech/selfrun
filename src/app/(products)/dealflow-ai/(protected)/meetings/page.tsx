import { requireLmsPage } from "@/lib/lms-auth";
import MeetingsPageClient from "./MeetingsPageClient";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  await requireLmsPage("VIEW_LEADS");
  return <MeetingsPageClient />;
}
