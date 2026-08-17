import { dbInstance } from "../config/dbInstance.js";

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const getBills = async (req, res) => {
  const db = dbInstance.get();
  res.json(db.bills || []);
};

export const getNextBillNumber = async (req, res) => {
  res.json({ nextInvoiceNo: dbInstance.nextInvoiceNo() });
};

export const createBill = async (req, res) => {
  const db = dbInstance.get();
  const billData = req.body;
  const invoiceNo = dbInstance.nextInvoiceNo();
  const newBill = {
    ...billData,
    id: generateId("bill"),
    invoiceNo,
    date: billData.date || new Date().toISOString().replace("T", " ").substring(0, 19),
    createdAt: new Date().toISOString(),
    status: "Active"
  };

  if (Array.isArray(newBill.items)) {
    newBill.items.forEach((item) => {
      const prodIndex = db.products.findIndex((p) => p.id === item.productId);
      if (prodIndex !== -1) {
        const prod = db.products[prodIndex];
        const bagKg = item.bagSizeKg || (prod.bagSize ? parseInt(prod.bagSize) : 25) || 25;
        const method = item.sellingMethod || "25kg";
        const bagsToDeduct = (method === "custom" || method === "1kg")
          ? (Number(item.qty) || 1) / bagKg
          : (Number(item.qty) || 1);

        db.products[prodIndex].currentStock = Math.max(0, Number((db.products[prodIndex].currentStock - bagsToDeduct).toFixed(3)));
      }
    });
  }

  let cashPaid = 0;
  let bankPaid = 0;
  let balanceDue = 0;

  if (newBill.paymentType === "Split" && newBill.paymentSplit) {
    cashPaid = Number(newBill.paymentSplit.cash) || 0;
    bankPaid = (Number(newBill.paymentSplit.bank) || 0) + (Number(newBill.paymentSplit.upi) || 0) + (Number(newBill.paymentSplit.card) || 0);
    const totalPaid = cashPaid + bankPaid;
    balanceDue = Math.max(0, newBill.total - totalPaid);
  } else if (newBill.paymentType === "Credit") {
    cashPaid = Number(newBill.paidAmount) || 0;
    bankPaid = 0;
    balanceDue = Math.max(0, newBill.total - cashPaid);
  } else if (newBill.paymentType === "Cash") {
    cashPaid = Number(newBill.paidAmount) !== undefined && newBill.paidAmount !== "" ? Number(newBill.paidAmount) : newBill.total;
    if (cashPaid > newBill.total) cashPaid = newBill.total;
    bankPaid = 0;
    balanceDue = Math.max(0, newBill.total - cashPaid);
  } else {
    bankPaid = Number(newBill.paidAmount) !== undefined && newBill.paidAmount !== "" ? Number(newBill.paidAmount) : newBill.total;
    if (bankPaid > newBill.total) bankPaid = newBill.total;
    cashPaid = 0;
    balanceDue = Math.max(0, newBill.total - bankPaid);
  }

  newBill.paidAmount = cashPaid + bankPaid;
  newBill.balance = balanceDue;

  if (balanceDue > 0) {
    const custIndex = db.customers.findIndex(
      (c) =>
        (newBill.customerId && c.id === newBill.customerId) ||
        (newBill.customerName && c.name && c.name.toLowerCase() === newBill.customerName.toLowerCase()) ||
        (newBill.customerPhone && c.phone && c.phone === newBill.customerPhone)
    );
    if (custIndex !== -1) {
      db.customers[custIndex].outstanding = (Number(db.customers[custIndex].outstanding) || 0) + balanceDue;
    }
  }

  db.bills.push(newBill);

  db.accountsLedger.push({
    id: generateId("ldgr"),
    date: newBill.date.split(" ")[0],
    particulars: `Sales Invoice ${newBill.invoiceNo} (${newBill.customerName})`,
    referenceId: newBill.id,
    type: "Credit",
    amount: newBill.total,
    accountGroup: "Sales",
    customerId: newBill.customerId
  });

  if (cashPaid > 0) {
    db.accountsLedger.push({
      id: generateId("ldgr"),
      date: newBill.date.split(" ")[0],
      particulars: `Cash Received - Bill ${newBill.invoiceNo}`,
      referenceId: newBill.id,
      type: "Debit",
      amount: cashPaid,
      accountGroup: "Cash",
      customerId: newBill.customerId
    });
  }

  if (bankPaid > 0) {
    db.accountsLedger.push({
      id: generateId("ldgr"),
      date: newBill.date.split(" ")[0],
      particulars: `${newBill.paymentType === "UPI" ? "UPI" : newBill.paymentType === "Card" ? "Card" : "Bank"} Received - Bill ${newBill.invoiceNo}`,
      referenceId: newBill.id,
      type: "Debit",
      amount: bankPaid,
      accountGroup: "Bank",
      customerId: newBill.customerId
    });
  }

  if (balanceDue > 0) {
    db.accountsLedger.push({
      id: generateId("ldgr"),
      date: newBill.date.split(" ")[0],
      particulars: `Credit Outstanding - Bill ${newBill.invoiceNo}`,
      referenceId: newBill.id,
      type: "Debit",
      amount: balanceDue,
      accountGroup: "Customer Outstanding",
      customerId: newBill.customerId
    });
  }

  dbInstance.save(db);
  res.json({ success: true, bill: newBill });
};

