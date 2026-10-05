import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import SopLibraryTable from "@/components/sop/SopLibraryTable";
import { getViewer } from "@/lib/sop/viewer";
import { parseLibraryQuery, queryLibrary } from "@/lib/sop/library";
import { creatableDepartmentIds } from "@/lib/sop/access";
import { sopCan } from "@/lib/sop-roles";

export default async function SopLibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sop/login");
  const query = parseLibraryQuery(await searchParams);
  const result = await queryLibrary(viewer, query);
  const canCreate = creatableDepartmentIds(viewer)?.length !== 0;

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "SOP", href: "/sop" }, { label: "SOP Library" }]}
        title={<>SOP Library</>}
        description={<>{result.total} SOP{result.total === 1 ? "" : "s"} you can access. Search covers title, SOP ID, department, function, process, category, tags, owner, author, version, dates and status.</>}
      />
      <SopLibraryTable
        result={result}
        query={query}
        canCreate={canCreate}
        canExport={sopCan({ roles: viewer.roles, permissionOverrides: viewer.overrides }, "EXPORT")}
        exportBase="/api/sop/export/library"
      />
    </div>
  );
}
