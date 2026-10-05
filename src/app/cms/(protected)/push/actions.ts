"use server";

import { revalidatePath } from "next/cache";
import { requireViewer, can } from "@/lib/cms/viewer";
import { recordAudit } from "@/lib/cms/audit";
import { saveWebPushSettings } from "@/lib/webpush/store";
import { sendBroadcast } from "@/lib/webpush/send";
import { isTopic, type WebPushSettings } from "@/lib/webpush/topics";

type Fail = { ok: false; error: string };

async function guard(): Promise<{ userId: string; email: string } | Fail> {
  const v = await requireViewer().catch(() => null);
  if (!v) return { ok: false, error: "Your session has expired — please sign in again." };
  if (!can(v, "SETTINGS_MANAGE")) return { ok: false, error: "You don't have permission to do that." };
  return { userId: v.userId, email: v.email };
}

export async function saveWebPushSettingsAction(input: WebPushSettings): Promise<{ ok: true; settings: WebPushSettings } | Fail> {
  const who = await guard();
  if ("ok" in who) return who;
  const settings = await saveWebPushSettings(input);
  await recordAudit({ actorId: who.userId, actorEmail: who.email, action: "settings", entity: "settings", entityId: "web-push", entityLabel: "Website push notifications" });
  revalidatePath("/cms/push");
  return { ok: true, settings };
}

export async function sendWebPushAction(input: { topic: string; title: string; body: string; url: string }): Promise<{ ok: true; sent: number; failed: number; targeted: number; partial: boolean } | Fail> {
  const who = await guard();
  if ("ok" in who) return who;
  if (!isTopic(input.topic)) return { ok: false, error: "Choose a topic." };
  const res = await sendBroadcast({ topic: input.topic, title: input.title, body: input.body, url: input.url, trigger: "manual", createdBy: who.userId });
  revalidatePath("/cms/push");
  if (!res.ok) return { ok: false, error: res.error };
  await recordAudit({ actorId: who.userId, actorEmail: who.email, action: "settings", entity: "settings", entityId: "web-push-send", entityLabel: `Sent: ${res.broadcast.title}` });
  return { ok: true, sent: res.broadcast.sent, failed: res.broadcast.failed, targeted: res.broadcast.targeted, partial: res.broadcast.status === "partial" };
}
