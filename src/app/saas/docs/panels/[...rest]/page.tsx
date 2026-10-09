import { redirect } from "next/navigation";

/** Old guide addresses (/docs/panels/…) now live at /docs/<panel>/<feature>. */
export default async function OldPanelDocs({ params }: { params: Promise<{ rest: string[] }> }) {
  const { rest } = await params;
  redirect(rest.length === 1 ? `/docs#${rest[0]}` : `/docs/${rest.join("/")}`);
}
