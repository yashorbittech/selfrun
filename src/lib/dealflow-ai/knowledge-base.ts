import { getDb } from "@/lib/mongodb";

export interface KnowledgeItem {
  id: string;
  category: "company" | "services" | "internships" | "training" | "jobs" | "pricing" | "faqs";
  title: string;
  summary: string;
  content: string;
  keywords: string[];
  updatedAt: string;
}

export const DEFAULT_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: "kb-company",
    category: "company",
    title: "About SelfRun & DealFlow AI",
    summary: "Leading technology agency and enterprise software suite.",
    content: `SelfRun is a technology solutions provider and SaaS platform offering enterprise software, AI automations, and custom engineering. DealFlow AI is our unified acquisition and communication hub for clients, applicants, interns, and trainees. We provide 99.9% uptime SLA, dedicated technical support, and strict multi-tenant data isolation.`,
    keywords: ["company", "about", "selfrun", "dealflow", "sla", "overview"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-services",
    category: "services",
    title: "Enterprise Services & Tech Stacks",
    summary: "Full-stack web, mobile, AI workflow automations, and resource augmentation.",
    content: `We build high-performance web applications using Next.js 15, React 19, TypeScript, Node.js, and Python FastAPI. Our mobile expertise covers React Native and Flutter. We integrate AI solutions using LangChain, OpenAI GPT-4o, custom RAG pipelines, Vector databases (Pinecone, pgvector), and automated WhatsApp / CRM webhook workflows. For client inquiries from Meta Ads, Facebook, Instagram, or Upwork, we offer rapid 2-week MVP sprints or dedicated team augmentations.`,
    keywords: ["services", "nextjs", "react", "python", "ai", "whatsapp", "meta", "facebook", "instagram", "upwork", "mvp"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-pricing",
    category: "pricing",
    title: "Client Pricing & Engagement Models",
    summary: "Fixed scope, hourly engagement, and dedicated monthly engineers.",
    content: `For client leads arriving from Upwork or Meta Ads:
1. Fixed-Price Projects: Typically ₹2,50,000 to ₹15,00,000 ($3,500 - $20,000 USD) with milestone-based escrow payments.
2. Hourly Engagements: $45 - $80 / hour depending on seniority (Senior Next.js, Python AI, or Mobile Engineer).
3. Dedicated Monthly Developer: ₹1,20,000 to ₹2,50,000 / month ($2,000 - $3,500 USD / month) including full-time 160 hours, daily Loom video updates, dedicated Slack channel, and GitHub PR reviews.`,
    keywords: ["pricing", "budget", "rates", "fixed", "hourly", "retainer", "quote", "cost"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-jobs",
    category: "jobs",
    title: "Career Openings & Hiring Guidelines",
    summary: "Hiring criteria, technical interview process, and compensation for applicants.",
    content: `For Job Applicants:
- Open Positions: Senior Full Stack Engineer (Next.js/Node.js), AI Solutions Engineer (Python/RAG), Senior Product Designer (UI/UX), and Lead QA Automation Engineer.
- Experience Requirements: 3 to 7+ years of verifiable production experience.
- Hiring Process: 
  1. Initial Resume & Portfolio Screening (within 24 hours).
  2. Round 1 Technical Screening (45 min live system design or coding exercise).
  3. Round 2 Cultural & Architecture Alignment with Engineering Director.
  4. Offer Release within 48 hours of final round.
- Remote Policy: 100% remote flexibility with annual offsites. Compensation ranges from ₹12,00,000 to ₹28,00,000 LPA based on role and impact.`,
    keywords: ["jobs", "careers", "hiring", "interview", "salary", "remote", "fullstack", "designer", "qa"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-internships",
    category: "internships",
    title: "Internship Program Guidelines",
    summary: "Curriculum, live projects, stipends, and PPO conversion for interns.",
    content: `For Intern Candidates:
- Tracks: Frontend Web Development (React/Next.js), Backend & Cloud (Node.js/MongoDB), and AI/Data Science.
- Duration: 3 months to 6 months full-time or part-time.
- Stipend: ₹15,000 - ₹25,000 per month based on technical assessment.
- Highlights: Work directly on production codebases under senior mentor supervision, code reviews, and strong Pre-Placement Offer (PPO) conversion rate (75%+).`,
    keywords: ["intern", "internship", "stipend", "students", "mentorship", "ppo", "college"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-training",
    category: "training",
    title: "Industrial Training Program (6 Weeks / 6 Months)",
    summary: "Certified hands-on technical training with live project deployment.",
    content: `For Trainee Candidates:
- Programs: 6-Weeks Summer Training and 6-Months Industrial Training for B.Tech / BCA / MCA / M.Tech students.
- Technologies Covered: MERN Stack, Python AI & Machine Learning, Cloud DevOps & Docker, Mobile App Development.
- Deliverables: Verified ISO Training Certificate, Project Completion Letter, GitHub Portfolio Project, and placement assistance with mock interview drills.`,
    keywords: ["trainee", "training", "industrial training", "summer training", "certificate", "project"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-faqs",
    category: "faqs",
    title: "Frequently Asked Questions & Common Queries",
    summary: "Answers to common client inquiries, timeline questions, and onboarding details.",
    content: `Q: How quickly can a project start?
A: Once scope and milestones are agreed, kickoff begins within 48 to 72 hours.
Q: Do you sign NDAs?
A: Yes, mutual non-disclosure agreements (NDAs) and IP assignment contracts are signed before technical discussions.
Q: Where are servers and data hosted?
A: By default in AWS Mumbai (ap-south-1) with optional EU/US multi-region deployment, fully SOC2 and GDPR compliant.`,
    keywords: ["faq", "questions", "nda", "security", "timeline", "hosting", "gdpr"],
    updatedAt: new Date().toISOString(),
  },
];

export async function getKnowledgeBase(): Promise<KnowledgeItem[]> {
  try {
    const db = await getDb();
    const col = db.collection<KnowledgeItem>("dealflow_knowledge_base");
    const count = await col.countDocuments();
    if (count === 0) {
      await col.insertMany(DEFAULT_KNOWLEDGE_BASE);
      return DEFAULT_KNOWLEDGE_BASE;
    }
    const items = await col.find({}).toArray();
    return items.map((i) => ({ ...i, id: String(i._id || i.id) }));
  } catch {
    return DEFAULT_KNOWLEDGE_BASE;
  }
}

export async function addOrUpdateKnowledgeItem(item: Omit<KnowledgeItem, "updatedAt">): Promise<KnowledgeItem> {
  const fullItem: KnowledgeItem = {
    ...item,
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await getDb();
    const col = db.collection<KnowledgeItem>("dealflow_knowledge_base");
    await col.updateOne({ id: item.id }, { $set: fullItem }, { upsert: true });
  } catch {
    // In-memory update if DB is unreachable
    const idx = DEFAULT_KNOWLEDGE_BASE.findIndex((k) => k.id === item.id);
    if (idx >= 0) DEFAULT_KNOWLEDGE_BASE[idx] = fullItem;
    else DEFAULT_KNOWLEDGE_BASE.push(fullItem);
  }
  return fullItem;
}

export async function searchKnowledgeBase(query: string, category?: string): Promise<string> {
  const all = await getKnowledgeBase();
  const q = query.toLowerCase();

  const matched = all.filter((k) => {
    if (category && category !== "all" && k.category !== category) return false;
    if (!q) return true;
    return (
      k.title.toLowerCase().includes(q) ||
      k.summary.toLowerCase().includes(q) ||
      k.content.toLowerCase().includes(q) ||
      k.keywords.some((w) => w.toLowerCase().includes(q))
    );
  });

  const relevant = matched.length > 0 ? matched : all.slice(0, 3);
  return relevant.map((r) => `### ${r.title} (${r.category.toUpperCase()}):\n${r.content}`).join("\n\n");
}
