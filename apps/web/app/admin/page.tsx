"use client";

import { useState, useEffect } from "react";
import { Users, School, ClipboardList, CalendarCheck, CreditCard, FileText, AlertTriangle, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

export default function AdminDashboard() {
  const [academyName, setAcademyName] = useState("Creative Kids Academy");
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [activeClassrooms, setActiveClassrooms] = useState<number | null>(null);
  const [pendingRegistrations, setPendingRegistrations] = useState<number | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<string | null>(null);
  const [pendingDocuments, setPendingDocuments] = useState<number | null>(null);
  const [openIncidents, setOpenIncidents] = useState<number | null>(null);
  const [occupancyRate, setOccupancyRate] = useState<string | null>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Academy name
    api.get("/settings/academy_profile").then((res) => {
      const val = res.data?.value || res.data?.data;
      if (val?.name) setAcademyName(val.name);
    }).catch(() => {});

    async function loadDashboard() {
      try {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const [studentsRes, classroomsRes, registrationsRes, attendanceRes, invoicesRes, documentsRes, incidentsRes] = await Promise.allSettled([
          api.get("/students", { params: { limit: 1 } }),
          api.get("/classrooms"),
          api.get("/registrations", { params: { limit: 100 } }),
          api.get("/attendance", { params: { date: todayStr, limit: 500 } }),
          api.get("/billing/invoices", { params: { limit: 100 } }),
          api.get("/documents", { params: { limit: 100 } }),
          api.get("/incidents", { params: { status: "OPEN", limit: 100 } }),
        ]);

        // Total Students
        if (studentsRes.status === "fulfilled") {
          const data = studentsRes.value.data;
          setTotalStudents(data?.meta?.total ?? data?.total ?? (Array.isArray(data?.data) ? data.data.length : 0));
        }

        // Active Classrooms + Occupancy
        if (classroomsRes.status === "fulfilled") {
          const classrooms = classroomsRes.value.data?.data || classroomsRes.value.data || [];
          if (Array.isArray(classrooms)) {
            const active = classrooms.filter((c: any) => c.isActive !== false);
            setActiveClassrooms(active.length);
            const totalCapacity = active.reduce((s: number, c: any) => s + (c.capacity || 0), 0);
            const totalEnrolled = active.reduce((s: number, c: any) => s + (c._count?.students || c.studentCount || 0), 0);
            if (totalCapacity > 0) {
              setOccupancyRate(`${Math.round((totalEnrolled / totalCapacity) * 100)}%`);
            }
          }
        }

        // Pending Registrations
        if (registrationsRes.status === "fulfilled") {
          const regs = registrationsRes.value.data?.data || registrationsRes.value.data || [];
          if (Array.isArray(regs)) {
            const pending = regs.filter((r: any) => r.status === "PENDING" || r.status === "UNDER_REVIEW");
            setPendingRegistrations(pending.length);
            setRecentRegistrations(regs.slice(0, 5));
          }
        }

        // Today's Attendance
        if (attendanceRes.status === "fulfilled") {
          const records = attendanceRes.value.data?.data || attendanceRes.value.data || [];
          if (Array.isArray(records)) {
            const present = records.filter((r: any) => r.status === "PRESENT" || r.checkInTime).length;
            const total = records.length;
            setTodayAttendance(total > 0 ? `${present}/${total}` : "0");
            setRecentAttendance(records.slice(0, 5));
          }
        }

        // Total Revenue (paid invoices)
        if (invoicesRes.status === "fulfilled") {
          const invoices = invoicesRes.value.data?.data || invoicesRes.value.data || [];
          if (Array.isArray(invoices)) {
            const paid = invoices
              .filter((inv: any) => inv.status === "PAID")
              .reduce((sum: number, inv: any) => sum + (Number(inv.totalAmount) || 0), 0);
            setTotalRevenue(`$${paid.toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
          }
        }

        // Pending Documents
        if (documentsRes.status === "fulfilled") {
          const docs = documentsRes.value.data?.data || documentsRes.value.data || [];
          if (Array.isArray(docs)) {
            const pending = docs.filter((d: any) => d.status === "PENDING" || d.status === "UPLOADED").length;
            setPendingDocuments(pending);
          }
        }

        // Open Incidents
        if (incidentsRes.status === "fulfilled") {
          const incidents = incidentsRes.value.data?.data || incidentsRes.value.data || [];
          if (Array.isArray(incidents)) {
            setOpenIncidents(incidents.length);
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const primaryMetrics = [
    { label: "Total Students", value: totalStudents, icon: Users, color: "text-blue-600 bg-blue-50", href: "/admin/students" },
    { label: "Active Classrooms", value: activeClassrooms, icon: School, color: "text-green-600 bg-green-50", href: "/admin/classrooms" },
    { label: "Pending Registrations", value: pendingRegistrations, icon: ClipboardList, color: "text-orange-600 bg-orange-50", href: "/admin/registrations" },
    { label: "Today's Attendance", value: todayAttendance, icon: CalendarCheck, color: "text-purple-600 bg-purple-50", href: "/admin/attendance" },
  ];

  const secondaryMetrics = [
    { label: "Total Revenue", value: totalRevenue, icon: CreditCard, color: "text-emerald-600 bg-emerald-50", href: "/admin/payments" },
    { label: "Pending Documents", value: pendingDocuments, icon: FileText, color: "text-amber-600 bg-amber-50", href: "/admin/documents" },
    { label: "Open Incidents", value: openIncidents, icon: AlertTriangle, color: "text-red-600 bg-red-50", href: "/admin/staff" },
    { label: "Occupancy Rate", value: occupancyRate, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50", href: "/admin/classrooms" },
  ];

  const renderMetrics = (items: typeof primaryMetrics) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((m) => {
        const Icon = m.icon;
        const displayValue = loading ? "..." : (m.value ?? "–");
        return (
          <Link key={m.label} href={m.href} className="rounded-xl bg-card border border-border p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${m.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-foreground">{displayValue}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{m.label}</div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome to the {academyName} admin portal.</p>
      </div>

      {/* Primary Metrics */}
      {renderMetrics(primaryMetrics)}

      {/* Secondary Metrics */}
      <div className="mt-4">
        {renderMetrics(secondaryMetrics)}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Registrations */}
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Registrations</h2>
            <Link href="/admin/registrations" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recentRegistrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            <div className="space-y-3">
              {recentRegistrations.map((reg: any) => {
                const student = reg.student || {};
                return (
                  <div key={reg.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt={student.firstName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium">{student.firstName} {student.lastName}</div>
                        <div className="text-xs text-muted-foreground">{new Date(reg.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      reg.status === "APPROVED" ? "bg-green-100 text-green-700" :
                      reg.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                      reg.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {reg.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Attendance */}
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Today&apos;s Attendance</h2>
            <Link href="/admin/attendance" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recentAttendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records for today.</p>
          ) : (
            <div className="space-y-2">
              {recentAttendance.map((record: any, i: number) => (
                <div key={record.id || i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">
                      {record.student?.firstName} {record.student?.lastName}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {record.classroom?.name || ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "–"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      record.status === "PRESENT" || record.checkInTime ? "bg-green-100 text-green-700" :
                      record.status === "ABSENT" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {record.status || (record.checkInTime ? "Present" : "–")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
