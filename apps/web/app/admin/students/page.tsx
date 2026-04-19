"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Search, ChevronUp, ChevronDown, UserPlus } from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  enrollmentDate: string | null;
  isActive: boolean;
  classrooms: { id: string; name: string }[];
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SortKey = "name" | "dateOfBirth" | "enrollmentDate";

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20, sortBy, sortOrder };
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
  }, [page, search, status, classroomId, sortBy, sortOrder]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    api.get("/classrooms").then((res) => setClassrooms(res.data.data || [])).catch(() => {});
  }, []);

  function calcAge(dob: string) {
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (years === 0) return `${months < 0 ? months + 12 : months}mo`;
    return `${years}y ${months < 0 ? months + 12 : months}mo`;
  }

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortBy !== col) return <ChevronUp className="h-3 w-3 opacity-30 inline ml-1" />;
    return sortOrder === "asc"
      ? <ChevronUp className="h-3 w-3 inline ml-1" />
      : <ChevronDown className="h-3 w-3 inline ml-1" />;
  }

  const start = (page - 1) * meta.limit + 1;
  const end = Math.min(page * meta.limit, meta.total);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground text-sm mt-1">{meta.total} total students</p>
        </div>
        <button
          onClick={() => router.push("/admin/registrations")}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" /> Add Student
        </button>
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
              <th
                className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort("name")}
              >
                Name <SortIcon col="name" />
              </th>
              <th
                className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort("dateOfBirth")}
              >
                Age <SortIcon col="dateOfBirth" />
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Classroom</th>
              <th
                className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                onClick={() => handleSort("enrollmentDate")}
              >
                Enrolled <SortIcon col="enrollmentDate" />
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">No students found.</td>
              </tr>
            ) : (
              students.map((s) => (
                <tr
                  key={s.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/students/${s.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{s.firstName} {s.lastName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{calcAge(s.dateOfBirth)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.classrooms?.[0]?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      s.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            Showing {start}–{end} of {meta.total} students
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(1)}
              className="px-2 py-1 border rounded-md disabled:opacity-40 hover:bg-muted/50 text-xs"
            >
              «
            </button>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted/50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2 + i, meta.totalPages - 4 + i));
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 border rounded-md text-xs ${
                    pageNum === page ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={page === meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted/50"
            >
              Next
            </button>
            <button
              disabled={page === meta.totalPages}
              onClick={() => setPage(meta.totalPages)}
              className="px-2 py-1 border rounded-md disabled:opacity-40 hover:bg-muted/50 text-xs"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
