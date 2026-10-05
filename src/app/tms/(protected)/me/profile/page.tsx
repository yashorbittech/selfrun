import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import MyProfileForm from "@/components/tms/MyProfileForm";
import { getCurrentTmsUser } from "@/lib/tms-auth";
import { getStudent, serializeStudent } from "@/lib/tms/students";

export default async function MyProfilePage() {
  const user = await getCurrentTmsUser();
  if (!user?.studentId) redirect("/tms");
  const student = await getStudent(user.studentId);
  if (!student) redirect("/tms");

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "TMS", href: "/tms/me" }, { label: "Profile" }]}
        title={<>My Profile</>}
        description={<>Keep your contact details and links up to date. <span className="font-mono">{student.studentCode}</span></>}
      />
      <MyProfileForm student={serializeStudent(student)} />
    </div>
  );
}
