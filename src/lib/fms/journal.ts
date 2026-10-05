import "server-only";
import { getDb } from "@/lib/mongodb";
import { newId, nextYearSequence, formatYearCode } from "@/lib/fms/db";
import { type FundAccountType } from "@/lib/fms/constants";
import { getAccount, getAccountByCode, CONTROL_ACCOUNT_CODES } from "@/lib/fms/accounts";
import type { Transaction } from "@/lib/fms/transactions";

/**
 * Double-entry journal (§28/§29 — Phase 5). One journal entry per settled
 * transaction, auto-generated from `fms/transactions.ts`'s
 * `insertTransaction`/`changeTransactionStatus` at the exact same
 * `SETTLED_STATUSES` boundary Phase 4's fund-balance logic already uses —
 * never hand-edited, never posted from a form. Correcting a mistake means
 * reversing the transaction (which reverses its entry), not editing a line.
 *
 * Every entry is exactly two lines and balances by construction — see
 * `postJournalEntryForTransaction` for the account-resolution rules.
 */

export const JOURNAL_ENTRIES_COLLECTION = "fms_journal_entries";
export const JOURNAL_LINES_COLLECTION = "fms_journal_lines";
const FUND_TRANSFERS_COLLECTION = "fms_fund_transfers";
const ENTRY_NUMBER_PREFIX = "JE";

export type JournalSide = "debit" | "credit";

export interface JournalEntry {
  _id: string;
  entryNumber: string;
  /** Null for a fiscal-period closing/reopening entry (see `fms/fiscal-periods.ts`) — every other entry has one. */
  transactionId: string | null;
  transactionNumber: string | null;
  /** Set only on a period closing/reopening entry. */
  periodId: string | null;
  entryDate: Date;
  description: string | null;
  /** Set only on the equal-and-opposite entry posted when a transaction leaves the settled state, or a period is reopened. */
  reversalOfEntryId: string | null;
  createdAt: Date;
  createdBy: string | null;
}

export interface JournalLine {
  _id: string;
  entryId: string;
  entryDate: Date;
  accountId: string;
  accountCode: string;
  accountName: string;
  side: JournalSide;
  amount: number;
  /** The transaction's own currency, unconverted — see `fms/exchange-rates.ts` for base-currency conversion at report time. */
  currency: string;
  transactionId: string | null;
  transactionNumber: string | null;
  description: string | null;
  createdAt: Date;
}

export interface SerializedJournalEntry extends Omit<JournalEntry, "entryDate" | "createdAt"> {
  entryDate: string;
  createdAt: string;
}
export function serializeJournalEntry(e: JournalEntry): SerializedJournalEntry {
  return { ...e, entryDate: e.entryDate.toISOString(), createdAt: e.createdAt.toISOString() };
}

export interface SerializedJournalLine extends Omit<JournalLine, "entryDate" | "createdAt"> {
  entryDate: string;
  createdAt: string;
}
export function serializeJournalLine(l: JournalLine): SerializedJournalLine {
  return { ...l, entryDate: l.entryDate.toISOString(), createdAt: l.createdAt.toISOString() };
}

interface FundTransferLookup {
  _id: string;
  fromAccountId: string;
  fromAccountType: FundAccountType;
  toAccountId: string;
  toAccountType: FundAccountType;
  outTransactionId: string;
  inTransactionId: string;
}

let indexesEnsured = false;
async function getEntriesCollection() {
  const db = await getDb();
  const collection = db.collection<JournalEntry>(JOURNAL_ENTRIES_COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await Promise.all([
      collection.createIndex({ transactionId: 1 }).catch(() => {}),
      collection.createIndex({ entryNumber: 1 }, { unique: true }).catch(() => {}),
      collection.createIndex({ reversalOfEntryId: 1 }).catch(() => {}),
    ]);
  }
  return collection;
}

let lineIndexesEnsured = false;
async function getLinesCollection() {
  const db = await getDb();
  const collection = db.collection<JournalLine>(JOURNAL_LINES_COLLECTION);
  if (!lineIndexesEnsured) {
    lineIndexesEnsured = true;
    await Promise.all([
      collection.createIndex({ entryId: 1 }).catch(() => {}),
      collection.createIndex({ accountId: 1, entryDate: 1 }).catch(() => {}),
      collection.createIndex({ transactionId: 1 }).catch(() => {}),
    ]);
  }
  return collection;
}

