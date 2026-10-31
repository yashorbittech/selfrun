import {
  PipelineTab,
  UnifiedPipelineContact,
  OmnichannelMessage,
  VoiceCallRecord,
  WhatsAppNotificationLog,
  IntegrationStatus,
  CommunicationChannel,
} from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __dealflowUnifiedStore: {
    contacts: UnifiedPipelineContact[];
    messages: OmnichannelMessage[];
    voiceCalls: VoiceCallRecord[];
    notifications: WhatsAppNotificationLog[];
    integrations: IntegrationStatus;
  } | undefined;
}

function getInitialStore() {
  const now = new Date();
  const isoPast = (min: number) => new Date(now.getTime() - min * 60000).toISOString();

  const contacts: UnifiedPipelineContact[] = [
    // -------------------------------------------------------------
    // 1. CLIENTS (with clear source attribution: Facebook, Instagram, Upwork, Website, Meta)
    // -------------------------------------------------------------
    {
      id: "CLIENT-FB-01",
      pipeline: "clients",
      name: "Rohit Malhotra",
      email: "rohit.malhotra@techscale.in",
      phone: "+91 98110 43210",
      companyOrCollege: "TechScale Logistics Pvt Ltd",
      titleOrService: "AI Automations & Logistics CRM",
      source: "facebook",
      sourceLabel: "Facebook Lead Ads (Carousel Ad #02)",
      budgetOrSalary: "₹4,50,000",
      status: "new",
      statusLabel: "New Inbound Lead",
      message: "Need automated fleet dispatch, driver tracking bots, and WhatsApp updates for our delivery hubs.",
      submittedAt: isoPast(15),
      campaignInfo: {
        campaignName: "Meta / FB Q4 Enterprise Logistics Scaling",
        adName: "Logistics Fleet Automation Video",
        formName: "FB Instant Quote & Scoping Form",
      },
    },
    {
      id: "CLIENT-IG-02",
      pipeline: "clients",
      name: "Meenakshi Sundaram",
      email: "meenakshi@glamstyle.co",
      phone: "+91 98201 11223",
      companyOrCollege: "GlamStyle D2C Apparel",
      titleOrService: "Custom E-Commerce Platform & Mobile App",
      source: "instagram",
      sourceLabel: "Instagram Story Ad (D2C Reel)",
      budgetOrSalary: "₹8,00,000",
      status: "contacted",
      statusLabel: "Contacted - Scoping Call Needed",
      message: "Migrating from Shopify to custom Next.js 15 headless storefront with React Native mobile app.",
      submittedAt: isoPast(60),
      campaignInfo: {
        campaignName: "Instagram High-Growth D2C Founders",
        adName: "NextJS 15 E-Commerce Speed Demo",
        formName: "Instagram Lead Form v3",
      },
    },
    {
      id: "CLIENT-UPWORK-03",
      pipeline: "clients",
      name: "Marcus Vance",
      email: "mvance@finoptix.co.uk",
      phone: "+44 7911 123456",
      companyOrCollege: "FinOptix Capital Ltd (London)",
      titleOrService: "Senior Next.js & Python Risk Engine",
      source: "upwork",
      sourceLabel: "Upwork Enterprise ($6,500 Fixed)",
      budgetOrSalary: "$6,500 Fixed",
      status: "qualified",
      statusLabel: "Qualified - Proposal Shared",
      message: "Looking for dedicated senior full stack dev for financial risk analytics engine and real-time dashboard.",
      submittedAt: isoPast(180),
      campaignInfo: {
        campaignName: "Upwork Verified Client (4.95 Rating, $140k+ Spend)",
        adName: "Fixed Price Contract",
        formName: "Upwork Direct Message",
      },
    },
    {
      id: "CLIENT-WEB-04",
      pipeline: "clients",
      name: "Ananya Deshmukh",
      email: "ananya@healthpulse.org",
      phone: "+91 98200 98200",
      companyOrCollege: "HealthPulse Diagnostics",
      titleOrService: "Patient Portal & WhatsApp Automation",
      source: "website",
      sourceLabel: "Website Contact Form",
      budgetOrSalary: "₹6,00,000",
      status: "proposal_sent",
      statusLabel: "Proposal Sent",
      message: "We need automated appointment booking, WhatsApp test report delivery, and doctor schedule management.",
      submittedAt: isoPast(480),
    },
    {
      id: "CLIENT-UPWORK-05",
      pipeline: "clients",
      name: "David Chen",
      email: "david.chen@hypergrowth.us",
      phone: "+1 (415) 555-0199",
      companyOrCollege: "HyperGrowth SaaS Inc.",
      titleOrService: "Custom AI Agent Workflows & RAG Pipeline",
      source: "upwork",
      sourceLabel: "Upwork Hourly ($65/hr)",
      budgetOrSalary: "$65 / hour",
      status: "negotiation",
      statusLabel: "Contract Negotiation",
      message: "Build multi-agent customer onboarding pipeline with LangChain, pgvector, and Slack bot integrations.",
      submittedAt: isoPast(520),
    },

    // -------------------------------------------------------------
    // 2. JOBS (Job Applications / Careers)
    // -------------------------------------------------------------
    {
      id: "JOB-APP-01",
      pipeline: "jobs",
      name: "Priyanka Joshi",
      email: "priyanka.joshi.dev@gmail.com",
      phone: "+91 98765 12340",
      companyOrCollege: "TCS Digital (Ex-Senior Developer)",
      titleOrService: "Senior Full Stack Engineer (React/Next.js)",
      source: "website_portal",
      sourceLabel: "Careers Portal Submission",
      budgetOrSalary: "₹18,00,000 LPA",
      status: "shortlisted",
      statusLabel: "Shortlisted for Round 2",
      message: "4.5 years experience architecting high-traffic Next.js and Node.js applications with WebSockets.",
      resumeUrl: "/resumes/priyanka_joshi.pdf",
      skills: ["React", "Next.js", "TypeScript", "Node.js", "MongoDB", "AWS"],
      submittedAt: isoPast(720),
    },
    {
      id: "JOB-APP-02",
      pipeline: "jobs",
      name: "Karan Singhal",
      email: "karan.singhal.ai@outlook.com",
      phone: "+91 98223 88771",
      companyOrCollege: "Cognitive Solutions",
      titleOrService: "AI & LLM Solutions Engineer",
      source: "website_portal",
      sourceLabel: "Careers Portal Submission",
      budgetOrSalary: "₹16,00,000 LPA",
      status: "interview",
      statusLabel: "Round 1 Technical Scheduled",
      message: "Specialized in Python FastAPI, LangChain, agentic loops, and open-source LLM fine-tuning.",
      resumeUrl: "/resumes/karan_singhal.pdf",
      skills: ["Python", "FastAPI", "PyTorch", "LangChain", "Vector DB"],
      submittedAt: isoPast(400),
    },
    {
      id: "JOB-APP-03",
      pipeline: "jobs",
      name: "Sneha Reddy",
      email: "sneha.reddy.design@gmail.com",
      phone: "+91 99881 22334",
      companyOrCollege: "Zomato Partner Studio",
      titleOrService: "Senior Product & UI/UX Designer",
      source: "website_portal",
      sourceLabel: "Careers Portal Submission",
      budgetOrSalary: "₹20,00,000 LPA",
      status: "new",
      statusLabel: "New Application",
      message: "Lead UI designer for high-conversion web & mobile products with 200k+ MAU. Figma design systems expert.",
      resumeUrl: "/resumes/sneha_reddy.pdf",
      skills: ["Figma", "Design Systems", "Prototyping", "UX Research", "Framer"],
      submittedAt: isoPast(45),
    },

    // -------------------------------------------------------------
    // 3. INTERNS (Software & AI Interns)
    // -------------------------------------------------------------
    {
      id: "INTERN-01",
      pipeline: "interns",
      name: "Aryan Gupta",
      email: "aryan.gupta@dtu.ac.in",
      phone: "+91 98101 23456",
      companyOrCollege: "Delhi Technological University (DTU, 4th Year)",
      titleOrService: "Full Stack Web Developer Intern",
      source: "website_portal",
      sourceLabel: "Internship Application Form",
      budgetOrSalary: "₹20,000 / month Stipend",
      status: "assessment_sent",
      statusLabel: "Technical Assessment Sent",
      message: "Proficient in React, Tailwind CSS, Node.js, and Git. Looking for a 6-month full-time internship with PPO.",
      resumeUrl: "/resumes/aryan_gupta_dtu.pdf",
      skills: ["React", "JavaScript", "Tailwind CSS", "Node.js", "Express"],
      submittedAt: isoPast(120),
    },
    {
      id: "INTERN-02",
      pipeline: "interns",
      name: "Rhea Sen",
      email: "rhea.sen.iiit@gmail.com",
      phone: "+91 97480 99887",
      companyOrCollege: "IIIT Hyderabad (3rd Year CSE)",
      titleOrService: "AI & Python Research Intern",
      source: "website_portal",
      sourceLabel: "Internship Application Form",
      budgetOrSalary: "₹25,000 / month Stipend",
      status: "interview",
      statusLabel: "Interview Scheduled",
      message: "Built transformer models for text summarization. Strong DSA fundamentals in C++ and Python.",
      resumeUrl: "/resumes/rhea_sen_iiit.pdf",
      skills: ["Python", "Machine Learning", "PyTorch", "C++", "DSA"],
      submittedAt: isoPast(250),
    },

    // -------------------------------------------------------------
    // 4. TRAINEES (Industrial Training Programs)
    // -------------------------------------------------------------
    {
      id: "TRAINEE-01",
      pipeline: "trainees",
      name: "Harpreet Singh",
      email: "harpreet.singh@gndu.ac.in",
      phone: "+91 98150 44556",
      companyOrCollege: "Guru Nanak Dev University (B.Tech CSE)",
      titleOrService: "6-Months Industrial Training (MERN Stack)",
      source: "website_portal",
      sourceLabel: "Industrial Training Registration",
      budgetOrSalary: "Training Enrollment",
      status: "verified",
      statusLabel: "College NOC Verified",
      message: "Enrolling for 6-months mandatory final semester industrial training with live project certificate.",
      submittedAt: isoPast(320),
    },
    {
      id: "TRAINEE-02",
      pipeline: "trainees",
      name: "Simran Kaur",
      email: "simran.kaur99@gmail.com",
      phone: "+91 97800 66778",
      companyOrCollege: "Chitkara University (BCA Final Year)",
      titleOrService: "6-Weeks Summer Training (Python AI & ML)",
      source: "website_portal",
      sourceLabel: "Summer Training Application",
      budgetOrSalary: "Summer Training Fee",
      status: "new",
      statusLabel: "New Registration",
      message: "Want to learn Python, Pandas, and build a machine learning model for university semester credit.",
      submittedAt: isoPast(95),
    },
  ];

  const messages: OmnichannelMessage[] = [
    {
      id: "msg-c-1",
      pipeline: "clients",
      contactId: "CLIENT-FB-01",
      channel: "chat",
      direction: "inbound",
      senderName: "Rohit Malhotra",
      senderIdentifier: "+91 98110 43210",
      recipientIdentifier: "DealFlow AI Platform",
      body: "Hi! I submitted my contact via your Facebook Lead Ad for Logistics AI. We have 80 delivery vehicles and need driver dispatch automation.",
      deliveryStatus: "read",
      timestamp: isoPast(14),
    },
    {
      id: "msg-c-2",
      pipeline: "clients",
      contactId: "CLIENT-FB-01",
      channel: "chat",
      direction: "outbound",
      senderName: "Sameer Verma (via AI Assistant)",
      senderIdentifier: "deals@selfrun.in",
      recipientIdentifier: "+91 98110 43210",
      body: "Hello Rohit! Thank you for connecting through Facebook. We specialize in fleet dispatch bots, live driver tracking webhooks, and automated customer WhatsApp alerts. Would 4:00 PM work for a brief 10-minute scoping call?",
      deliveryStatus: "delivered",
      timestamp: isoPast(10),
      isAiGenerated: true,
    },
    {
      id: "msg-j-1",
      pipeline: "jobs",
      contactId: "JOB-APP-01",
      channel: "chat",
      direction: "inbound",
      senderName: "Priyanka Joshi",
      senderIdentifier: "priyanka.joshi.dev@gmail.com",
      recipientIdentifier: "Careers Portal",
      body: "Hello HR team, is the Senior Full Stack Engineer position open for full remote work?",
      deliveryStatus: "read",
      timestamp: isoPast(150),
    },
  ];

  const voiceCalls: VoiceCallRecord[] = [
    {
      id: "CALL-2026-001",
      pipeline: "clients",
      contactId: "CLIENT-FB-01",
      contactName: "Rohit Malhotra",
      phoneNumber: "+91 98110 43210",
      direction: "outbound_ai",
      status: "completed",
      durationSeconds: 165,
      initiatedBy: "Sameer Verma (Authorized)",
      audioDuration: "2m 45s",
      transcript: [
        {
          speaker: "ai_assistant",
          text: "Hello Rohit! This is DealFlow AI calling on behalf of SelfRun regarding your Facebook inquiry for fleet dispatch automation.",
          timestamp: "00:03",
        },
        {
          speaker: "contact",
          text: "Hi, yes! We have 80 delivery vehicles across 3 hubs and need automated route alerts.",
          timestamp: "00:15",
        },
        {
          speaker: "ai_assistant",
          text: "Understood. Our platform connects directly with GPS devices to dispatch WhatsApp updates to customers and drivers. What is your preferred rollout date?",
          timestamp: "00:32",
        },
        {
          speaker: "contact",
          text: "We want to pilot within the next 2 weeks. Can you send a scope document?",
          timestamp: "00:50",
        },
        {
          speaker: "ai_assistant",
          text: "Absolutely. I have noted down the 80 vehicle pilot scope. Sameer from our senior team will email you the exact timeline and pricing within the hour.",
          timestamp: "01:10",
        },
      ],
      aiSummary: "Lead verified 80 vehicles fleet. Requested rapid 2-week pilot with automated WhatsApp alerts. Sent scoping proposal.",
      sentiment: "positive",
      nextActionItems: ["Send 80-vehicle pilot proposal", "Follow up tomorrow morning"],
      humanTakenOver: false,
      startedAt: isoPast(180),
      endedAt: isoPast(177),
    },
  ];

  const notifications: WhatsAppNotificationLog[] = [
    {
      id: "NOTIF-01",
      triggerType: "new_lead",
      entityId: "CLIENT-FB-01",
      recipientPhone: "+91 98110 43210",
      messageText: `🎯 *New Client Lead Received!* \n\n*Name:* Rohit Malhotra\n*Source:* Facebook Ads (Carousel #02)\n*Company:* TechScale Logistics\n*Phone:* +91 98110 43210\n*Budget:* ₹4,50,000\n*Service:* AI Automations & Logistics CRM\n\n👉 Open Lead: https://selfrun.in/dealflow-ai/pipeline/clients`,
      status: "delivered",
      dealflowLink: "/dealflow-ai/pipeline/clients",
      sentAt: isoPast(15),
    },
    {
      id: "NOTIF-02",
      triggerType: "new_job_application",
      entityId: "JOB-APP-03",
      recipientPhone: "+91 99881 22334",
      messageText: `💼 *New Job Application Received!* \n\n*Candidate:* Sneha Reddy\n*Position:* Senior Product & UI/UX Designer\n*Experience:* 5.0 Years\n*Email:* sneha.reddy.design@gmail.com\n*Phone:* +91 99881 22334\n\n👉 Review: https://selfrun.in/dealflow-ai/pipeline/jobs`,
      status: "delivered",
      dealflowLink: "/dealflow-ai/pipeline/jobs",
      sentAt: isoPast(45),
    },
  ];

  const integrations: IntegrationStatus = {
    meta: {
      connected: true,
      connectedAccounts: ["SelfRun Meta Ads Manager (act_849201948)"],
      activeFormsCount: 4,
      lastSyncedAt: isoPast(5),
      totalLeadsFetched: 142,
    },
    upwork: {
      connected: true,
      activeQueries: [
        "Next.js Full Stack Enterprise",
        "Python AI Agent Automation",
        "React Native Mobile App",
      ],
      lastSyncedAt: isoPast(8),
      totalOpportunitiesFetched: 68,
    },
    website: {
      portalUrl: "https://selfrun.in/careers",
      webhookActive: true,
      openJobPositions: 8,
      lastApplicationReceivedAt: isoPast(45),
      totalApplicationsFetched: 219,
    },
    whatsapp: {
      connected: true,
      businessPhoneNumber: "+91 80000 12345",
      notificationsEnabled: true,
      totalNotificationsSent: 361,
    },
  };

  return {
    contacts,
    messages,
    voiceCalls,
    notifications,
    integrations,
  };
}

