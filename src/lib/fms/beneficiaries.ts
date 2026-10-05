import "server-only";
import { getDb } from "@/lib/mongodb";
import { newId, createStamp, updateStamp, notDeleted, type AuditFields } from "@/lib/fms/db";

export const BENEFICIARIES_COLLECTION = "fms_beneficiaries";

export type BeneficiaryEntity = "vendor" | "employee" | "client" | "student" | "other";

export interface BeneficiaryBankAccount extends AuditFields {
  _id: string;
  entityType: BeneficiaryEntity;
  entityId: string;
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  accountNumberLast4: string;
  ifsc: string;
  branch: string | null;
  upiId: string | null;
  isVerified: boolean;
  notes: string | null;
}

let indexesEnsured = false;
async function getCollection() {
  const db = await getDb();
  const collection = db.collection<BeneficiaryBankAccount>(BENEFICIARIES_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      collection.createIndex({ entityType: 1, entityId: 1 }).catch(() => {}),
      collection.createIndex({ beneficiaryName: 1 }).catch(() => {}),
    ]);
  }
  return collection;
}

export async function listBeneficiaries(entityType?: BeneficiaryEntity): Promise<BeneficiaryBankAccount[]> {
  const collection = await getCollection();
  const filter: Record<string, unknown> = { ...notDeleted };
  if (entityType) filter.entityType = entityType;
  return collection.find(filter).sort({ beneficiaryName: 1 }).toArray();
}

export async function getBeneficiaryByEntity(entityType: BeneficiaryEntity, entityId: string): Promise<BeneficiaryBankAccount | null> {
  const collection = await getCollection();
  return collection.findOne({ entityType, entityId, ...notDeleted });
}

export async function saveBeneficiary(
  data: {
    entityType: BeneficiaryEntity;
    entityId: string;
    beneficiaryName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    branch?: string | null;
    upiId?: string | null;
    notes?: string | null;
  },
  actorId: string
): Promise<BeneficiaryBankAccount> {
  const collection = await getCollection();
  const existing = await collection.findOne({ entityType: data.entityType, entityId: data.entityId, ...notDeleted });

  const last4 = data.accountNumber.slice(-4) || "0000";

  if (existing) {
    const patch: Record<string, unknown> = {
      beneficiaryName: data.beneficiaryName,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountNumberLast4: last4,
      ifsc: data.ifsc,
      branch: data.branch ?? null,
      upiId: data.upiId ?? null,
      notes: data.notes ?? null,
      ...updateStamp(actorId),
    };
    const updated = await collection.findOneAndUpdate({ _id: existing._id }, { $set: patch }, { returnDocument: "after" });
    return updated!;
  }

  const doc: BeneficiaryBankAccount = {
    _id: newId(),
    entityType: data.entityType,
    entityId: data.entityId,
    beneficiaryName: data.beneficiaryName,
    bankName: data.bankName,
    accountNumber: data.accountNumber,
    accountNumberLast4: last4,
    ifsc: data.ifsc,
    branch: data.branch ?? null,
    upiId: data.upiId ?? null,
    isVerified: true,
    notes: data.notes ?? null,
    ...createStamp(actorId),
  };

  await collection.insertOne(doc);
  return doc;
}
