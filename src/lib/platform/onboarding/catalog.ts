/**
 * Starting points offered by the onboarding wizard — client-safe, no data
 * access. Everything here is a DEFAULT the owner can edit before it's applied.
 */

export const INDUSTRIES = [
  { value: "software_services", label: "Software development services" },
  { value: "saas_product", label: "SaaS / product company" },
  { value: "digital_agency", label: "Digital marketing agency" },
  { value: "ai_data", label: "AI, data & automation" },
  { value: "it_consulting", label: "IT consulting & staffing" },
  { value: "training", label: "IT training & education" },
] as const;
export type Industry = (typeof INDUSTRIES)[number]["value"];

export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"] as const;

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"] as const;

export interface DepartmentTemplate {
  name: string;
  code: string;
  designations: string[];
}

const ENGINEERING: DepartmentTemplate = { name: "Engineering", code: "ENG", designations: ["Engineering Manager", "Tech Lead", "Senior Software Engineer", "Software Engineer", "Intern"] };
const QA: DepartmentTemplate = { name: "Quality Assurance", code: "QA", designations: ["QA Lead", "QA Engineer", "Automation Engineer"] };
const DESIGN: DepartmentTemplate = { name: "Design", code: "DES", designations: ["Design Lead", "UI/UX Designer"] };
const PRODUCT: DepartmentTemplate = { name: "Product", code: "PRD", designations: ["Product Manager", "Business Analyst"] };
const DELIVERY: DepartmentTemplate = { name: "Project Delivery", code: "PMO", designations: ["Delivery Head", "Project Manager", "Scrum Master"] };
const SALES: DepartmentTemplate = { name: "Sales & Business Development", code: "SAL", designations: ["Head of Sales", "Business Development Executive", "Pre-sales Consultant"] };
const MARKETING: DepartmentTemplate = { name: "Marketing", code: "MKT", designations: ["Marketing Manager", "Digital Marketing Executive", "Content Writer", "SEO Specialist"] };
const HR: DepartmentTemplate = { name: "Human Resources", code: "HR", designations: ["HR Manager", "Talent Acquisition Specialist", "HR Executive"] };
const FINANCE: DepartmentTemplate = { name: "Finance & Accounts", code: "FIN", designations: ["Finance Manager", "Accountant"] };
const OPERATIONS: DepartmentTemplate = { name: "Operations & Admin", code: "OPS", designations: ["Operations Manager", "IT Administrator", "Office Administrator"] };
const DATA: DepartmentTemplate = { name: "Data & AI", code: "DAI", designations: ["Data Science Lead", "Data Scientist", "ML Engineer", "Data Engineer"] };
const TRAINING: DepartmentTemplate = { name: "Training & Mentorship", code: "TRN", designations: ["Training Head", "Trainer", "Mentor", "Placement Coordinator"] };

export const DEPARTMENT_TEMPLATES: Record<Industry, DepartmentTemplate[]> = {
  software_services: [ENGINEERING, QA, DESIGN, DELIVERY, SALES, HR, FINANCE, OPERATIONS],
  saas_product: [ENGINEERING, QA, DESIGN, PRODUCT, SALES, MARKETING, HR, FINANCE],
  digital_agency: [MARKETING, DESIGN, { ...ENGINEERING, designations: ["Web Developer", "Senior Web Developer"] }, DELIVERY, SALES, HR, FINANCE],
  ai_data: [DATA, ENGINEERING, PRODUCT, DELIVERY, SALES, HR, FINANCE],
  it_consulting: [DELIVERY, ENGINEERING, SALES, HR, FINANCE, OPERATIONS],
  training: [TRAINING, ENGINEERING, SALES, MARKETING, HR, FINANCE],
};

/**
 * Invitation role presets → the REAL role literals each panel checks (see
 * each module's `*-roles.ts` / `admin/role-catalog.ts`). A preset is only a
 * convenient bundle; roles stay editable per person in Users & Roles.
 */
