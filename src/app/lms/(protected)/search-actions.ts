"use server";

import { getCurrentLmsUser } from "@/lib/lms-auth";
import { globalLmsSearch, type GlobalSearchResult } from "@/lib/lms-search";

export async function globalLmsSearchAction(query: string): Promise<GlobalSearchResult> {
  const lmsUser = await getCurrentLmsUser();
  if (!lmsUser) throw new Error("Unauthorized");
  return globalLmsSearch(query);
}
