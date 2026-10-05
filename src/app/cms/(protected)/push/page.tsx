import { redirect } from "next/navigation";
import { BellRing } from "lucide-react";
import { getViewer, can } from "@/lib/cms/viewer";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";
import WebPushManager from "@/components/cms/WebPushManager";
import { getWebPushSettings, listBroadcasts, subscriberStats } from "@/lib/webpush/store";
import { pushConfigured } from "@/lib/push/vapid";

export const dynamic = "force-dynamic";
/** Sending to many subscribers can take a while. */
export const maxDuration = 60;

export default async function WebPushPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");
  if (!can(viewer, "SETTINGS_MANAGE")) redirect("/cms");

  const [settings, stats, broadcasts] = await Promise.all([getWebPushSettings(), subscriberStats(), listBroadcasts(25)]);

  return (
    <div className="space-y-4">
      <CmsPageHeader
        breadcrumbs={[{ label: "Push notifications" }]}
        icon={BellRing}
        title="Website push notifications"
        description={<>Notify your website visitors about offers, credits and rewards, and news, even when they aren&apos;t on your site.</>}
      />
      <WebPushManager
        serverReady={pushConfigured()}
        initialSettings={settings}
        stats={stats}
        broadcasts={broadcasts.map((b) => ({ id: b._id, topic: b.topic, title: b.title, body: b.body, url: b.url, trigger: b.trigger, status: b.status, note: b.note, targeted: b.targeted, sent: b.sent, failed: b.failed, clicks: b.clicks, createdAt: b.createdAt.toISOString() }))}
      />
    </div>
  );
}
