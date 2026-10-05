"use server";

import { revalidatePath } from "next/cache";
import { getCurrentLmsUser } from "@/lib/lms-auth";
import {
  createInterview,
  deleteInterview,
  updateInterviewStatus,
  listInterviewsForApplication,
  type InterviewMode,
  type InterviewStatus,
  type SerializedInterview,
} from "@/lib/portal/interviews";
import { getApplication } from "@/lib/career-applications";
import { notifyPortalUser } from "@/lib/portal/notifications";
import { externalUsers } from "@/lib/portal-auth";

async function requireLms() {
  const u = await getCurrentLmsUser();
  if (!u) throw new Error("Unauthorized");
  return u;
}

async function notifyApplicant(applicationId: string, title: string, body: string) {
  const account = await (await externalUsers()).findOne({ role: "job_applicant", applicationId });
  if (account) await notifyPortalUser({ recipientUserId: account._id, type: "interview", title, body, link: "/portal/interviews" });
}

export async function addInterviewAction(
  applicationId: string,
  input: { title: string; mode: InterviewMode; scheduledAt: string; durationMins: number; round?: string; location?: string; meetingLink?: string; panel?: string; notes?: string }
): Promise<{ error?: string }> {
  const u = await requireLms();
  if (!input.title.trim() || !input.scheduledAt) return { error: "Title and date/time are required." };
  const app = await getApplication(applicationId);
  if (!app) return { error: "Application not found." };

  await createInterview(
    applicationId,
    {
      title: input.title,
      mode: input.mode,
      scheduledAt: new Date(input.scheduledAt).toISOString(),
      durationMins: input.durationMins,
      round: input.round ?? null,
      location: input.location ?? null,
      meetingLink: input.meetingLink ?? null,
      panel: input.panel ?? null,
      notes: input.notes ?? null,
    },
    u.id
  );
  await notifyApplicant(applicationId, "Interview scheduled", `${input.title} — ${new Date(input.scheduledAt).toLocaleString()}`);
  revalidatePath(`/lms/careers/applicants/${applicationId}`);
  return {};
}

export async function setInterviewStatusAction(applicationId: string, interviewId: string, status: InterviewStatus): Promise<{ error?: string }> {
  await requireLms();
  await updateInterviewStatus(interviewId, status);
  revalidatePath(`/lms/careers/applicants/${applicationId}`);
  return {};
}

export async function removeInterviewAction(applicationId: string, interviewId: string): Promise<{ error?: string }> {
  await requireLms();
  await deleteInterview(interviewId);
  revalidatePath(`/lms/careers/applicants/${applicationId}`);
  return {};
}

export async function listInterviewsAction(applicationId: string): Promise<SerializedInterview[]> {
  await requireLms();
  return listInterviewsForApplication(applicationId);
}
