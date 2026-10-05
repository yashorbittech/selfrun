import { NextRequest, NextResponse } from "next/server";
import { limitOr429 } from "@/lib/security/rate-limit";
import { isAuthorizedLmsRequest } from "@/lib/api-auth";
import {
  CATEGORIES,
  createLead,
  getSubServices,
  isValidCategory,
  listLeads,
  uploadResume,
  validateLeadInput,
  validateResumeFile,
} from "@/lib/leads";
import { provisionLeadAndAccount } from "@/lib/lead-management/provision";
import { CATEGORY_TO_SOURCE } from "@/lib/lead-management/types";
import { createPortalSession, setPortalSessionCookie } from "@/lib/portal-auth";

type Context = { params: Promise<{ category: string }> };

export async function POST(req: NextRequest, { params }: Context) {
  const limited = await limitOr429(req, "lead-submit", 10, 600);
  if (limited) return limited;
  const { category } = await params;

  if (!isValidCategory(category)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${CATEGORIES.map((c) => c.slug).join(", ")}` },
      { status: 400 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Request body must be multipart form data." }, { status: 400 });
  }

  const validation = validateLeadInput({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
    subService: formData.get("subService"),
    source: formData.get("source"),
    utmSource: formData.get("utmSource"),
    utmMedium: formData.get("utmMedium"),
    utmCampaign: formData.get("utmCampaign"),
    utmContent: formData.get("utmContent"),
    utmTerm: formData.get("utmTerm"),
  });
  if (!validation.valid) {
    return NextResponse.json({ error: "Validation failed.", fields: validation.errors }, { status: 422 });
  }

  const validSubServices = getSubServices(category);
  if (!validation.data.subService || !validSubServices.some((s) => s.slug === validation.data.subService)) {
    return NextResponse.json(
      { error: "Validation failed.", fields: { subService: "Please choose a specific service." } },
      { status: 422 }
    );
  }

  const resumeEntry = formData.get("resume");
  let resume: Awaited<ReturnType<typeof uploadResume>> | undefined;
  if (resumeEntry instanceof File && resumeEntry.size > 0) {
    const resumeError = validateResumeFile(resumeEntry);
    if (resumeError) {
      return NextResponse.json({ error: "Validation failed.", fields: { resume: resumeError } }, { status: 422 });
    }
    try {
      resume = await uploadResume(resumeEntry);
    } catch (err) {
      console.error("Failed to upload resume", err);
      return NextResponse.json({ error: "Failed to upload resume. Please try again." }, { status: 500 });
    }
  }

  try {
    const lead = await createLead(category, { ...validation.data, resume });

    // Lead-driven portal: every inquiry becomes a Lead + a portal account the
    // visitor is immediately signed into. Needs an email to own the account.
    let portal: { redirect: string; isNewAccount: boolean; tempPassword: string | null } | undefined;
    if (validation.data.email) {
      try {
        const result = await provisionLeadAndAccount({
          source: CATEGORY_TO_SOURCE[category],
          name: validation.data.name,
          email: validation.data.email,
          phone: validation.data.phone,
          subService: validation.data.subService ?? null,
          message: validation.data.message ?? null,
          sourceRef: { kind: "category_lead", category, id: String(lead._id) },
          referralCode: typeof formData.get("referralCode") === "string" ? String(formData.get("referralCode")) : null,
        });
        // Only a brand-new account is signed in automatically. An email that already has an account is NOT proof of identity —
        // logging the submitter in would let anyone take over (and spend the wallet of) any user whose email they know.
        if (result.isNewAccount) {
          const { token } = await createPortalSession(result.externalUserId, false);
          await setPortalSessionCookie(token, false);
        }
        portal = { redirect: result.isNewAccount ? "/portal" : "/login", isNewAccount: result.isNewAccount, tempPassword: result.tempPassword };
      } catch (provErr) {
        console.error("Lead provisioning failed (submission still saved)", provErr);
      }
    }

    return NextResponse.json({ data: lead, portal }, { status: 201 });
  } catch (err) {
    console.error("Failed to create lead", err);
    return NextResponse.json({ error: "Failed to save submission. Please try again." }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: Context) {
  if (!(await isAuthorizedLmsRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category } = await params;

  if (!isValidCategory(category)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${CATEGORIES.map((c) => c.slug).join(", ")}` },
      { status: 400 }
    );
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = Number(searchParams.get("limit")) || undefined;
  const cursor = searchParams.get("cursor") ?? undefined;

  try {
    const { items, nextCursor } = await listLeads(category, { limit, cursor });
    return NextResponse.json({ data: items, nextCursor });
  } catch (err) {
    console.error("Failed to list leads", err);
    return NextResponse.json({ error: "Failed to fetch submissions." }, { status: 500 });
  }
}
