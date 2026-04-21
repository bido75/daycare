"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarCheck, Users, UserX, Clock, TrendingUp,
  ChevronDown, CheckCircle, XCircle, Download, RefreshCw, Search,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface AttendanceRecord {
  id: string;
  studentId: string;
  classroomId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  notes: string | null;
  student: { id: string; firstName: string; lastName: string; photoUrl?: string | null };
  classroom: { id: string; name: string };
  staff?: { id: string; firstName: string; lastName: string } | null;
}

interface Stats {
  presentToday: number;
  absentToday: number;
  totalToday: number;
  lateToday: number;
  attendanceRate: number;
  avgDurationMinutes: number;
}

interface Classroom {
  id: string;
  name: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  classrooms: { id: string; name: string }[];
}

function duration(checkIn: string | null, checkOut: string | null) {
  if (!checkIn || !checkOut) return "—";
  const mins = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PRESENT: "bg-emerald-100 text-emerald-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

export default function AdminAttendancePage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [classroomId, setClassroomId] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Check-in modal state
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInStudentId, setCheckInStudentId] = useState("");
  const [checkInClassroomId, setCheckInClassroomId] = useState("");
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Bulk select
  const [selected, setSelected] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { date, limit: 200 };
      if (classroomId) params.classroomId = classroomId;

      const [recRes, statsRes] = await Promise.all([
        api.get("/attendance", { params }),
        api.get("/attendance/stats", { params: classroomId ? { classroomId } : {} }),
      ]);

      setRecords(recRes.data.data ?? []);
      setStats(statsRes.data);
    } catch {
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, [date, classroomId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    Promise.all([
      api.get("/classrooms?limit=100"),
      api.get("/students?limit=200"),
    ]).then(([c, s]) => {
      setClassrooms(c.data.data ?? c.data.classrooms ?? []);
      setStudents(s.data.data ?? s.data.students ?? []);
    }).catch(() => {});
  }, []);

  const handleCheckIn = async () => {
    if (!checkInStudentId || !checkInClassroomId) {
      toast.error("Select a student and classroom");
      return;
    }
    setCheckInLoading(true);
    try {
      await api.post("/attendance/check-in", {
        studentId: checkInStudentId,
        classroomId: checkInClassroomId,
        method: "MANUAL",
      });
      toast.success("Student checked in!");
      setShowCheckIn(false);
      setCheckInStudentId("");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Check-in failed");
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    try {
      await api.post("/attendance/check-out", { attendanceId, method: "MANUAL" });
      toast.success("Student checked out!");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Check-out failed");
    }
  };

  const handleMarkAbsent = async (studentId: string, cId: string) => {
    try {
      await api.post("/attendance/mark-absent", { studentId, classroomId: cId, date });
      toast.success("Marked as absent");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  };

  const handleBulkCheckIn = async () => {
    if (!selected.length || !checkInClassroomId) {
      toast.error("Select students and a classroom");
      return;
    }
    try {
      await api.post("/attendance/bulk-check-in", {
        studentIds: selected,
        classroomId: checkInClassroomId,
      });
      toast.success(`Checked in ${selected.length} students`);
      setSelected([]);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Bulk check-in failed");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Student", "Classroom", "Date", "Check In", "Check Out", "Duration", "Status", "Staff"],
      ...filtered.map((r) => [
        `${r.student.firstName} ${r.student.lastName}`,
        r.classroom.name,
        format(parseISO(r.date), "MM/dd/yyyy"),
        r.checkInTime ? format(new Date(r.checkInTime), "hh:mm a") : "",
        r.checkOutTime ? format(new Date(r.checkOutTime), "hh:mm a") : "",
        duration(r.checkInTime, r.checkOutTime),
        r.status,
        r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : "",
      ]),
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const filtered = records.filter((r) => {
    if (!search) return true;
    const name = `${r.student.firstName} ${r.student.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage daily attendance records.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowCheckIn(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Check In
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-sm hover:bg-muted transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg"><Users className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <div className="text-2xl font-bold">{stats.presentToday}</div>
                <div className="text-xs text-muted-foreground">Present Today</div>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><UserX className="h-5 w-5 text-red-600" /></div>
              <div>
                <div className="text-2xl font-bold">{stats.absentToday}</div>
                <div className="text-xs text-muted-foreground">Absent Today</div>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <div className="text-2xl font-bold">{stats.lateToday}</div>
                <div className="text-xs text-muted-foreground">Late Arrivals</div>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
              <div>
                <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                <div className="text-xs text-muted-foreground">Attendance Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="relative">
          <select
            value={classroomId}
            onChange={(e) => setClassroomId(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Classrooms</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selected.length > 0 && (
        <div className="mb-3 flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <select
            value={checkInClassroomId}
            onChange={(e) => setCheckInClassroomId(e.target.value)}
            className="text-sm px-2 py-1 border border-border rounded-lg bg-background"
          >
            <option value="">Select classroom…</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={handleBulkCheckIn}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Bulk Check In
          </button>
          <button onClick={() => setSelected([])} className="text-sm text-muted-foreground hover:text-foreground">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <CalendarCheck className="h-10 w-10 mb-3" />
            <p className="text-sm">No attendance records for this date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="pl-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelected(e.target.checked ? filtered.map((r) => r.studentId) : [])
                      }
                      checked={selected.length === filtered.length && filtered.length > 0}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Classroom</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Check In</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Check Out</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="pl-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.studentId)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, r.studentId]
                              : selected.filter((id) => id !== r.studentId)
                          )
                        }
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {r.student.firstName} {r.student.lastName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.classroom.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.checkInTime ? format(new Date(r.checkInTime), "hh:mm a") : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.checkOutTime ? format(new Date(r.checkOutTime), "hh:mm a") : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {duration(r.checkInTime, r.checkOutTime)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.status !== "ABSENT" && !r.checkInTime && (
                          <button
                            onClick={() => handleMarkAbsent(r.studentId, r.classroomId)}
                            className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            Mark Absent
                          </button>
                        )}
                        {r.checkInTime && !r.checkOutTime && (
                          <button
                            onClick={() => handleCheckOut(r.id)}
                            className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                          >
                            Check Out
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
      </div>

      {/* Check-In Modal */}
      {showCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Manual Check-In</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student</label>
                <select
                  value={checkInStudentId}
                  onChange={(e) => setCheckInStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Classroom</label>
                <select
                  value={checkInClassroomId}
                  onChange={(e) => setCheckInClassroomId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select classroom…</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCheckIn}
                disabled={checkInLoading}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {checkInLoading ? "Checking in…" : "Check In"}
              </button>
              <button
                onClick={() => setShowCheckIn(false)}
                className="flex-1 py-2 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
