"use client";

export interface ActionField {
  key: string;
  label: string;
  type: "text" | "date" | "number" | "select";
  options?: string[];
  placeholder: string;
  required: boolean;
  validationError?: string;
}

export interface PanelAction {
  id: string;
  label: string;
  description: string;
  triggers: string[];
  fields: ActionField[];
}

export interface PanelInfo {
  id: string;
  name: string;
  shortCode: string;
  description: string;
  quickPrompts: string[];
  actions: PanelAction[];
  faq: Record<string, string>;
}

export interface AgenticFlowState {
  actionId: string;
  actionLabel: string;
  panelId: string;
  fields: ActionField[];
  currentStepIndex: number;
  collectedData: Record<string, any>;
  isAwaitingConfirmation: boolean;
  isCompleted: boolean;
  createdRecord?: {
    id: string;
    title: string;
    panelId: string;
    details: Record<string, any>;
    createdAt: string;
  };
}

export interface MessageItem {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  stepInfo?: {
    current: number;
    total: number;
    fieldName: string;
  };
  confirmationCard?: {
    actionLabel: string;
    fields: { label: string; value: string }[];
  };
  successCard?: {
    recordId: string;
    title: string;
    panelName: string;
    details: { label: string; value: string }[];
    status: string;
  };
  warningNotice?: string;
}

