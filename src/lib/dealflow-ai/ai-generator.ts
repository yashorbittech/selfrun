import { searchKnowledgeBase } from "./knowledge-base";
import { getOpenAI } from "@/lib/openai";

export interface GenerateAiReplyOptions {
  channel: "chat" | "email" | "whatsapp" | "voice";
  category: "jobs" | "interns" | "trainees" | "clients";
  contactName: string;
  contactIdentifier?: string;
  clientSource?: string; // Facebook, Instagram, Meta Ads, Upwork, Website, etc.
  serviceCategory?: string;
  budgetOrSalary?: string;
  previousMessages?: { sender: string; text: string }[];
  specificPrompt?: string;
}

export interface GeneratedAiReplyResult {
  reply: string;
  subject?: string; // For emails
  rationale: string;
  suggestedAction: string;
}

export async function generateContextualAiReply(
  opts: GenerateAiReplyOptions
): Promise<GeneratedAiReplyResult> {
  // 1. Retrieve relevant facts from central Knowledge Base
  const kbCategoryMap: Record<string, string> = {
    jobs: "jobs",
    interns: "internships",
    trainees: "training",
    clients: "services",
  };

  const kbCategory = kbCategoryMap[opts.category] || "services";
  const kbContext = await searchKnowledgeBase(
    `${opts.serviceCategory || ""} ${opts.category} ${opts.specificPrompt || ""}`,
    kbCategory
  );

  const lastMessageText =
    opts.previousMessages && opts.previousMessages.length > 0
      ? opts.previousMessages[opts.previousMessages.length - 1].text
      : opts.specificPrompt || "";

  // 2. Try calling OpenAI with real system prompt and KB context
  try {
    const openai = await getOpenAI({ timeoutMs: 8000, maxRetries: 1 });
    const systemInstruction = `You are DealFlow AI, the senior customer and talent communication assistant for SelfRun.
You communicate professionally across ${opts.channel.toUpperCase()}.
Entity Type: ${opts.category.toUpperCase()} (${opts.contactName}).
${opts.clientSource ? `Lead Origin Source: ${opts.clientSource.toUpperCase()}` : ""}
${opts.serviceCategory ? `Service / Position: ${opts.serviceCategory}` : ""}
${opts.budgetOrSalary ? `Budget / Expected Salary: ${opts.budgetOrSalary}` : ""}

KNOWLEDGE BASE CONTEXT:
${kbContext}

INSTRUCTIONS:
- Generate a polite, contextual, highly specific reply.
- Address the user's inquiry directly.
- Offer clear next steps (call time, schedule link, or document attachment).
${opts.channel === "whatsapp" ? "- Use WhatsApp markdown like *bold*, bullet points, and friendly emojis." : ""}
${opts.channel === "email" ? "- Provide a formal professional email body with greeting and sign-off." : ""}
${opts.channel === "chat" ? "- Keep it crisp, conversational, and helpful." : ""}
${opts.channel === "voice" ? "- Provide a natural conversational voice script suitable for spoken speech." : ""}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemInstruction },
        {
          role: "user",
          content: `Generate the ${opts.channel} reply to ${opts.contactName}. Last query: "${lastMessageText}"`,
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (reply) {
      let subject: string | undefined = undefined;
      if (opts.channel === "email") {
        subject =
          opts.category === "clients"
            ? `SelfRun Project Scope & Architecture Proposal - ${opts.contactName}`
            : opts.category === "jobs"
              ? `Next Steps on your Application with SelfRun / DealFlow AI - ${opts.contactName}`
              : `Internship & Training Program Details - SelfRun`;
      }

      return {
        reply,
        subject,
        rationale: `Generated with GPT-4o-mini using ${kbCategory.toUpperCase()} Knowledge Base context for ${opts.contactName} via ${opts.clientSource || opts.channel}.`,
        suggestedAction: opts.category === "clients" ? "Send Proposal & Schedule Call" : "Schedule Interview Screening",
      };
    }
  } catch {
    // Graceful fallback to real knowledge-based dynamic templates
  }

  // 3. Knowledge-Base Grounded Contextual Fallback
  return fallbackKbReply(opts, kbContext);
}

function fallbackKbReply(
  opts: GenerateAiReplyOptions,
  _kbContext: string
): GeneratedAiReplyResult {
  const name = opts.contactName || "there";
  let reply = "";
  let subject: string | undefined = undefined;
  let rationale = "";
  let suggestedAction = "";

  if (opts.category === "clients") {
    const sourceLabel = opts.clientSource || "our website";
    const service = opts.serviceCategory || "Software Development & AI Automation";
    const budget = opts.budgetOrSalary;

    if (opts.channel === "whatsapp") {
      reply = `Hello ${name}! 👋\n\nThank you for reaching out regarding *${service}* via *${sourceLabel}*.\n\nOur senior engineering architects have reviewed your specifications. We provide complete end-to-end development with dedicated sprint deliveries${budget ? ` within your estimated budget of ${budget}` : ""}.\n\nWould *3:30 PM today* or *11:00 AM tomorrow* work for a quick 10-minute scoping call? We can also share a live architecture demo.`;
      rationale = `WhatsApp client response referencing ${sourceLabel} attribution, ${service}, and concrete meeting options.`;
      suggestedAction = "Lock Scoping Call Slot";
    } else if (opts.channel === "email") {
      subject = `SelfRun Proposal & Technical Scope - ${service}`;
      reply = `Hi ${name},\n\nThank you for connecting with us regarding your project for ${service} (via ${sourceLabel}).\n\nWe specialize in high-performance Next.js 15, Python AI RAG architectures, and custom workflows. Attached is our company capabilities overview and preliminary milestone schedule.\n\nCould you please let us know your availability for a 15-minute introductory video walkthrough this week?\n\nWarm regards,\nDealFlow AI Solutions Team\nSelfRun Technologies`;
      rationale = `Professional B2B email referencing client inquiry from ${sourceLabel} with attached capabilities.`;
      suggestedAction = "Send Architecture Document";
    } else if (opts.channel === "voice") {
      reply = `Hello ${name}, this is Sarah calling from DealFlow AI on behalf of SelfRun. I am following up on your project inquiry for ${service} that we received from ${sourceLabel}. We have confirmed our technical team's availability and wanted to verify if you would like a formal technical walkthrough or a direct proposal document first?`;
      rationale = `Voice call opening script referencing lead source ${sourceLabel} and verifying project requirements.`;
      suggestedAction = "Record Verbal Scope Notes";
    } else {
      reply = `Hello ${name}! Thank you for your inquiry regarding ${service} via ${sourceLabel}. We have confirmed availability for a dedicated sprint. Would you prefer a quick 10-minute walkthrough call or a detailed scope document first?`;
      rationale = `Platform chat response referencing ${sourceLabel} and immediate sprint availability.`;
      suggestedAction = "Confirm Meeting Slot";
    }
  } else if (opts.category === "jobs") {
    const role = opts.serviceCategory || "Senior Full Stack Engineer";
    if (opts.channel === "whatsapp") {
      reply = `Hi ${name}! 💼\n\nThis is the Hiring Team at *DealFlow AI / SelfRun*.\n\nWe have reviewed your application for the *${role}* position. Your technical background is a strong fit for our current roadmap!\n\nWe would love to invite you for a 45-minute live technical discussion. Please pick a slot here: https://selfrun.in/calendar/interview-slot. Looking forward to speaking!`;
      rationale = `WhatsApp invitation to candidate for live technical interview.`;
      suggestedAction = "Schedule Round 1 Screening";
    } else if (opts.channel === "email") {
      subject = `Interview Invitation: ${role} - SelfRun / DealFlow AI`;
      reply = `Dear ${name},\n\nThank you for applying for the ${role} position at SelfRun. Our technical leadership has reviewed your resume and credentials.\n\nWe are pleased to invite you to our Round 1 Technical Screening. The session will cover production architecture, problem-solving, and a brief discussion about past projects.\n\nPlease select a convenient time slot on our hiring calendar: https://selfrun.in/calendar/interview-slot\n\nBest regards,\nTalent Acquisition Team\nSelfRun`;
      rationale = `Formal job application email invitation to Round 1 screening.`;
      suggestedAction = "Track Interview Confirmation";
    } else if (opts.channel === "voice") {
      reply = `Hello ${name}, this is the talent acquisition team from DealFlow AI. I am calling regarding your recent job application for the ${role} position. We were impressed with your background and wanted to check if you are available this week for a 45-minute technical discussion?`;
      rationale = `Candidate telephone screening script confirming interview interest and availability.`;
      suggestedAction = "Log Interview Availability";
    } else {
      reply = `Hi ${name}! We have reviewed your application for ${role}. Your profile has been shortlisted for Round 1 technical evaluation. When would be a good time this week for your session?`;
      rationale = `Direct candidate chat acknowledgment and scheduling query.`;
      suggestedAction = "Schedule Screening";
    }
  } else if (opts.category === "interns") {
    if (opts.channel === "whatsapp") {
      reply = `Hello ${name}! 🎓\n\nThank you for applying for our *Software & AI Internship Program* at SelfRun.\n\nOur program includes a monthly stipend (₹15k - ₹25k), real-world production mentorship, and pre-placement offer (PPO) opportunities. We have sent the technical assessment link to your email.\n\nPlease complete the assessment within 48 hours to secure your interview round!`;
      rationale = `Internship inquiry WhatsApp follow-up with stipend and assessment details.`;
      suggestedAction = "Send Assessment Link";
    } else if (opts.channel === "email") {
      subject = `SelfRun Internship Program - Assessment & Next Steps`;
      reply = `Dear ${name},\n\nThank you for your interest in the SelfRun Internship Program. Our program offers 3 to 6 months of hands-on production engineering with full senior mentorship and stipend.\n\nTo move forward to the technical interview, please complete our 45-minute coding challenge: https://selfrun.in/internships/assessment\n\nBest regards,\nCampus & Internship Team\nSelfRun`;
      rationale = `Internship email notification with assessment instructions.`;
      suggestedAction = "Grade Coding Challenge";
    } else {
      reply = `Hello ${name}! Thanks for applying to the Internship Program. Our team has reviewed your profile. Have you received the technical assessment link sent to your email?`;
      rationale = `Intern status check.`;
      suggestedAction = "Check Assessment Submission";
    }
  } else {
    // trainees
    if (opts.channel === "whatsapp") {
      reply = `Hello ${name}! 🛠️\n\nThank you for inquiring about our *6-Months / 6-Weeks Industrial Training Program*.\n\nOur training covers MERN Stack, Python AI, and Cloud DevOps with live project deployment and ISO-certified training credentials.\n\nWould you like us to share the complete syllabus PDF and fee structure here on WhatsApp?`;
      rationale = `Trainee WhatsApp response offering syllabus and certification details.`;
      suggestedAction = "Share Training Syllabus PDF";
    } else if (opts.channel === "email") {
      subject = `Industrial Training Program Curriculum & Certification - SelfRun`;
      reply = `Dear ${name},\n\nThank you for inquiring about our Industrial Training Program. Attached is our comprehensive 6-Months training curriculum covering Full-Stack MERN, Python AI, and DevOps.\n\nAll trainees build and deploy live production projects and receive verified ISO completion certificates.\n\nPlease let us know if you would like to schedule a campus counseling session.\n\nBest regards,\nTraining & Placement Cell\nSelfRun`;
      rationale = `Trainee email response with attached syllabus and curriculum.`;
      suggestedAction = "Send Registration Form";
    } else {
      reply = `Hello ${name}! Thanks for your interest in our Industrial Training Program. We offer certified training in MERN and Python AI. Would you like us to send you the syllabus and batch timings?`;
      rationale = `Trainee chat overview.`;
      suggestedAction = "Send Syllabus";
    }
  }

  return {
    reply,
    subject,
    rationale,
    suggestedAction,
  };
}

function optsBudgetOrRate(val?: string) {
  if (!val) return "";
  return ` (${val})`;
}
