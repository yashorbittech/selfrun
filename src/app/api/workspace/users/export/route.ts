import { NextRequest, NextResponse } from "next/server";
import { authorizeWorkspaceApi } from "@/lib/workspace/access";
import { exportAdminUsers } from "@/lib/workspace/admin-users";
import { moduleLabelsForRoles } from "@/lib/workspace/role-catalog";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const auth = await authorizeWorkspaceApi("company.users");
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const idsParam = sp.get("ids");
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : undefined;

  const rows = await exportAdminUsers({
    search: sp.get("search") ?? undefined,
    role: sp.get("role") ?? undefined,
    ids,
  });

  const csv = toCsv(rows, [
    { header: "Email", value: (r) => r.email },
    { header: "Roles", value: (r) => r.roles.join("; ") },
    { header: "Modules", value: (r) => moduleLabelsForRoles(r.roles).join("; ") },
    { header: "Status", value: (r) => (r.roles.length === 0 ? "Deactivated" : "Active") },
    { header: "Must Change Password", value: (r) => (r.mustChangePassword ? "Yes" : "No") },
    { header: "Locked", value: (r) => (r.locked ? "Yes" : "No") },
    { header: "Created", value: (r) => r.createdAt.slice(0, 10) },
    { header: "Last Login", value: (r) => (r.lastLoginAt ? r.lastLoginAt.slice(0, 10) : "") },
  ]);

  const filename = `admin-users-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
