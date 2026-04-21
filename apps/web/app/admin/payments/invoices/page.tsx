"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Plus, Search, Send, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  createdAt: string;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    user: { email: string };
  };
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  payments: { id: string; amount: number; method: string; status: string; paidAt: string }[];
}

interface Parent {
  id: string;
  email: string;
  parentProfile: { id: string; firstName: string; lastName: string };
}

interface FeeType {
  id: string;
  name: string;
  amount: number;
  frequency: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOID: "bg-gray-100 text-gray-500",
  PARTIALLY_PAID: "bg-blue-100 text-blue-700",
  DRAFT: "bg-gray-100 text-gray-600",
};

const fmt = (n?: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showDetail, setShowDetail] = useState<Invoice | null>(null);

  const [parents, setParents] = useState<Parent[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);

  // Create form state
  const [createForm, setCreateForm] = useState({
    parentProfileId: "",
    dueDate: "",
    notes: "",
    items: [{ feeTypeId: "", description: "", quantity: 1, unitPrice: 0 }],
  });

  // Bulk form state
  const [bulkForm, setBulkForm] = useState({
    parentIds: [] as string[],
    feeTypeId: "",
    dueDate: "",
  });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/billing/invoices", { params });
      setInvoices(res.data.data || []);
      setMeta(res.data.meta || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    Promise.all([
      api.get("/parents", { params: { limit: 200 } }),
      api.get("/billing/fee-types", { params: { active: "true", limit: 100 } }),
    ])
      .then(([pRes, ftRes]) => {
        setParents(pRes.data.data || []);
        setFeeTypes(ftRes.data.data || []);
      })
      .catch(() => {});
  }, []);

  const handleCreateInvoice = async () => {
    try {
      await api.post("/billing/invoices", createForm);
      toast.success("Invoice created successfully");
      setShowCreate(false);
      setCreateForm({
        parentProfileId: "",
        dueDate: "",
        notes: "",
        items: [{ feeTypeId: "", description: "", quantity: 1, unitPrice: 0 }],
      });
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to create invoice");
    }
  };

  const handleBulkCreate = async () => {
    try {
      const res = await api.post("/billing/invoices/bulk", bulkForm);
      toast.success(`Created ${res.data.created} invoices`);
      setShowBulk(false);
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to create bulk invoices");
    }
  };

  const handleVoid = async (id: string) => {
    if (!confirm("Are you sure you want to void this invoice?")) return;
    try {
      await api.post(`/billing/invoices/${id}/void`);
      toast.success("Invoice voided");
      fetchInvoices();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to void invoice");
    }
  };

  const handleReminder = async (id: string) => {
    try {
      await api.post(`/billing/invoices/${id}/reminder`);
      toast.success("Reminder sent");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to send reminder");
    }
  };

  const addItem = () => {
    setCreateForm((f) => ({
      ...f,
      items: [...f.items, { feeTypeId: "", description: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setCreateForm((f) => {
      const items = [...f.items];
      (items[idx] as any)[field] = value;
      if (field === "feeTypeId" && value) {
        const ft = feeTypes.find((x) => x.id === value);
        if (ft) {
          items[idx].description = ft.name;
          items[idx].unitPrice = ft.amount;
        }
      }
      return { ...f, items };
    });
  };

  const removeItem = (idx: number) => {
    setCreateForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const filteredInvoices = search
    ? invoices.filter((inv) => {
        const name = `${inv.parent?.firstName} ${inv.parent?.lastName}`.toLowerCase();
        return (
          name.includes(search.toLowerCase()) ||
          inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
        );
      })
    : invoices;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and create invoices for families</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulk(true)}
            className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Bulk Create
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="bg-transparent outline-none text-sm w-full"
            placeholder="Search by parent or invoice #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="VOID">Void</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No invoices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50 border-b">
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Parent</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Balance Due</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-indigo-600 font-medium">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {inv.parent ? `${inv.parent.firstName} ${inv.parent.lastName}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-900">{fmt(inv.totalAmount)}</td>
                    <td className="px-5 py-3 text-gray-900">{fmt(inv.balanceDue)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDetail(inv)}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {["PENDING", "OVERDUE", "PARTIALLY_PAID"].includes(inv.status) && (
                          <button
                            onClick={() => handleReminder(inv.id)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Send Reminder"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {!["PAID", "VOID"].includes(inv.status) && (
                          <button
                            onClick={() => handleVoid(inv.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Void Invoice"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{meta.total} invoices total</span>
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

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Create Invoice</h2>
              <button onClick={() => setShowCreate(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={createForm.parentProfileId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, parentProfileId: e.target.value }))}
                >
                  <option value="">Select parent...</option>
                  {parents.map((p) => (
                    <option key={p.parentProfile?.id} value={p.parentProfile?.id}>
                      {p.parentProfile?.firstName} {p.parentProfile?.lastName} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Line Items</label>
                  <button onClick={addItem} className="text-xs text-indigo-600 hover:underline">
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {createForm.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <select
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
                          value={item.feeTypeId}
                          onChange={(e) => updateItem(idx, "feeTypeId", e.target.value)}
                        >
                          <option value="">Custom</option>
                          {feeTypes.map((ft) => (
                            <option key={ft.id} value={ft.id}>
                              {ft.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <input
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          min={1}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {createForm.items.length > 1 && (
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="text-xs text-gray-400 grid grid-cols-12 gap-2">
                    <span className="col-span-4">Fee Type</span>
                    <span className="col-span-4">Description</span>
                    <span className="col-span-1">Qty</span>
                    <span className="col-span-2">Price</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  rows={3}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>
                    {fmt(
                      createForm.items.reduce(
                        (sum, item) => sum + item.unitPrice * item.quantity,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Bulk Create Invoices</h2>
              <button onClick={() => setShowBulk(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={bulkForm.feeTypeId}
                  onChange={(e) => setBulkForm((f) => ({ ...f, feeTypeId: e.target.value }))}
                >
                  <option value="">Select fee type...</option>
                  {feeTypes.map((ft) => (
                    <option key={ft.id} value={ft.id}>
                      {ft.name} ({fmt(ft.amount)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Parents ({bulkForm.parentIds.length} selected)
                </label>
                <div className="border border-gray-200 rounded-lg overflow-auto max-h-48">
                  <div className="p-2 border-b">
                    <button
                      onClick={() =>
                        setBulkForm((f) => ({
                          ...f,
                          parentIds:
                            f.parentIds.length === parents.length
                              ? []
                              : parents.map((p) => p.parentProfile?.id).filter(Boolean),
                        }))
                      }
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      {bulkForm.parentIds.length === parents.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  {parents.map((p) => (
                    <label
                      key={p.parentProfile?.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={bulkForm.parentIds.includes(p.parentProfile?.id)}
                        onChange={(e) =>
                          setBulkForm((f) => ({
                            ...f,
                            parentIds: e.target.checked
                              ? [...f.parentIds, p.parentProfile?.id]
                              : f.parentIds.filter((id) => id !== p.parentProfile?.id),
                          }))
                        }
                      />
                      {p.parentProfile?.firstName} {p.parentProfile?.lastName}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={bulkForm.dueDate}
                  onChange={(e) => setBulkForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t">
              <button
                onClick={() => setShowBulk(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCreate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Create {bulkForm.parentIds.length} Invoices
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">Invoice {showDetail.invoiceNumber}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[showDetail.status]}`}>
                  {showDetail.status}
                </span>
              </div>
              <button onClick={() => setShowDetail(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Parent</p>
                  <p className="font-medium">
                    {showDetail.parent?.firstName} {showDetail.parent?.lastName}
                  </p>
                  <p className="text-gray-400 text-xs">{showDetail.parent?.user?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p className="font-medium">{new Date(showDetail.dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Line Items</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs border-b">
                      <th className="text-left pb-2">Description</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Unit Price</th>
                      <th className="text-right pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showDetail.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">{fmt(item.unitPrice)}</td>
                        <td className="py-2 text-right font-medium">{fmt(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between text-sm font-semibold mt-3 pt-3 border-t">
                  <span>Total</span>
                  <span>{fmt(showDetail.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Paid</span>
                  <span>{fmt(showDetail.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-indigo-600 mt-1">
                  <span>Balance Due</span>
                  <span>{fmt(showDetail.balanceDue)}</span>
                </div>
              </div>

              {showDetail.payments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h3>
                  <div className="space-y-2">
                    {showDetail.payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-600">{p.method} · {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</span>
                        <span className="font-medium">{fmt(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