async function generateEntryNumber(year: number): Promise<string> {
  const seq = await nextYearSequence(ENTRY_NUMBER_PREFIX, year);
  return formatYearCode(ENTRY_NUMBER_PREFIX, year, seq);
}

export async function entryForTransaction(transactionId: string): Promise<JournalEntry | null> {
  const collection = await getEntriesCollection();
  return collection.findOne({ transactionId });
}

export async function linesForEntry(entryId: string): Promise<JournalLine[]> {
  const collection = await getLinesCollection();
  return collection.find({ entryId }).sort({ side: 1 }).toArray();
}

export interface LedgerLineFilter {
  dateFrom?: Date;
  dateTo?: Date;
}

function dateRangeFilter(opts: LedgerLineFilter): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (opts.dateFrom || opts.dateTo) {
    const range: Record<string, Date> = {};
    if (opts.dateFrom) range.$gte = opts.dateFrom;
    if (opts.dateTo) range.$lte = opts.dateTo;
    filter.entryDate = range;
  }
  return filter;
}

/** Every line for one account, oldest first — the raw material for a running-balance General Ledger view. */
export async function linesForAccount(accountId: string, opts: LedgerLineFilter = {}): Promise<JournalLine[]> {
  const collection = await getLinesCollection();
  return collection
    .find({ accountId, ...dateRangeFilter(opts) })
    .sort({ entryDate: 1, createdAt: 1 })
    .toArray();
}

/** Every line across every account in a date range — the raw material for Trial Balance / P&L / Balance Sheet. */
export async function allLinesInRange(opts: LedgerLineFilter = {}): Promise<JournalLine[]> {
  const collection = await getLinesCollection();
  return collection.find(dateRangeFilter(opts)).toArray();
}

export interface MiniAccount {
  _id: string;
  code: string;
  name: string;
}

async function accountByCode(code: string): Promise<MiniAccount | null> {
  const account = await getAccountByCode(code);
  return account ? { _id: account._id, code: account.code, name: account.name } : null;
}

async function controlAccountFor(fundType: FundAccountType): Promise<MiniAccount | null> {
  const code = fundType === "bank" ? CONTROL_ACCOUNT_CODES.bank : CONTROL_ACCOUNT_CODES.cash;
  return accountByCode(code);
}

/**
 * The settlement side of a normal income/expense entry — the real fund
 * account it moved through, mapped onto one shared control account per fund-
 * account *type* (not per literal bank/cash account — see the Phase 5 plan).
 * Falls back to Accounts Receivable / Accounts Payable when the transaction
 * doesn't carry a `fundAccountId` yet (still common for Phase 2/3 automated
 * postings that predate Phase 4's fund-account concept).
 */
async function resolveSettlementAccount(txn: Transaction): Promise<MiniAccount | null> {
  if (txn.fundAccountId && txn.fundAccountType) {
    const control = await controlAccountFor(txn.fundAccountType);
    if (control) return control;
  }
  const code = txn.type === "income" ? CONTROL_ACCOUNT_CODES.accountsReceivable : CONTROL_ACCOUNT_CODES.accountsPayable;
  return accountByCode(code);
}

/** The category side — the transaction's own Chart-of-Accounts classification, or a catch-all fallback. */
async function resolveCategoryAccount(txn: Transaction): Promise<MiniAccount | null> {
  if (txn.accountId) {
    const account = await getAccount(txn.accountId);
    if (account) return { _id: account._id, code: account.code, name: account.name };
  }
  const code = txn.type === "income" ? CONTROL_ACCOUNT_CODES.otherIncome : CONTROL_ACCOUNT_CODES.otherExpense;
  return accountByCode(code);
}

interface PostEntryParams {
  entryDate: Date;
  description: string | null;
  transactionId: string | null;
  transactionNumber: string | null;
  periodId: string | null;
  reversalOfEntryId: string | null;
  actorId: string | null;
  lines: { account: MiniAccount; side: JournalSide; amount: number; currency: string }[];
}