export function getUnifiedStore() {
  if (!global.__dealflowUnifiedStore) {
    global.__dealflowUnifiedStore = getInitialStore();
  }
  return global.__dealflowUnifiedStore;
}

export function listUnifiedContacts(pipeline?: PipelineTab, search?: string): UnifiedPipelineContact[] {
  const store = getUnifiedStore();
  let list = [...store.contacts];
  if (pipeline) {
    list = list.filter((c) => c.pipeline === pipeline);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.titleOrService.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q) ||
        (c.companyOrCollege && c.companyOrCollege.toLowerCase().includes(q))
    );
  }
  return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function getUnifiedContactById(id: string): UnifiedPipelineContact | null {
  const store = getUnifiedStore();
  return store.contacts.find((c) => c.id === id) ?? null;
}

export function listOmnichannelMessages(channel?: CommunicationChannel, pipeline?: PipelineTab): OmnichannelMessage[] {
  const store = getUnifiedStore();
  return store.messages
    .filter((m) => (!channel || m.channel === channel) && (!pipeline || m.pipeline === pipeline))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function listMessagesForContact(contactId: string, channel?: CommunicationChannel): OmnichannelMessage[] {
  const store = getUnifiedStore();
  return store.messages
    .filter((m) => m.contactId === contactId && (!channel || m.channel === channel))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function sendOmnichannelMessage(input: Omit<OmnichannelMessage, "id" | "timestamp" | "deliveryStatus">): OmnichannelMessage {
  const store = getUnifiedStore();
  const id = `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const msg: OmnichannelMessage = {
    ...input,
    id,
    deliveryStatus: "delivered",
    timestamp: now,
  };

  store.messages.push(msg);
  return msg;
}

export function listVoiceCalls(pipeline?: PipelineTab): VoiceCallRecord[] {
  const store = getUnifiedStore();
  return store.voiceCalls
    .filter((c) => !pipeline || c.pipeline === pipeline)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function logCompletedVoiceCall(input: {
  pipeline: PipelineTab;
  contactId: string;
  contactName: string;
  phoneNumber: string;
  durationSeconds: number;
  transcript: { speaker: "ai_assistant" | "contact" | "human_agent"; text: string; timestamp: string }[];
  aiSummary: string;
  sentiment: "positive" | "neutral" | "negative";
  nextActionItems: string[];
  humanTakenOver: boolean;
}): VoiceCallRecord {
  const store = getUnifiedStore();
  const id = `CALL-${Date.now()}`;
  const now = new Date().toISOString();

  const call: VoiceCallRecord = {
    id,
    ...input,
    direction: "outbound_ai",
    status: "completed",
    initiatedBy: "Human Operator Click-to-Call CTA",
    startedAt: now,
    endedAt: now,
  };

  store.voiceCalls.unshift(call);
  return call;
}

export function getIntegrationsStatus(): IntegrationStatus {
  return getUnifiedStore().integrations;
}

export function listWhatsAppNotifications(): WhatsAppNotificationLog[] {
  return getUnifiedStore().notifications;
}

// -------------------------------------------------------------
// Backwards compatibility & Integration Hub helpers
// -------------------------------------------------------------
export function listDealLeads(): UnifiedPipelineContact[] {
  return listUnifiedContacts("clients");
}

export function listDealJobApplications(): UnifiedPipelineContact[] {
  return listUnifiedContacts("jobs");
}

export function listAllMessages(channel?: CommunicationChannel): OmnichannelMessage[] {
  return listOmnichannelMessages(channel);
}

export function syncMetaLeads() {
  const store = getUnifiedStore();
  store.integrations.meta.lastSyncedAt = new Date().toISOString();
  store.integrations.meta.totalLeadsFetched += 2;
  return {
    ok: true,
    fetchedCount: 2,
    newLeads: store.contacts.filter((c) => c.pipeline === "clients").slice(0, 2),
  };
}

export function syncUpworkOpportunities() {
  const store = getUnifiedStore();
  store.integrations.upwork.lastSyncedAt = new Date().toISOString();
  store.integrations.upwork.totalOpportunitiesFetched += 1;
  return {
    ok: true,
    fetchedCount: 1,
    newLeads: store.contacts.filter((c) => c.pipeline === "clients" && c.source === "upwork").slice(0, 1),
  };
}

export function syncWebsiteJobApplications() {
  const store = getUnifiedStore();
  store.integrations.website.lastApplicationReceivedAt = new Date().toISOString();
  store.integrations.website.totalApplicationsFetched += 3;
  return {
    ok: true,
    fetchedCount: 3,
    newApplications: store.contacts.filter((c) => c.pipeline === "jobs").slice(0, 3),
  };
}

export function triggerWhatsAppNotification(input: {
  triggerType?: "new_lead" | "new_job_application" | "new_intern" | "new_trainee";
  entityId?: string;
  recipientPhone: string;
  name?: string;
  position?: string;
  company?: string;
  service?: string;
  budget?: string;
  dealflowLink?: string;
  messageText?: string;
}): WhatsAppNotificationLog {
  const store = getUnifiedStore();
  const triggerType = input.triggerType || "new_lead";
  const label = triggerType === "new_job_application" ? "New Job Application" : "New Client Lead";
  const defaultText = `*DealFlow AI Alert: ${label}*\n\nName: ${input.name || "Contact"}\n${input.company ? `Company: ${input.company}\n` : ""}${input.service ? `Requirement: ${input.service}\n` : ""}${input.budget ? `Budget: ${input.budget}\n` : ""}\nView details: ${input.dealflowLink || "https://selfrun.in/dealflow-ai"}`;

  const log: WhatsAppNotificationLog = {
    id: `WAN-${Date.now()}`,
    triggerType,
    entityId: input.entityId || "LEAD-MANUAL",
    recipientPhone: input.recipientPhone,
    messageText: input.messageText || defaultText,
    status: "delivered",
    dealflowLink: input.dealflowLink || "/dealflow-ai",
    sentAt: new Date().toISOString(),
  };
  store.notifications.unshift(log);
  return log;
}

export function initiateAiVoiceCall(input: {
  entityType?: string;
  entityId?: string;
  contactName: string;
  phoneNumber: string;
  initiatedBy?: string;
  initialObjective?: string;
  pipeline?: PipelineTab;
  contactId?: string;
}): VoiceCallRecord {
  const store = getUnifiedStore();
  const id = `CALL-${Date.now()}`;
  const now = new Date().toISOString();
  const pipeline: PipelineTab = input.pipeline || (input.entityType === "applicant" ? "jobs" : "clients");
  const call: VoiceCallRecord = {
    id,
    pipeline,
    contactId: input.contactId || input.entityId || "CALL-CONTACT",
    contactName: input.contactName,
    phoneNumber: input.phoneNumber,
    direction: "outbound_ai",
    status: "in_progress",
    durationSeconds: 0,
    transcript: [
      {
        speaker: "ai_assistant",
        text: `Hello ${input.contactName}, this is DealFlow AI calling. How can I assist you today?`,
        timestamp: now,
      },
    ],
    aiSummary: "Call connected. Ongoing conversation.",
    sentiment: "positive",
    nextActionItems: ["Complete conversation", "Log action items"],
    humanTakenOver: false,
    initiatedBy: input.initiatedBy || "Staff Agent Authorized",
    startedAt: now,
  };
  store.voiceCalls.unshift(call);
  return call;
}

export function takeoverVoiceCall(callId: string, agentName?: string): VoiceCallRecord | undefined {
  const store = getUnifiedStore();
  const call = store.voiceCalls.find((c) => c.id === callId);
  if (call) {
    call.humanTakenOver = true;
    call.transcript.push({
      speaker: "human_agent",
      text: `[${agentName || "Human agent"} took over the live call audio stream]`,
      timestamp: new Date().toISOString(),
    });
  }
  return call;
}

export function endVoiceCall(callId: string, duration?: number): VoiceCallRecord | undefined {
  const store = getUnifiedStore();
  const call = store.voiceCalls.find((c) => c.id === callId);
  if (call) {
    call.status = "completed";
    if (duration) call.durationSeconds = duration;
    call.endedAt = new Date().toISOString();
  }
  return call;
}

export function listAiApprovalDrafts(filters?: { channel?: string; status?: string; entityType?: string }): any[] {
  // Replaced by direct composer auto-fill per user design
  return [];
}

export function createAiApprovalDraft(draft: any): any {
  return { id: `DRAFT-${Date.now()}`, ...draft, status: "auto_filled", createdAt: new Date().toISOString() };
}

export function resolveAiApprovalDraft(draftId: string, action: string, editedText?: string, reviewerName?: string) {
  return {
    ok: true,
    draft: { id: draftId, status: action, editedText, reviewerName },
    sentMessage: { id: `MSG-${Date.now()}`, status: "sent" },
  };
}
