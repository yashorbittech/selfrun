import { redirect } from "next/navigation";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { workspaceLoginUrl } from "@/lib/workspace-session";

/**
 * There is one company sign-in: the Workspace. This address stays so old
 * links, bookmarks and the panel's own "signed out" redirects keep working.
 */
export default async function HrmsLoginPage() {
  const user = await getCurrentHrmsUser();
  if (user) redirect("/hrms");
  // Signed in, but this panel isn't among the account's roles: back to the Workspace rather than a sign-in loop.
  if (await getCurrentHubUser()) redirect("/workspace");
  redirect(workspaceLoginUrl("/hrms"));
}
