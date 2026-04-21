"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Plus, Search, Download, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionRef?: string;
  paidAt?: string;
  createdAt: string;
  invoice: {
    invoiceNumber: string;
    parent: { firstName: string; lastName: string };
  };
  receipt?: { id: string; receiptNumber: string };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  balanceDue: number;
  totalAmount: number;
  parent: { firstName: string; lastName: string };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const fmt = (n?: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export default function AdminTransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [page, setPage] = useState(1);

  const [showManual, setShowManual] = useState(false);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [manualForm, setManualForm] = useState({
    invoiceId: "",
    amount: 0,
    method: "CASH",
    reference: "",
    notes: "",
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;
      const res = await api.get("/billing/payments", { params });
      setPayments(res.data.data || []);
      setMeta(res.data.meta || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const openManual = async () => {
    try {
      const res = await api.get("/billing/invoices", {
        params: { status: "PENDING", limit: 200 },
      });
      const invoices = (res.data.data || []).filter((inv: any) => inv.balanceDue > 0);
      setPendingInvoices(invoices);
      if (invoices.length > 0) {
        setManualForm((f) => ({
          ...f,
          invoiceId: invoices[0].id,
          amount: invoices[0].balanceDue,
        }));
      }
    } catch {}
    setShowManual(true);
  };

  const handleRecordManual = async () => {
    try {
      await api.post("/billing/payments/manual", manualForm);
      toast.success("Payment recorded successfully");
      setShowManual(false);
      fetchPayments();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to record payment");
    }
  };

  const handleDownloadReceipt = async (receiptId: string) => {
    try {
      const res = await api.get(`/billing/receipts/${receiptId}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receiptId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download receipt");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">All payment transactions</p>
        </div>
        <button
          onClick={openManual}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Record Manual Payment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 flex-wrap">
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
          value={methodFilter}
          onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Methods</option>
          <option value="STRIPE">Stripe</option>
          <option value="CASH">Cash</option>
          <option value="CHECK">Check</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50 border-b">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Parent</th>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(p.paidAt ?? p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {p.invoice?.parent
                        ? `${p.invoice.parent.firstName} ${p.invoice.parent.lastName}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 font-mono text-indigo-600">
                      {p.invoice?.invoiceNumber ?? "—"}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{fmt(p.amount)}</td>
                    <td className="px-5 py-3 text-gray-600">{p.method}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {p.receipt ? (
                        <button
                          onClick={() => handleDownloadReceipt(p.receipt!.id)}
                          className="flex items-center gap-1 text-indigo-600 hover:underline text-xs"
                        >
                          <Download className="w-3 h-3" />
                          {p.receipt.receiptNumber}
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{meta.total} transactions total</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                {page} / {meta.totalPages}
              </span>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Manual Payment Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Record Manual Payment</h2>
              <button onClick={() => setShowManual(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={manualForm.invoiceId}
                  onChange={(e) => {
                    const inv = pendingInvoices.find((i) => i.id === e.target.value);
                    setManualForm((f) => ({
                      ...f,
                      invoiceId: e.target.value,
                      amount: inv?.balanceDue ?? 0,
                    }));
                  }}
                >
                  <option value="">Select invoice...</option>
                  {pendingInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.parent.firstName} {inv.parent.lastName} (
                      {fmt(inv.balanceDue)} due)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={manualForm.amount}
                  onChange={(e) =>
                    setManualForm((f) => ({ ...f, amount: parseFloat(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={manualForm.method}
                  onChange={(e) => setManualForm((f) => ({ ...f, method: e.target.value }))}
                >
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference # (Optional)
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={manualForm.reference}
                  onChange={(e) => setManualForm((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="Check #, transfer ID, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  rows={2}
                  value={manualForm.notes}
                  onChange={(e) => setManualForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t">
              <button
                onClick={() => setShowManual(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordManual}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
