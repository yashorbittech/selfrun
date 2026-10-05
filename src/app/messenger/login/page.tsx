import { redirect } from "next/navigation";
import { getCurrentChatUser } from "@/lib/messenger-auth";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { workspaceLoginUrl } from "@/lib/workspace-session";

/**
 * There is one company sign-in: the Workspace. This address stays so old
 * links, bookmarks and the panel's own "signed out" redirects keep working.
 */
export default async function MessengerLoginPage() {
  const user = await getCurrentChatUser();
  if (user) redirect(user.mustChangePassword ? "/messenger/change-password" : "/messenger");
  // Signed in, but this panel isn't among the account's roles: back to the Workspace rather than a sign-in loop.
  if (await getCurrentHubUser()) redirect("/workspace");
  redirect(workspaceLoginUrl("/messenger"));
}
