import "server-only";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export interface VoiceAgent {
  _id?: string;
  name: string;           // Name people call in meeting (e.g. "Sarah")
  role: string;           // "Sales Expert", "Technical Lead", "HR Specialist"
  personality: string;    // Detailed instructions for how this agent behaves
  knowledgeBase: string;  // What this agent knows — products, pricing, FAQs, policies
  voiceId: string;        // ElevenLabs voice ID
  voiceName: string;      // Human-readable voice name (e.g. "Rachel")
  voiceGender: "male" | "female";
  avatarColor: string;    // Tailwind color class for avatar
  avatarInitials: string; // 2-letter initials from name
  isActive: boolean;
  meetingCount: number;   // How many meetings this agent has participated in
  createdAt: string;
  updatedAt: string;
}

export async function createVoiceAgent(
  data: Omit<VoiceAgent, "_id" | "meetingCount" | "createdAt" | "updatedAt">
): Promise<VoiceAgent> {
  const db = await getDb();
  const now = new Date();
  const doc = {
    ...data,
    meetingCount: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection("voice_agents").insertOne(doc);
  return { ...doc, _id: result.insertedId.toString(), createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

const INITIAL_AGENTS = [
  {
    name: "Sarah",
    role: "Senior Sales Specialist",
    personality: "I am a senior sales consultant with 8 years of experience in B2B enterprise software and AI solutions. I speak with warmth, confidence, and professionalism. I understand client pain points deeply and articulate clear ROI and business value. I handle commercial questions and partnership opportunities with great poise.",
    knowledgeBase: "Our Company provides AI Automation, Web & Mobile App Development, Cloud Architecture, and dedicated engineering teams. Typical project delivery is 4-8 weeks with agile weekly sprints. Pricing models include Fixed Scope ($5k-$50k) and Dedicated Team ($3k-$7k/month per engineer). We offer 99.9% SLA, IP ownership transfer, and NDA confidentiality from Day 1.",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    voiceName: "Rachel",
    voiceGender: "female" as const,
    avatarColor: "bg-violet-600",
    avatarInitials: "SJ",
    isActive: true,
    meetingCount: 0,
  },
  {
    name: "Rahul",
    role: "Chief Technical Architect",
    personality: "I am an enterprise technical architect with deep hands-on expertise in full-stack engineering, microservices, Next.js, Node.js, Python, AWS/GCP cloud systems, and LLM integrations. I explain complex technical decisions with clarity and precision. I am methodical, calm, and reassuring.",
    knowledgeBase: "Our technology stack includes React/Next.js, TypeScript, Python/FastAPI, Node.js, PostgreSQL, MongoDB, Docker, Kubernetes, and LLM orchestration (OpenAI, Anthropic, LangChain). We follow CI/CD best practices, automated testing with >85% code coverage, SOC-2 compliance standards, and end-to-end data encryption at rest and in transit.",
    voiceId: "ErXwobaYiN019PkySvjV",
    voiceName: "Antoni",
    voiceGender: "male" as const,
    avatarColor: "bg-blue-600",
    avatarInitials: "RV",
    isActive: true,
    meetingCount: 0,
  },
  {
    name: "Priya",
    role: "Client Solutions & Delivery Lead",
    personality: "I am the head of client delivery and onboarding. I ensure every client project is executed on time and meets high quality standards. I am detail-oriented, empathetic, and organized. I reassure clients on timelines, sprint reviews, and transparent communication channels.",
    knowledgeBase: "Client onboarding starts within 48 hours of agreement. We assign a dedicated Project Manager and Slack/WhatsApp channel with real-time updates. Weekly sprint demos are scheduled every Friday. We provide 30 days of free post-launch support and maintenance on all deliverables.",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    voiceName: "Bella",
    voiceGender: "female" as const,
    avatarColor: "bg-emerald-600",
    avatarInitials: "PS",
    isActive: true,
    meetingCount: 0,
  },
];

export async function listVoiceAgents(): Promise<VoiceAgent[]> {
  const db = await getDb();
  let docs = await db.collection("voice_agents").find({}).sort({ createdAt: -1 }).toArray();

  if (docs.length === 0) {
    const now = new Date();
    const seedDocs = INITIAL_AGENTS.map((a) => ({
      ...a,
      createdAt: now,
      updatedAt: now,
    }));
    await db.collection("voice_agents").insertMany(seedDocs);
    docs = await db.collection("voice_agents").find({}).sort({ createdAt: -1 }).toArray();
  }

  return docs.map((d) => ({
    ...d,
    _id: d._id.toString(),
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
    updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : String(d.updatedAt),
  })) as VoiceAgent[];
}

export async function getVoiceAgent(agentId: string): Promise<VoiceAgent | null> {
  const db = await getDb();
  let doc;
  try {
    doc = await db.collection("voice_agents").findOne({ _id: new ObjectId(agentId) });
  } catch {
    doc = await db.collection("voice_agents").findOne({ _id: agentId as unknown as ObjectId });
  }
  if (!doc) return null;
  return {
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
  } as VoiceAgent;
}

export async function updateVoiceAgent(
  agentId: string,
  data: Partial<Omit<VoiceAgent, "_id" | "createdAt">>
): Promise<boolean> {
  const db = await getDb();
  const now = new Date();
  let result;
  try {
    result = await db.collection("voice_agents").updateOne(
      { _id: new ObjectId(agentId) },
      { $set: { ...data, updatedAt: now } }
    );
  } catch {
    result = await db.collection("voice_agents").updateOne(
      { _id: agentId as unknown as ObjectId },
      { $set: { ...data, updatedAt: now } }
    );
  }
  return result.matchedCount > 0;
}

export async function deleteVoiceAgent(agentId: string): Promise<boolean> {
  const db = await getDb();
  let result;
  try {
    result = await db.collection("voice_agents").deleteOne({ _id: new ObjectId(agentId) });
  } catch {
    result = await db.collection("voice_agents").deleteOne({ _id: agentId as unknown as ObjectId });
  }
  return result.deletedCount > 0;
}

// Increment meetingCount when agent joins a meeting
export async function incrementAgentMeetingCount(agentId: string): Promise<void> {
  const db = await getDb();
  try {
    await db.collection("voice_agents").updateOne(
      { _id: new ObjectId(agentId) },
      { $inc: { meetingCount: 1 }, $set: { updatedAt: new Date() } }
    );
  } catch { /* ignore */ }
}
