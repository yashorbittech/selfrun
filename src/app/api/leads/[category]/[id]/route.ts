import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedLmsRequest } from "@/lib/api-auth";
import {
  CATEGORIES,
  deleteLead,
  getLead,
  isValidCategory,
  updateLead,
  validateLeadUpdate,
} from "@/lib/leads";

type Context = { params: Promise<{ category: string; id: string }> };

const invalidCategoryResponse = () =>
  NextResponse.json(
    { error: `Invalid category. Must be one of: ${CATEGORIES.map((c) => c.slug).join(", ")}` },
    { status: 400 }
  );

export async function GET(req: NextRequest, { params }: Context) {
  if (!(await isAuthorizedLmsRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, id } = await params;
  if (!isValidCategory(category)) return invalidCategoryResponse();

  const lead = await getLead(category, id);
  if (!lead) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  return NextResponse.json({ data: lead });
}

export async function PATCH(req: NextRequest, { params }: Context) {
  if (!(await isAuthorizedLmsRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, id } = await params;
  if (!isValidCategory(category)) return invalidCategoryResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const validation = validateLeadUpdate(body as Record<string, unknown>);
  if (!validation.valid) {
    return NextResponse.json({ error: "Validation failed.", fields: validation.errors }, { status: 422 });
  }

  if (Object.keys(validation.data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided to update." }, { status: 400 });
  }

  const updated = await updateLead(category, id, validation.data);
  if (!updated) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: Context) {
  if (!(await isAuthorizedLmsRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, id } = await params;
  if (!isValidCategory(category)) return invalidCategoryResponse();

  const deleted = await deleteLead(category, id);
  if (!deleted) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  return NextResponse.json({ data: { deleted: true } });
}
