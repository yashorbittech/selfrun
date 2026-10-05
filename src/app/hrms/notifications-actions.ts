"use server";

import { revalidatePath } from "next/cache";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { markRead, markAllRead } from "@/lib/hrms/notifications";

export async function markNotificationsReadAction(ids: string[]): Promise<{ ok: boolean }> {
  const user = await getCurrentHrmsUser();
  if (!user) return { ok: false };
  await markRead(ids, user.id);
  revalidatePath("/hrms", "layout");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{ ok: boolean }> {
  const user = await getCurrentHrmsUser();
  if (!user) return { ok: false };
  await markAllRead(user);
  revalidatePath("/hrms", "layout");
  return { ok: true };
}
