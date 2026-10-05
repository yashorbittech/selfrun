import { NextResponse } from "next/server";
import { notifyGoogleIndexing, IndexingNotificationType } from "@/lib/google-indexing";
import { companySiteUrl } from "@/lib/platform/tenancy/site-url";

export async function POST(req: Request) {
  const secret = process.env.INDEXING_API_SECRET;
  
  if (secret) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const { slug, url, type = "URL_UPDATED" } = body as {
      slug?: string;
      url?: string;
      type?: IndexingNotificationType;
    };

    const targetUrl = url || (slug ? `${await companySiteUrl()}/careers/${slug}` : null);

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Missing required parameter: 'slug' or 'url'" },
        { status: 400 }
      );
    }

    const result = await notifyGoogleIndexing(targetUrl, type);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 }
    );
  }
}
