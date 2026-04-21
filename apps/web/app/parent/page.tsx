"use client";

import { useState, useEffect } from "react";
import { Baby, CalendarCheck, CreditCard, MessageCircle, FileText, Clock } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

export default function ParentDashboard() {
  const [academyName, setAcademyName] = useState("Creative Kids Academy");
  const [childrenCount, setChildrenCount] = useState<number | null>(null);
  const [daysPresent, setDaysPresent] = useState<number | null>(null);
  const [outstandingBalance, setOutstandingBalance] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch academy name
    api.get("/settings/public/academy_profile").then((res) => {
      const val = res.data?.data || res.data?.value;
      if (val?.name) setAcademyName(val.name);
    }).catch(() => {});

    // Fetch dashboard data
    async function loadDashboard() {
      try {
          const now = new Date();
          const dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const dateTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const [regRes, attendanceRes, invoicesRes, messagesRes] = await Promise.allSettled([
          api.get("/registrations"),
          api.get("/attendance", { params: { dateFrom, dateTo } }),
          api.get("/billing/invoices", { params: { limit: 50 } }),
          api.get("/messages/threads", { params: { limit: 50 } }),
        ]);

        // Children count
        if (regRes.status === "fulfilled") {
          const regs = regRes.value.data?.data || regRes.value.data || [];
          setChildrenCount(Array.isArray(regs) ? regs.length : 0);
          setChildren(Array.isArray(regs) ? regs.slice(0, 3) : []);
        }

        // Days present this month
        if (attendanceRes.status === "fulfilled") {
          const records = attendanceRes.value.data?.data || attendanceRes.value.data || [];
          const presentDays = Array.isArray(records)
            ? new Set(records.filter((r: any) => r.status === "PRESENT" || r.checkInTime).map((r: any) => r.date?.slice(0, 10))).size
            : 0;
          setDaysPresent(presentDays);
          setRecentAttendance(Array.isArray(records) ? records.slice(0, 5) : []);
        }

        // Outstanding balance
        if (invoicesRes.status === "fulfilled") {
          const invoices = invoicesRes.value.data?.data || invoicesRes.value.data || [];
          if (Array.isArray(invoices)) {
            const total = invoices
              .filter((inv: any) => inv.status !== "PAID" && inv.status !== "CANCELLED")
              .reduce((sum: number, inv: any) => sum + (Number(inv.balanceDue) || Number(inv.totalAmount) || 0), 0);
            setOutstandingBalance(total > 0 ? `$${total.toFixed(2)}` : "$0.00");
          }
        }

        // Unread messages
        if (messagesRes.status === "fulfilled") {
          const threads = messagesRes.value.data?.data || messagesRes.value.data || [];
          if (Array.isArray(threads)) {
            const unread = threads.filter((t: any) => t.unreadCount > 0 || !t.read).length;
            setUnreadMessages(unread);
          }
        }
      } catch {
        // Silently fail — show dashes for unavailable data
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const metrics = [
    { label: "My Children", value: childrenCount, icon: Baby, color: "text-pink-600 bg-pink-50", href: "/parent/children" },
    { label: "Days Present This Month", value: daysPresent, icon: CalendarCheck, color: "text-green-600 bg-green-50", href: "/parent/attendance" },
    { label: "Outstanding Balance", value: outstandingBalance, icon: CreditCard, color: "text-orange-600 bg-orange-50", href: "/parent/payments" },
    { label: "Unread Messages", value: unreadMessages, icon: MessageCircle, color: "text-blue-600 bg-blue-50", href: "/parent/messages" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome to your parent portal at {academyName}.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => {
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Children */}
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">My Children</h2>
            <Link href="/parent/children" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : children.length === 0 ? (
            <p className="text-sm text-muted-foreground">No children enrolled yet.</p>
          ) : (
            <div className="space-y-3">
              {children.map((reg: any) => {
                const student = reg.student || reg;
                return (
                  <div key={student.id || reg.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    {student.photoUrl ? (
                      <img src={student.photoUrl} alt={student.firstName} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-foreground">{student.firstName} {student.lastName}</div>
                      <div className="text-xs text-muted-foreground">{reg.status || "Enrolled"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Attendance</h2>
            <Link href="/parent/attendance" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recentAttendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records this month.</p>
          ) : (
            <div className="space-y-2">
              {recentAttendance.map((record: any, i: number) => (
                <div key={record.id || i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {record.student?.firstName || "Student"} — {record.date?.slice(0, 10)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.checkInTime ? `In: ${new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ""}
                        {record.checkOutTime ? ` · Out: ${new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ""}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    record.status === "PRESENT" || record.checkInTime ? "bg-green-100 text-green-700" : 
                    record.status === "ABSENT" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {record.status || (record.checkInTime ? "Present" : "—")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
