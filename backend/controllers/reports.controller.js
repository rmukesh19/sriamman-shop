import { dbInstance } from "../config/dbInstance.js";

export const getReportsData = async (req, res) => {
  const db = dbInstance.get();
  res.json({
    bills: db.bills || [],
    purchases: db.purchases || [],
    customers: db.customers || [],
    suppliers: db.suppliers || [],
    products: db.products || [],
    accountsLedger: db.accountsLedger || [],
    incomes: db.incomes || [],
    expenses: db.expenses || []
  });
};
