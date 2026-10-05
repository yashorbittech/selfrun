import "server-only";
import { getDb } from "@/lib/mongodb";
import { newId, createStamp, updateStamp, notDeleted } from "@/lib/fms/db";
import { recordAudit } from "@/lib/fms/audit";

export const BANK_STATEMENTS_COLLECTION = "fms_bank_statements";
export const SETTLEMENTS_COLLECTION = "fms_gateway_settlements";

export interface BankStatementLine {
  _id: string;
  statementId: string;
  bankAccountId: string;
  transactionDate: Date;
  valueDate: Date;
  description: string;
  referenceNumber: string | null;
  utr: string | null;
  type: "CREDIT" | "DEBIT";
  amount: number;
  balance: number;
  status: "UNRECONCILED" | "MATCHED" | "RECONCILED" | "DISPUTED";
  matchedEntityId?: string | null;
  matchedEntityType?: "PAYMENT_INTENT" | "TRANSACTION" | "SETTLEMENT" | null;
  matchConfidence?: number | null; // 0 to 100
}

export interface GatewaySettlementRecord {
  _id: string;
  settlementId: string;
  provider: string;
  grossAmount: number;
  gatewayFee: number;
  gstOnFee: number;
  netSettlementAmount: number;
  settlementDate: Date;
  status: "PENDING" | "RECONCILED";
  transactionCount: number;
  utr: string | null;
}

let indexesEnsured = false;
async function getCollections() {
  const db = await getDb();
  const statements = db.collection<BankStatementLine>(BANK_STATEMENTS_COLLECTION);
  const settlements = db.collection<GatewaySettlementRecord>(SETTLEMENTS_COLLECTION);

  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      statements.createIndex({ statementId: 1 }).catch(() => {}),
      statements.createIndex({ bankAccountId: 1 }).catch(() => {}),
      statements.createIndex({ utr: 1 }, { sparse: true }).catch(() => {}),
      statements.createIndex({ status: 1 }).catch(() => {}),
      settlements.createIndex({ settlementId: 1 }, { unique: true }).catch(() => {}),
    ]);
  }

  return { statements, settlements };
}

export async function parseAndImportBankStatement(
  bankAccountId: string,
  rows: Array<{
    date: string;
    description: string;
    reference?: string;
    utr?: string;
    type: "CREDIT" | "DEBIT";
    amount: number;
    balance?: number;
  }>,
  actorId: string
): Promise<{ ok: boolean; count: number; statementId: string }> {
  const { statements } = await getCollections();
  const statementId = `STMT_${Date.now()}`;
  const docs: BankStatementLine[] = rows.map((r) => ({
    _id: newId(),
    statementId,
    bankAccountId,
    transactionDate: new Date(r.date),
    valueDate: new Date(r.date),
    description: r.description,
    referenceNumber: r.reference ?? null,
    utr: r.utr ?? null,
    type: r.type,
    amount: Math.abs(r.amount),
    balance: r.balance ?? 0,
    status: "UNRECONCILED",
  }));

  if (docs.length > 0) {
    await statements.insertMany(docs as any);
    await autoMatchBankStatementLines(statementId);
  }

  await recordAudit({
    actorId: actorId || "system",
    actorEmail: null,
    action: "import",
    entity: "bank_statement",
    entityId: statementId,
    entityLabel: `Statement ${statementId}`,
    summary: `Imported ${docs.length} bank statement transactions`,
  });

  return { ok: true, count: docs.length, statementId };
}

export async function autoMatchBankStatementLines(statementId: string): Promise<number> {
  const db = await getDb();
  const { statements } = await getCollections();
  const lines = await statements.find({ statementId, status: "UNRECONCILED" }).toArray();
  let matchedCount = 0;

  for (const line of lines) {
    if (line.utr) {
      const intent = await db.collection("fms_payment_intents").findOne({ utr: line.utr, deletedAt: null });
      if (intent) {
        await statements.updateOne(
          { _id: line._id },
          {
            $set: {
              status: "MATCHED",
              matchedEntityId: String(intent._id),
              matchedEntityType: "PAYMENT_INTENT",
              matchConfidence: 100,
            },
          }
        );
        matchedCount++;
        continue;
      }
    }

    // Amount & Date Fuzzy Matching
    if (line.type === "CREDIT") {
      const candidate = await db.collection("fms_payment_intents").findOne({
        netAmount: line.amount,
        status: "SUCCESS",
        deletedAt: null,
      });

      if (candidate) {
        await statements.updateOne(
          { _id: line._id },
          {
            $set: {
              status: "MATCHED",
              matchedEntityId: String(candidate._id),
              matchedEntityType: "PAYMENT_INTENT",
              matchConfidence: 85,
            },
          }
        );
        matchedCount++;
      }
    }
  }

  return matchedCount;
}

export async function listUnreconciledLines(bankAccountId?: string) {
  const { statements } = await getCollections();
  const filter: Record<string, unknown> = { status: { $in: ["UNRECONCILED", "MATCHED"] } };
  if (bankAccountId) filter.bankAccountId = bankAccountId;

  return statements.find(filter).sort({ transactionDate: -1 }).toArray();
}
