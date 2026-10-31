import { NextRequest, NextResponse } from "next/server";
import { getMeeting, updateMeetingStatus, deleteMeeting } from "@/lib/dealflow-ai/db-meetings";

export async function GET(_: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const meeting = await getMeeting(roomId);
    if (!meeting) return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    return NextResponse.json({ ok: true, meeting });
  } catch (err) {
    console.error("[meetings/[roomId]] GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load meeting" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { status, recordingUrl, transcript, summary } = body;
    if (!status) return NextResponse.json({ ok: false, error: "status is required" }, { status: 400 });
    const updated = await updateMeetingStatus(roomId, status, { recordingUrl, transcript, summary });
    if (!updated) return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[meetings/[roomId]] PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update meeting" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const deleted = await deleteMeeting(roomId);
    if (!deleted) return NextResponse.json({ ok: false, error: "Meeting not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[meetings/[roomId]] DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete meeting" }, { status: 500 });
  }
}
