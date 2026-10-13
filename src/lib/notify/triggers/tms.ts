import "server-only";
import { notifyStaff, notifyStudent } from "@/lib/tms/notifications";
import { inr, short } from "@/lib/notify/triggers/format";

/** Training notifications through TMS's own store: staff hear about applications; a student hears about their own batch, fees and certificate. */
export const tmsEvents = {
  applicationReceived: (a: { id: string; name: string; programName?: string | null }) =>
    notifyStaff({ type: "application_received", title: `New training application: ${short(a.name, 50)}`, body: a.programName ?? "Review it in Applications.", link: `/tms/applications/${a.id}`, dedupeKey: `tms-app-new:${a.id}` }),
  enrolled: (studentId: string, batchName: string, enrollmentId: string) =>
    notifyStudent(studentId, { type: "batch_assigned", title: "You were added to a batch", body: short(batchName, 80), link: "/tms/me/batch", dedupeKey: `tms-enrolled:${enrollmentId}` }),
  paymentRecorded: (studentId: string, amount: number, invoiceNumber: string, currency = "INR") =>
    notifyStudent(studentId, { type: "payment_recorded", title: `Payment received: ${inr(amount, currency)}`, body: `Receipt ${invoiceNumber}`, link: "/tms/me/payments", dedupeKey: `tms-pay:${invoiceNumber}` }),
  certificateIssued: (studentId: string, title: string, certificateId: string) =>
    !studentId ? Promise.resolve() : notifyStudent(studentId, { type: "certificate_issued", title: "Your certificate is ready", body: short(title, 80), link: "/tms/me/certificates", dedupeKey: `tms-cert:${certificateId}` }),
};
