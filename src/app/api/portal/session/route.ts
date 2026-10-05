import { NextResponse } from "next/server";
import { getCurrentPortalUser } from "@/lib/portal-auth";

/** Lightweight "is a portal user signed in?" for the public header. Returns only a first name — nothing sensitive. */
export async function GET() {
  const user = await getCurrentPortalUser();
  return NextResponse.json(
    { signedIn: Boolean(user), firstName: user ? user.displayName.split(" ")[0] : null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
