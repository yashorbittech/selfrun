/**
 * Variables a catalogue template may use. Pure, client-safe.
 *
 * The PBDoc validator checks the NAMESPACE of a variable (company, employee, candidate, client, vendor, party, doc, input, custom).
 * Templates are stricter: for the record namespaces the FIELD must be in this list, so a typo (`employee.full_nmae`) fails at test time
 * instead of printing a blank in a letter. The data layer's variables registry is the runtime source of values; keep both in step.
 * `input.*` keys must be declared inputs of the template; `custom.*` is the company's own variables and is open.
 */

import type { PickerNamespace } from "@/lib/products/playbook-ai/catalogue/types";

export const KNOWN_FIELDS = {
  company: [
    "name", "legal_name", "address", "address_line1", "city", "state", "postal_code", "country", "email", "phone", "website",
    "pan", "gstin", "cin", "signatory_name", "signatory_designation", "hr_email", "grievance_officer_name", "grievance_officer_email",
  ],
  employee: [
    "full_name", "first_name", "code", "designation", "department", "location", "joining_date", "reporting_manager", "email", "phone",
    "address", "grade", "employment_type", "pan",
  ],
  candidate: ["full_name", "first_name", "email", "phone", "address"],
  client: ["name", "contact_name", "contact_designation", "address", "email", "phone", "gstin", "pan"],
  vendor: ["name", "contact_name", "contact_designation", "address", "email", "phone", "gstin", "pan"],
  party: ["name", "contact_name", "designation", "address", "email", "phone"],
  doc: ["date", "number", "title", "version"],
} as const satisfies Record<string, readonly string[]>;

export type KnownNamespace = keyof typeof KNOWN_FIELDS;

/** Namespaces that need a matching person/party picker input in the template. */
export const PICKER_BACKED: readonly PickerNamespace[] = ["employee", "candidate", "client", "vendor", "party"];

export function isKnownVariable(key: string): boolean {
  const [ns, ...rest] = key.split(".");
  if (ns === "input" || ns === "custom") return rest.length >= 1;
  const fields = (KNOWN_FIELDS as Record<string, readonly string[]>)[ns];
  return !!fields && rest.length === 1 && fields.includes(rest[0]);
}

/** All known (non-input, non-custom) variable keys, sorted. */
export function listKnownVariables(): string[] {
  const out: string[] = [];
  for (const [ns, fields] of Object.entries(KNOWN_FIELDS)) for (const f of fields) out.push(`${ns}.${f}`);
  return out.sort();
}