// System Database of Panel AI Definitions across all 19 app panels
export const PANELS_CONFIG: Record<string, PanelInfo> = {
  pms: {
    id: "pms",
    name: "Project Management System",
    shortCode: "PMS",
    description: "Plan projects, tasks, milestones & team performance",
    quickPrompts: [
      "Create a new project",
      "Create a new task",
      "Add project milestone",
      "Summarize current project status",
    ],
    faq: {
      status: "Currently, PMS has 14 active projects with 88% on-track delivery status across development and design teams.",
      team: "Team leads can assign tasks and manage milestones directly from the Projects tab.",
    },
    actions: [
      {
        id: "create_project",
        label: "Create New Project",
        description: "Set up a new project with lead, timeline & priority",
        triggers: ["create project", "new project", "add project", "start project", "create a new project"],
        fields: [
          { key: "name", label: "Project Name", type: "text", placeholder: "e.g. Website Redesign", required: true },
          { key: "manager", label: "Project Manager", type: "text", placeholder: "e.g. John Doe", required: true },
          { key: "startDate", label: "Expected Start Date", type: "date", placeholder: "e.g. October 10", required: true },
          { key: "deadline", label: "Expected Deadline", type: "date", placeholder: "e.g. December 20", required: true },
          { key: "priority", label: "Project Priority", type: "select", options: ["Low", "Medium", "High", "Critical"], placeholder: "Select priority", required: true },
        ],
      },
      {
        id: "create_task",
        label: "Create New Task",
        description: "Assign a task to team members with due date",
        triggers: ["create task", "new task", "add task", "assign task"],
        fields: [
          { key: "title", label: "Task Title", type: "text", placeholder: "e.g. API Integration", required: true },
          { key: "projectName", label: "Associated Project", type: "text", placeholder: "e.g. Mobile App Development", required: true },
          { key: "assignee", label: "Assignee Name", type: "text", placeholder: "e.g. Sarah Smith", required: true },
          { key: "dueDate", label: "Due Date", type: "date", placeholder: "e.g. Nov 15", required: true },
          { key: "priority", label: "Task Priority", type: "select", options: ["Low", "Medium", "High"], placeholder: "Select priority", required: true },
        ],
      },
      {
        id: "add_milestone",
        label: "Add Project Milestone",
        description: "Define a major phase delivery milestone",
        triggers: ["add milestone", "new milestone", "create milestone"],
        fields: [
          { key: "title", label: "Milestone Title", type: "text", placeholder: "e.g. Beta Version Release", required: true },
          { key: "targetDate", label: "Target Delivery Date", type: "date", placeholder: "e.g. Nov 30", required: true },
          { key: "deliverable", label: "Key Deliverable Description", type: "text", placeholder: "e.g. User authentication & dashboard", required: true },
        ],
      },
    ],
  },
  fms: {
    id: "fms",
    name: "Financial Management System",
    shortCode: "FMS",
    description: "Manage invoices, expenses, payments & fiscal reports",
    quickPrompts: [
      "Record an expense",
      "Create a client invoice",
      "Record incoming payment",
      "Check overall monthly revenue",
    ],
    faq: {
      revenue: "Total Q3 revenue is $245,000 with net operating margin of 34.2%.",
      expenses: "Monthly operational expenses are tracked under FMS > Expenses.",
    },
    actions: [
      {
        id: "record_expense",
        label: "Record Expense",
        description: "Log an operational expense or vendor payment",
        triggers: ["record expense", "new expense", "add expense", "log expense", "create expense"],
        fields: [
          { key: "category", label: "Expense Category", type: "select", options: ["Software & Cloud", "Office Supplies", "Vendor Services", "Marketing", "Travel"], placeholder: "Select category", required: true },
          { key: "amount", label: "Amount ($)", type: "number", placeholder: "e.g. 450", required: true },
          { key: "vendor", label: "Vendor / Recipient Name", type: "text", placeholder: "e.g. AWS Cloud Services", required: true },
          { key: "expenseDate", label: "Expense Date", type: "date", placeholder: "e.g. Oct 03", required: true },
          { key: "paymentMethod", label: "Payment Method", type: "select", options: ["Corporate Credit Card", "Bank Transfer", "Petty Cash"], placeholder: "Select method", required: true },
        ],
      },
      {
        id: "create_invoice",
        label: "Create Invoice",
        description: "Generate a customer billing invoice",
        triggers: ["create invoice", "new invoice", "generate invoice", "add invoice"],
        fields: [
          { key: "clientName", label: "Client / Company Name", type: "text", placeholder: "e.g. Acme Corp", required: true },
          { key: "serviceDescription", label: "Line Item Description", type: "text", placeholder: "e.g. Q4 Software Consulting", required: true },
          { key: "amount", label: "Total Amount ($)", type: "number", placeholder: "e.g. 3500", required: true },
          { key: "dueDate", label: "Invoice Payment Due Date", type: "date", placeholder: "e.g. Oct 30", required: true },
        ],
      },
    ],
  },
  hrms: {
    id: "hrms",
    name: "Human Resource Management",
    shortCode: "HRMS",
    description: "Manage employees, payroll, attendance & leave requests",
    quickPrompts: [
      "Add a new employee",
      "Apply for leave",
      "Log employee attendance",
      "Check department headcount",
    ],
    faq: {
      headcount: "Active employee headcount is currently 142 across Engineering, Product, and Sales.",
      leavePolicy: "Standard paid leave allowance is 24 days per calendar year.",
    },
    actions: [
      {
        id: "add_employee",
        label: "Add New Employee",
        description: "Onboard a new team member to HRMS",
        triggers: ["add employee", "new employee", "onboard employee", "create employee"],
        fields: [
          { key: "fullName", label: "Employee Full Name", type: "text", placeholder: "e.g. Alex Johnson", required: true },
          { key: "email", label: "Corporate Email Address", type: "text", placeholder: "e.g. alex@company.com", required: true },
          { key: "department", label: "Department", type: "select", options: ["Engineering", "Product Design", "Human Resources", "Sales & Marketing", "Finance"], placeholder: "Select department", required: true },
          { key: "designation", label: "Job Title / Role", type: "text", placeholder: "e.g. Senior Frontend Developer", required: true },
          { key: "startDate", label: "Joining Date", type: "date", placeholder: "e.g. Nov 01", required: true },
        ],
      },
      {
        id: "apply_leave",
        label: "Apply for Leave",
        description: "Submit a staff leave request",
        triggers: ["apply leave", "request leave", "new leave", "take leave"],
        fields: [
          { key: "employeeName", label: "Employee Name", type: "text", placeholder: "e.g. Alex Johnson", required: true },
          { key: "leaveType", label: "Leave Type", type: "select", options: ["Casual Leave", "Sick Leave", "Earned Leave", "Maternity/Paternity"], placeholder: "Select leave type", required: true },
          { key: "startDate", label: "Leave Start Date", type: "date", placeholder: "e.g. Oct 15", required: true },
          { key: "endDate", label: "Leave End Date", type: "date", placeholder: "e.g. Oct 18", required: true },
          { key: "reason", label: "Reason for Leave", type: "text", placeholder: "e.g. Personal family event", required: true },
        ],
      },
    ],
  },
  lms: {
    id: "lms",
    name: "Lead Management System",
    shortCode: "LMS",
    description: "Track leads, deals, pipelines & sales conversions",
    quickPrompts: [
      "Create a new lead",
      "Schedule lead follow-up",
      "Update lead deal stage",
      "Show pipeline overview",
    ],
    faq: {
      pipeline: "Current active sales pipeline has 34 qualified leads valued at $180,000.",
    },
    actions: [
      {
        id: "create_lead",
        label: "Create New Lead",
        description: "Register a prospective client in the sales pipeline",
        triggers: ["create lead", "new lead", "add lead", "register lead"],
        fields: [
          { key: "leadName", label: "Lead / Prospect Name", type: "text", placeholder: "e.g. Robert Vance", required: true },
          { key: "company", label: "Company Name", type: "text", placeholder: "e.g. Vance Refrigeration", required: true },
          { key: "email", label: "Contact Email", type: "text", placeholder: "e.g. robert@vance.com", required: true },
          { key: "dealValue", label: "Estimated Deal Value ($)", type: "number", placeholder: "e.g. 15000", required: true },
          { key: "source", label: "Lead Source", type: "select", options: ["Website Inbound", "LinkedIn Outbound", "Referral", "Trade Show"], placeholder: "Select source", required: true },
        ],
      },
      {
        id: "schedule_followup",
        label: "Schedule Lead Follow-up",
        description: "Book a call or email follow-up task with lead",
        triggers: ["schedule follow-up", "follow up", "add follow up", "schedule call"],
        fields: [
          { key: "leadName", label: "Lead Name", type: "text", placeholder: "e.g. Robert Vance", required: true },
          { key: "followUpDate", label: "Follow-up Date & Time", type: "date", placeholder: "e.g. Oct 12 at 2:00 PM", required: true },
          { key: "notes", label: "Action Item / Notes", type: "text", placeholder: "e.g. Demo SaaS pricing structure", required: true },
        ],
      },
    ],
  },
  cms: {
    id: "cms",
    name: "Content Management System",
    shortCode: "CMS",
    description: "Manage website pages, navigation, media & site settings",
    quickPrompts: [
      "Create a new page",
      "Add navigation link",
      "Upload media asset",
      "Check published pages count",
    ],
    faq: {
      pages: "There are currently 18 published pages and 3 draft landing pages.",
    },
    actions: [
      {
        id: "create_page",
        label: "Create New Page",
        description: "Publish or draft a new website content page",
        triggers: ["create page", "new page", "add page", "publish page"],
        fields: [
          { key: "title", label: "Page Title", type: "text", placeholder: "e.g. Enterprise Solutions", required: true },
          { key: "slug", label: "URL Slug", type: "text", placeholder: "e.g. /enterprise-solutions", required: true },
          { key: "author", label: "Author / Editor", type: "text", placeholder: "e.g. CMS Admin", required: true },
          { key: "status", label: "Publish Status", type: "select", options: ["Draft", "Published", "Scheduled"], placeholder: "Select status", required: true },
        ],
      },
    ],
  },
  tms: {
    id: "tms",
    name: "Training Management System",
    shortCode: "TMS",
    description: "Manage courses, enrollments, certifications & student progress",
    quickPrompts: [
      "Create a training course",
      "Enroll student in course",
      "Issue training certificate",
      "List active courses",
    ],
    faq: {
      courses: "TMS offers 12 active certification courses with over 450 enrolled students.",
    },
    actions: [
      {
        id: "create_course",
        label: "Create Training Course",
        description: "Set up a new educational training course",
        triggers: ["create course", "new course", "add course", "publish course"],
        fields: [
          { key: "courseTitle", label: "Course Title", type: "text", placeholder: "e.g. Cybersecurity Fundamentals", required: true },
          { key: "instructor", label: "Instructor Name", type: "text", placeholder: "e.g. Dr. Emily Carter", required: true },
          { key: "category", label: "Category", type: "select", options: ["Technical Development", "Compliance & Safety", "Leadership", "Product Training"], placeholder: "Select category", required: true },
          { key: "durationHours", label: "Total Duration (Hours)", type: "number", placeholder: "e.g. 20", required: true },
        ],
      },
      {
        id: "enroll_student",
        label: "Enroll Student",
        description: "Register a candidate into a course",
        triggers: ["enroll student", "add student", "enroll user", "new enrollment"],
        fields: [
          { key: "studentName", label: "Student Full Name", type: "text", placeholder: "e.g. Michael Scott", required: true },
          { key: "courseTitle", label: "Target Course Title", type: "text", placeholder: "e.g. Cybersecurity Fundamentals", required: true },
          { key: "startDate", label: "Enrollment Start Date", type: "date", placeholder: "e.g. Oct 10", required: true },
        ],
      },
    ],
  },
  sop: {
    id: "sop",
    name: "Standard Operating Procedures",
    shortCode: "SOP",
    description: "Manage compliance docs, operational standards & approvals",
    quickPrompts: [
      "Create new SOP document",
      "Request SOP review",
      "List active compliance procedures",
    ],
    faq: {
      sopCount: "Total 28 approved SOP documents active across company operations.",
    },
    actions: [
      {
        id: "create_sop",
        label: "Create SOP Document",
        description: "Author a new operational standard procedure",
        triggers: ["create sop", "new sop", "add sop", "draft sop"],
        fields: [
          { key: "title", label: "SOP Document Title", type: "text", placeholder: "e.g. Data Security & Encryption Policy", required: true },
          { key: "department", label: "Department Scope", type: "select", options: ["IT Infrastructure", "Customer Success", "Operations", "Finance"], placeholder: "Select department", required: true },
          { key: "version", label: "Initial Version", type: "text", placeholder: "e.g. v1.0", required: true },
          { key: "owner", label: "Document Owner", type: "text", placeholder: "e.g. Security Team", required: true },
        ],
      },
    ],
  },
  ots: {
    id: "ots",
    name: "Online Testing System",
    shortCode: "OTS",
    description: "Manage test papers, questions, candidate evaluations & results",
    quickPrompts: [
      "Create online test",
      "Assign candidate to test",
      "View evaluation summary",
    ],
    faq: {
      tests: "OTS has 15 standardized evaluation papers active for recruitment and internal skills assessment.",
    },
    actions: [
      {
        id: "create_test",
        label: "Create Online Test",
        description: "Build an assessment exam paper",
        triggers: ["create test", "new test", "add test", "build test"],
        fields: [
          { key: "testTitle", label: "Test Title", type: "text", placeholder: "e.g. Fullstack React & Node Skill Assessment", required: true },
          { key: "timeLimitMinutes", label: "Time Limit (Minutes)", type: "number", placeholder: "e.g. 60", required: true },
          { key: "passPercentage", label: "Passing Score (%)", type: "number", placeholder: "e.g. 75", required: true },
        ],
      },
    ],
  },
  seo: {
    id: "seo",
    name: "SEO Management System",
    shortCode: "SEO",
    description: "Manage technical SEO audits, keyword rankings & backlinks",
    quickPrompts: [
      "Add target keyword",
      "Create SEO audit task",
      "Show organic traffic summary",
    ],
    faq: {
      keywords: "Tracking 120 primary keywords with 42 ranked in Top 10 search results.",
    },
    actions: [
      {
        id: "add_keyword",
        label: "Add Target Keyword",
        description: "Track search ranking for a focus keyword",
        triggers: ["add keyword", "track keyword", "new keyword"],
        fields: [
          { key: "keyword", label: "Target Keyword Phrase", type: "text", placeholder: "e.g. enterprise SaaS ERP software", required: true },
          { key: "targetUrl", label: "Target Landing Page", type: "text", placeholder: "e.g. /products/saas-erp", required: true },
          { key: "priority", label: "Keyword Priority", type: "select", options: ["High", "Medium", "Low"], placeholder: "Select priority", required: true },
        ],
      },
    ],
  },
  smms: {
    id: "smms",
    name: "Social Media Management",
    shortCode: "SMMS",
    description: "Schedule social posts, manage campaigns & track engagement",
    quickPrompts: [
      "Create social media post",
      "Schedule social campaign",
      "View channel performance",
    ],
    faq: {
      socialStats: "Connected channels: LinkedIn, Twitter/X, Instagram with 48k total followers.",
    },
    actions: [
      {
        id: "create_post",
        label: "Create Social Post",
        description: "Draft and schedule a broadcast social post",
        triggers: ["create post", "new post", "schedule post", "add post"],
        fields: [
          { key: "platform", label: "Social Platform", type: "select", options: ["LinkedIn", "Twitter/X", "Instagram", "Facebook"], placeholder: "Select platform", required: true },
          { key: "caption", label: "Post Content / Caption", type: "text", placeholder: "e.g. Exciting product updates launched today! 🚀", required: true },
          { key: "scheduledTime", label: "Scheduled Time", type: "date", placeholder: "e.g. Oct 10 at 10:00 AM", required: true },
        ],
      },
    ],
  },
  lpms: {
    id: "lpms",
    name: "Legal & Process Management",
    shortCode: "LPMS",
    description: "Manage legal workflows, document approvals & maker templates",
    quickPrompts: [
      "Create legal workflow",
      "Add contract template",
      "Check pending approvals",
    ],
    faq: {
      legalDocs: "14 active non-disclosure & vendor agreements currently undergoing legal review.",
    },
    actions: [
      {
        id: "create_workflow",
        label: "Create Legal Workflow",
        description: "Initiate a contract approval process",
        triggers: ["create workflow", "new workflow", "legal workflow", "add workflow"],
        fields: [
          { key: "workflowName", label: "Workflow Title", type: "text", placeholder: "e.g. Enterprise Master Services Agreement", required: true },
          { key: "clientName", label: "Counterparty / Client Name", type: "text", placeholder: "e.g. Global Tech LLC", required: true },
          { key: "reviewer", label: "Lead Legal Reviewer", type: "text", placeholder: "e.g. Attorney David Ross", required: true },
        ],
      },
    ],
  },
  prms: {
    id: "prms",
    name: "Procurement Management",
    shortCode: "PRMS",
    description: "Manage purchase orders, vendor items & procurement workflow",
    quickPrompts: [
      "Create purchase order",
      "Add vendor item",
      "Check open purchase orders",
    ],
    faq: {
      poCount: "9 active Purchase Orders pending vendor fulfillment totaling $68,400.",
    },
    actions: [
      {
        id: "create_po",
        label: "Create Purchase Order",
        description: "Draft a formal PO for vendor items",
        triggers: ["create po", "create purchase order", "new purchase order", "new po"],
        fields: [
          { key: "vendorName", label: "Vendor Name", type: "text", placeholder: "e.g. Dell Enterprise Hardware", required: true },
          { key: "itemDescription", label: "Items / Hardware Summary", type: "text", placeholder: "e.g. 10x Developer Laptops", required: true },
          { key: "totalCost", label: "Total Estimated Cost ($)", type: "number", placeholder: "e.g. 22000", required: true },
          { key: "deliveryDate", label: "Expected Delivery Date", type: "date", placeholder: "e.g. Nov 12", required: true },
        ],
      },
    ],
  },
  aibots: {
    id: "aibots",
    name: "AI Bots Management",
    shortCode: "AIBOTS",
    description: "Configure custom AI bots, knowledge bases & chatbot workflows",
    quickPrompts: ["Create new AI bot", "Upload knowledge base PDF", "Test bot response"],
    faq: { status: "4 active AI bots deployed across customer support and internal helpdesk." },
    actions: [
      {
        id: "create_bot",
        label: "Create Custom AI Bot",
        description: "Configure an autonomous AI assistant bot",
        triggers: ["create bot", "new bot", "add bot", "create ai bot"],
        fields: [
          { key: "botName", label: "Bot Name", type: "text", placeholder: "e.g. Customer Support Bot v2", required: true },
          { key: "purpose", label: "Bot Purpose / System Persona", type: "text", placeholder: "e.g. Answer tier-1 product pricing & technical FAQs", required: true },
          { key: "model", label: "AI Language Model", type: "select", options: ["Gemini 1.5 Pro", "GPT-4o", "Claude 3.5 Sonnet"], placeholder: "Select model", required: true },
        ],
      },
    ],
  },
  dlms: {
    id: "dlms",
    name: "Document Lifecycle Management",
    shortCode: "DLMS",
    description: "Manage document vault, versions & digital signatures",
    quickPrompts: ["Upload vault document", "Request digital signature", "Check archived files"],
    faq: { vault: "DLMS stores 1,420 encrypted compliance files with 99.99% availability." },
    actions: [
      {
        id: "upload_doc",
        label: "Vault Document Upload",
        description: "Register a secure file into DLMS vault",
        triggers: ["upload document", "new document", "add file", "vault upload"],
        fields: [
          { key: "docTitle", label: "Document Title", type: "text", placeholder: "e.g. Annual Audit Report 2026", required: true },
          { key: "classification", label: "Security Classification", type: "select", options: ["Confidential", "Internal Only", "Public", "Restricted"], placeholder: "Select level", required: true },
        ],
      },
    ],
  },
  hub: {
    id: "hub",
    name: "Workspace Hub",
    shortCode: "HUB",
    description: "Central command center & app workspace switcher",
    quickPrompts: ["Summarize workspace health", "Manage team workspaces", "View app modules"],
    faq: { workspace: "Workspace Hub integrates 19 enterprise operational modules seamlessly." },
    actions: [],
  },
  intelligence: {
    id: "intelligence",
    name: "Business Intelligence",
    shortCode: "INTEL",
    description: "Analytics, metrics, custom data queries & reporting dashboards",
    quickPrompts: ["Generate executive dashboard", "Run cross-module query", "Export metric report"],
    faq: { bi: "Intelligence engine analyzes real-time signals across all 19 panel databases." },
    actions: [],
  },
  messenger: {
    id: "messenger",
    name: "Team Messenger",
    shortCode: "MSG",
    description: "Direct messaging, group channels, announcements & calls",
    quickPrompts: ["Create group channel", "Send company broadcast announcement", "Search team chat logs"],
    faq: { messaging: "Messenger supports end-to-end encrypted channel communications." },
    actions: [],
  },
  portal: {
    id: "portal",
    name: "Client Portal",
    shortCode: "PORTAL",
    description: "Client overview, invoices, downloads & support tickets",
    quickPrompts: ["View client invoices", "Check support tickets", "Download project deliverables"],
    faq: { portal: "Client portal provides 24/7 self-service invoice settlement & ticket tracking." },
    actions: [],
  },
  support: {
    id: "support",
    name: "Help & Support",
    shortCode: "HELP",
    description: "Get help, send requests to the platform support team and track their progress",
    quickPrompts: [
      "How do I report a bug?",
      "How do I send a feature request?",
      "Where can I see my requests?",
      "Can I attach a screenshot?",
    ],
    faq: {
      bug: "To report a bug, open **New Request** and choose **Bug Report**. Your panel, page, browser and device are captured automatically — just describe what went wrong, add steps to reproduce, and attach a screenshot if you can (you can paste one straight into the description box).",
      feature: "To suggest something new, open **New Request** and choose **Feature Request** or **Feature Improvement**, then explain the business need. The support team reviews every request and replies in the request thread.",
      screenshot: "Yes. On **New Request** (and when replying) use **Attach screenshot or file**, or paste an image into the text box. You can attach up to 5 images, PDFs or text files, 4 MB each.",
      attach: "Yes. On **New Request** (and when replying) use **Attach screenshot or file**, or paste an image into the text box. You can attach up to 5 images, PDFs or text files, 4 MB each.",
      "my request": "Open **My Requests** in the sidebar to see everything your company has sent, filter by status, and open a request to read replies or answer. The **Dashboard** shows counts and anything waiting for your reply.",
      track: "Open **My Requests** in the sidebar to see everything your company has sent, filter by status, and open a request to read replies or answer. The **Dashboard** shows counts and anything waiting for your reply.",
      status: "A request moves through the stages the support team uses to handle it (for example submitted, in progress, waiting for you, resolved, closed). Open it from **My Requests** to see the current status and the full conversation.",
      reply: "Open the request from **My Requests** and use the reply box at the bottom. If a request was marked resolved and the problem is still there, replying reopens it. A closed request can't be replied to — create a new one.",
      notification: "When the support team replies or changes the status of your request you get a notification — see **Updates** in the sidebar or the bell in the top bar.",
      assistant: "Open **Help Assistant** (or the help button in any panel's top bar) and ask in your own words. It answers from the official help content, and if it can't solve the problem it prepares a support request for you to review and send.",
      help: "Try the **Help Assistant** for instant answers, browse the **Help Center** for guides, or send a request from **New Request** if you still need the support team.",
    },
    actions: [],
  },
  platform: {
    id: "platform",
    name: "Platform Administration",
    shortCode: "ADMIN",
    description: "Manage workspace subscriptions, plans, billing & system audit logs",
    quickPrompts: ["View subscription usage", "Check audit logs", "Manage platform users"],
    faq: { platform: "Platform Admin manages workspace licensing, RBAC policies & API limits." },
    actions: [],
  },
};

