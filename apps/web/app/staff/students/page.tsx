"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, Search } from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string | null;
  allergies: string | null;
  isActive: boolean;
  emergencyContacts: { firstName: string; lastName: string; phone: string; relationship: string }[];
  studentParents: {
    parent: { firstName: string; lastName: string; phone: string | null };
  }[];
}

export default function StaffStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classroomName, setClassroomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const clsRes = await api.get("/classrooms");
        const classrooms = clsRes.data.data || [];
        if (classrooms.length === 0) {
          setLoading(false);
          return;
        }
        const classroom = classrooms[0];
        setClassroomName(classroom.name);

        const stuRes = await api.get(`/classrooms/${classroom.id}/students`);
        setStudents(stuRes.data || []);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function calcAge(dob: string) {
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    return `${years}y`;
  }

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Student Roster</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {classroomName ? `${classroomName} · ` : ""}{students.length} students
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card border rounded-lg p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="pl-9 pr-3 py-2 w-full border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      ) : students.length === 0 ? (
        <div className="bg-card border rounded-lg p-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">No Students Found</h2>
          <p className="text-muted-foreground text-sm">No students are enrolled in your classroom yet.</p>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Table */}
          <div className={`bg-card border rounded-lg overflow-hidden flex-1 ${selected ? "hidden lg:block" : ""}`}>
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Age</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Gender</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Allergies</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Emergency Contacts</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${selected?.id === s.id ? "bg-muted/40" : ""}`}
                    onClick={() => setSelected(selected?.id === s.id ? null : s)}
                  >
                    <td className="px-4 py-3 font-medium">{s.firstName} {s.lastName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{calcAge(s.dateOfBirth)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.gender ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {s.allergies ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{s.allergies}</span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.emergencyContacts?.length ?? 0} contacts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="bg-card border rounded-lg p-5 w-full lg:w-80 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Student Details</h3>
                <button onClick={() => setSelected(null)} className="p-1 hover:bg-muted/50 rounded-md text-sm">✕</button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                  {selected.firstName[0]}{selected.lastName[0]}
                </div>
                <div>
                  <div className="font-medium">{selected.firstName} {selected.lastName}</div>
                  <div className="text-xs text-muted-foreground">{calcAge(selected.dateOfBirth)} · {selected.gender ?? "—"}</div>
                </div>
              </div>

              {selected.allergies && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs font-medium text-red-700">Allergies</p>
                  <p className="text-xs text-red-600 mt-0.5">{selected.allergies}</p>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">EMERGENCY CONTACTS</h4>
                  {selected.emergencyContacts?.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No emergency contacts</p>
                  ) : (
                    selected.emergencyContacts?.map((ec, i) => (
                      <div key={i} className="mb-2">
                        <div className="font-medium text-xs">{ec.firstName} {ec.lastName}</div>
                        <div className="text-xs text-muted-foreground">{ec.relationship} · {ec.phone}</div>
                      </div>
                    ))
                  )}
                </div>

                {selected.studentParents?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">PARENTS</h4>
                    {selected.studentParents.map((sp, i) => (
                      <div key={i} className="mb-2">
                        <div className="font-medium text-xs">{sp.parent.firstName} {sp.parent.lastName}</div>
                        {sp.parent.phone && <div className="text-xs text-muted-foreground">{sp.parent.phone}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
