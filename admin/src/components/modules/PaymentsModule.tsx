import React, { useState, useEffect } from "react";
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  Search,
  RefreshCw,
  FileText,
  Download,
  ShoppingBag,
  User,
  Phone,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Layers,
  X,
  FileSpreadsheet
} from "lucide-react";
import { jsPDF } from "jspdf";
import { adminFetch } from "../../lib/api";

export const PaymentsModule: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "matched" | "orphaned">("all");
  const [selectedOrphan, setSelectedOrphan] = useState<any | null>(null);
  const [targetOrderId, setTargetOrderId] = useState("");
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchPayments = () => {
    setLoading(true);
    adminFetch("/api/admin/payments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPayments(data.payments || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleReconcile = async (paymentId: string) => {
    if (!targetOrderId) return;
    try {
      const res = await adminFetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reconcile", paymentId, orderId: targetOrderId }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrphan(null);
        setTargetOrderId("");
        setStatusMessage(`Payment #${paymentId} successfully matched to Order #${targetOrderId}`);
        setTimeout(() => setStatusMessage(null), 4000);
        fetchPayments();
      }
    } catch (e) {
      console.error("Reconcile error:", e);
    }
  };

  // Filtered payments list
  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerPhone?.includes(searchQuery) ||
      p.orderId?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === "matched") return matchesSearch && p.reconciliationStatus === "matched";
    if (filterStatus === "orphaned") return matchesSearch && p.reconciliationStatus === "orphaned";
    return matchesSearch;
  });

  // Calculate Metrics
  const totalReconciledKsh = payments
    .filter((p) => p.reconciliationStatus === "matched")
    .reduce((sum, p) => sum + (parseFloat(p.amountKsh) || 0), 0);

  const matchedCount = payments.filter((p) => p.reconciliationStatus === "matched").length;
  const orphanedCount = payments.filter((p) => p.reconciliationStatus === "orphaned").length;

  // Export PDF Statement for entire payment reconciliation table
  const handleExportPDFStatement = () => {
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString("en-KE", { dateStyle: "medium" });

      // Header Branding
      doc.setFillColor(15, 61, 60); // Dark Teal
      doc.rect(0, 0, 210, 25, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("MQULIMA HUB — FINANCIAL PAYMENT RECONCILIATION SHEET", 14, 16);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(230, 230, 230);
      doc.text(`Generated: ${dateStr} | Source: Live Production Database Ledger`, 14, 22);

      // Financial Summary Block
      doc.setFillColor(240, 248, 246);
      doc.rect(14, 30, 182, 22, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 61, 60);
      doc.text(`Total Reconciled Volume: KSh ${totalReconciledKsh.toLocaleString()}`, 20, 38);
      doc.text(`Matched Transactions: ${matchedCount} | Orphaned: ${orphanedCount}`, 20, 46);

      // Table Headers
      let y = 60;
      doc.setFillColor(232, 244, 241);
      doc.rect(14, y - 5, 182, 8, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 61, 60);
      doc.text("Trans Ref ID", 16, y);
      doc.text("Customer / Phone", 55, y);
      doc.text("Amount (KSh)", 105, y);
      doc.text("Matched Order", 140, y);
      doc.text("Status", 175, y);

      y += 8;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);

      for (const item of filteredPayments) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }

        doc.setTextColor(30, 30, 30);
        doc.text(String(item.transactionId || item.id).slice(0, 18), 16, y);

        const custStr = `${item.customerName || "Customer"} (${item.customerPhone || ""})`.slice(0, 26);
        doc.text(custStr, 55, y);

        doc.setFont("Helvetica", "bold");
        doc.text(`KSh ${parseFloat(item.amountKsh || 0).toLocaleString()}`, 105, y);

        doc.setFont("Helvetica", "normal");
        doc.text(item.orderId ? `#${item.orderId.slice(0, 10)}` : "Unmatched", 140, y);

        const statusLabel = item.reconciliationStatus === "matched" ? "MATCHED" : "ORPHANED";
        doc.setTextColor(item.reconciliationStatus === "matched" ? 39 : 225, item.reconciliationStatus === "matched" ? 140 : 29, item.reconciliationStatus === "matched" ? 123 : 72);
        doc.text(statusLabel, 175, y);

        y += 7;
        doc.setDrawColor(220, 235, 230);
        doc.line(14, y - 3, 196, y - 3);
      }

      doc.save(`mqulima_financial_reconciliation_${Date.now()}.pdf`);
    } catch (e) {
      console.error("PDF export error:", e);
    }
  };

  // Download Individual Payment Receipt PDF
  const handleDownloadSingleReceipt = (item: any) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 61, 60);
      doc.rect(0, 0, 210, 32, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("MQULIMA AGROSHOP OFFICIAL RECEIPT", 14, 18);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(200, 230, 220);
      doc.text("Mkulima Hub Platform Payment Receipt & Proof of Purchase", 14, 26);

      let y = 45;
      doc.setFontSize(10);
      doc.setTextColor(15, 61, 60);
      doc.setFont("Helvetica", "bold");
      doc.text("TRANSACTION INFORMATION", 14, y);

      y += 6;
      doc.setDrawColor(39, 140, 123);
      doc.line(14, y, 196, y);

      y += 8;
      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(50, 50, 50);

      doc.text(`Receipt Reference: ${item.id}`, 14, y);
      doc.text(`M-Pesa Trans ID: ${item.transactionId}`, 110, y);

      y += 6;
      doc.text(`Payment Method: ${item.method}`, 14, y);
      doc.text(`Payment Date: ${new Date(item.createdAt || Date.now()).toLocaleString()}`, 110, y);

      y += 12;
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 61, 60);
      doc.text("CUSTOMER DETAILS", 14, y);

      y += 6;
      doc.line(14, y, 196, y);

      y += 8;
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`Customer Name: ${item.customerName || "N/A"}`, 14, y);
      doc.text(`Phone Number: ${item.customerPhone || "N/A"}`, 110, y);

      y += 6;
      doc.text(`Email Address: ${item.customerEmail || "N/A"}`, 14, y);
      doc.text(`County / Location: ${item.customerCounty || "N/A"}`, 110, y);

      y += 12;
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 61, 60);
      doc.text("PURCHASED SHOP PRODUCTS & SERVICES", 14, y);

      y += 6;
      doc.line(14, y, 196, y);

      y += 8;
      if (Array.isArray(item.items) && item.items.length > 0) {
        doc.setFont("Helvetica", "bold");
        doc.text("Item Name", 14, y);
        doc.text("Qty", 120, y);
        doc.text("Unit Price (KSh)", 140, y);
        doc.text("Subtotal (KSh)", 170, y);

        y += 6;
        doc.setFont("Helvetica", "normal");
        for (const it of item.items) {
          doc.text(String(it.name || it.title || "Agroshop Product").slice(0, 45), 14, y);
          doc.text(String(it.quantity || 1), 120, y);
          doc.text(parseFloat(it.price || 0).toLocaleString(), 140, y);
          const sub = (it.quantity || 1) * (it.price || 0);
          doc.text(sub.toLocaleString(), 170, y);
          y += 6;
        }
      } else {
        doc.setFont("Helvetica", "normal");
        doc.text(`Order #${item.orderId || "N/A"} - General Shop Order Checkout`, 14, y);
        y += 6;
      }

      y += 8;
      doc.setFillColor(240, 248, 246);
      doc.rect(14, y, 182, 16, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 61, 60);
      doc.text("TOTAL AMOUNT PAID:", 20, y + 11);
      doc.text(`KSh ${parseFloat(item.amountKsh || 0).toLocaleString()}`, 140, y + 11);

      doc.save(`receipt_${item.transactionId || item.id}.pdf`);
    } catch (e) {
      console.error("Single receipt PDF error:", e);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C]">
            Payment Reconciliation & Financial Ledger
          </h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Audit live shop payments, M-Pesa STK Push transactions, match orphaned payments, and export PDF statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPayments}
            className="p-2 bg-[#E8F4F1] border border-[#CCE5E1] rounded-lg text-[#0F3D3C] hover:bg-[#d4ece7] cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExportPDFStatement}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#278C7B] hover:bg-[#1D6F61] text-white text-xs font-bold font-mono rounded-lg transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Financial Statement (PDF)</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#CCE5E1] p-4 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-[#4A7C79]">
              Reconciled Revenue
            </span>
            <div className="text-xl font-bold font-serif text-[#0F3D3C] mt-0.5">
              KSh {totalReconciledKsh.toLocaleString()}
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold">
              {matchedCount} Matched Shop Payments
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-[#278C7B]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#CCE5E1] p-4 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-[#4A7C79]">
              Matched Orders
            </span>
            <div className="text-xl font-bold font-serif text-[#0F3D3C] mt-0.5">
              {matchedCount}
            </div>
            <span className="text-[10px] font-mono text-[#2C5E5B]">
              Verified in PostgreSQL
            </span>
          </div>
          <div className="p-3 bg-teal-50 rounded-lg text-[#278C7B]">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#CCE5E1] p-4 rounded-lg shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-[#4A7C79]">
              Orphaned Payments
            </span>
            <div className="text-xl font-bold font-serif text-rose-700 mt-0.5">
              {orphanedCount}
            </div>
            <span className="text-[10px] font-mono text-rose-600 font-bold">
              Require Admin Reconciliation
            </span>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3 border border-[#CCE5E1] rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#4A7C79] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payment ID, transaction ref, customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAFDFD] border border-[#CCE5E1] rounded-md text-xs font-mono text-[#0F3D3C] outline-none focus:border-[#278C7B]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition ${
              filterStatus === "all"
                ? "bg-[#278C7B] text-white"
                : "bg-[#E8F4F1] text-[#0F3D3C] hover:bg-[#d5e8e4]"
            }`}
          >
            All ({payments.length})
          </button>
          <button
            onClick={() => setFilterStatus("matched")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition ${
              filterStatus === "matched"
                ? "bg-[#278C7B] text-white"
                : "bg-[#E8F4F1] text-[#0F3D3C] hover:bg-[#d5e8e4]"
            }`}
          >
            Matched ({matchedCount})
          </button>
          <button
            onClick={() => setFilterStatus("orphaned")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition ${
              filterStatus === "orphaned"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Orphaned ({orphanedCount})
          </button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white border border-[#CCE5E1] rounded-[6px] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#E8F4F1] border-b border-[#CCE5E1] font-mono text-[11px] uppercase text-[#0F3D3C]">
            <tr>
              <th className="p-3">Payment / Trans Ref</th>
              <th className="p-3">Customer & Contact</th>
              <th className="p-3">Method</th>
              <th className="p-3">Amount (KSh)</th>
              <th className="p-3">Matched Order</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CCE5E1]/60 font-sans">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[#4A7C79] font-mono">
                  Loading payment ledger from PostgreSQL...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[#4A7C79] font-mono">
                  No payment records found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => {
                const isExpanded = expandedPaymentId === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <tr className="hover:bg-[#E8F4F1]/50 transition">
                      <td className="p-3 font-mono">
                        <div className="font-bold text-[#0F3D3C]">{p.id}</div>
                        <div className="text-[10px] text-[#278C7B] font-semibold">
                          {p.transactionId}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-[#0F3D3C] flex items-center gap-1">
                          <User className="w-3 h-3 text-[#278C7B]" />
                          <span>{p.customerName || "Guest Customer"}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#4A7C79] flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{p.customerPhone}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[#0F3D3C]">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#278C7B] font-bold text-[10px] border border-emerald-100">
                          {p.method}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#0F3D3C]">
                        KSh {parseFloat(p.amountKsh || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-[#4A7C79]">
                        {p.orderId ? (
                          <span className="font-bold text-[#0F3D3C]">#{p.orderId.slice(0, 10)}</span>
                        ) : (
                          <span className="text-rose-600 font-bold">Unmatched</span>
                        )}
                      </td>
                      <td className="p-3">
                        {p.reconciliationStatus === "orphaned" ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-rose-50 border border-rose-200 text-rose-700 uppercase px-2 py-0.5 rounded-[2px] font-bold">
                            <AlertCircle className="h-3 w-3" /> ORPHANED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-teal-50 border border-teal-200 text-[#278C7B] uppercase px-2 py-0.5 rounded-[2px] font-bold">
                            <CheckCircle className="h-3 w-3" /> MATCHED
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}
                          className="px-2 py-1 text-[11px] bg-[#E8F4F1] text-[#0F3D3C] font-bold rounded hover:bg-[#d4ece7] cursor-pointer inline-flex items-center gap-1"
                        >
                          <ShoppingBag className="w-3 h-3 text-[#278C7B]" />
                          <span>Shop Items</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        <button
                          onClick={() => handleDownloadSingleReceipt(p)}
                          className="px-2 py-1 text-[11px] bg-[#278C7B] text-white font-bold rounded hover:bg-[#1D6F61] cursor-pointer inline-flex items-center gap-1"
                          title="Download Receipt PDF"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>

                        {p.reconciliationStatus === "orphaned" && (
                          <button
                            onClick={() => setSelectedOrphan(p)}
                            className="px-2.5 py-1 text-[11px] bg-rose-600 text-white font-bold rounded hover:bg-rose-700 cursor-pointer inline-flex items-center gap-1"
                          >
                            Reconcile
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Purchased Items Drawer */}
                    {isExpanded && (
                      <tr className="bg-[#FAFDFD] border-b border-[#CCE5E1]">
                        <td colSpan={7} className="p-4">
                          <div className="space-y-2 text-xs font-mono">
                            <div className="flex items-center justify-between text-[11px] text-[#278C7B] font-bold uppercase border-b border-[#CCE5E1]/60 pb-1">
                              <span className="flex items-center gap-1">
                                <ShoppingBag className="w-3.5 h-3.5" /> Purchased Shop Products & Cart Breakdown
                              </span>
                              <span>Order Reference: #{p.orderId || "Unassigned"}</span>
                            </div>

                            {Array.isArray(p.items) && p.items.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {p.items.map((it: any, iIdx: number) => (
                                  <div
                                    key={iIdx}
                                    className="flex items-center justify-between bg-white p-2.5 rounded border border-[#CCE5E1]"
                                  >
                                    <div>
                                      <div className="font-bold text-[#0F3D3C]">
                                        {it.name || it.title || "Agroshop Product"}
                                      </div>
                                      <div className="text-[10px] text-[#4A7C79]">
                                        Quantity: {it.quantity || 1} &middot; Unit Price: KSh {parseFloat(it.price || 0).toLocaleString()}
                                      </div>
                                    </div>
                                    <div className="font-bold text-[#278C7B]">
                                      KSh {((it.quantity || 1) * (it.price || 0)).toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 italic py-1">
                                Standard Agroshop order item bundle (KSh {parseFloat(p.amountKsh || 0).toLocaleString()}).
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Reconcile Modal */}
      {selectedOrphan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white border border-[#CCE5E1] rounded-[6px] p-6 max-w-md w-full text-left space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#CCE5E1] pb-3">
              <h2 className="text-base font-serif font-bold text-[#0F3D3C]">
                Reconcile Orphaned Payment
              </h2>
              <button onClick={() => setSelectedOrphan(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono bg-[#E8F4F1] border border-[#CCE5E1] p-3 rounded-[4px] space-y-1 text-[#0F3D3C]">
              <div>Trans ID: <strong className="text-[#278C7B]">{selectedOrphan.transactionId}</strong></div>
              <div>Payer Phone: <strong>{selectedOrphan.customerPhone}</strong></div>
              <div>Amount: <strong className="text-[#0F3D3C]">KSh {selectedOrphan.amountKsh}</strong></div>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <label className="block text-[#4A7C79] text-[10px] uppercase font-bold">Target Order ID</label>
              <input
                type="text"
                placeholder="Enter valid customer order ID..."
                value={targetOrderId}
                onChange={(e) => setTargetOrderId(e.target.value)}
                className="w-full bg-[#FAFDFD] border border-[#CCE5E1] p-2 rounded-[4px] text-[#0F3D3C] outline-none focus:border-[#278C7B]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#CCE5E1]">
              <button
                onClick={() => setSelectedOrphan(null)}
                className="px-3 py-1.5 bg-[#E8F4F1] text-[#0F3D3C] text-xs font-semibold rounded-[4px] hover:bg-[#d5e8e4]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReconcile(selectedOrphan.id)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-[4px] cursor-pointer"
              >
                Match Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