// Cross-Panel Intention Resolver
export function checkCrossPanelRequest(input: string, currentPanelId: string): { isCrossPanel: boolean; targetPanelName?: string; targetPanelId?: string } {
  const lower = input.toLowerCase();

  const crossPanelRules: { keywords: string[]; targetPanelId: string; targetPanelName: string }[] = [
    { keywords: ["invoice", "expense", "receipt", "payment", "revenue"], targetPanelId: "fms", targetPanelName: "Financial Management (FMS)" },
    { keywords: ["employee", "payroll", "leave", "attendance", "headcount"], targetPanelId: "hrms", targetPanelName: "Human Resource Management (HRMS)" },
    { keywords: ["project", "milestone", "pms task"], targetPanelId: "pms", targetPanelName: "Project Management (PMS)" },
    { keywords: ["lead", "prospect", "pipeline"], targetPanelId: "lms", targetPanelName: "Lead Management (LMS)" },
    { keywords: ["page", "slug", "cms site"], targetPanelId: "cms", targetPanelName: "Content Management (CMS)" },
    { keywords: ["course", "enrollment", "student"], targetPanelId: "tms", targetPanelName: "Training Management (TMS)" },
    { keywords: ["sop", "compliance doc"], targetPanelId: "sop", targetPanelName: "Standard Operating Procedures (SOP)" },
    { keywords: ["exam paper", "test score"], targetPanelId: "ots", targetPanelName: "Online Testing System (OTS)" },
    { keywords: ["keyword", "backlink", "seo audit"], targetPanelId: "seo", targetPanelName: "SEO Management System" },
    { keywords: ["social post", "tweet", "linkedin post"], targetPanelId: "smms", targetPanelName: "Social Media Management (SMMS)" },
    { keywords: ["legal agreement", "maker type"], targetPanelId: "lpms", targetPanelName: "Legal & Process Management (LPMS)" },
    { keywords: ["purchase order", "vendor item"], targetPanelId: "prms", targetPanelName: "Procurement Management (PRMS)" },
  ];

  for (const rule of crossPanelRules) {
    if (rule.targetPanelId !== currentPanelId) {
      if (rule.keywords.some((kw) => lower.includes(kw))) {
        return { isCrossPanel: true, targetPanelId: rule.targetPanelId, targetPanelName: rule.targetPanelName };
      }
    }
  }

  return { isCrossPanel: false };
}

