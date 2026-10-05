import { redirect } from "next/navigation";
import { getCurrentLpmsUser } from "@/lib/lpms-auth";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { workspaceLoginUrl } from "@/lib/workspace-session";

/**
 * There is one company sign-in: the Workspace. This address stays so old
 * links, bookmarks and the panel's own "signed out" redirects keep working.
 */
export default async function LpmsLoginPage() {
  const user = await getCurrentLpmsUser();
  if (user) redirect("/lpms");
  // Signed in, but this panel isn't among the account's roles: back to the Workspace.
  if (await getCurrentHubUser()) redirect("/workspace");
  redirect(workspaceLoginUrl("/lpms"));
}
