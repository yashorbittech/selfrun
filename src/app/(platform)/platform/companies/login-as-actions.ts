"use server";

import { requirePlatformPermission } from "@/lib/platform/console/access";
import { loginAsCompany, type LoginAsCompanyResult } from "@/lib/platform/console/impersonate";
import { requestOrigin } from "@/lib/platform/request";

/** Platform user → one-time sign-in link into a company's panels as its Super Admin. */
export async function loginAsCompanyAction(companyId: string): Promise<LoginAsCompanyResult> {
  const user = await requirePlatformPermission("companies.status");
  const { host } = await requestOrigin();
  return loginAsCompany(String(companyId ?? ""), user.id, host);
}
