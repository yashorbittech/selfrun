import { redirect } from "next/navigation";
import { PageHeader, SectionCard } from "@/components/products/agentos/AibotsUi";
import DoNotCallManager from "@/components/products/agentos/calls/DoNotCallManager";
import PhoneNav from "@/components/products/agentos/calls/PhoneNav";
import { listDoNotCall } from "@/lib/products/agentos/calls/dnc";
import { companyTimeZone } from "@/lib/products/agentos/calls/guards";
import { listAibotsStaff } from "@/lib/products/agentos/bots";
import { can, getViewer } from "@/lib/products/agentos/viewer";

export const dynamic = "force-dynamic";

export default async function DoNotCallPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/agentos/login");
  if (!can(viewer, "VOICE_CALL_MANAGE")) redirect("/agentos");
  const [entries, timeZone, staff] = await Promise.all([listDoNotCall(viewer), companyTimeZone(), listAibotsStaff().catch(() => [])]);
  return (
    <div className="space-y-4">
      <PageHeader title="Do not call" crumbs={[{ label: "Phone", href: "/agentos/phone" }, { label: "Do not call" }]} description="Numbers that must never be called. The check runs on every call, including scheduled ones." />
      <PhoneNav />
      <SectionCard title="Do-not-call list" description={`${entries.length} number${entries.length === 1 ? "" : "s"}. Only the last four digits stay visible.`}>
        <DoNotCallManager entries={entries} timeZone={timeZone} whoAdded={Object.fromEntries(staff.map((s) => [s.value, s.label]))} />
      </SectionCard>
    </div>
  );
}
