import { cookies, draftMode } from "next/headers";
import { THEME_PREVIEW_COOKIE } from "@/lib/cms/theme-preview";

/** Ends a theme live preview: this browser goes back to the cached site with the active theme. */
export async function POST() {
  (await draftMode()).disable();
  (await cookies()).delete(THEME_PREVIEW_COOKIE);
  return new Response(null, { status: 204 });
}
