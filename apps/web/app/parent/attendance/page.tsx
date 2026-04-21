"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, Clock, Filter } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  notes: string | null;
  student: { id: string; firstName: string; lastName: string };
  classroom: { id: string; name: string };
}

function duration(checkIn: string | null, checkOut: string | null) {
  if (!checkIn || !checkOut) return null;
  const mins = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function statusColor(status: string) {
  if (status === "PRESENT") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "ABSENT") return "bg-red-100 text-red-700 border-red-200";
  if (status === "LATE") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function ParentAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/attendance", {
        params: { limit: 100, page: 1 },
      });
      setRecords(data.data ?? []);
    } catch {
      toast.error("Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = records.filter((r) => {
    const d = r.date.split("T")[0];
    return d >= dateFrom && d <= dateTo;
  });

  const byDate = filtered.reduce<Record<string, AttendanceRecord[]>>((acc, r) => {
    const key = r.date.split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Attendance History</h1>
        <p className="text-sm text-muted-foreground mt-1">View your child's check-in and check-out records.</p>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} records</span>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-card border rounded-xl p-16 text-center">
          <CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No attendance records in this date range.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <div className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                {format(new Date(dateKey + "T12:00:00"), "EEEE, MMMM d, yyyy")}
              </div>
              <div className="bg-card border rounded-xl overflow-hidden divide-y divide-border">
                {byDate[dateKey].map((r) => {
                  const dur = duration(r.checkInTime, r.checkOutTime);
                  return (
                    <div key={r.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {r.student.firstName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{r.student.firstName} {r.student.lastName}</div>
                          <div className="text-xs text-muted-foreground">{r.classroom.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {r.checkInTime && (
                          <div className="text-xs text-muted-foreground text-right">
                            <div>In: {format(new Date(r.checkInTime), "hh:mm a")}</div>
                            {r.checkOutTime && <div>Out: {format(new Date(r.checkOutTime), "hh:mm a")}</div>}
                          </div>
                        )}
                        {dur && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {dur}
                          </div>
                        )}
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(r.status)}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
