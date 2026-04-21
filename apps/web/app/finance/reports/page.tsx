"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { TrendingUp, Download, Printer, Loader2 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function fmt(n?: number, currency = false) {
  if (n === undefined || n === null) return "—";
  if (currency) return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
  return n.toLocaleString();
}

export default function FinanceReportsPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await api.get("/reports/revenue", { params });
      setData(res.data);
    } catch {
      toast.error("Failed to load revenue report");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportCsv = async () => {
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await api.get("/reports/export/revenue", { params, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = "revenue-report.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
  };

  const s = data?.summary ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Revenue analysis and financial summaries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="flex gap-3 items-center bg-white border border-gray-200 rounded-xl p-4">
        <span className="text-sm text-gray-500 font-medium">Date range:</span>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-sm text-gray-400 hover:text-gray-600">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-24 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-400" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Revenue" value={fmt(s.totalRevenue, true)} />
            <StatCard title="Outstanding" value={fmt(s.outstanding, true)} sub="Unpaid balance" />
            <StatCard title="Collection Rate" value={`${s.collectionRate ?? 0}%`} />
            <StatCard title="Avg Invoice" value={fmt(s.avgInvoice, true)} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
            {data?.monthlyRevenue?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.monthlyRevenue}>
                  <defs>
                    <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => [fmt(v, true), "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#revGrad2)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-40 flex items-center justify-center text-gray-400">No data</div>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Method Distribution</h3>
              {data?.paymentMethods?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.paymentMethods} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={80}
                      label={({ method, percent }: any) => `${method} ${(percent * 100).toFixed(0)}%`}>
                      {data.paymentMethods.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [fmt(v, true), "Amount"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-40 flex items-center justify-center text-gray-400">No data</div>}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
              <div className="overflow-y-auto max-h-52">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-100">
                    <th className="pb-2">Month</th><th className="pb-2 text-right">Revenue</th>
                  </tr></thead>
                  <tbody>
                    {[...(data?.monthlyRevenue ?? [])].reverse().map((r: any) => (
                      <tr key={r.month} className="border-b border-gray-50">
                        <td className="py-1.5 text-gray-700">{r.month}</td>
                        <td className="py-1.5 text-right font-medium text-gray-900">{fmt(r.revenue, true)}</td>
                      </tr>
                    ))}
                    {!data?.monthlyRevenue?.length && <tr><td colSpan={2} className="py-4 text-center text-gray-400">No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
