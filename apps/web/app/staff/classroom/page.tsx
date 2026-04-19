"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, BookOpen } from "lucide-react";

export default function StaffClassroomPage() {
  const [classroom, setClassroom] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const clsRes = await api.get("/classrooms");
        const classrooms = clsRes.data.data || [];
        if (classrooms.length === 0) {
          setLoading(false);
          return;
        }
        const c = classrooms[0];
        setClassroom(c);

        const stuRes = await api.get(`/classrooms/${c.id}/students`);
        setStudents(stuRes.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function calcAge(dob: string) {
    const birth = new Date(dob);
    const now = new Date();
    return `${now.getFullYear() - birth.getFullYear()}y`;
  }

  if (loading) return <div className="text-center py-20 text-muted-foreground">Loading...</div>;
  if (!classroom) return (
    <div className="text-center py-20">
      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">No classroom assigned.</p>
    </div>
  );

  const util = classroom.capacityUtilization ?? Math.round((students.length / classroom.capacity) * 100);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{classroom.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Ages {classroom.ageGroupMin}–{classroom.ageGroupMax} years</p>
      </div>

      {/* Classroom Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Capacity", value: classroom.capacity },
          { label: "Enrolled", value: students.length },
          { label: "Available", value: Math.max(0, classroom.capacity - students.length) },
          { label: "Occupancy", value: `${util}%` },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Capacity Bar */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Capacity Utilization</span>
          <span className={util >= 90 ? "text-red-600" : util >= 75 ? "text-yellow-600" : "text-green-600"}>
            {util}% ({students.length}/{classroom.capacity})
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${util >= 90 ? "bg-red-500" : util >= 75 ? "bg-yellow-500" : "bg-green-500"}`}
            style={{ width: `${Math.min(util, 100)}%` }}
          />
        </div>
      </div>

      {/* Student Roster */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Student Roster ({students.length})</h2>
          <span className="text-xs text-muted-foreground ml-auto">Read-only</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Age</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Allergies</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Emergency Contacts</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No students enrolled.</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{s.firstName} {s.lastName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{calcAge(s.dateOfBirth)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {s.allergies ? (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{s.allergies}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {s.emergencyContacts?.length ?? 0} on file
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
