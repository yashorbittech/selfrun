import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import AnnouncementComposer from "@/components/messenger/AnnouncementComposer";
import { getCurrentChatUser } from "@/lib/messenger-auth";
import { canPostAnnouncements } from "@/lib/messenger-roles";
import { getAudienceOptions } from "@/lib/messenger/announcement-audience";

export const dynamic = "force-dynamic";

export default async function NewAnnouncementPage() {
  const user = await getCurrentChatUser();
  if (!user) return null;
  if (!canPostAnnouncements(user)) redirect("/messenger/announcements");

  const opts = await getAudienceOptions(user.id);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="space-y-4">
<PanelPageHeader
          breadcrumbs={[
            { label: "Messenger", href: "/messenger" },
            { label: "Announcements", href: "/messenger/announcements" },
            { label: "New" },
          ]}
          title={<>New announcement</>}
          description={<>Compose an announcement, choose who sees it and when it goes out.</>}
        />
<div className="space-y-4">
        <AnnouncementComposer {...opts} />
      </div>
</div>
    </div>
  );
}