// Engine Processing Logic
export function processPanelMessage(
  userText: string,
  panelId: string,
  currentState: AgenticFlowState | null,
  userRoles?: string[],
  /** Panel Registry names, so the assistant calls panels what every listing calls them. */
  registry?: { name?: string; shortName?: string; description?: string; names?: Record<string, string> }
): {
  nextState: AgenticFlowState | null;
  assistantMessages: MessageItem[];
} {
  const baseConfig = PANELS_CONFIG[panelId] || PANELS_CONFIG.pms;
  const panel = { ...baseConfig, ...(registry?.name ? { name: registry.name } : {}), ...(registry?.shortName ? { shortCode: registry.shortName } : {}), ...(registry?.description ? { description: registry.description } : {}) };
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // 1. If user is currently in an active multi-step flow
  if (currentState && !currentState.isCompleted) {
    // Handling Confirmation Phase
    if (currentState.isAwaitingConfirmation) {
      const trimmed = userText.trim().toLowerCase();
      if (trimmed === "yes" || trimmed === "confirm" || trimmed === "create" || trimmed === "proceed" || trimmed.includes("confirm")) {
        // Execute Action Creation
        const recordId = `${panel.shortCode}-${Math.floor(10000 + Math.random() * 90000)}`;
        const title = currentState.collectedData[currentState.fields[0].key] || currentState.actionLabel;
        
        const detailsArray = currentState.fields.map((f) => ({
          label: f.label,
          value: String(currentState.collectedData[f.key] || "N/A"),
        }));

        const completedState: AgenticFlowState = {
          ...currentState,
          isAwaitingConfirmation: false,
          isCompleted: true,
          createdRecord: {
            id: recordId,
            title,
            panelId: panel.id,
            details: currentState.collectedData,
            createdAt: new Date().toISOString(),
          },
        };

        return {
          nextState: completedState,
          assistantMessages: [
            {
              id: `msg-${Date.now()}`,
              sender: "assistant",
              text: `✅ **Action Completed Successfully!**\n\nThe record has been validated and created in the **${panel.name}** database.`,
              timestamp,
              successCard: {
                recordId,
                title,
                panelName: panel.name,
                details: detailsArray,
                status: "ACTIVE & SAVED",
              },
            },
          ],
        };
      } else if (trimmed === "no" || trimmed === "cancel") {
        return {
          nextState: null,
          assistantMessages: [
            {
              id: `msg-${Date.now()}`,
              sender: "assistant",
              text: `❌ Action cancelled. The ${currentState.actionLabel} request was discarded. How else can I assist you in **${panel.name}**?`,
              timestamp,
            },
          ],
        };
      } else {
        return {
          nextState: currentState,
          assistantMessages: [
            {
              id: `msg-${Date.now()}`,
              sender: "assistant",
              text: `Please click **Confirm & Create** or type **"Confirm"** to finalize this record in **${panel.name}**, or type **"Cancel"** to abort.`,
              timestamp,
            },
          ],
        };
      }
    }

    // Step-by-step field collection phase
    const currentField = currentState.fields[currentState.currentStepIndex];
    const val = userText.trim();

    // Field validation
    if (currentField.required && !val) {
      return {
        nextState: currentState,
        assistantMessages: [
          {
            id: `msg-${Date.now()}`,
            sender: "assistant",
            text: `⚠️ **${currentField.label}** is required. Please provide a valid response.`,
            timestamp,
          },
        ],
      };
    }

    if (currentField.type === "number" && isNaN(Number(val))) {
      return {
        nextState: currentState,
        assistantMessages: [
          {
            id: `msg-${Date.now()}`,
            sender: "assistant",
            text: `⚠️ Please enter a valid numerical value for **${currentField.label}**.`,
            timestamp,
          },
        ],
      };
    }

    // Save field response
    const updatedCollected = { ...currentState.collectedData, [currentField.key]: val };
    const nextStepIndex = currentState.currentStepIndex + 1;

    // Check if more fields remain
    if (nextStepIndex < currentState.fields.length) {
      const nextField = currentState.fields[nextStepIndex];
      const updatedState: AgenticFlowState = {
        ...currentState,
        currentStepIndex: nextStepIndex,
        collectedData: updatedCollected,
      };

      let promptText = `Got it! Next question:\n\n**${nextField.label}**?`;
      if (nextField.options) {
        promptText += `\n*(Options: ${nextField.options.join(", ")})*`;
      }

      return {
        nextState: updatedState,
        assistantMessages: [
          {
            id: `msg-${Date.now()}`,
            sender: "assistant",
            text: promptText,
            timestamp,
            stepInfo: {
              current: nextStepIndex + 1,
              total: currentState.fields.length,
              fieldName: nextField.label,
            },
          },
        ],
      };
    } else {
      // All fields collected! Show summary confirmation card
      const awaitingState: AgenticFlowState = {
        ...currentState,
        currentStepIndex: nextStepIndex,
        collectedData: updatedCollected,
        isAwaitingConfirmation: true,
      };

      const fieldsSummary = currentState.fields.map((f) => ({
        label: f.label,
        value: String(updatedCollected[f.key]),
      }));

      return {
        nextState: awaitingState,
        assistantMessages: [
          {
            id: `msg-${Date.now()}`,
            sender: "assistant",
            text: `Thank you! All required information for **${currentState.actionLabel}** has been collected and validated.\n\nPlease review the details below before creation:`,
            timestamp,
            confirmationCard: {
              actionLabel: currentState.actionLabel,
              fields: fieldsSummary,
            },
          },
        ],
      };
    }
  }

  // 2. Check Role / RBAC restrictions if applicable
  if (userRoles && (userRoles.includes("viewer") || userRoles.includes("guest"))) {
    const isTryingToCreate = ["create", "add", "new", "record", "upload"].some((w) => userText.toLowerCase().includes(w));
    if (isTryingToCreate) {
      return {
        nextState: null,
        assistantMessages: [
          {
            id: `msg-${Date.now()}`,
            sender: "assistant",
            text: `🔒 **Permission Restricted (RBAC)**: Your account holds **Read-Only / Viewer** permissions for **${panel.name}**. Creating or modifying records is restricted.`,
            timestamp,
          },
        ],
      };
    }
  }

  // 3. Check for Cross-Panel request
  const crossCheck = checkCrossPanelRequest(userText, panel.id);
  if (crossCheck.isCrossPanel && crossCheck.targetPanelName) {
    crossCheck.targetPanelName = (crossCheck.targetPanelId && registry?.names?.[crossCheck.targetPanelId]) || crossCheck.targetPanelName;
    return {
      nextState: null,
      assistantMessages: [
        {
          id: `msg-${Date.now()}`,
          sender: "assistant",
          text: `ℹ️ **Panel Scope Notice**:\n\nThis request involves **${crossCheck.targetPanelName}**. You are currently inside the **${panel.name}** Ask AI assistant.\n\nTo manage items for ${crossCheck.targetPanelName}, please switch to the **${crossCheck.targetPanelName}** panel and open Ask AI from there.`,
          timestamp,
          warningNotice: `Scope: Restricted to ${panel.shortCode}`,
        },
      ],
    };
  }

  // 4. Intent Recognition: Trigger multi-step flow if matching action found
  const lowerText = userText.toLowerCase();
  const matchedAction = panel.actions.find((act) =>
    act.triggers.some((trig) => lowerText.includes(trig))
  );

  if (matchedAction) {
    const initialState: AgenticFlowState = {
      actionId: matchedAction.id,
      actionLabel: matchedAction.label,
      panelId: panel.id,
      fields: matchedAction.fields,
      currentStepIndex: 0,
      collectedData: {},
      isAwaitingConfirmation: false,
      isCompleted: false,
    };

    const firstField = matchedAction.fields[0];
    let initialPrompt = `I'll guide you step by step to **${matchedAction.label}** in ${panel.name}.\n\nFirst, **${firstField.label}**?`;
    if (firstField.options) {
      initialPrompt += `\n*(Options: ${firstField.options.join(", ")})*`;
    }

    return {
      nextState: initialState,
      assistantMessages: [
        {
          id: `msg-${Date.now()}`,
          sender: "assistant",
          text: initialPrompt,
          timestamp,
          stepInfo: {
            current: 1,
            total: matchedAction.fields.length,
            fieldName: firstField.label,
          },
        },
      ],
    };
  }

  // 5. Standard Q&A & Info Response
  let responseText = "";
  for (const [key, val] of Object.entries(panel.faq)) {
    if (lowerText.includes(key.toLowerCase())) {
      responseText = val;
      break;
    }
  }

  if (!responseText) {
    responseText = `I am your context-aware **${panel.name} AI Agent**. I can help you query panel status, answer questions, or automate multi-step tasks like ${panel.quickPrompts.slice(0, 2).map((p) => `"${p}"`).join(" or ")}.\n\nHow can I help you in **${panel.shortCode}** today?`;
  }

  return {
    nextState: null,
    assistantMessages: [
      {
        id: `msg-${Date.now()}`,
        sender: "assistant",
        text: responseText,
        timestamp,
      },
    ],
  };
}