export const ROLE_PRESETS = [
  { value: "admin", label: "Company Admin", description: "Full access to every panel and company settings.", roles: ["super_admin"] },
  {
    value: "hr",
    label: "HR Manager",
    description: "People, attendance, leave, payroll, recruitment tests and policies.",
    roles: ["hr", "employee", "chat_hr", "sop_manager", "ots_manager", "workspace_member"],
  },
  {
    value: "project_manager",
    label: "Project Manager",
    description: "Projects, tasks, timesheets and the delivery team.",
    roles: ["pms_manager", "manager", "employee", "chat_pm", "sop_employee", "dlms_manager", "workspace_member"],
  },
  {
    value: "developer",
    label: "Developer / Team member",
    description: "Their tasks, timesheets, leave, chat and company documents.",
    roles: ["pms_employee", "employee", "chat_employee", "sop_employee", "prms_employee", "dlms_employee", "workspace_member"],
  },
  { value: "sales", label: "Sales / Business Development", description: "Leads, clients and the CRM pipeline.", roles: ["lms_manager", "employee", "chat_employee", "sop_employee", "workspace_member"] },
  { value: "finance", label: "Accounts / Finance", description: "Invoices, payments, expenses and procurement approvals.", roles: ["finance_manager", "finance", "employee", "chat_employee", "sop_employee", "workspace_member"] },
  {
    value: "marketing",
    label: "Marketing",
    description: "Social media, SEO and the website.",
    roles: ["smms_manager", "seo_manager", "cms_editor", "employee", "chat_employee", "sop_employee", "workspace_member"],
  },
] as const;
export type RolePreset = (typeof ROLE_PRESETS)[number]["value"];

export function rolesForPreset(preset: string): string[] | null {
  const p = ROLE_PRESETS.find((r) => r.value === preset);
  return p ? [...p.roles] : null;
}

/** The panels a company can switch on or off. `core` panels are always on. */
export const MODULES = [
  { key: "workspace", label: "Staff Hub", description: "Everyone's home screen", core: true },
  { key: "admin", label: "Command Center", description: "Company dashboard, users & roles", core: true },
  { key: "messenger", label: "Team Chat", description: "Channels, DMs, meetings, calls", core: true },
  { key: "hrms", label: "HR & Payroll", description: "Employees, attendance, leave, payroll, recruitment", core: false },
  { key: "pms", label: "Projects", description: "Clients, projects, tasks, timesheets, costing", core: false },
  { key: "lms", label: "CRM & Sales", description: "Leads, pipeline, campaigns, offers", core: false },
  { key: "fms", label: "Finance", description: "Invoices, payments, accounting, reports", core: false },
  { key: "prms", label: "Procurement & Assets", description: "Vendors, purchase orders, assets, expenses", core: false },
  { key: "tms", label: "Training", description: "Programs, batches, students, certificates", core: false },
  { key: "ots", label: "Online Tests", description: "Assessments for hiring and training", core: false },
  { key: "sop", label: "SOPs & Policies", description: "Processes and acknowledgements", core: false },
  { key: 'lpms', label: 'Legal & Documents', description: 'Policies, agreements, certificates and document automation', core: false },
  { key: "dlms", label: "Digi Locker", description: "Company & client documents and credentials", core: false },
  { key: "cms", label: "Website", description: "Your public website and pages", core: false },
  { key: "seo", label: "SEO", description: "Search visibility and audits", core: false },
  { key: "smms", label: "Social Media", description: "Posts, campaigns and approvals", core: false },
  { key: "aibots", label: "AI Assistants", description: "AI bots for your team", core: false },
  { key: "intelligence", label: "AI Intelligence", description: "Ask questions about your business data", core: false },
  { key: "portal", label: "Client & Student Portal", description: "External portal for clients, students, applicants", core: false },
] as const;
export type ModuleKey = (typeof MODULES)[number]["key"];

/** Sensible default selection per industry (core modules are implied). */
export const DEFAULT_MODULES: Record<Industry, ModuleKey[]> = {
  software_services: ["hrms", "pms", "lms", "fms", "prms", "sop", "lpms", "dlms", "cms", "portal"],
  saas_product: ["hrms", "pms", "lms", "fms", "sop", "lpms", "dlms", "cms", "seo", "smms", "aibots"],
  digital_agency: ["hrms", "pms", "lms", "fms", "cms", "seo", "smms", "portal"],
  ai_data: ["hrms", "pms", "lms", "fms", "sop", "lpms", "dlms", "cms", "aibots", "portal"],
  it_consulting: ["hrms", "pms", "lms", "fms", "prms", "ots", "dlms", "portal"],
  training: ["hrms", "tms", "ots", "lms", "fms", "cms", "portal"],
};

export const ONBOARDING_STEPS = [
  { key: "profile", label: "Company profile" },
  { key: "structure", label: "Departments" },
  { key: "team", label: "Invite your team" },
  { key: "branding", label: "Branding" },
  { key: "modules", label: "Choose panels" },
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]["key"];
