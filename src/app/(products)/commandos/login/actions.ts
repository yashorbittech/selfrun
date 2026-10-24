"use server";

import { redirect } from "next/navigation";
import {
  verifyHubCredentials,
  createHubSession,
  setHubSessionCookie,
  getSessionHubUser,
} from "@/lib/hub-auth";
import { safeNextPath } from "@/lib/workspace-session";
import { provisionAccessibleSessions } from "@/lib/cross-module-sso";
import { endOtherDevices, otherDevices, startLoginSession } from "@/lib/security/sessions";
import { consumeTakeoverTicket, createTakeoverTicket, oneDeviceLimitApplies } from "@/lib/security/device-limit";
import type { ObjectId } from "mongodb";
import { loginLanding } from "@/lib/platform/onboarding/state";

export interface HubLoginState {
  error?: string;
  /** The password was right and the account has two-step sign-in: the form now asks for the code. */
  needsCode?: boolean;
  /** The plan allows one device at a time and the account is signed in elsewhere: the page asks before signing that device out. */
  conflict?: { ticket: string; devices: { label: string; detail: string; place: string; lastActiveAt: string }[] };
}

export async function hubLoginAction(_prevState: HubLoginState, formData: FormData): Promise<HubLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const result = await verifyHubCredentials(email, password, String(formData.get("code") ?? ""));
  if (!result.ok) {
    return { error: result.error, needsCode: result.needsCode };
  }

  // Free plan: one device at a time. If the account is already signed in somewhere else, nothing is signed in yet: the person is asked first.
  if (await oneDeviceLimitApplies()) {
    const others = await otherDevices(result.adminId);
    if (others.length) {
      const ticket = await createTakeoverTicket(result.adminId, email);
      return { conflict: { ticket, devices: others.map((d) => ({ label: d.deviceLabel, detail: [d.browser, d.os].filter((x) => x && x !== "Unknown").join(" on ") || d.deviceLabel, place: d.place, lastActiveAt: d.lastActiveAt })) } };
    }
  }
  return finishHubLogin(result.adminId, email, formData.get("next"));
}

/** The person confirmed: the other device is signed out and this one signs in. The pass from the first step replaces the password check. */
export async function hubTakeoverAction(ticket: string, next: string | null): Promise<HubLoginState> {
  const t = await consumeTakeoverTicket(String(ticket ?? ""));
  if (!t) return { error: "This confirmation has expired. Please sign in again." };
  return finishHubLogin(t.adminId, t.email, next);
}

async function finishHubLogin(adminId: ObjectId, email: string, next: FormDataEntryValue | string | null): Promise<HubLoginState> {
  const limited = await oneDeviceLimitApplies();
  const startedAt = new Date();
  const token = await createHubSession(adminId);
  await setHubSessionCookie(token);

  // Mint a real session in every other product this account's roles actually
  // grant access to, so no separate login is needed to open them.
  await provisionAccessibleSessions(adminId, "hub");
  const loginId = await startLoginSession(adminId, { startedAt, email, via: "password" });
  if (limited) await endOtherDevices(adminId, loginId);

  const user = await getSessionHubUser(token);
  if (user?.mustChangePassword) redirect("/commandos/change-password");
  // Back to the product the person came from — validated again here, the form field is user input.
  // An explicit, validated `next` wins; otherwise an owner with open setup lands on the onboarding wizard.
  redirect(await loginLanding(user?.roles ?? [], safeNextPath(next), user?.id));
}
