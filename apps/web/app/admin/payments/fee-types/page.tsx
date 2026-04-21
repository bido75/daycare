"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Plus, Search, Pencil, X, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { toast } from "sonner";

interface FeeType {
  id: string;
  name: string;
  description?: string;
  amount: number;
  frequency: string;
  isActive: boolean;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const fmt = (n?: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);

const FREQUENCIES = ["ONE_TIME", "WEEKLY", "MONTHLY", "ANNUAL"];

const emptyForm = {
  name: "",
  description: "",
  amount: 0,
  frequency: "MONTHLY",
  isActive: true,
};

export default function AdminFeeTypesPage() {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<FeeType | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchFeeTypes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (search) params.search = search;
      if (activeFilter) params.active = activeFilter;
      const res = await api.get("/billing/fee-types", { params });
      setFeeTypes(res.data.data || []);
      setMeta(res.data.meta || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch {
      setFeeTypes([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter]);

  useEffect(() => {
    fetchFeeTypes();
  }, [fetchFeeTypes]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (ft: FeeType) => {
    setEditTarget(ft);
    setForm({
      name: ft.name,
      description: ft.description ?? "",
      amount: ft.amount,
      frequency: ft.frequency,
      isActive: ft.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await api.patch(`/billing/fee-types/${editTarget.id}`, form);
        toast.success("Fee type updated");
      } else {
        await api.post("/billing/fee-types", form);
        toast.success("Fee type created");
      }
      setShowForm(false);
      fetchFeeTypes();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to save fee type");
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this fee type?")) return;
    try {
      await api.delete(`/billing/fee-types/${id}`);
      toast.success("Fee type deactivated");
      fetchFeeTypes();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to deactivate");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Types</h1>
          <p className="text-sm text-gray-500 mt-1">Configure tuition rates and fee structures</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Fee Type
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="bg-transparent outline-none text-sm w-full"
            placeholder="Search fee types..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : feeTypes.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No fee types found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50 border-b">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Frequency</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeTypes.map((ft) => (
                  <tr key={ft.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{ft.name}</p>
                      {ft.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{ft.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{fmt(ft.amount)}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                        {ft.frequency}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          ft.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {ft.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(ft)}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {ft.isActive && (
                          <button
                            onClick={() => handleDeactivate(ft.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Deactivate"
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

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{meta.total} fee types total</span>
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editTarget ? "Edit Fee Type" : "Add Fee Type"}
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Monthly Tuition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    value={form.frequency}
                    onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                {editTarget ? "Save Changes" : "Create Fee Type"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
