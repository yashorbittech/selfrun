import { NextResponse } from "next/server";
import { getOpenJobPositions } from "@/lib/career-applications";

export async function GET() {
  const positions = await getOpenJobPositions();
  return NextResponse.json({ data: positions });
}
