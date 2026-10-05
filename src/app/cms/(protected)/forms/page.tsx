import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import { redirect } from "next/navigation";
import { getViewer, can } from "@/lib/cms/viewer";
import { getFormDoc, CONTACT_FORM_FIELD_NAMES } from "@/lib/cms/forms";
import ContactFormEditor from "@/components/cms/ContactFormEditor";
import { ClipboardList } from "lucide-react";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";

export default async function CmsFormsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/cms/login");

  const fields = await getFormDoc("contact", CONTACT_FORM_FIELD_NAMES);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "Forms" }]}
        icon={ClipboardList}
        title="Forms"
        description={<>The contact form&apos;s field labels, placeholders and help text. Submissions still go through the existing leads pipeline — this only controls how the fields are presented.</>}
      />
      <PanelListFilters>
<ContactFormEditor initialFields={fields} canEdit={can(viewer, "FORMS_MANAGE")} />
</PanelListFilters>
    </div>
  );
}
