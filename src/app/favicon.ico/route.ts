import { renderCompanyIcon } from "@/lib/platform/branding/icon";

/** Browsers still ask for /favicon.ico directly: answer with the current company's icon (its logo, or its initials in the theme colour). */
export async function GET() {
  const res = await renderCompanyIcon(48);
  res.headers.set("cache-control", "public, max-age=300");
  return res;
}
