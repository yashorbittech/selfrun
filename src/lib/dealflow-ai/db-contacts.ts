import "server-only";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { PipelineTab, UnifiedPipelineContact } from "./types";

function toIsoString(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

export async function loadPipelineContactsFromDb(
  pipeline?: PipelineTab
): Promise<UnifiedPipelineContact[]> {
  const db = await getDb();
  const results: UnifiedPipelineContact[] = [];

  // 1. JOBS PIPELINE (Website Career Applications & Job Applicant Lead Records)
  if (!pipeline || pipeline === "jobs") {
    const [careerApps, leadJobs] = await Promise.all([
      db
        .collection("career_applications")
        .find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
      db
        .collection("lead_records")
        .find({ type: "job_applicant", deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray(),
    ]);

    for (const app of careerApps) {
      const id = String(app._id);
      results.push({
        id,
        pipeline: "jobs",
        name: String(app.name || "Candidate"),
        email: String(app.email || ""),
        phone: String(app.phone || ""),
        companyOrCollege: app.notes ? String(app.notes) : "Website Careers Applicant",
        titleOrService: String(app.positionTitle || "Software Engineer"),
        source: "website",
        sourceLabel: "Website Careers Portal",
        budgetOrSalary: "₹12,00,000 - ₹24,00,000 LPA",
        status: String(app.status || "new"),
        statusLabel: String(app.status || "applied").replace(/_/g, " ").toUpperCase(),
        message: app.coverNote ? String(app.coverNote) : undefined,
        resumeUrl: app.resume?.storageKey ? `/api/lead-messages/files/${app.resume.storageKey}` : undefined,
        submittedAt: toIsoString(app.createdAt),
        detailUrl: `/dealflow-ai/careers/applicants/${id}`,
      });
    }

    for (const lead of leadJobs) {
      const id = String(lead._id);
      results.push({
        id,
        pipeline: "jobs",
        name: String(lead.name || "Candidate"),
        email: String(lead.email || ""),
        phone: String(lead.phone || ""),
        companyOrCollege: "Website Careers Applicant",
        titleOrService: String(lead.subService || "Software Development Position"),
        source: "website",
        sourceLabel: "Website Careers Portal",
        status: String(lead.stage || "applied"),
        statusLabel: String(lead.stage || "applied").replace(/_/g, " ").toUpperCase(),
        message: lead.message ? String(lead.message) : undefined,
        submittedAt: toIsoString(lead.createdAt),
        detailUrl: `/dealflow-ai/leads/${id}`,
      });
    }
  }

  // 2. INTERNS PIPELINE (Internship Applications from Website / lead_records)
  if (!pipeline || pipeline === "interns") {
    const interns = await db
      .collection("lead_records")
      .find({ type: "intern", deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    for (const intern of interns) {
      const id = String(intern._id);
      results.push({
        id,
        pipeline: "interns",
        name: String(intern.name || "Intern Applicant"),
        email: String(intern.email || ""),
        phone: String(intern.phone || ""),
        companyOrCollege: "University / College Internship Applicant",
        titleOrService: intern.subService ? `${intern.subService} Internship` : "Software & AI Engineering Internship",
        source: "website",
        sourceLabel: "Website Internship Portal",
        budgetOrSalary: "₹25,000 / month Stipend",
        status: String(intern.stage || "applied"),
        statusLabel: String(intern.stage || "applied").replace(/_/g, " ").toUpperCase(),
        message: intern.message ? String(intern.message) : "Applied for college software internship through website portal.",
        submittedAt: toIsoString(intern.createdAt),
        detailUrl: `/dealflow-ai/leads/${id}`,
      });
    }
  }

  // 3. TRAINEES PIPELINE (Industrial Training Applications from Website / lead_records)
  if (!pipeline || pipeline === "trainees") {
    const trainees = await db
      .collection("lead_records")
      .find({ type: "trainee", deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    for (const trainee of trainees) {
      const id = String(trainee._id);
      results.push({
        id,
        pipeline: "trainees",
        name: String(trainee.name || "Trainee Candidate"),
        email: String(trainee.email || ""),
        phone: String(trainee.phone || ""),
        companyOrCollege: "Industrial Training (College Credit)",
        titleOrService: trainee.subService ? `${trainee.subService} Industrial Training` : "6-Months Industrial Training",
        source: "website",
        sourceLabel: "Website Training Registration",
        budgetOrSalary: "Training Enrollment",
        status: String(trainee.stage || "applied"),
        statusLabel: String(trainee.stage || "applied").replace(/_/g, " ").toUpperCase(),
        message: trainee.message ? String(trainee.message) : "Interested in industrial training live project cohort.",
        submittedAt: toIsoString(trainee.createdAt),
        detailUrl: `/dealflow-ai/leads/${id}`,
      });
    }
  }

  // 4. CLIENTS PIPELINE (Multi-Source Client Inbound: Meta, Facebook, Instagram, Upwork, Google, LinkedIn, Website)
  if (!pipeline || pipeline === "clients") {
    const [leadsCollection, clientLeadRecords] = await Promise.all([
      db
        .collection("leads")
        .find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
      db
        .collection("lead_records")
        .find({ type: "client", deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray(),
    ]);

    for (const lead of leadsCollection) {
      const id = String(lead._id);
      const rawSource = String(lead.source || "website").toLowerCase();

      let source = "website";
      let sourceLabel = "Website Contact Form";

      if (rawSource.includes("meta")) {
        source = "meta";
        sourceLabel = "Meta Lead Ads (Campaign Q4)";
      } else if (rawSource.includes("facebook") || rawSource.includes("fb")) {
        source = "facebook";
        sourceLabel = "Facebook Lead Ads";
      } else if (rawSource.includes("instagram") || rawSource.includes("ig")) {
        source = "instagram";
        sourceLabel = "Instagram Story Ad";
      } else if (rawSource.includes("upwork")) {
        source = "upwork";
        sourceLabel = "Upwork Enterprise ($65/hr)";
      } else if (rawSource.includes("google")) {
        source = "google";
        sourceLabel = "Google Search Campaign";
      } else if (rawSource.includes("linkedin")) {
        source = "linkedin";
        sourceLabel = "LinkedIn InMail Lead";
      }

      results.push({
        id,
        pipeline: "clients",
        name: String(lead.name || "Client Lead"),
        email: String(lead.email || ""),
        phone: String(lead.phone || ""),
        companyOrCollege: lead.company ? String(lead.company) : "Enterprise Inbound Client",
        titleOrService: lead.category ? String(lead.category).replace(/-/g, " ").toUpperCase() : "Custom Software & AI Automations",
        source,
        sourceLabel,
        budgetOrSalary: lead.dealValue ? `₹${Number(lead.dealValue).toLocaleString("en-IN")}` : "₹6,00,000",
        status: String(lead.status || "new"),
        statusLabel: String(lead.status || "new").replace(/_/g, " ").toUpperCase(),
        message: lead.message ? String(lead.message) : "Inquiry for software architecture and development services.",
        submittedAt: toIsoString(lead.createdAt),
        detailUrl: `/dealflow-ai/leads/${id}`,
        campaignInfo: source === "meta" || source === "facebook" || source === "instagram" ? {
          campaignName: "High-Growth B2B Scaling Campaign",
          adName: `${sourceLabel} - Video Demonstration`,
          formName: "Instant Scope Request Form",
        } : undefined,
      });
    }

    for (const lead of clientLeadRecords) {
      const id = String(lead._id);
      results.push({
        id,
        pipeline: "clients",
        name: String(lead.name || "Client Lead"),
        email: String(lead.email || ""),
        phone: String(lead.phone || ""),
        companyOrCollege: "Direct Business Inquiry",
        titleOrService: lead.subService ? String(lead.subService) : "Software Development",
        source: "website",
        sourceLabel: "Website Business Inbound",
        status: String(lead.stage || "inquiry"),
        statusLabel: String(lead.stage || "inquiry").replace(/_/g, " ").toUpperCase(),
        message: lead.message ? String(lead.message) : undefined,
        submittedAt: toIsoString(lead.createdAt),
        detailUrl: `/dealflow-ai/leads/${id}`,
      });
    }
  }

  // Sort by real submittedAt / createdAt descending
  return results.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}
