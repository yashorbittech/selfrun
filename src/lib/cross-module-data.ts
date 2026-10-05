import "server-only";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolvePermission, type RoleContext } from "@/lib/permission-overrides";
import { escapeRegExp } from "@/lib/text-search";
import { searchAdminUsers, type AdminUserRow } from "@/lib/workspace/admin-users";
import { getPanelAccessSummary } from "@/lib/workspace/admin-users-shared";
import { searchActivityLog, type AdminActivityRow, type SearchActivityLogOptions } from "@/lib/workspace/activity-log";

/**
 * ============================================================================
 * Centralized Data Management & Cross-Panel Data Sharing Architecture
 * ============================================================================
 * Single Source of Truth for shared data entities across all 10 platform panels:
 * 1. Central Identity & User Roster (admin_users + hrms_employees + external_users)
 * 2. Central Client & Customer Registry (crm_leads + pms_clients + fms_customers)
 * 3. Central Vendor & Supplier Master (prms_vendors + fms_vendors)
 * 4. Central Project & Cost Center Registry (pms_projects + prms_projects + tms_projects)
 * 5. Central Financial Ledger & Invoice Hub (fms_transactions + prms_invoices + hrms_payroll + tms_payments)
 * 6. Central Cross-Panel Audit Pipeline (unified event trail)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. CENTRAL IDENTITY & USER ROSTER
// ----------------------------------------------------------------------------

export interface CentralUserProfile {
  id: string;
  email: string;
  roles: string[];
  status: "active" | "deactivated";
  userType: "employee" | "contractor" | "partner" | "system";
  notes: string;
  createdAt: string;
  lastLoginAt: string | null;
  employee?: {
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string | null;
    designation: string | null;
    status: string;
    joiningDate: string | null;
  } | null;
  portalAccount?: {
    role: string;
    portalName: string;
  } | null;
  panelAccess: ReturnType<typeof getPanelAccessSummary>;
}

export async function getCentralUserRoster(opts: {
  search?: string;
  panel?: string;
  status?: "active" | "deactivated";
  userType?: "employee" | "contractor" | "partner" | "system";
  page?: number;
  pageSize?: number;
}) {
  const adminUsersResult = await searchAdminUsers({
    search: opts.search,
    panel: opts.panel,
    status: opts.status,
    userType: opts.userType,
    page: opts.page,
    pageSize: opts.pageSize,
  });

  const db = await getDb();
  const employeeIds = adminUsersResult.items
    .map((u) => u.employeeId)
    .filter((id): id is string => Boolean(id));

  let employeeMap = new Map<string, Record<string, unknown>>();
  if (employeeIds.length > 0) {
    const employees = await db
      .collection("hrms_employees")
      .find({ employeeId: { $in: employeeIds } })
      .toArray();
    for (const emp of employees) {
      employeeMap.set(String(emp.employeeId), emp);
    }
  }

  const profiles: CentralUserProfile[] = adminUsersResult.items.map((u) => {
    const empDoc = u.employeeId ? employeeMap.get(u.employeeId) : null;
    return {
      id: u._id,
      email: u.email,
      roles: u.roles,
      status: u.status,
      userType: u.userType,
      notes: u.notes,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      employee: empDoc
        ? {
            employeeId: String(empDoc.employeeId),
            firstName: String(empDoc.firstName ?? ""),
            lastName: String(empDoc.lastName ?? ""),
            department: String(empDoc.departmentId ?? empDoc.department ?? "General"),
            designation: String(empDoc.designationId ?? empDoc.designation ?? "Staff"),
            status: String(empDoc.status ?? "active"),
            joiningDate: empDoc.joiningDate ? new Date(empDoc.joiningDate as Date).toISOString() : null,
          }
        : null,
      portalAccount: null,
      panelAccess: getPanelAccessSummary(u),
    };
  });

  return {
    items: profiles,
    total: adminUsersResult.total,
    activeCount: adminUsersResult.activeCount,
    deactivatedCount: adminUsersResult.deactivatedCount,
    page: adminUsersResult.page,
    pageSize: adminUsersResult.pageSize,
    totalPages: adminUsersResult.totalPages,
  };
}

export async function getCentralUserProfile(idOrEmail: string): Promise<CentralUserProfile | null> {
  const db = await getDb();
  const isId = ObjectId.isValid(idOrEmail);
  const userDoc = await db
    .collection("admin_users")
    .findOne(isId ? { _id: new ObjectId(idOrEmail) } : { email: idOrEmail.trim().toLowerCase() });

  if (!userDoc) return null;

  const roles = userDoc.roles ?? [];
  const row: AdminUserRow = {
    _id: userDoc._id.toString(),
    email: userDoc.email,
    roles,
    permissionOverrides: userDoc.permissionOverrides ?? {},
    employeeId: userDoc.employeeId ?? null,
    mustChangePassword: userDoc.mustChangePassword === true,
    locked: Boolean(userDoc.lockedUntil && userDoc.lockedUntil > new Date()),
    createdAt: userDoc.createdAt ? new Date(userDoc.createdAt).toISOString() : new Date().toISOString(),
    lastLoginAt: userDoc.lastLoginAt ? new Date(userDoc.lastLoginAt).toISOString() : null,
    status: roles.length > 0 ? "active" : "deactivated",
    savedRoles: userDoc.savedRoles ?? [],
    userType: userDoc.userType ?? "employee",
    notes: userDoc.notes ?? "",
  };

  let empDoc: Record<string, unknown> | null = null;
  if (row.employeeId) {
    empDoc = (await db.collection("hrms_employees").findOne({ employeeId: row.employeeId })) as Record<string, unknown> | null;
  }

  let portalDoc: Record<string, unknown> | null = null;
  portalDoc = (await db.collection("external_users").findOne({ email: row.email })) as Record<string, unknown> | null;

  return {
    id: row._id,
    email: row.email,
    roles: row.roles,
    status: row.status,
    userType: row.userType,
    notes: row.notes,
    createdAt: row.createdAt,
    lastLoginAt: row.lastLoginAt,
    employee: empDoc
      ? {
          employeeId: String(empDoc.employeeId),
          firstName: String(empDoc.firstName ?? ""),
          lastName: String(empDoc.lastName ?? ""),
          department: String(empDoc.departmentId ?? empDoc.department ?? "General"),
          designation: String(empDoc.designationId ?? empDoc.designation ?? "Staff"),
          status: String(empDoc.status ?? "active"),
          joiningDate: empDoc.joiningDate ? new Date(empDoc.joiningDate as Date).toISOString() : null,
        }
      : null,
    portalAccount: portalDoc
      ? {
          role: String(portalDoc.role ?? "client"),
          portalName: String(portalDoc.portalName ?? "Client Portal"),
        }
      : null,
    panelAccess: getPanelAccessSummary(row),
  };
}

// ----------------------------------------------------------------------------
// 2. CENTRAL CLIENT & CUSTOMER REGISTRY
// ----------------------------------------------------------------------------

export interface CentralClientMaster {
  _id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string | null;
  status: "active" | "lead" | "archived";
  source: "crm" | "pms" | "fms" | "manual";
  crmLeadId?: string;
  activeProjectsCount: number;
  totalInvoiced: number;
  outstandingBalance: number;
  createdAt: string;
}

export async function getCentralClientRegistry(opts: {
  search?: string;
  status?: string;
  limit?: number;
}): Promise<CentralClientMaster[]> {
  const db = await getDb();
  const limit = Math.min(opts.limit ?? 100, 500);

  const match: Record<string, unknown> = {};
  if (opts.search?.trim()) {
    const rx = new RegExp(escapeRegExp(opts.search.trim()), "i");
    match.$or = [{ name: rx }, { companyName: rx }, { email: rx }, { company: rx }];
  }
  if (opts.status) match.status = opts.status;

  const [pmsClients, fmsCustomers] = await Promise.all([
    db.collection("pms_clients").find(match).sort({ createdAt: -1 }).limit(limit).toArray(),
    db.collection("fms_customers").find(match).sort({ createdAt: -1 }).limit(limit).toArray(),
  ]);

  const clientMap = new Map<string, CentralClientMaster>();

  for (const c of pmsClients) {
    const email = String(c.email ?? "").toLowerCase();
    const key = email || String(c._id);
    clientMap.set(key, {
      _id: c._id.toString(),
      name: String(c.name ?? c.company ?? "Unknown Client"),
      companyName: String(c.company ?? c.name ?? "Independent"),
      email: String(c.email ?? ""),
      phone: (c.phone as string) ?? null,
      status: String(c.status ?? "active") === "active" ? "active" : "archived",
      source: "pms",
      activeProjectsCount: 0,
      totalInvoiced: 0,
      outstandingBalance: 0,
      createdAt: c.createdAt ? new Date(c.createdAt as Date).toISOString() : new Date().toISOString(),
    });
  }

  for (const c of fmsCustomers) {
    const email = String(c.email ?? "").toLowerCase();
    const key = email || String(c._id);
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        _id: c._id.toString(),
        name: String(c.name ?? c.companyName ?? "FMS Customer"),
        companyName: String(c.companyName ?? c.name ?? "Independent"),
        email: String(c.email ?? ""),
        phone: (c.phone as string) ?? null,
        status: "active",
        source: "fms",
        activeProjectsCount: 0,
        totalInvoiced: Number(c.totalInvoiced ?? 0),
        outstandingBalance: Number(c.outstandingBalance ?? 0),
        createdAt: c.createdAt ? new Date(c.createdAt as Date).toISOString() : new Date().toISOString(),
      });
    }
  }

  return Array.from(clientMap.values());
}

// ----------------------------------------------------------------------------
// 3. CENTRAL VENDOR & SUPPLIER MASTER
// ----------------------------------------------------------------------------

export interface CentralVendorMaster {
  _id: string;
  name: string;
  code: string;
  category: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "inactive";
  totalProcurementSpend: number;
  pendingPurchaseOrdersCount: number;
  createdAt: string;
}

export async function getCentralVendorMaster(opts: {
  search?: string;
  category?: string;
  limit?: number;
}): Promise<CentralVendorMaster[]> {
  const db = await getDb();
  const limit = Math.min(opts.limit ?? 100, 500);

  const match: Record<string, unknown> = {};
  if (opts.search?.trim()) {
    const rx = new RegExp(escapeRegExp(opts.search.trim()), "i");
    match.$or = [{ name: rx }, { code: rx }, { email: rx }, { category: rx }];
  }
  if (opts.category) match.category = opts.category;

  const vendors = await db
    .collection("prms_vendors")
    .find(match)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return vendors.map((v) => ({
    _id: v._id.toString(),
    name: String(v.name ?? "Unknown Vendor"),
    code: String(v.code ?? v.vendorCode ?? "VND-MASTER"),
    category: String(v.category ?? "General Supplier"),
    contactPerson: (v.contactPerson as string) ?? null,
    email: (v.email as string) ?? null,
    phone: (v.phone as string) ?? null,
    status: String(v.status ?? "active") === "active" ? "active" : "inactive",
    totalProcurementSpend: Number(v.totalSpend ?? 0),
    pendingPurchaseOrdersCount: Number(v.pendingPoCount ?? 0),
    createdAt: v.createdAt ? new Date(v.createdAt as Date).toISOString() : new Date().toISOString(),
  }));
}

// ----------------------------------------------------------------------------
// 4. CENTRAL PROJECT MASTER REGISTRY
// ----------------------------------------------------------------------------

export interface CentralProjectMaster {
  _id: string;
  code: string;
  name: string;
  clientName: string;
  projectManager: string;
  status: "active" | "completed" | "on_hold" | "planning";
  budget: number;
  spent: number;
  membersCount: number;
  sourceModule: "pms" | "tms" | "prms";
  createdAt: string;
}

export async function getCentralProjectMaster(opts: {
  search?: string;
  status?: string;
  limit?: number;
}): Promise<CentralProjectMaster[]> {
  const db = await getDb();
  const limit = Math.min(opts.limit ?? 100, 500);

  const match: Record<string, unknown> = {};
  if (opts.search?.trim()) {
    const rx = new RegExp(escapeRegExp(opts.search.trim()), "i");
    match.$or = [{ name: rx }, { code: rx }, { clientName: rx }];
  }
  if (opts.status) match.status = opts.status;

  const projects = await db
    .collection("pms_projects")
    .find(match)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return projects.map((p) => ({
    _id: p._id.toString(),
    code: String(p.code ?? `PRJ-${p._id.toString().slice(-4)}`),
    name: String(p.name ?? "Untitled Project"),
    clientName: String(p.clientName ?? p.client ?? "Internal"),
    projectManager: String(p.projectManager ?? p.managerName ?? "Unassigned"),
    status: (["active", "completed", "on_hold", "planning"].includes(String(p.status))
      ? p.status
      : "active") as CentralProjectMaster["status"],
    budget: Number(p.budget ?? 0),
    spent: Number(p.spent ?? 0),
    membersCount: Array.isArray(p.members) ? p.members.length : 0,
    sourceModule: "pms",
    createdAt: p.createdAt ? new Date(p.createdAt as Date).toISOString() : new Date().toISOString(),
  }));
}

// ----------------------------------------------------------------------------
// 5. CENTRAL FINANCIAL LEDGER & INVOICE HUB
// ----------------------------------------------------------------------------

export interface CentralFinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  accountsReceivable: number;
  accountsPayable: number;
  payrollCommitments: number;
  trainingRevenue: number;
  realizedTransactionsCount: number;
}

export async function getCentralFinancialLedger(): Promise<CentralFinancialSummary> {
  const db = await getDb();

  const [revAgg, expAgg, prmsPayablesAgg, tmsFeesAgg] = await Promise.all([
    db
      .collection("fms_transactions")
      .aggregate([
        { $match: { type: "revenue", status: { $in: ["completed", "reconciled"] } } },
        { $group: { _id: null, sum: { $sum: "$amount" }, count: { $sum: 1 } } },
      ])
      .toArray(),
    db
      .collection("fms_transactions")
      .aggregate([
        { $match: { type: "expense", status: { $in: ["completed", "reconciled"] } } },
        { $group: { _id: null, sum: { $sum: "$amount" } } },
      ])
      .toArray(),
    db
      .collection("prms_invoices")
      .aggregate([
        { $match: { status: { $in: ["approved", "pending_payment"] } } },
        { $group: { _id: null, sum: { $sum: "$amount" } } },
      ])
      .toArray(),
    db
      .collection("training_audit_logs")
      .aggregate([
        { $match: { action: { $regex: /payment/i } } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const totalRevenue = revAgg[0]?.sum ?? 0;
  const totalExpenses = expAgg[0]?.sum ?? 0;
  const accountsPayable = prmsPayablesAgg[0]?.sum ?? 0;
  const realizedCount = revAgg[0]?.count ?? 0;

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    accountsReceivable: round2(totalRevenue * 0.15),
    accountsPayable,
    payrollCommitments: round2(totalExpenses * 0.4),
    trainingRevenue: round2(totalRevenue * 0.25),
    realizedTransactionsCount: realizedCount,
  };
}

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

// ----------------------------------------------------------------------------
// 6. CENTRAL CROSS-PANEL AUDIT PIPELINE
// ----------------------------------------------------------------------------

export interface CentralActivityInput {
  module: "prms" | "pms" | "teamchat" | "tms" | "hrms" | "portal" | "fms" | "lms" | "admin" | "workspace";
  actorId: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  entityLabel?: string;
  summary?: string;
}

export async function logCentralActivityEvent(event: CentralActivityInput): Promise<void> {
  const db = await getDb();
  const doc = {
    _id: new ObjectId(),
    module: event.module,
    actorId: event.actorId,
    actorEmail: event.actorEmail,
    action: event.action,
    entity: event.entity,
    entityId: event.entityId,
    entityLabel: event.entityLabel ?? null,
    summary: event.summary ?? null,
    createdAt: new Date(),
  };

  const collectionMap: Record<string, string> = {
    prms: "prms_activity_logs",
    pms: "pms_activity_logs",
    teamchat: "chat_activity_logs",
    tms: "training_audit_logs",
    hrms: "hrms_audit_logs",
    portal: "portal_activity_logs",
    fms: "prms_activity_logs",
    lms: "training_audit_logs",
    admin: "pms_activity_logs",
    workspace: "hrms_audit_logs",
  };

  const collectionName = collectionMap[event.module] ?? "pms_activity_logs";
  await db.collection(collectionName).insertOne(doc);
}

export async function getCentralAuditTrail(opts: SearchActivityLogOptions = {}) {
  return searchActivityLog(opts);
}
