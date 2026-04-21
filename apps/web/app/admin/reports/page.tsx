"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  Users, TrendingUp, Calendar, BarChart2, FileText, Printer, Download, Loader2,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "sonner";

const TABS = [
  { id: "enrollment", label: "Enrollment", icon: Users },
  { id: "attendance", label: "Attendance", icon: Calendar },
  { id: "revenue", label: "Revenue", icon: TrendingUp },
  { id: "classrooms", label: "Classrooms", icon: BarChart2 },
  { id: "documents", label: "Document Compliance", icon: FileText },
];

const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function StatCard({ title, value, sub, color = "bg-indigo-500" }: { title: string; value: string; sub?: string; color?: string }) {
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

export default function AdminReportsPage() {
  const [tab, setTab] = useState("enrollment");
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
      const res = await api.get(`/reports/${tab}`, { params });
      setData(res.data);
    } catch {
      toast.error("Failed to load report");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tab, dateFrom, dateTo]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportCsv = async () => {
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await api.get(`/reports/export/${tab}`, { params, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = `${tab}-report.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Operational insights and data exports</p>
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Date filters */}
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
      ) : !data ? (
        <div className="bg-white border border-gray-200 rounded-xl p-24 text-center text-gray-400">No data available</div>
      ) : (
        <>
          {tab === "enrollment" && <EnrollmentTab data={data} />}
          {tab === "attendance" && <AttendanceTab data={data} />}
          {tab === "revenue" && <RevenueTab data={data} />}
          {tab === "classrooms" && <ClassroomsTab data={data} />}
          {tab === "documents" && <DocumentsTab data={data} />}
        </>
      )}
    </div>
  );
}

function EnrollmentTab({ data }: { data: any }) {
  const s = data.summary ?? {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={fmt(s.totalStudents)} />
        <StatCard title="Active Students" value={fmt(s.activeStudents)} sub="Currently enrolled" />
        <StatCard title="Inactive Students" value={fmt(s.inactiveStudents)} />
        <StatCard title="Pending Registrations" value={fmt(s.pendingRegistrations)} />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">New Enrollments Per Month</h3>
        {data.enrollmentTrend?.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.enrollmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} name="Enrollments" />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="h-40 flex items-center justify-center text-gray-400">No data</div>}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Enrollment by Classroom</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-100">
              <th className="pb-3">Classroom</th><th className="pb-3">Capacity</th><th className="pb-3">Enrolled</th><th className="pb-3">Active</th><th className="pb-3">Utilization</th>
            </tr></thead>
            <tbody>
              {(data.byClassroom ?? []).map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50">
                  <td className="py-2 font-medium text-gray-900">{c.name}</td>
                  <td className="py-2 text-gray-500">{c.capacity}</td>
                  <td className="py-2 text-gray-700">{c.enrolled}</td>
                  <td className="py-2 text-gray-700">{c.active}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(c.capacity > 0 ? Math.round(c.enrolled / c.capacity * 100) : 0, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{c.capacity > 0 ? Math.round(c.enrolled / c.capacity * 100) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AttendanceTab({ data }: { data: any }) {
  const s = data.summary ?? {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Avg Attendance Rate" value={`${s.avgRate ?? 0}%`} />
        <StatCard title="Total Records" value={fmt(s.totalRecords)} />
        <StatCard title="Present Count" value={fmt(s.presentCount)} />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Daily Attendance Rate</h3>
        {data.dailyRate?.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.dailyRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, "Rate"]} />
              <Bar dataKey="rate" fill="#10b981" radius={[3, 3, 0, 0]} name="Attendance %" />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-40 flex items-center justify-center text-gray-400">No data</div>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Most Absences</h3>
          <div className="space-y-2">
            {(data.mostAbsent ?? []).map((r: any) => (
              <div key={r.student.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{r.student.firstName} {r.student.lastName}</span>
                <span className="font-semibold text-red-600">{r.count} absent</span>
              </div>
            ))}
            {!data.mostAbsent?.length && <p className="text-gray-400 text-sm">No absences recorded</p>}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">By Classroom</h3>
          <div className="space-y-2">
            {(data.byClassroom ?? []).map((c: any) => (
              <div key={c.classroomId} className="flex items-center gap-2 text-sm">
                <span className="text-gray-700 w-28 shrink-0">{c.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${c.rate}%` }} />
                </div>
                <span className="text-gray-500 text-xs w-10 text-right">{c.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueTab({ data }: { data: any }) {
  const s = data.summary ?? {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={fmt(s.totalRevenue, true)} />
        <StatCard title="Outstanding" value={fmt(s.outstanding, true)} sub="Unpaid balance" />
        <StatCard title="Collection Rate" value={`${s.collectionRate ?? 0}%`} />
        <StatCard title="Avg Invoice" value={fmt(s.avgInvoice, true)} />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
        {data.monthlyRevenue?.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.monthlyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [fmt(v, true), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div className="h-40 flex items-center justify-center text-gray-400">No data</div>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Methods</h3>
          {data.paymentMethods?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.paymentMethods} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={80} label={({ method, percent }: any) => `${method} ${(percent * 100).toFixed(0)}%`}>
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
                {[...(data.monthlyRevenue ?? [])].reverse().map((r: any) => (
                  <tr key={r.month} className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-700">{r.month}</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">{fmt(r.revenue, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassroomsTab({ data }: { data: any }) {
  const rows = Array.isArray(data) ? data : [];
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Capacity Utilization</h3>
        {rows.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rows} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
              <Tooltip formatter={(v: any) => [`${v}%`, "Utilization"]} />
              <Bar dataKey="utilization" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-40 flex items-center justify-center text-gray-400">No data</div>}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
              <th className="px-5 py-3">Classroom</th>
              <th className="px-5 py-3">Age Group</th>
              <th className="px-5 py-3">Capacity</th>
              <th className="px-5 py-3">Enrolled</th>
              <th className="px-5 py-3">Active</th>
              <th className="px-5 py-3">Utilization</th>
              <th className="px-5 py-3">Lead Staff</th>
            </tr></thead>
            <tbody>
              {rows.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3 text-gray-500">{c.ageGroup} months</td>
                  <td className="px-5 py-3 text-gray-700">{c.capacity}</td>
                  <td className="px-5 py-3 text-gray-700">{c.enrolled}</td>
                  <td className="px-5 py-3 text-gray-700">{c.active}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${c.utilization >= 90 ? "bg-red-500" : c.utilization >= 70 ? "bg-amber-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(c.utilization, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{c.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{c.leadStaff ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ data }: { data: any }) {
  const s = data.summary ?? {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Documents" value={fmt(s.totalDocs)} />
        <StatCard title="Verified" value={fmt(s.verifiedDocs)} />
        <StatCard title="Unverified" value={fmt(s.unverifiedDocs)} />
        <StatCard title="Verification Rate" value={`${s.verificationRate ?? 0}%`} />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Overall Verification</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-4">
            <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${s.verificationRate ?? 0}%` }} />
          </div>
          <span className="text-sm font-semibold text-gray-700 w-12 text-right">{s.verificationRate ?? 0}%</span>
        </div>
        <div className="flex gap-6 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />{s.verifiedDocs} verified</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" />{s.unverifiedDocs} pending</span>
        </div>
      </div>
      {data.expiringSoon?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Expiring Soon (30 days)</h3>
          <div className="space-y-2">
            {data.expiringSoon.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between text-sm bg-amber-50 border border-amber-100 rounded-lg px-4 py-2">
                <span className="font-medium text-gray-800">{d.student.firstName} {d.student.lastName} — {d.name}</span>
                <span className="text-amber-700 font-medium">{new Date(d.expiresAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.studentsWithUnverified?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Students with Unverified Documents</h3>
          <div className="space-y-2">
            {data.studentsWithUnverified.map((r: any) => (
              <div key={r.student.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{r.student.firstName} {r.student.lastName}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{r.count} unverified</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
