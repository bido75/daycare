"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Search, Filter } from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  isActive: boolean;
  classrooms: { id: string; name: string }[];
}

interface Meta {
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (classroomId) params.classroomId = classroomId;
      const res = await api.get("/students", { params });
      setStudents(res.data.data);
      setMeta(res.data.meta);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, classroomId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    api.get("/classrooms").then((res) => setClassrooms(res.data.data || [])).catch(() => {});
  }, []);

  function calcAge(dob: string) {
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (years === 0) return `${months}mo`;
    return `${years}y ${months < 0 ? months + 12 : months}mo`;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {meta.total} total students
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="pl-9 pr-3 py-2 w-full border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={classroomId}
          onChange={(e) => { setClassroomId(e.target.value); setPage(1); }}
        >
          <option value="">All Classrooms</option>
          {classrooms.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Age</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Classroom</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr
                  key={s.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/students/${s.id}`)}
                >
                  <td className="px-4 py-3 font-medium">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {calcAge(s.dateOfBirth)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.classrooms?.[0]?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/students/${s.id}`); }}
                      className="text-primary hover:underline text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted/50"
            >
              Previous
            </button>
            <button
              disabled={page === meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted/50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
