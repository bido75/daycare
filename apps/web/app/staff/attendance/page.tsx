"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarCheck, Users, UserX, CheckCircle, RefreshCw, Search,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  studentId: string;
  classroomId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  notes: string | null;
  student: { id: string; firstName: string; lastName: string };
  classroom: { id: string; name: string };
}

interface Classroom {
  id: string;
  name: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PRESENT: "bg-emerald-100 text-emerald-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

export default function StaffAttendancePage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Check-in modal
  const [showModal, setShowModal] = useState(false);
  const [modalStudentId, setModalStudentId] = useState("");
  const [modalClassroomId, setModalClassroomId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { date: today, limit: 200 };
      if (selectedClassroom) params.classroomId = selectedClassroom;
      const { data } = await api.get("/attendance", { params });
      setRecords(data.data ?? []);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [today, selectedClassroom]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
    if (!modalStudentId || !modalClassroomId) { toast.error("Select student and classroom"); return; }
    setModalLoading(true);
    try {
      await api.post("/attendance/check-in", { studentId: modalStudentId, classroomId: modalClassroomId, method: "MANUAL" });
      toast.success("Student checked in!");
      setShowModal(false);
      setModalStudentId("");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Check-in failed");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    try {
      await api.post("/attendance/check-out", { attendanceId, method: "MANUAL" });
      toast.success("Checked out!");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  };

  const handleMarkAbsent = async (studentId: string, classroomId: string) => {
    try {
      await api.post("/attendance/mark-absent", { studentId, classroomId, date: today });
      toast.success("Marked absent");
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  };

  const filtered = records.filter((r) => {
    if (!search) return true;
    return `${r.student.firstName} ${r.student.lastName}`.toLowerCase().includes(search.toLowerCase());
  });

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Today: {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Check In Student
          </button>
          <button onClick={fetchData} className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg"><Users className="h-5 w-5 text-emerald-600" /></div>
          <div>
            <div className="text-2xl font-bold">{presentCount}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg"><UserX className="h-5 w-5 text-red-600" /></div>
          <div>
            <div className="text-2xl font-bold">{absentCount}</div>
            <div className="text-xs text-muted-foreground">Absent</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
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
        <select
          value={selectedClassroom}
          onChange={(e) => setSelectedClassroom(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Classrooms</option>
          {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <CalendarCheck className="h-10 w-10 mb-3" />
            <p className="text-sm">No records yet for today.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {r.student.firstName[0]}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{r.student.firstName} {r.student.lastName}</div>
                    <div className="text-xs text-muted-foreground">{r.classroom.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground text-right">
                    {r.checkInTime ? (
                      <div>In: {format(new Date(r.checkInTime), "hh:mm a")}</div>
                    ) : null}
                    {r.checkOutTime ? (
                      <div>Out: {format(new Date(r.checkOutTime), "hh:mm a")}</div>
                    ) : null}
                  </div>
                  {statusBadge(r.status)}
                  {r.checkInTime && !r.checkOutTime && (
                    <button
                      onClick={() => handleCheckOut(r.id)}
                      className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                    >
                      Check Out
                    </button>
                  )}
                  {!r.checkInTime && r.status !== "ABSENT" && (
                    <button
                      onClick={() => handleMarkAbsent(r.studentId, r.classroomId)}
                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      Absent
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Check In Student</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student</label>
                <select
                  value={modalStudentId}
                  onChange={(e) => setModalStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none"
                >
                  <option value="">Select student…</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Classroom</label>
                <select
                  value={modalClassroomId}
                  onChange={(e) => setModalClassroomId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none"
                >
                  <option value="">Select classroom…</option>
                  {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCheckIn}
                disabled={modalLoading}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {modalLoading ? "Checking in…" : "Check In"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
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
