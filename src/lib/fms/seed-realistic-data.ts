import "server-only";
import { getDb } from "@/lib/mongodb";

export async function seedFmsRealisticData(actorId = "system_admin") {
  const db = await getDb();

  // 1. Seed Company Bank Accounts
  const companyAccounts = [
    {
      _id: "BANK-HDFC-CURRENT",
      accountName: "HDFC Corporate Current A/C",
      bankName: "HDFC Bank",
      accountNumberLast4: "6789",
      ifsc: "HDFC0001234",
      branch: "Connaught Place, New Delhi",
      currency: "INR",
      openingBalance: 5000000,
      currentBalance: 4850000,
      status: "active",
      notes: "Primary Operational Account for Client Collections & Vendor Payouts",
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      _id: "BANK-ICICI-OPERATING",
      accountName: "ICICI Operating Current A/C",
      bankName: "ICICI Bank",
      accountNumberLast4: "3456",
      ifsc: "ICIC0000567",
      branch: "Cyber City, Gurugram",
      currency: "INR",
      openingBalance: 2000000,
      currentBalance: 1820000,
      status: "active",
      notes: "Secondary Reserve Account for Payroll & Tax Payments",
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  for (const acc of companyAccounts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.collection("fms_bank_accounts").updateOne(
      { _id: acc._id as any },
      { $set: acc },
      { upsert: true }
    );
  }

  // 2. Seed Beneficiary Bank Details
  const beneficiaries = [
    {
      _id: "BEN-DELL-INDIA",
      entityType: "vendor",
      entityId: "VEND-DELL-01",
      beneficiaryName: "Dell Technologies India Pvt Ltd",
      bankName: "HDFC Bank",
      accountNumber: "50100445566778",
      accountNumberLast4: "6778",
      ifsc: "HDFC0008899",
      branch: "Bengaluru",
      upiId: "dellindia@hdfcbank",
      isVerified: true,
      notes: "Hardware & IT Equipment Supplier",
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      _id: "BEN-AWS-INDIA",
      entityType: "vendor",
      entityId: "VEND-AWS-02",
      beneficiaryName: "AWS Cloud Infrastructure India",
      bankName: "ICICI Bank",
      accountNumber: "000998877665",
      accountNumberLast4: "7665",
      ifsc: "ICIC0001122",
      branch: "Mumbai",
      upiId: "aws@icici",
      isVerified: true,
      notes: "Cloud Server Hosting & Infrastructure",
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      _id: "BEN-EMP-RAHUL",
      entityType: "employee",
      entityId: "EMP-101",
      beneficiaryName: "Rahul Sharma (Lead Engineer)",
      bankName: "HDFC Bank",
      accountNumber: "5010011223344",
      accountNumberLast4: "3344",
      ifsc: "HDFC0009988",
      branch: "New Delhi",
      upiId: "rahul@okaxis",
      isVerified: true,
      notes: "Engineering Department Payroll Destination",
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      _id: "BEN-CLIENT-APEX",
      entityType: "client",
      entityId: "CLT-APEX-99",
      beneficiaryName: "Apex Healthcare Pvt Ltd",
      bankName: "HDFC Bank",
      accountNumber: "5010099887766",
      accountNumberLast4: "7766",
      ifsc: "HDFC0007788",
      branch: "Noida Sector 62",
      upiId: "apexpay@hdfc",
      isVerified: true,
      notes: "Enterprise PMS Project Client",
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      _id: "BEN-STUDENT-ANKIT",
      entityType: "student",
      entityId: "STU-2026-88",
      beneficiaryName: "Ankit Kumar (AI Masterclass)",
      bankName: "SBI",
      accountNumber: "30987654321",
      accountNumberLast4: "4321",
      ifsc: "SBIN0005544",
      branch: "Patna",
      upiId: "ankit@ybl",
      isVerified: true,
      notes: "TMS Student Enrollment",
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  for (const b of beneficiaries) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.collection("fms_beneficiaries").updateOne(
      { _id: b._id as any },
      { $set: b },
      { upsert: true }
    );
  }

  // 3. Seed Realistic Transactions across PRMS, PMS, HRMS, TMS
  const transactions = [
    {
      _id: "TXN-2026-00101",
      transactionNumber: "TXN-2026-00101",
      type: "expense",
      sourceModule: "prms",
      sourceRecordId: "PO-PRMS-2026-08",
      payee: "Dell Technologies India Pvt Ltd",
      accountNumber: "••••6778",
      amount: 245000,
      currency: "INR",
      paymentMethod: "Corporate Bank NEFT",
      referenceNumber: "UTR2026091801",
      status: "completed",
      transactionDate: new Date("2026-09-15"),
      createdBy: actorId,
      createdAt: new Date("2026-09-15"),
      updatedAt: new Date("2026-09-15"),
      deletedAt: null,
    },
    {
      _id: "TXN-2026-00102",
      transactionNumber: "TXN-2026-00102",
      type: "expense",
      sourceModule: "prms",
      sourceRecordId: "PO-PRMS-2026-12",
      payee: "AWS Cloud Infrastructure India",
      accountNumber: "••••7665",
      amount: 112000,
      currency: "INR",
      paymentMethod: "RazorpayX Payout API",
      referenceNumber: "UTR2026091705",
      status: "pending_approval",
      transactionDate: new Date("2026-09-17"),
      createdBy: actorId,
      createdAt: new Date("2026-09-17"),
      updatedAt: new Date("2026-09-17"),
      deletedAt: null,
    },
    {
      _id: "TXN-2026-00103",
      transactionNumber: "TXN-2026-00103",
      type: "income",
      sourceModule: "pms",
      sourceRecordId: "PRJ-APEX-MS2",
      customerName: "Apex Healthcare Pvt Ltd",
      amount: 450000,
      currency: "INR",
      paymentMethod: "Razorpay Payment Gateway",
      referenceNumber: "pay_apex_ms2_token",
      status: "completed",
      transactionDate: new Date("2026-09-12"),
      createdBy: actorId,
      createdAt: new Date("2026-09-12"),
      updatedAt: new Date("2026-09-12"),
      deletedAt: null,
    },
    {
      _id: "TXN-2026-00104",
      transactionNumber: "TXN-2026-00104",
      type: "income",
      sourceModule: "pms",
      sourceRecordId: "PRJ-EDUTECH-01",
      customerName: "EduTech Global Solutions",
      amount: 325000,
      currency: "INR",
      paymentMethod: "Bank Transfer",
      referenceNumber: "NEFT88992211",
      status: "completed",
      transactionDate: new Date("2026-09-10"),
      createdBy: actorId,
      createdAt: new Date("2026-09-10"),
      updatedAt: new Date("2026-09-10"),
      deletedAt: null,
    },
    {
      _id: "TXN-2026-00105",
      transactionNumber: "TXN-2026-00105",
      type: "expense",
      sourceModule: "hrms",
      sourceRecordId: "PAY-HRMS-2026-09",
      payee: "September 2026 Engineering Payroll",
      accountNumber: "HDFC Corporate Bulk Payout",
      amount: 875000,
      currency: "INR",
      paymentMethod: "HDFC Corporate Bank NEFT",
      referenceNumber: "BATCH-HRMS-9981",
      status: "completed",
      transactionDate: new Date("2026-09-01"),
      createdBy: actorId,
      createdAt: new Date("2026-09-01"),
      updatedAt: new Date("2026-09-01"),
      deletedAt: null,
    },
    {
      _id: "TXN-2026-00106",
      transactionNumber: "TXN-2026-00106",
      type: "income",
      sourceModule: "tms",
      sourceRecordId: "ENR-TMS-2026-101",
      customerName: "Rohan Verma (Generative AI Course)",
      amount: 35000,
      currency: "INR",
      paymentMethod: "UPI QR Code",
      referenceNumber: "pay_tms_rohan_token",
      status: "completed",
      transactionDate: new Date("2026-09-16"),
      createdBy: actorId,
      createdAt: new Date("2026-09-16"),
      updatedAt: new Date("2026-09-16"),
      deletedAt: null,
    },
    {
      _id: "TXN-2026-00107",
      transactionNumber: "TXN-2026-00107",
      type: "income",
      sourceModule: "tms",
      sourceRecordId: "ENR-TMS-2026-108",
      customerName: "Ankit Kumar (Data Science Certification)",
      amount: 28000,
      currency: "INR",
      paymentMethod: "Razorpay Checkout",
      referenceNumber: "pay_tms_ankit_token",
      status: "completed",
      transactionDate: new Date("2026-09-18"),
      createdBy: actorId,
      createdAt: new Date("2026-09-18"),
      updatedAt: new Date("2026-09-18"),
      deletedAt: null,
    },
  ];

  for (const t of transactions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.collection("fms_transactions").updateOne(
      { _id: t._id as any },
      // Fill the fields the Transactions list requires (postingDate etc.) — without them /fms/transactions crashes on these rows.
      {
        $set: {
          ...t,
          postingDate: t.transactionDate,
          taxAmount: 0,
          attachments: [],
          description: t.payee,
          customerId: null,
          vendorId: null,
          employeeId: null,
          projectId: null,
          department: null,
          accountId: null,
          fundAccountId: null,
          fundAccountType: null,
          transferId: null,
          approvedBy: null,
          approvedAt: null,
        },
      },
      { upsert: true }
    );
  }

  // 4. Seed Active Payment Links
  const paymentLinks = [
    {
      _id: "PL-TMS-ROHAN",
      token: "pay_tms_rohan",
      title: "Generative AI Masterclass Course Fee",
      amount: 35000,
      currency: "INR",
      customerName: "Rohan Verma",
      sourceModule: "TMS",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actorId,
      deletedAt: null,
    },
    {
      _id: "PL-PMS-APEX",
      token: "pay_apex_ms2",
      title: "Apex Healthcare - Milestone 2 Invoicing",
      amount: 450000,
      currency: "INR",
      customerName: "Apex Healthcare Pvt Ltd",
      sourceModule: "PMS",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actorId,
      deletedAt: null,
    },
    {
      _id: "PL-TMS-ANKIT",
      token: "pay_tms_ankit",
      title: "Data Science Certification Training Fee",
      amount: 28000,
      currency: "INR",
      customerName: "Ankit Kumar",
      sourceModule: "TMS",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actorId,
      deletedAt: null,
    },
  ];

  for (const pl of paymentLinks) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.collection("fms_payment_links").updateOne(
      { _id: pl._id as any },
      { $set: pl },
      { upsert: true }
    );
  }

  // 5. Seed Open Invoices for Collect Money
  const invoices = [
    {
      _id: "INV-2026-00125",
      invoiceNumber: "INV-2026-00125",
      customerName: "TechCorp Systems Pvt Ltd",
      sourceModule: "PMS",
      amount: 180000,
      totalAmount: 180000,
      status: "SENT",
      dueDate: new Date("2026-09-30"),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actorId,
      deletedAt: null,
    },
    {
      _id: "INV-2026-00126",
      invoiceNumber: "INV-2026-00126",
      customerName: "Priya Sundaram (Full Stack Bootcamp)",
      sourceModule: "TMS",
      amount: 45000,
      totalAmount: 45000,
      status: "OVERDUE",
      dueDate: new Date("2026-09-10"),
      createdAt: new Date("2026-09-01"),
      updatedAt: new Date(),
      createdBy: actorId,
      deletedAt: null,
    },
  ];

  for (const inv of invoices) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.collection("fms_invoices").updateOne(
      { _id: inv._id as any },
      { $set: inv },
      { upsert: true }
    );
  }

  return { ok: true, seededCount: { bankAccounts: companyAccounts.length, beneficiaries: beneficiaries.length, transactions: transactions.length, paymentLinks: paymentLinks.length } };
}
