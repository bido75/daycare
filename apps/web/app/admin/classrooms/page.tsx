"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Plus, Users, X, Edit, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface Classroom {
  id: string;
  name: string;
  ageGroupMin: number;
  ageGroupMax: number;
  capacity: number;
  isActive: boolean;
  studentCount: number;
  capacityUtilization: number;
  availableSpots: number;
  students: { id: string; firstName: string; lastName: string }[];
  leadStaff?: { id: string; firstName: string; lastName: string; user?: { email: string } };
}

const EMPTY_FORM = { name: "", ageGroupMin: 0, ageGroupMax: 6, capacity: 20, leadStaffId: "" };

export default function AdminClassroomsPage() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Staff assignment
  const [assignModalId, setAssignModalId] = useState<string | null>(null);
  const [assignStaffId, setAssignStaffId] = useState("");

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/classrooms");
      setClassrooms(res.data.data || []);
    } catch {
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClassrooms(); }, [fetchClassrooms]);
  useEffect(() => {
    api.get("/staff").then((r) => setStaffList(r.data.data || [])).catch(() => {});
  }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(c: Classroom) {
    setEditId(c.id);
    setForm({ name: c.name, ageGroupMin: c.ageGroupMin, ageGroupMax: c.ageGroupMax, capacity: c.capacity, leadStaffId: c.leadStaff?.id ?? "" });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/classrooms/${editId}`, form);
        toast.success("Classroom updated");
      } else {
        await api.post("/classrooms", form);
        toast.success("Classroom created");
      }
      setShowModal(false);
      fetchClassrooms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to save classroom");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignStaff() {
    if (!assignModalId || !assignStaffId) return;
    setSaving(true);
    try {
      await api.post(`/classrooms/${assignModalId}/staff`, { staffId: assignStaffId });
      toast.success("Staff assigned");
      setAssignModalId(null);
      setAssignStaffId("");
      fetchClassrooms();
    } catch {
      toast.error("Failed to assign staff");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveStaff(classroomId: string) {
    if (!confirm("Remove lead staff from this classroom?")) return;
    try {
      await api.delete(`/classrooms/${classroomId}/staff`);
      toast.success("Staff removed");
      fetchClassrooms();
    } catch {
      toast.error("Failed to remove staff");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classrooms</h1>
          <p className="text-muted-foreground text-sm mt-1">{classrooms.length} classrooms</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Classroom
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((c) => {
            const util = c.capacityUtilization ?? (c.capacity > 0 ? Math.round((c.studentCount / c.capacity) * 100) : 0);
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className="bg-card border rounded-lg p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Ages {c.ageGroupMin}–{c.ageGroupMax} years</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-muted/50 rounded-md">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Capacity */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{c.studentCount ?? c.students?.length ?? 0} / {c.capacity} students</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                    util >= 90 ? "bg-red-100 text-red-700" :
                    util >= 75 ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {util}% full
                  </span>
                </div>

                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      util >= 90 ? "bg-red-500" : util >= 75 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(util, 100)}%` }}
                  />
                </div>

                {/* Lead Staff */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {c.leadStaff ? `Lead: ${c.leadStaff.firstName} ${c.leadStaff.lastName}` : "No lead staff"}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setAssignModalId(c.id); setAssignStaffId(c.leadStaff?.id ?? ""); }}
                      className="text-primary hover:underline"
                    >
                      {c.leadStaff ? "Change" : "Assign"}
                    </button>
                    {c.leadStaff && (
                      <button onClick={() => handleRemoveStaff(c.id)} className="text-red-500 hover:underline ml-1">
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Active badge */}
                <div className="flex items-center justify-between">
                  <span className={`self-start inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isExpanded ? "Hide" : "Students"}
                    </button>
                    <button
                      onClick={() => router.push(`/admin/students?classroomId=${c.id}`)}
                      className="text-xs text-primary hover:underline"
                    >
                      View All
                    </button>
                  </div>
                </div>

                {/* Expanded student list */}
                {isExpanded && (
                  <div className="border-t pt-3 space-y-1 max-h-40 overflow-y-auto">
                    {c.students?.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No active students</p>
                    ) : (
                      c.students?.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => router.push(`/admin/students/${s.id}`)}
                          className="w-full text-left text-xs px-2 py-1 hover:bg-muted/50 rounded-md"
                        >
                          {s.firstName} {s.lastName}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{editId ? "Edit Classroom" : "Add Classroom"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted/50 rounded-md">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Classroom Name</label>
                <input
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Sunflower Room"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Min Age (years)</label>
                  <input type="number" className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.ageGroupMin} onChange={(e) => setForm((f) => ({ ...f, ageGroupMin: Number(e.target.value) }))} min={0} />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Age (years)</label>
                  <input type="number" className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.ageGroupMax} onChange={(e) => setForm((f) => ({ ...f, ageGroupMax: Number(e.target.value) }))} min={0} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Capacity</label>
                <input type="number" className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} min={1} />
              </div>
              {staffList.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Lead Staff (optional)</label>
                  <select className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.leadStaffId} onChange={(e) => setForm((f) => ({ ...f, leadStaffId: e.target.value }))}>
                    <option value="">No lead staff</option>
                    {staffList.map((s: any) => (
                      <option key={s.staffProfile?.id ?? s.id} value={s.staffProfile?.id ?? s.id}>
                        {s.staffProfile ? `${s.staffProfile.firstName} ${s.staffProfile.lastName}` : s.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={handleSave} disabled={saving || !form.name}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-md text-sm hover:bg-muted/50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {assignModalId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Assign Lead Staff</h2>
              <button onClick={() => setAssignModalId(null)} className="p-1 hover:bg-muted/50 rounded-md">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="text-sm font-medium">Select Staff Member</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={assignStaffId} onChange={(e) => setAssignStaffId(e.target.value)}>
              <option value="">Select...</option>
              {staffList.filter((s: any) => s.isActive).map((s: any) => (
                <option key={s.staffProfile?.id ?? s.id} value={s.staffProfile?.id ?? s.id}>
                  {s.staffProfile ? `${s.staffProfile.firstName} ${s.staffProfile.lastName}` : s.email}
                </option>
              ))}
            </select>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAssignStaff} disabled={!assignStaffId || saving}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-60">
                {saving ? "Assigning..." : "Assign"}
              </button>
              <button onClick={() => setAssignModalId(null)} className="flex-1 py-2 border rounded-md text-sm hover:bg-muted/50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
