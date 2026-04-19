"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Users, X, Edit } from "lucide-react";
import { toast } from "sonner";

interface Classroom {
  id: string;
  name: string;
  ageGroupMin: number;
  ageGroupMax: number;
  capacity: number;
  isActive: boolean;
  students: { id: string }[];
  leadStaff?: { firstName: string; lastName: string };
}

const EMPTY_FORM = { name: "", ageGroupMin: 0, ageGroupMax: 6, capacity: 20, leadStaffId: "" };

export default function AdminClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function fetchClassrooms() {
    setLoading(true);
    try {
      const res = await api.get("/classrooms");
      setClassrooms(res.data.data || []);
    } catch {
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchClassrooms(); }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(c: Classroom) {
    setEditId(c.id);
    setForm({ name: c.name, ageGroupMin: c.ageGroupMin, ageGroupMax: c.ageGroupMax, capacity: c.capacity, leadStaffId: "" });
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
            const utilization = c.capacity > 0 ? Math.round((c.students.length / c.capacity) * 100) : 0;
            return (
              <div key={c.id} className="bg-card border rounded-lg p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Ages {c.ageGroupMin}–{c.ageGroupMax} years
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-muted/50 rounded-md">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{c.students.length} / {c.capacity} students</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    utilization >= 90 ? "bg-red-100 text-red-700" :
                    utilization >= 70 ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {utilization}% full
                  </span>
                </div>

                {/* Capacity bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      utilization >= 90 ? "bg-red-500" :
                      utilization >= 70 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  />
                </div>

                {c.leadStaff && (
                  <p className="text-xs text-muted-foreground">
                    Lead: {c.leadStaff.firstName} {c.leadStaff.lastName}
                  </p>
                )}

                <span className={`self-start inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                  {c.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
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
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.ageGroupMin}
                    onChange={(e) => setForm((f) => ({ ...f, ageGroupMin: Number(e.target.value) }))}
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Age (years)</label>
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.ageGroupMax}
                    onChange={(e) => setForm((f) => ({ ...f, ageGroupMax: Number(e.target.value) }))}
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Capacity</label>
                <input
                  type="number"
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                  min={1}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border rounded-md text-sm hover:bg-muted/50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
