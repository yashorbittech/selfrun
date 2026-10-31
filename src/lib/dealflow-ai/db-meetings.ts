import "server-only";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type MeetingStatus = "scheduled" | "live" | "ended" | "cancelled";

export interface MeetingRoom {
  _id?: string;
  roomId: string;          // LiveKit room name — unique slug
  title: string;           // e.g. "Discovery Call — Rahul from TechCorp"
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  scheduledAt: string;     // ISO datetime
  durationMinutes: number;
  status: MeetingStatus;
  agentIds: string[];      // Selected VoiceAgent _id's
  agentNames: string[];    // Cached names for display
  salesPersonName?: string;
  notes?: string;          // Pre-meeting notes / agenda
  clientJoinLink: string;  // Public link shared with client (no auth)
  recordingUrl?: string;
  transcript?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export async function createMeeting(
  data: Omit<MeetingRoom, "_id" | "createdAt" | "updatedAt">
): Promise<MeetingRoom> {
  const db = await getDb();
  const now = new Date();
  const doc = { ...data, createdAt: now, updatedAt: now };
  const result = await db.collection("meeting_rooms").insertOne(doc);
  return {
    ...doc,
    _id: result.insertedId.toString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function listMeetings(filter?: { status?: MeetingStatus }): Promise<MeetingRoom[]> {
  const db = await getDb();
  const query = filter?.status ? { status: filter.status } : {};
  const docs = await db
    .collection("meeting_rooms")
    .find(query)
    .sort({ scheduledAt: -1 })
    .limit(200)
    .toArray();
  return docs.map(serializeMeeting);
}

export async function getMeeting(roomId: string): Promise<MeetingRoom | null> {
  const db = await getDb();
  // Try by roomId slug first, then by _id
  let doc = await db.collection("meeting_rooms").findOne({ roomId });
  if (!doc) {
    try {
      doc = await db.collection("meeting_rooms").findOne({ _id: new ObjectId(roomId) });
    } catch { /* not an ObjectId */ }
  }
  return doc ? serializeMeeting(doc) : null;
}

export async function updateMeetingStatus(
  roomId: string,
  status: MeetingStatus,
  extra?: Partial<Pick<MeetingRoom, "recordingUrl" | "transcript" | "summary">>
): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("meeting_rooms").updateOne(
    { roomId },
    { $set: { status, ...extra, updatedAt: new Date() } }
  );
  return result.matchedCount > 0;
}

export async function deleteMeeting(roomId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("meeting_rooms").deleteOne({ roomId });
  return result.deletedCount > 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeMeeting(doc: any): MeetingRoom {
  return {
    ...doc,
    _id: doc._id?.toString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt ?? ""),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt ?? ""),
    scheduledAt: doc.scheduledAt instanceof Date ? doc.scheduledAt.toISOString() : String(doc.scheduledAt ?? ""),
  };
}