/**
 * The one place every journal entry is actually written. Transaction-based
 * postings (`writeEntry` below) and fiscal-period closing/reopening entries
 * (`fms/fiscal-periods.ts`) both funnel through here — never a second
 * parallel insert path.
 */
async function postEntry(params: PostEntryParams): Promise<JournalEntry> {
  const entriesCol = await getEntriesCollection();
  const linesCol = await getLinesCollection();
  const entryId = newId();
  const now = new Date();
  const entry: JournalEntry = {
    _id: entryId,
    entryNumber: await generateEntryNumber(params.entryDate.getFullYear()),
    transactionId: params.transactionId,
    transactionNumber: params.transactionNumber,
    periodId: params.periodId,
    entryDate: params.entryDate,
    description: params.description,
    reversalOfEntryId: params.reversalOfEntryId,
    createdAt: now,
    createdBy: params.actorId,
  };
  await entriesCol.insertOne(entry);
  const lineDocs: JournalLine[] = params.lines.map((l) => ({
    _id: newId(),
    entryId,
    entryDate: params.entryDate,
    accountId: l.account._id,
    accountCode: l.account.code,
    accountName: l.account.name,
    side: l.side,
    amount: l.amount,
    currency: l.currency,
    transactionId: params.transactionId,
    transactionNumber: params.transactionNumber,
    description: params.description,
    createdAt: now,
  }));
  await linesCol.insertMany(lineDocs);
  return entry;
}

async function writeEntry(
  txn: Transaction,
  lines: { account: MiniAccount; side: JournalSide }[],
  actorId: string | null,
  reversalOfEntryId: string | null
): Promise<JournalEntry> {
  return postEntry({
    entryDate: txn.postingDate ?? txn.transactionDate,
    description: reversalOfEntryId ? `Reversal — ${txn.transactionNumber}` : txn.description,
    transactionId: txn._id,
    transactionNumber: txn.transactionNumber,
    periodId: null,
    reversalOfEntryId,
    actorId,
    lines: lines.map((l) => ({ ...l, amount: txn.amount, currency: txn.currency })),
  });
}

/**
 * A transfer's two linked `fms_transactions` legs (§19/§21, `fund-
 * transfers.ts`) represent one indivisible movement between two control
 * accounts — posted once, from the "out" leg, as Dr destination / Cr source,
 * never touching a revenue/expense account. The "in" leg is a no-op here
 * (its effect is already captured by the out leg's entry) so the pair never
 * double-posts.
 */
async function postTransferJournalEntry(txn: Transaction, actorId: string | null): Promise<JournalEntry | null> {
  const db = await getDb();
  const transfer = await db.collection<FundTransferLookup>(FUND_TRANSFERS_COLLECTION).findOne({ _id: txn.transferId as string });
  if (!transfer || txn._id !== transfer.outTransactionId) return null;
  const [fromControl, toControl] = await Promise.all([
    controlAccountFor(transfer.fromAccountType),
    controlAccountFor(transfer.toAccountType),
  ]);
  if (!fromControl || !toControl) return null;
  return writeEntry(
    txn,
    [
      { account: toControl, side: "debit" },
      { account: fromControl, side: "credit" },
    ],
    actorId,
    null
  );
}

/**
 * Posts the balanced two-line entry for a transaction that just became
 * settled (`completed`/`reconciled`). Idempotent — a transaction that
 * already has an entry is skipped, never double-posted. `adjustment`-typed
 * transactions have no defined GL treatment yet and are skipped (they also
 * carry no fund-balance effect — see `fundEffectSign` in `transactions.ts`).
 * Never throws — a posting failure must not break the transaction it's
 * attached to, mirroring `applyToFundAccount`'s fail-soft behavior.
 */
