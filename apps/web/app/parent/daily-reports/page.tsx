"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Clock, Utensils, Moon, Gamepad2, DropletIcon,
  Smile, Meh, Frown, SmilePlus, Heart, Filter,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

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

const MOODS: Record<string, { label: string; color: string; Icon: any }> = {
  GREAT: { label: "Great", color: "text-pink-500 bg-pink-50 border-pink-200", Icon: Heart },
  HAPPY: { label: "Happy", color: "text-emerald-500 bg-emerald-50 border-emerald-200", Icon: SmilePlus },
  OKAY: { label: "Okay", color: "text-blue-500 bg-blue-50 border-blue-200", Icon: Smile },
  TIRED: { label: "Tired", color: "text-yellow-500 bg-yellow-50 border-yellow-200", Icon: Meh },
  SAD: { label: "Sad", color: "text-red-500 bg-red-50 border-red-200", Icon: Frown },
};

function ReportCard({ report }: { report: DailyReport }) {
  const [expanded, setExpanded] = useState(false);
  const mood = report.mood ? MOODS[report.mood] : null;
  const MoodIcon = mood?.Icon;

  const hasActivities = report.activities && Object.values(report.activities).some(Boolean);
  const activeActivities = report.activities
    ? Object.entries(report.activities)
        .filter(([, v]) => v)
        .map(([k]) => k)
    : [];

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {report.student.firstName[0]}
          </div>
          <div>
            <div className="font-medium text-sm">{report.student.firstName} {report.student.lastName}</div>
            <div className="text-xs text-muted-foreground">
              By {report.staff.firstName} {report.staff.lastName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mood && MoodIcon && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${mood.color}`}>
              <MoodIcon className="h-3 w-3" />
              {mood.label}
            </span>
          )}
          <span className="text-muted-foreground text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
          {/* Meals */}
          {report.meals && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                <Utensils className="h-3.5 w-3.5" /> Meals
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(report.meals)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between bg-muted/50 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs text-muted-foreground capitalize">{k}</span>
                      <span className="text-xs font-medium">{String(v)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Nap */}
          {report.naps?.start && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                <Moon className="h-3.5 w-3.5" /> Nap
              </div>
              <div className="text-sm bg-muted/50 rounded-lg px-2.5 py-1.5">
                {report.naps.start} — {report.naps.end || "ongoing"}
              </div>
            </div>
          )}

          {/* Activities */}
          {hasActivities && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                <Gamepad2 className="h-3.5 w-3.5" /> Activities
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeActivities.map((act) => (
                  <span key={act} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full capitalize">
                    {act}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Toileting */}
          {report.toileting && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                <DropletIcon className="h-3.5 w-3.5" /> Toileting
              </div>
              <div className="flex gap-3 text-sm">
                {report.toileting.wet > 0 && <span>Wet: {report.toileting.wet}</span>}
                {report.toileting.bm > 0 && <span>BM: {report.toileting.bm}</span>}
                {report.toileting.dry && <span>Dry ✓</span>}
              </div>
            </div>
          )}

          {/* Notes */}
          {report.notes && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">Notes</div>
              <p className="text-sm text-foreground bg-muted/50 rounded-lg px-2.5 py-1.5">{report.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ParentDailyReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 14), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/daily-reports", { params: { limit: 100 } });
      setReports(data.data ?? []);
    } catch {
      toast.error("Failed to load daily reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = reports.filter((r) => {
    const d = r.date.split("T")[0];
    return d >= dateFrom && d <= dateTo;
  });

  const byDate = filtered.reduce<Record<string, DailyReport[]>>((acc, r) => {
    const key = r.date.split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Daily Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">See how your child's day went.</p>
      </div>

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
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} reports</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-card border rounded-xl p-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No reports in this date range.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <div className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                {format(new Date(dateKey + "T12:00:00"), "EEEE, MMMM d, yyyy")}
              </div>
              <div className="space-y-2">
                {byDate[dateKey].map((r) => (
                  <ReportCard key={r.id} report={r} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
