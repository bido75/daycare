"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Search } from "lucide-react";

interface Registration {
  id: string;
  status: string;
  createdAt: string;
  student: {
    firstName: string;
    lastName: string;
    studentParents?: { parent: { firstName: string; lastName: string; user: { email: string } } }[];
  };
  classroom: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WAITLISTED: "bg-blue-100 text-blue-800",
  INFO_REQUESTED: "bg-purple-100 text-purple-800",
};

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [status, setStatus] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (status) params.status = status;
      if (search) params.search = search;
      const res = await api.get("/registrations", { params });
      setRegistrations(res.data.data);
      setMeta(res.data.meta);
    } catch {
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Registrations</h1>
        <p className="text-muted-foreground text-sm mt-1">{meta.total} total registrations</p>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="pl-9 pr-3 py-2 w-full border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by child name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["", "PENDING", "APPROVED", "REJECTED", "WAITLISTED"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                status === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/50"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Child</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Parent</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Classroom</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Submitted</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
            ) : registrations.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No registrations found.</td></tr>
            ) : (
              registrations.map((r) => {
                const parent = r.student.studentParents?.[0]?.parent;
                return (
                  <tr
                    key={r.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/registrations/${r.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">
                      {r.student.firstName} {r.student.lastName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {parent ? `${parent.firstName} ${parent.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.classroom?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/admin/registrations/${r.id}`); }}
                        className="text-primary hover:underline text-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted/50">Previous</button>
            <button disabled={page === meta.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted/50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