export const cancelBill = async (req, res) => {
  const db = dbInstance.get();
  const billIndex = db.bills.findIndex((b) => b.id === req.params.id);
  if (billIndex === -1) return res.status(404).json({ message: "Bill not found" });
  const bill = db.bills[billIndex];
  if (bill.status === "Cancelled") {
    return res.json({ success: true, message: "Bill already cancelled" });
  }

  bill.status = "Cancelled";
  bill.items.forEach((item) => {
    const prodIndex = db.products.findIndex((p) => p.id === item.productId);
    if (prodIndex !== -1) {
      const prod = db.products[prodIndex];
      const bagKg = item.bagSizeKg || (prod.bagSize ? parseInt(prod.bagSize) : 25) || 25;
      const method = item.sellingMethod || "25kg";
      const bagsToRestore = (method === "custom" || method === "1kg")
        ? (Number(item.qty) || 1) / bagKg
        : (Number(item.qty) || 1);

      db.products[prodIndex].currentStock = Math.max(0, Number((db.products[prodIndex].currentStock + bagsToRestore).toFixed(3)));
    }
  });

  if (bill.paymentType === "Credit") {
    const custIndex = db.customers.findIndex((c) => c.id === bill.customerId);
    if (custIndex !== -1) {
      db.customers[custIndex].outstanding -= bill.balance;
    }
  }

  db.accountsLedger.push({
    id: generateId("ldgr"),
    date: new Date().toISOString().split("T")[0],
    particulars: `CANCELLED Sales Invoice ${bill.invoiceNo}`,
    referenceId: bill.id,
    type: "Debit",
    amount: bill.total,
    accountGroup: "Sales"
  });

  if (bill.paidAmount > 0) {
    db.accountsLedger.push({
      id: generateId("ldgr"),
      date: new Date().toISOString().split("T")[0],
      particulars: `REVERSED Payment for Cancelled Invoice ${bill.invoiceNo}`,
      referenceId: bill.id,
      type: "Credit",
      amount: bill.paidAmount,
      accountGroup: bill.paymentType === "UPI" ? "Bank" : "Cash"
    });
  }

  if (bill.balance > 0) {
    db.accountsLedger.push({
      id: generateId("ldgr"),
      date: new Date().toISOString().split("T")[0],
      particulars: `REVERSED Outstanding for Cancelled Invoice ${bill.invoiceNo}`,
      referenceId: bill.id,
      type: "Credit",
      amount: bill.balance,
      accountGroup: "Customer Outstanding",
      customerId: bill.customerId
    });
  }

  dbInstance.save(db);
  res.json({ success: true, bill });
};
