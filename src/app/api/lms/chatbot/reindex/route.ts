import { NextRequest, NextResponse } from "next/server";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import { isOpenAIConfigured } from "@/lib/openai";
import { beginWebsiteIndex, chatbotCrawlBaseOverride, runWebsiteIndex } from "@/lib/kb-website";
import { listKbRuns, reapStaleRuns } from "@/lib/kb-runs";
import { companySiteUrl } from "@/lib/platform/tenancy/site-url";
import { afterForCompany } from "@/lib/platform/tenancy/context";

async function authorize(req: NextRequest): Promise<string | null> {
  const secret = process.env.CHATBOT_ADMIN_API_SECRET;
  const authHeader = req.headers.get("authorization");
  if (secret && authHeader === `Bearer ${secret}`) return "api";
  const lmsUser = await getCurrentLmsUser();
  return lmsUser ? lmsUser.email : null;
}

/** Recent indexing runs (for polling progress). */
export async function GET(req: NextRequest) {
  if (!(await authorize(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await reapStaleRuns();
  return NextResponse.json({ runs: await listKbRuns(15) });
}

// Indexing can take several minutes; the crawl runs in `after()` so the
// response returns immediately with a run id the caller can poll.
// Capped at 300 (Vercel Hobby plan's max serverless function duration).
export const maxDuration = 300;

/**
 * Triggers a knowledge-base re-index of the website content. Authorised by
 * either an lmsUser session or the `CHATBOT_ADMIN_API_SECRET` bearer token
 * (mirrors src/app/api/indexing/route.ts) so it can be run from cron / CI.
 */
export async function POST(req: NextRequest) {
  const triggeredBy = await authorize(req);
  if (!triggeredBy) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isOpenAIConfigured())) {
    return NextResponse.json({ error: "OpenAI isn't connected. Add your key in Workspace → Settings → Integrations." }, { status: 503 });
  }

  let body: { incremental?: unknown; baseUrl?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // no body — default to a full re-index
  }

  const baseUrl =
    (typeof body.baseUrl === "string" && body.baseUrl) ||
    (await chatbotCrawlBaseOverride()) ||
    req.nextUrl.origin ||
    (await companySiteUrl());
  const incremental = body.incremental === true;

  const { runId, logger } = await beginWebsiteIndex({ triggeredBy, incremental });
  await afterForCompany(() => runWebsiteIndex(logger, { baseUrl, incremental, triggeredBy }));

  return NextResponse.json({ ok: true, runId });
}
