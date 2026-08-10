import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

function isRecordReferenced(type, id, db) {
  if (type === "customers") {
    const inBills = (db.bills || []).some(b => b.customerId === id);
    if (inBills) return true;
    const inLedger = (db.accountsLedger || []).some(l => l.customerId === id);
    if (inLedger) return true;
  }
  return false;
}

export const getCustomers = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.customers || []);
};

export const createCustomer = async (req, res) => {
  const db = dbInstance.get();
  const newCustomer = {
    ...req.body,
    id: generateId("cust"),
    outstanding: Number(req.body.outstanding) || 0
  };
  db.customers.push(newCustomer);
  dbInstance.save(db);
  res.json({ success: true, customer: newCustomer });
};

export const updateCustomer = async (req, res) => {
  const db = dbInstance.get();
  const index = db.customers.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Customer not found" });
  db.customers[index] = { ...db.customers[index], ...req.body };
  dbInstance.save(db);
  res.json({ success: true, customer: db.customers[index] });
};

export const deleteCustomer = async (req, res) => {
  const db = dbInstance.get();
  const id = req.params.id;
  if (isRecordReferenced("customers", id, db)) {
    return res.status(400).json({ success: false, message: "This record cannot be deleted because it is already used in transactions." });
  }
  const idx = db.customers.findIndex((c) => c.id === id);
  if (idx !== -1) {
    db.customers[idx].status = "Inactive";
    dbInstance.save(db);
  }
  res.json({ success: true });
};

export const recordCustomerPayment = async (req, res) => {
  const db = dbInstance.get();
  const custId = req.params.id;
  const { amount, paymentMode, date, narration } = req.body;
  const numAmount = Number(amount) || 0;

  if (numAmount <= 0) {
    return res.status(400).json({ message: "Invalid payment amount" });
  }

  const custIndex = db.customers.findIndex((c) => c.id === custId);
  if (custIndex === -1) {
    return res.status(404).json({ message: "Customer not found" });
  }

  const cust = db.customers[custIndex];
  cust.outstanding = Math.max(0, (cust.outstanding || 0) - numAmount);
  const payDate = date || new Date().toISOString().split("T")[0];
  cust.lastPaymentDate = payDate;
  cust.lastPaymentAmount = numAmount;

  // Allocate payment across customer's active unpaid bills (FIFO)
  let remainingPayment = numAmount;
  const customerBills = db.bills
    .filter((b) => (b.customerId === custId || b.customerName === cust.name) && b.status !== "Cancelled" && (b.balance > 0 || ((b.grandTotal || b.total || 0) - (b.paidAmount || 0)) > 0))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  for (const bill of customerBills) {
    if (remainingPayment <= 0) break;
    const invTotal = bill.grandTotal !== undefined ? bill.grandTotal : bill.total || 0;
    const currentPaid = bill.paidAmount !== undefined ? bill.paidAmount : (bill.paymentType === "Credit" ? 0 : invTotal);
    const currentBalance = bill.balance !== undefined ? bill.balance : Math.max(0, invTotal - currentPaid);

    if (currentBalance <= 0) continue;

    const payToThisBill = Math.min(remainingPayment, currentBalance);
    bill.paidAmount = currentPaid + payToThisBill;
    bill.balance = Math.max(0, invTotal - bill.paidAmount);
    bill.lastPaymentDate = payDate;
    bill.status = bill.balance === 0 ? "Paid" : "Partial";

    bill.payments = bill.payments || [];
    bill.payments.push({
      date: payDate,
      amount: payToThisBill,
      mode: paymentMode || "Cash",
      narration: narration || "Customer Collection Payment"
    });

    remainingPayment -= payToThisBill;
  }

  const mode = paymentMode || "Cash";
  const refId = `pay-${Date.now()}`;

  db.accountsLedger.push({
    id: generateId("ldgr"),
    date: payDate,
    particulars: `Customer Payment Received (${cust.name}) ${narration ? "- " + narration : ""}`,
    referenceId: refId,
    type: "Debit",
    amount: numAmount,
    accountGroup: (mode === "Bank" || mode === "UPI" || mode === "Card") ? "Bank" : "Cash",
    customerId: cust.id,
    ledgerId: cust.id,
    voucherType: "Receipt"
  });

  db.accountsLedger.push({
    id: generateId("ldgr"),
    date: payDate,
    particulars: `Credit Outstanding Collection - ${cust.name}`,
    referenceId: refId,
    type: "Credit",
    amount: numAmount,
    accountGroup: "Customer Outstanding",
    customerId: cust.id,
    ledgerId: cust.id,
    voucherType: "Receipt"
  });

  dbInstance.save(db);
  res.json({ success: true, customer: cust, newOutstanding: cust.outstanding });
};