export async function postJournalEntryForTransaction(txn: Transaction, actorId: string | null): Promise<JournalEntry | null> {
  try {
    if (txn.amount <= 0) return null;
    if (await entryForTransaction(txn._id)) return null;
    if (txn.transferId) return await postTransferJournalEntry(txn, actorId);
    if (txn.type !== "income" && txn.type !== "expense") return null;

    const [settlement, category] = await Promise.all([resolveSettlementAccount(txn), resolveCategoryAccount(txn)]);
    if (!settlement || !category) return null;

    const lines: { account: MiniAccount; side: JournalSide }[] =
      txn.type === "income"
        ? [
            { account: settlement, side: "debit" },
            { account: category, side: "credit" },
          ]
        : [
            { account: category, side: "debit" },
            { account: settlement, side: "credit" },
          ];

    return await writeEntry(txn, lines, actorId, null);
  } catch {
    return null;
  }
}

/**
 * Posts an equal-and-opposite entry when a settled transaction leaves the
 * settled state (e.g. `completed → reversed`). The original entry is never
 * edited or deleted — it stays in the General Ledger, and the reversal
 * entry nets it to zero. A no-op if no original entry exists, or if it was
 * already reversed once.
 */
export async function reverseJournalEntryForTransaction(txn: Transaction, actorId: string | null): Promise<JournalEntry | null> {
  try {
    let originalTxnId = txn._id;
    if (txn.transferId) {
      const db = await getDb();
      const transfer = await db.collection<FundTransferLookup>(FUND_TRANSFERS_COLLECTION).findOne({ _id: txn.transferId });
      if (transfer) originalTxnId = transfer.outTransactionId;
    }
    const original = await entryForTransaction(originalTxnId);
    if (!original) return null;

    const entriesCol = await getEntriesCollection();
    const alreadyReversed = await entriesCol.findOne({ reversalOfEntryId: original._id });
    if (alreadyReversed) return null;

    const originalLines = await linesForEntry(original._id);
    if (originalLines.length === 0) return null;

    const flipped = originalLines.map((l) => ({
      account: { _id: l.accountId, code: l.accountCode, name: l.accountName },
      side: (l.side === "debit" ? "credit" : "debit") as JournalSide,
    }));

    return await writeEntry(txn, flipped, actorId, original._id);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fiscal-period closing entries (§39 — Phase 7). Called only from
// `fms/fiscal-periods.ts`'s `closePeriod`/`reopenPeriod` — never posted from
// a transaction, so `transactionId` is null and `periodId` is set instead.
// ---------------------------------------------------------------------------

export async function entriesForPeriod(periodId: string): Promise<JournalEntry[]> {
  const collection = await getEntriesCollection();
  return collection.find({ periodId }).toArray();
}

export async function postClosingEntry(params: {
  periodId: string;
  entryDate: Date;
  description: string;
  currency: string;
  actorId: string | null;
  lines: { account: MiniAccount; side: JournalSide; amount: number }[];
}): Promise<JournalEntry> {
  return postEntry({
    entryDate: params.entryDate,
    description: params.description,
    transactionId: null,
    transactionNumber: null,
    periodId: params.periodId,
    reversalOfEntryId: null,
    actorId: params.actorId,
    lines: params.lines.map((l) => ({ ...l, currency: params.currency })),
  });
}

/** Equal-and-opposite of a period's closing entry, posted when the period is reopened. */
export async function reverseClosingEntry(periodId: string, actorId: string | null): Promise<JournalEntry | null> {
  const entries = await entriesForPeriod(periodId);
  const original = entries.find((e) => e.reversalOfEntryId === null);
  if (!original) return null;

  const entriesCol = await getEntriesCollection();
  const alreadyReversed = await entriesCol.findOne({ reversalOfEntryId: original._id });
  if (alreadyReversed) return null;

  const originalLines = await linesForEntry(original._id);
  if (originalLines.length === 0) return null;

  return postEntry({
    entryDate: new Date(),
    description: `Reopen — ${original.description ?? "Period closing entry"}`,
    transactionId: null,
    transactionNumber: null,
    periodId,
    reversalOfEntryId: original._id,
    actorId,
    lines: originalLines.map((l) => ({
      account: { _id: l.accountId, code: l.accountCode, name: l.accountName },
      side: (l.side === "debit" ? "credit" : "debit") as JournalSide,
      amount: l.amount,
      currency: l.currency,
    })),
  });
}
