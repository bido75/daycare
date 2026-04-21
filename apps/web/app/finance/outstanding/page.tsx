"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Send, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface OutstandingParent {
  parentId: string;
  parentName: string;
  email: string;
  totalOutstanding: number;
  overdueCount: number;
  invoiceIds: string[];
  oldestDueDate: string;
}

const fmt = (n?: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);

export default function FinanceOutstandingPage() {
  const [parents, setParents] = useState<OutstandingParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchOutstanding = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/billing/invoices", {
        params: { status: "PENDING", limit: 200 },
      });
      const invoices: any[] = res.data.data || [];

      // Group by parent
      const map: Record<string, OutstandingParent> = {};
      for (const inv of invoices) {
        if (!inv.parent) continue;
        const parentId = inv.parentId;
        if (!map[parentId]) {
          map[parentId] = {
            parentId,
            parentName: `${inv.parent.firstName} ${inv.parent.lastName}`,
            email: inv.parent.user?.email ?? "",
            totalOutstanding: 0,
            overdueCount: 0,
            invoiceIds: [],
            oldestDueDate: inv.dueDate,
          };
        }
        map[parentId].totalOutstanding += inv.balanceDue ?? 0;
        map[parentId].invoiceIds.push(inv.id);
        if (inv.status === "OVERDUE") map[parentId].overdueCount++;
        if (new Date(inv.dueDate) < new Date(map[parentId].oldestDueDate)) {
          map[parentId].oldestDueDate = inv.dueDate;
        }
      }

      setParents(
        Object.values(map).sort((a, b) => b.totalOutstanding - a.totalOutstanding)
      );
    } catch {
      setParents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOutstanding(); }, [fetchOutstanding]);

  const handleSendReminder = async (invoiceIds: string[]) => {
    try {
      await Promise.all(invoiceIds.map((id) => api.post(`/billing/invoices/${id}/reminder`)));
      toast.success("Reminders sent");
    } catch {
      toast.error("Failed to send reminders");
    }
  };

  const handleBulkReminder = async () => {
    if (selected.size === 0) { toast.error("Select at least one parent"); return; }
    const invoiceIds = parents.filter((p) => selected.has(p.parentId)).flatMap((p) => p.invoiceIds);
    await handleSendReminder(invoiceIds);
    setSelected(new Set());
  };

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(parents.length / PAGE_SIZE);
  const paginated = parents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outstanding Balances</h1>
          <p className="text-sm text-gray-500 mt-1">Families with unpaid balances</p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleBulkReminder}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Send className="w-4 h-4" />
            Send Reminders ({selected.size})
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No outstanding balances</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50 border-b">
                  <th className="px-5 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === paginated.length}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? new Set(paginated.map((p) => p.parentId))
                            : new Set()
                        )
                      }
                    />
                  </th>
                  <th className="px-5 py-3">Parent</th>
                  <th className="px-5 py-3">Outstanding</th>
                  <th className="px-5 py-3">Overdue Invoices</th>
                  <th className="px-5 py-3">Oldest Due</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr key={p.parentId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.parentId)}
                        onChange={(e) => {
                          const next = new Set(selected);
                          if (e.target.checked) next.add(p.parentId);
                          else next.delete(p.parentId);
                          setSelected(next);
                        }}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{p.parentName}</p>
                      <p className="text-xs text-gray-400">{p.email}</p>
                    </td>
                    <td className="px-5 py-3 font-bold text-red-600">{fmt(p.totalOutstanding)}</td>
                    <td className="px-5 py-3">
                      {p.overdueCount > 0 ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          {p.overdueCount} overdue
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">{p.invoiceIds.length} pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">
                      {new Date(p.oldestDueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleSendReminder(p.invoiceIds)}
                        className="flex items-center gap-1 text-indigo-600 hover:underline text-xs"
                      >
                        <Send className="w-3 h-3" /> Send Reminder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{parents.length} families</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
