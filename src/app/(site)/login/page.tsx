import { redirect } from "next/navigation";
import { getCurrentPortalUser } from "@/lib/portal-auth";
import CmsPageView from "@/components/cms/CmsPageView";
import { cmsPageMetadata, requirePublicPage } from "@/lib/cms/page-route";

export const generateMetadata = () => cmsPageMetadata("/login");

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentPortalUser();
  if (user) redirect(user.mustChangePassword ? "/portal/change-password" : "/portal");
  return <CmsPageView page={await requirePublicPage("/login")} />;
}
