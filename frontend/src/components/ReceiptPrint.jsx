import React from "react";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { Printer, FileText, X } from "lucide-react";
const ReceiptPrint = ({ bill, onClose, companySettings }) => {
  const { t, language } = useLanguage();
  const [printFormat, setPrintFormat] = React.useState(companySettings?.defaultPrintFormat || "80mm");
  React.useEffect(() => {
    if (bill && companySettings?.autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [bill, companySettings]);
  if (!bill) return null;
  const fmt = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(num || 0);
  };
  const handlePrint = () => {
    window.print();
  };
  return <div id="receipt-overlay" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto print:bg-white print:p-0">
      
      {
    /* Container Box */
  }
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {
    /* Header - Hidden on Print */
  }
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center print:hidden">
          <div className="flex gap-2">
            <button
              onClick={() => setPrintFormat("58mm")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${printFormat === "58mm" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
            >
              <Printer className="w-3.5 h-3.5" />
              58mm Thermal
            </button>
            <button
              onClick={() => setPrintFormat("80mm")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${printFormat === "80mm" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
            >
              <Printer className="w-3.5 h-3.5" />
              80mm Thermal
            </button>
            <button
              onClick={() => setPrintFormat("A4")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${printFormat === "A4" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
            >
              <FileText className="w-3.5 h-3.5" />
              A4 Invoice
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
    onClick={handlePrint}
    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/10 transition-colors"
  >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
    onClick={onClose}
    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg bg-white border border-slate-200"
  >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {
    /* Preview Scroll Area */
  }
        <div className="flex-1 overflow-y-auto bg-slate-100/40 p-6 print:p-0 print:bg-white">
          
          {/* ==================== 58mm THERMAL RECEIPT LAYOUT ==================== */}
          {printFormat === "58mm" && (
            <div id="thermal-receipt-58mm" className="w-[58mm] max-w-full mx-auto bg-white p-3 border border-slate-200 shadow-md rounded font-mono text-[10px] text-slate-800 print:shadow-none print:border-none print:p-1 print:w-full">
              <div className="text-center space-y-0.5">
                {companySettings.logoUrl && (
                  <div className="flex justify-center mb-1">
                    <img src={companySettings.logoUrl} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
                <h3 className="text-xs font-black uppercase">{companySettings.companyName}</h3>
                <p className="text-[9px] text-slate-600 truncate">{companySettings.address}</p>
                <p className="text-[9px] text-slate-600">Ph: {companySettings.phone}</p>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="space-y-0.5 text-[9px]">
                <div className="flex justify-between">
                  <span>Bill: <b>{bill.invoiceNo}</b></span>
                  <span><b>{bill.billType}</b></span>
                </div>
                <div className="flex justify-between">
                  <span>{bill.date?.substring(0, 10)}</span>
                  <span>{bill.date?.substring(11, 16)}</span>
                </div>
                <div>Cust: <b>{language === "English" ? bill.customerName : bill.customerTamilName || bill.customerName}</b></div>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="grid grid-cols-12 gap-0.5 font-bold text-[9px] border-b pb-1">
                <span className="col-span-5">Item</span>
                <span className="col-span-3 text-center">Pack/Wt</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              <div className="space-y-1 my-1 text-[9px]">
                {bill.items?.map((item, index) => {
                  const methodStr = item.sellingMethod === "custom" ? `${item.qty}Kg` : (item.sellingMethod || "25kg").toUpperCase();
                  return (
                    <div key={index} className="grid grid-cols-12 gap-0.5">
                      <span className="col-span-5 font-bold truncate">
                        {language === "English" ? item.englishName : item.tamilName || item.englishName}
                      </span>
                      <span className="col-span-3 text-center text-[8px] text-slate-500">{methodStr}</span>
                      <span className="col-span-2 text-center font-bold">{item.qty}</span>
                      <span className="col-span-2 text-right font-bold">₹{item.total || (item.qty * item.rate - item.discount)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="space-y-0.5 text-[9px] font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{fmt(bill.subtotal)}</span>
                </div>
                {bill.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>- {fmt(bill.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black pt-1 border-t border-dashed">
                  <span>NET TOTAL:</span>
                  <span>{fmt(bill.total)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-600 pt-0.5">
                  <span>Mode:</span>
                  <span className="font-bold">{bill.paymentType}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="text-center space-y-0.5">
                <p className="font-bold text-[10px]">{t("thankYou") || "Thank You! Visit Again"}</p>
                <p className="text-[8px] text-slate-400">SRI AMMAN TRADERS BILLING</p>
              </div>
            </div>
          )}

          {/* ==================== 80mm THERMAL RECEIPT LAYOUT ==================== */}
          {printFormat === "80mm" && <div id="thermal-receipt-preview" className="w-[80mm] max-w-full mx-auto bg-white p-5 border border-slate-200 shadow-md rounded font-mono text-xs text-slate-800 print:shadow-none print:border-none print:p-2 print:w-full">
              
              {
    /* Header */
  }
              <div className="text-center space-y-1">
                {companySettings.logoUrl && <div className="flex justify-center mb-1.5">
                    <img
    src={companySettings.logoUrl}
    alt={`${companySettings.companyName} Logo`}
    className="w-12 h-12 object-contain"
    referrerPolicy="no-referrer"
  />
                  </div>}
                <h3 className="text-sm font-black tracking-wide">{companySettings.companyName}</h3>
                <p className="text-[10px] text-slate-500">{companySettings.address}</p>
                <p className="text-[10px] text-slate-500">Phone: {companySettings.phone}</p>
              </div>

              <div className="border-t border-dashed border-slate-300 my-3" />

              {
    /* Bill Details */
  }
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Bill No: <span className="font-bold text-slate-900">{bill.invoiceNo}</span></span>
                  <span>Type: <span className="font-bold">{bill.billType}</span></span>
                </div>
                <div className="flex justify-between">
                  <span>Date: {bill.date?.substring(0, 10)}</span>
                  <span>Time: {bill.date?.substring(11, 16)}</span>
                </div>
                <div className="text-slate-700">
                  Customer: <span className="font-bold">{language === "English" ? bill.customerName : bill.customerTamilName || bill.customerName}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 my-3" />

              {
    /* Item headers */
  }
              <div className="grid grid-cols-12 gap-1 font-bold text-[10px] text-slate-900 mb-1">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              <div className="border-b border-slate-200 mb-2" />

              {
    /* Cart Items */
  }
              <div className="space-y-2 text-[10px]">
                {bill.items?.map((item, index) => <div key={index} className="grid grid-cols-12 gap-1">
                    <div className="col-span-6">
                      <p className="font-bold text-slate-800 leading-tight">
                        {language === "English" ? item.englishName : item.tamilName || item.englishName}
                      </p>
                    </div>
                    <span className="col-span-2 text-center font-bold">{item.qty}</span>
                    <span className="col-span-2 text-right">{item.rate}</span>
                    <span className="col-span-2 text-right font-bold">{item.qty * item.rate - item.discount}</span>
                  </div>)}
              </div>

              <div className="border-t border-dashed border-slate-300 my-3" />

              {
    /* Summary calculations */
  }
              <div className="space-y-1 text-[10px] font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{fmt(bill.subtotal)}</span>
                </div>
                {bill.discount > 0 && <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>- {fmt(bill.discount)}</span>
                  </div>}
                <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-dashed border-slate-200">
                  <span>GRAND TOTAL:</span>
                  <span>{fmt(bill.total)}</span>
                </div>
                <div className="flex justify-between text-slate-600 mt-1">
                  <span>Payment Mode:</span>
                  <span className="font-bold">{bill.paymentType}</span>
                </div>
                {bill.paidAmount > 0 && <div className="flex justify-between text-slate-700">
                    <span>Paid Amount:</span>
                    <span>{fmt(bill.paidAmount)}</span>
                  </div>}
                {bill.balance > 0 && <div className="flex justify-between text-rose-600">
                    <span>Balance Due:</span>
                    <span className="font-bold">{fmt(bill.balance)}</span>
                  </div>}
              </div>

              <div className="border-t border-dashed border-slate-300 my-4" />

              {
    /* Thank you note */
  }
              <div className="text-center space-y-1">
                <p className="font-bold text-[11px]">{t("thankYou")}</p>
                <p className="text-[9px] text-slate-400">Powered by Sri Amman Traders</p>
              </div>

            </div>}

          {
    /* ==================== A4 PROFESSIONAL TAX INVOICE ==================== */
  }
          {printFormat === "A4" && <div id="a4-invoice-preview" className="w-[210mm] max-w-full mx-auto bg-white p-8 border border-slate-200 shadow-md text-xs text-slate-800 print:shadow-none print:border-none print:p-0">
              
              {
    /* Invoice Title */
  }
              <div className="text-center mb-6">
                <h1 className="text-lg font-black uppercase tracking-wider text-slate-900">SALES INVOICE</h1>
                <p className="text-[10px] text-slate-500 font-semibold">ORIGINAL FOR RECIPIENT</p>
              </div>

              {
    /* Logo / Shop metadata Header */
  }
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4 items-center">
                <div className="flex items-center gap-4">
                  {companySettings.logoUrl && <img
    src={companySettings.logoUrl}
    alt={`${companySettings.companyName} Logo`}
    className="w-16 h-16 object-contain border border-slate-200 p-1 rounded-xl shrink-0"
    referrerPolicy="no-referrer"
  />}
                  <div className="space-y-1">
                    <h2 className="text-base font-black text-blue-600">{companySettings.companyName}</h2>
                    <p className="text-slate-500 leading-relaxed font-semibold">{companySettings.address}</p>
                    <p className="text-slate-500 font-semibold">Phone: {companySettings.phone} | Email: {companySettings.email}</p>
                  </div>
                </div>
                <div className="text-right space-y-1 font-semibold">
                  <p><span className="text-slate-400">Invoice No:</span> <span className="font-bold text-slate-900">{bill.invoiceNo}</span></p>
                  <p><span className="text-slate-400">Date &amp; Time:</span> <span>{bill.date}</span></p>
                  <p><span className="text-slate-400">Payment Terms:</span> <span className="font-bold text-blue-600">{bill.paymentType}</span></p>
                </div>
              </div>

              {
    /* Billing Customer Metadata block */
  }
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 font-semibold">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">BILL TO:</h3>
                  <p className="font-bold text-slate-800 text-sm">{language === "English" ? bill.customerName : bill.customerTamilName || bill.customerName}</p>
                  <p className="text-slate-500 mt-1">Cashier: {bill.customerName}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TRANSPORT / VEHICLE DETAILS:</h3>
                  <p className="text-slate-500">Delivery via: Counter Delivery</p>
                  <p className="text-slate-500">Vehicle No: Hand Carry</p>
                </div>
              </div>

              {
    /* Items Listing Table */
  }
              <table className="w-full text-left mt-6 border border-slate-200 rounded-lg overflow-hidden font-semibold">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-2.5 text-center w-10">S.No</th>
                    <th className="p-2.5">Description of Rice Item</th>
                    <th className="p-2.5 text-center">Pack / Method</th>
                    <th className="p-2.5 text-right">Qty / Bags</th>
                    <th className="p-2.5 text-right">Rate</th>
                    <th className="p-2.5 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                  {bill.items?.map((item, idx) => {
    const lineTotal = item.total || (item.qty * item.rate - (item.discount || 0));
    return <tr key={idx}>
                        <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold">
                          {language === "English" ? item.englishName : item.tamilName || item.englishName}
                        </td>
                        <td className="p-2.5 text-center font-mono">{item.sellingMethod || "25kg"}</td>
                        <td className="p-2.5 text-right font-bold">{item.qty}</td>
                        <td className="p-2.5 text-right">{item.rate}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{lineTotal}</td>
                      </tr>;
  })}
                </tbody>
              </table>

              {
    /* Terms and Signatures footer */
  }
              <div className="grid grid-cols-12 gap-4 mt-8 border-t border-slate-200 pt-6">
                
                {
    /* Bank Details */
  }
                <div className="col-span-7 space-y-2 font-semibold">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">Bank Payment &amp; Details</h4>
                  <p className="text-slate-500 leading-relaxed text-[10px]">
                    Bank Name: State Bank of India, Erode Main Branch<br />
                    A/C No: 33948572910 | IFSC: SBIN0000845<br />
                    UPI ID: sriamman@sbi
                  </p>
                </div>

                {
    /* Calculations summary */
  }
                <div className="col-span-5 space-y-2 text-right text-[11px] font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sub Total:</span>
                    <span>{fmt(bill.subtotal)}</span>
                  </div>
                  {bill.discount > 0 && <div className="flex justify-between text-rose-600">
                      <span>Total Discount:</span>
                      <span>- {fmt(bill.discount)}</span>
                    </div>}
                  <div className="flex justify-between text-sm font-black text-blue-600 pt-2 border-t border-dashed border-slate-200">
                    <span>INVOICE TOTAL:</span>
                    <span>{fmt(bill.total)}</span>
                  </div>
                  {bill.balance > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Outstanding Balance:</span>
                      <span>{fmt(bill.balance)}</span>
                    </div>
                  )}
                </div>

              </div>

              {
    /* Bottom Authority signature sign blocks */
  }
              <div className="grid grid-cols-2 gap-4 mt-12 pt-8 border-t border-slate-100 font-semibold text-[10px]">
                <div>
                  <p className="text-slate-400 mb-10 uppercase">Customer's Signature</p>
                  <div className="w-40 border-b border-slate-300" />
                </div>
                <div className="text-right">
                  <p className="text-slate-500 mb-1">{t("title")}</p>
                  <p className="text-slate-400 mb-10 uppercase font-semibold text-[9px]">Authorized Signatory</p>
                  <div className="w-40 border-b border-slate-300 ml-auto" />
                </div>
              </div>

            </div>}

        </div>

      </div>
    </div>;
};
export {
  ReceiptPrint
};
