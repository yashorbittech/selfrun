import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { listActiveSessions, listLoginHistory } from "@/lib/security/sessions";

export const dynamic = "force-dynamic";

/** The signed-in person's own devices and sign-in history, for the account drawer in every panel's sidebar. */
export async function GET() {
  const user = await getCurrentHubUser();
  if (!user || !ObjectId.isValid(user.id)) return NextResponse.json({ error: "Sign in to see your sessions." }, { status: 401 });
  const [sessions, history] = await Promise.all([listActiveSessions(new ObjectId(user.id)), listLoginHistory(new ObjectId(user.id), user.email)]);
  return NextResponse.json({ sessions, history }, { headers: { "Cache-Control": "no-store" } });
}
