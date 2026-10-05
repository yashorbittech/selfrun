import { redirect } from "next/navigation";

/** The console moved into the Platform Panel — old links keep working. */
export default async function ConsoleRedirect({ params }: { params: Promise<{ rest?: string[] }> }) {
  const rest = (await params).rest ?? [];
  if (rest.length === 0) redirect("/platform/companies");
  redirect(`/platform/${rest.map(encodeURIComponent).join("/")}`);
}
