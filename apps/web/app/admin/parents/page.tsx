"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Search, X, Users } from "lucide-react";

interface Parent {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  childrenCount: number;
  parentProfile: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    city: string | null;
    studentParents: {
      relationship: string;
      student: {
        id: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
      };
    }[];
  } | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminParentsPage() {
  const router = useRouter();
  const [parents, setParents] = useState<Parent[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Parent | null>(null);

  const fetchParents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (search) params.search = search;
      const res = await api.get("/parents", { params });
      setParents(res.data.data);
      setMeta(res.data.meta);
    } catch {
      setParents([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchParents(); }, [fetchParents]);

  const start = (page - 1) * meta.limit + 1;
  const end = Math.min(page * meta.limit, meta.total);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parents</h1>
          <p className="text-muted-foreground text-sm mt-1">{meta.total} parent accounts</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card border rounded-lg p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="pl-9 pr-3 py-2 w-full border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={`bg-card border rounded-lg overflow-hidden flex-1 ${selected ? "hidden lg:block" : ""}`}>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Children</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Registered</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
              ) : parents.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No parents found.</td></tr>
              ) : (
                parents.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${selected?.id === p.id ? "bg-muted/40" : ""}`}
                    onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  >
                    <td className="px-4 py-3 font-medium">
                      {p.parentProfile ? `${p.parentProfile.firstName} ${p.parentProfile.lastName}` : p.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.email}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{p.parentProfile?.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" /> {p.childrenCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
              <span className="text-muted-foreground">Showing {start}–{end} of {meta.total}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted/50">Previous</button>
                <button disabled={page === meta.totalPages} onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 border rounded-md disabled:opacity-40 hover:bg-muted/50">Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="bg-card border rounded-lg p-5 w-full lg:w-80 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Parent Detail</h3>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-muted/50 rounded-md">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                {selected.parentProfile?.firstName?.[0] ?? "?"}{selected.parentProfile?.lastName?.[0] ?? ""}
              </div>
              <div>
                <div className="font-medium">
                  {selected.parentProfile
                    ? `${selected.parentProfile.firstName} ${selected.parentProfile.lastName}`
                    : selected.email}
                </div>
                <div className="text-xs text-muted-foreground">Parent</div>
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              <div><dt className="text-muted-foreground text-xs">Email</dt><dd className="font-medium mt-0.5">{selected.email}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Phone</dt><dd className="font-medium mt-0.5">{selected.parentProfile?.phone ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground text-xs">City</dt><dd className="font-medium mt-0.5">{selected.parentProfile?.city ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Registered</dt><dd className="font-medium mt-0.5">{new Date(selected.createdAt).toLocaleDateString()}</dd></div>
            </dl>

            {/* Children */}
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">Children ({selected.childrenCount})</h4>
              {selected.parentProfile?.studentParents && selected.parentProfile.studentParents.length > 0 ? (
                <div className="space-y-2">
                  {selected.parentProfile.studentParents.map((sp: any) => (
                    <div key={sp.student.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/admin/students/${sp.student.id}`)}>
                      <div>
                        <div className="text-sm font-medium">{sp.student.firstName} {sp.student.lastName}</div>
                        <div className="text-xs text-muted-foreground">{sp.relationship}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sp.student.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {sp.student.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No children linked</p>
              )}
              {selected.parentProfile?.studentParents && selected.parentProfile.studentParents.length > 0 && (
                <button
                  onClick={() => router.push(`/admin/students?parentId=${selected.id}`)}
                  className="mt-3 w-full text-xs text-primary hover:underline"
                >
                  View all children in student directory →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
