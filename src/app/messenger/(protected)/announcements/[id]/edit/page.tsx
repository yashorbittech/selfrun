import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound, redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import AnnouncementComposer from "@/components/messenger/AnnouncementComposer";
import { getCurrentChatUser } from "@/lib/messenger-auth";
import { canPostAnnouncements } from "@/lib/messenger-roles";
import { getAnnouncement } from "@/lib/messenger/announcements";
import { getAudienceOptions } from "@/lib/messenger/announcement-audience";

export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentChatUser();
  if (!user) return null;
  if (!canPostAnnouncements(user)) redirect("/messenger/announcements");

  const a = await getAnnouncement(id);
  if (!a || a.authorId !== user.id) notFound();
  if (a.status === "published") redirect(`/messenger/announcements/${id}`);

  const opts = await getAudienceOptions(user.id);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="space-y-4">
<PanelPageHeader
          breadcrumbs={[
            { label: "Messenger", href: "/messenger" },
            { label: "Announcements", href: "/messenger/announcements" },
            { label: "Edit" },
          ]}
          title={<>Edit announcement</>}
          description={<>Update this draft before it is published.</>}
        />
<div className="space-y-4">
        <AnnouncementComposer
          {...opts}
          existing={{
            _id: a._id,
            title: a.title,
            body: a.body,
            priority: a.priority,
            attachments: a.attachments,
            audience: a.audience,
            scheduledFor: a.scheduledFor ? a.scheduledFor.toISOString() : null,
            requireConfirmation: a.requireConfirmation,
            crossPost: a.crossPost,
          }}
        />
      </div>
</div>
    </div>
  );
}
