"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Plus, CheckCircle, Clock, X,
  Smile, Meh, Frown, SmilePlus, Heart,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface DailyReport {
  id: string;
  studentId: string;
  date: string;
  mood: string | null;
  meals: any;
  naps: any;
  activities: any;
  toileting: any;
  notes: string | null;
  student: { id: string; firstName: string; lastName: string };
  staff: { id: string; firstName: string; lastName: string };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

const MOODS = [
  { value: "GREAT", label: "Great", icon: Heart, color: "text-pink-500 bg-pink-50" },
  { value: "HAPPY", label: "Happy", icon: SmilePlus, color: "text-emerald-500 bg-emerald-50" },
  { value: "OKAY", label: "Okay", icon: Smile, color: "text-blue-500 bg-blue-50" },
  { value: "TIRED", label: "Tired", icon: Meh, color: "text-yellow-500 bg-yellow-50" },
  { value: "SAD", label: "Sad", icon: Frown, color: "text-red-500 bg-red-50" },
];

function MoodIcon({ mood }: { mood: string | null }) {
  const m = MOODS.find((x) => x.value === mood);
  if (!m) return <span className="text-slate-400 text-xs">—</span>;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.color}`}>
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

export default function StaffDailyReportsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editReport, setEditReport] = useState<DailyReport | null>(null);

  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(today);
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [meals, setMeals] = useState({ breakfast: "", lunch: "", snack: "", water: "" });
  const [naps, setNaps] = useState({ start: "", end: "" });
  const [activities, setActivities] = useState({ outdoor: false, art: false, reading: false, music: false, blocks: false });
  const [toileting, setToileting] = useState({ wet: 0, bm: 0, dry: false });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/daily-reports", { params: { date: today, limit: 100 } });
      setReports(data.data ?? []);
    } catch {
      toast.error("Failed to load daily reports");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    api.get("/students?limit=200").then(({ data }) => {
      setStudents(data.data ?? data.students ?? []);
    }).catch(() => {});
  }, []);

  const openCreate = (presetStudentId?: string) => {
    setEditReport(null);
    setStudentId(presetStudentId ?? "");
    setDate(today);
    setMood("");
    setNotes("");
    setMeals({ breakfast: "", lunch: "", snack: "", water: "" });
    setNaps({ start: "", end: "" });
    setActivities({ outdoor: false, art: false, reading: false, music: false, blocks: false });
    setToileting({ wet: 0, bm: 0, dry: false });
    setShowForm(true);
  };

  const openEdit = (r: DailyReport) => {
    setEditReport(r);
    setStudentId(r.studentId);
    setDate(r.date.split("T")[0]);
    setMood(r.mood ?? "");
    setNotes(r.notes ?? "");
    setMeals(r.meals ?? { breakfast: "", lunch: "", snack: "", water: "" });
    setNaps(r.naps ?? { start: "", end: "" });
    setActivities(r.activities ?? { outdoor: false, art: false, reading: false, music: false, blocks: false });
    setToileting(r.toileting ?? { wet: 0, bm: 0, dry: false });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!studentId) { toast.error("Select a student"); return; }
    setSubmitting(true);
    try {
      const payload = {
        studentId,
        date,
        mood: mood || undefined,
        meals,
        naps,
        activities,
        toileting,
        notes: notes || undefined,
      };

      if (editReport) {
        await api.patch(`/daily-reports/${editReport.id}`, payload);
        toast.success("Report updated!");
      } else {
        await api.post("/daily-reports", payload);
        toast.success("Report created!");
      }
      setShowForm(false);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save report");
    } finally {
      setSubmitting(false);
    }
  };

  const reportedStudentIds = new Set(reports.map((r) => r.studentId));

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Daily Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Today: {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Report
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
          <div>
            <div className="text-2xl font-bold">{reports.length}</div>
            <div className="text-xs text-muted-foreground">Reports Completed</div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
          <div>
            <div className="text-2xl font-bold">{Math.max(0, students.length - reports.length)}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>
      </div>

      {students.filter((s) => !reportedStudentIds.has(s.id)).length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-800 mb-2">No report yet today:</div>
          <div className="flex flex-wrap gap-2">
            {students.filter((s) => !reportedStudentIds.has(s.id)).map((s) => (
              <button
                key={s.id}
                onClick={() => openCreate(s.id)}
                className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium hover:bg-amber-200 transition-colors border border-amber-200"
              >
                {s.firstName} {s.lastName}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <FileText className="h-10 w-10 mb-3" />
            <p className="text-sm">No reports yet for today.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {r.student.firstName[0]}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{r.student.firstName} {r.student.lastName}</div>
                    <div className="text-xs text-muted-foreground">By {r.staff.firstName} {r.staff.lastName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MoodIcon mood={r.mood} />
                  <button
                    onClick={() => openEdit(r)}
                    className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editReport ? "Edit" : "New"} Daily Report</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Student</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select…</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mood</label>
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.value}
                        onClick={() => setMood(mood === m.value ? "" : m.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          mood === m.value ? `${m.color} border-current` : "border-border hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Meals</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["breakfast", "lunch", "snack", "water"] as const).map((meal) => (
                    <div key={meal}>
                      <label className="block text-xs text-muted-foreground mb-0.5 capitalize">{meal}</label>
                      <input
                        type="text"
                        placeholder={meal === "water" ? "oz" : "ate all / half / none"}
                        value={meals[meal]}
                        onChange={(e) => setMeals({ ...meals, [meal]: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nap Time</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-0.5">Start</label>
                    <input type="time" value={naps.start} onChange={(e) => setNaps({ ...naps, start: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-0.5">End</label>
                    <input type="time" value={naps.end} onChange={(e) => setNaps({ ...naps, end: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Activities</label>
                <div className="flex flex-wrap gap-2">
                  {(["outdoor", "art", "reading", "music", "blocks"] as const).map((act) => (
                    <button
                      key={act}
                      onClick={() => setActivities({ ...activities, [act]: !activities[act] })}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors capitalize ${
                        activities[act] ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Toileting</label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Wet</label>
                    <input type="number" min={0} value={toileting.wet}
                      onChange={(e) => setToileting({ ...toileting, wet: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 text-sm rounded-lg border border-border bg-background focus:outline-none text-center" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">BM</label>
                    <input type="number" min={0} value={toileting.bm}
                      onChange={(e) => setToileting({ ...toileting, bm: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 text-sm rounded-lg border border-border bg-background focus:outline-none text-center" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="dry2" checked={toileting.dry}
                      onChange={(e) => setToileting({ ...toileting, dry: e.target.checked })} className="rounded" />
                    <label htmlFor="dry2" className="text-sm text-muted-foreground">Dry</label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes for parents…"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Saving…" : editReport ? "Update Report" : "Save Report"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
