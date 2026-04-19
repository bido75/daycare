"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { Users, CalendarCheck, FileText, AlertCircle, BookOpen } from "lucide-react";

export default function StaffDashboard() {
  const [classroom, setClassroom] = useState<any>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  useEffect(() => {
    async function load() {
      try {
        // Get classrooms — staff see only their classroom
        const res = await api.get("/classrooms");
        const classrooms = res.data.data || [];
        if (classrooms.length > 0) {
          const c = classrooms[0];
          setClassroom(c);
          setStudentCount(c.studentCount ?? c.students?.length ?? 0);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const metrics = [
    {
      label: "My Students",
      value: loading ? "—" : String(studentCount ?? "—"),
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Classroom Capacity",
      value: loading ? "—" : classroom ? `${classroom.capacity}` : "—",
      icon: BookOpen,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Reports This Week",
      value: "—",
      icon: FileText,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Open Incidents",
      value: "—",
      icon: AlertCircle,
      color: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {user ? `Welcome, ${(user as any).firstName || user.email}!` : "My Classroom"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {classroom ? `You are assigned to ${classroom.name}` : "Here's your classroom overview."}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl bg-card border border-border p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${m.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-foreground">{m.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Classroom Info */}
      {classroom && (
        <div className="bg-card border rounded-lg p-5">
          <h2 className="font-semibold mb-3">{classroom.name}</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Age Group</dt>
              <dd className="font-medium mt-0.5">{classroom.ageGroupMin}–{classroom.ageGroupMax} years</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Capacity</dt>
              <dd className="font-medium mt-0.5">{classroom.capacity}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Enrolled</dt>
              <dd className="font-medium mt-0.5">{studentCount ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Available Spots</dt>
              <dd className="font-medium mt-0.5">{classroom.availableSpots ?? classroom.capacity - (studentCount ?? 0)}</dd>
            </div>
          </dl>

          {/* Capacity bar */}
          {studentCount !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Occupancy</span>
                <span>{classroom.capacityUtilization ?? Math.round((studentCount / classroom.capacity) * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(classroom.capacityUtilization ?? Math.round((studentCount / classroom.capacity) * 100), 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
