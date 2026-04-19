"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Search, Plus, X, UserX } from "lucide-react";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  staffProfile: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    position: string | null;
    hireDate: string | null;
    classrooms: { id: string; name: string }[];
  } | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", phone: "", position: "", role: "STAFF", classroomId: "",
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (classroomFilter) params.classroomId = classroomFilter;
      const res = await api.get("/staff", { params });
      setStaff(res.data.data);
      setMeta(res.data.meta);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, classroomFilter]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);
  useEffect(() => {
    api.get("/classrooms").then((r) => setClassrooms(r.data.data || [])).catch(() => {});
  }, []);

  async function handleCreate() {
    setSaving(true);
    try {
      await api.post("/staff", form);
      toast.success("Staff member created. Temporary password: TempPassword123!");
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchStaff();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to create staff member");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Are you sure you want to deactivate this staff member?")) return;
    setDeactivating(id);
    try {
      await api.delete(`/staff/${id}`);
      toast.success("Staff member deactivated");
      fetchStaff();
      if (selected?.id === id) setSelected(null);
    } catch {
      toast.error("Failed to deactivate");
    } finally {
      setDeactivating(null);
    }
  }

  const start = (page - 1) * meta.limit + 1;
  const end = Math.min(page * meta.limit, meta.total);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff</h1>
          <p className="text-muted-foreground text-sm mt-1">{meta.total} staff members</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="pl-9 pr-3 py-2 w-full border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={classroomFilter} onChange={(e) => { setClassroomFilter(e.target.value); setPage(1); }}>
          <option value="">All Classrooms</option>
          {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={`bg-card border rounded-lg overflow-hidden flex-1 ${selected ? "hidden lg:block" : ""}`}>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Position</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Classroom</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No staff members found.</td></tr>
              ) : (
                staff.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${selected?.id === s.id ? "bg-muted/40" : ""}`}
                    onClick={() => setSelected(selected?.id === s.id ? null : s)}
                  >
                    <td className="px-4 py-3 font-medium">
                      {s.staffProfile ? `${s.staffProfile.firstName} ${s.staffProfile.lastName}` : s.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{s.staffProfile?.position ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {s.staffProfile?.classrooms?.[0]?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.isActive && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeactivate(s.id); }}
                          disabled={deactivating === s.id}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                        >
                          <UserX className="h-3 w-3" /> Deactivate
                        </button>
                      )}
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
              <h3 className="font-semibold">Staff Detail</h3>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-muted/50 rounded-md">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                {selected.staffProfile?.firstName?.[0] ?? "?"}{selected.staffProfile?.lastName?.[0] ?? ""}
              </div>
              <div>
                <div className="font-medium">
                  {selected.staffProfile ? `${selected.staffProfile.firstName} ${selected.staffProfile.lastName}` : selected.email}
                </div>
                <div className="text-xs text-muted-foreground">{selected.role}</div>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-muted-foreground text-xs">Email</dt><dd className="font-medium mt-0.5">{selected.email}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Phone</dt><dd className="font-medium mt-0.5">{selected.staffProfile?.phone ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Position</dt><dd className="font-medium mt-0.5">{selected.staffProfile?.position ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Classroom</dt><dd className="font-medium mt-0.5">{selected.staffProfile?.classrooms?.[0]?.name ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Hire Date</dt><dd className="font-medium mt-0.5">{selected.staffProfile?.hireDate ? new Date(selected.staffProfile.hireDate).toLocaleDateString() : "—"}</dd></div>
              <div><dt className="text-muted-foreground text-xs">Joined</dt><dd className="font-medium mt-0.5">{new Date(selected.createdAt).toLocaleDateString()}</dd></div>
              <div>
                <dt className="text-muted-foreground text-xs">Status</dt>
                <dd className="mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    selected.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {selected.isActive ? "Active" : "Inactive"}
                  </span>
                </dd>
              </div>
            </dl>
            {selected.isActive && (
              <button
                onClick={() => handleDeactivate(selected.id)}
                disabled={deactivating === selected.id}
                className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 disabled:opacity-60"
              >
                <UserX className="h-4 w-4" /> Deactivate Staff
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Add Staff Member</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted/50 rounded-md">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input type="email" className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone (optional)</label>
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Position (optional)</label>
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Lead Teacher, Assistant" value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Assign to Classroom (optional)</label>
                <select className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.classroomId} onChange={(e) => setForm((f) => ({ ...f, classroomId: e.target.value }))}>
                  <option value="">No classroom</option>
                  {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">A temporary password (TempPassword123!) will be set. The staff member should change it on first login.</p>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleCreate}
                disabled={saving || !form.firstName || !form.lastName || !form.email}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-60">
                {saving ? "Creating..." : "Create Staff Member"}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-md text-sm hover:bg-muted/50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
