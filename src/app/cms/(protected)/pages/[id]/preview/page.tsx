import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Eye, ExternalLink, Pencil } from "lucide-react";
import { getViewer } from "@/lib/cms/viewer";
import { getPage } from "@/lib/cms/pages";
import CmsPageHeader from "@/components/cms/ui/CmsPageHeader";
import { ContentStatusBadge, PendingChangesBadge } from "@/components/cms/ui/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import DevicePreview from "./DevicePreview";
import { displayTitle } from "@/lib/cms/site-areas";

export default async function CmsPagePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getViewer())) redirect("/cms/login");
  const { id } = await params;
  const page = await getPage(id);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
      <CmsPageHeader
        breadcrumbs={[{ label: "Pages", href: "/cms/pages" }, { label: displayTitle(page.title, page.path), href: `/cms/pages/${page._id}` }, { label: "Preview" }]}
        icon={Eye}
        title={`Preview: ${displayTitle(page.title, page.path)}`}
        description={<>The <strong>draft</strong> of <span className="font-mono">{page.path}</span>, rendered with the live theme, header and footer. Visitors don&apos;t see it until you publish.</>}
        badges={
          <>
            <ContentStatusBadge status={page.status} version={page.version} />
            {page.hasUnpublishedChanges && page.live && <PendingChangesBadge />}
          </>
        }
        actions={
          <>
            <Link href={`/cms/pages/${page._id}`} className={buttonVariants({ variant: "default", size: "sm" })}><Pencil className="size-3.5" /> Back to editor</Link>
            <a href={`/cms/preview/${page._id}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}><ExternalLink className="size-3.5" /> Open in new tab</a>
            {page.live && <a href={page.path} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}><ExternalLink className="size-3.5" /> Live page</a>}
          </>
        }
      />
      <DevicePreview src={`/cms/preview/${page._id}`} />
    </div>
  );
}
