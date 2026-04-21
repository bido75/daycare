"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AlertCircle, Plus, X, ChevronDown, ChevronUp } from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface Incident {
  id: string;
  type: string;
  severity: string;
  description: string;
  actionTaken: string | null;
  parentNotified: boolean;
  status: string;
  occurredAt: string;
  resolvedAt: string | null;
  student: { id: string; firstName: string; lastName: string };
  staff: { id: string; firstName: string; lastName: string };
}

const INCIDENT_TYPES = ["injury", "behavior", "illness", "accident", "other"];
const SEVERITY_LEVELS = ["low", "medium", "high"];
const STATUS_VALUES = ["OPEN", "RESOLVED", "CLOSED"];

const severityStyle: Record<string, string> = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

const statusStyle: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${className}`}>
      {label}
    </span>
  );
}

export default function StaffIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStudent, setFilterStudent] = useState("");

  // New incident form
  const [form, setForm] = useState({
    studentId: "",
    type: "injury",
    severity: "low",
    description: "",
    actionTaken: "",
    parentNotified: false,
    occurredAt: new Date().toISOString().slice(0, 16),
  });

  // Edit state per expanded incident
  const [editPatch, setEditPatch] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, [filterSeverity, filterStatus, filterStudent]);

  async function loadData() {
    setLoading(true);
    try {
      const params: any = {};
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      if (filterStudent) params.studentId = filterStudent;

      const [incRes, clsRes] = await Promise.all([
        api.get("/incidents", { params }),
        api.get("/classrooms"),
      ]);
      setIncidents(incRes.data.data || []);

      // Get classroom students for the form dropdown
      const classrooms = clsRes.data.data || [];
      if (classrooms.length > 0) {
        const stuRes = await api.get(`/classrooms/${classrooms[0].id}/students`);
        setStudents(stuRes.data || []);
        if (!form.studentId && stuRes.data?.length > 0) {
          setForm((f) => ({ ...f, studentId: stuRes.data[0].id }));
        }
      }
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.studentId || !form.description) {
      setError("Student and description are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/incidents", {
        ...form,
        occurredAt: new Date(form.occurredAt).toISOString(),
      });
      setShowForm(false);
      setForm((f) => ({ ...f, description: "", actionTaken: "", parentNotified: false }));
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to log incident.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    const patch = editPatch[id];
    if (!patch) return;
    setSaving(true);
    try {
      const updated = await api.patch(`/incidents/${id}`, patch);
      setIncidents((prev) => prev.map((i) => (i.id === id ? updated.data : i)));
      setEditPatch((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function setPatch(id: string, key: string, value: any) {
    setEditPatch((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }

  const filtered = incidents;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-sm text-muted-foreground mt-1">Log and track incident reports for your classroom.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Incident
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 mb-4 flex flex-wrap gap-3">
        <select
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="">All Severities</option>
          {SEVERITY_LEVELS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUS_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="border rounded-md px-3 py-1.5 text-sm bg-background"
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
        >
          <option value="">All Students</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        {(filterSeverity || filterStatus || filterStudent) && (
          <button
            onClick={() => { setFilterSeverity(""); setFilterStatus(""); setFilterStudent(""); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Log Incident Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Log Incident</h2>
              <button onClick={() => { setShowForm(false); setError(""); }} className="p-1 hover:bg-muted/50 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mb-3">{error}</p>}

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Student *</label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={form.studentId}
                  onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                >
                  <option value="">Select student...</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 bg-background"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Severity</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 bg-background"
                    value={form.severity}
                    onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                  >
                    {SEVERITY_LEVELS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  value={form.occurredAt}
                  onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description *</label>
                <textarea
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 bg-background resize-none"
                  placeholder="Describe what happened..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Action Taken</label>
                <textarea
                  rows={2}
                  className="w-full border rounded-md px-3 py-2 bg-background resize-none"
                  placeholder="What was done in response?"
                  value={form.actionTaken}
                  onChange={(e) => setForm((f) => ({ ...f, actionTaken: e.target.value }))}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.parentNotified}
                  onChange={(e) => setForm((f) => ({ ...f, parentNotified: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Parent has been notified</span>
              </label>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Log Incident"}
              </button>
              <button
                onClick={() => { setShowForm(false); setError(""); }}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-muted/50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incidents List */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-lg p-16 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">No Incidents Found</h2>
          <p className="text-muted-foreground text-sm">No incidents match the current filters.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Severity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="w-8 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc) => {
                const isExpanded = expandedId === inc.id;
                const patch = editPatch[inc.id] ?? {};
                return (
                  <>
                    <tr
                      key={inc.id}
                      className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${isExpanded ? "bg-muted/20" : ""}`}
                      onClick={() => setExpandedId(isExpanded ? null : inc.id)}
                    >
                      <td className="px-4 py-3 font-medium">{inc.student.firstName} {inc.student.lastName}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{inc.type}</td>
                      <td className="px-4 py-3">
                        <Badge label={inc.severity} className={severityStyle[inc.severity] ?? ""} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {new Date(inc.occurredAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[inc.status] ?? ""}`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${inc.id}-detail`} className="border-b bg-muted/10">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">DESCRIPTION</p>
                              <p>{inc.description}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">ACTION TAKEN</p>
                              <textarea
                                rows={2}
                                className="w-full border rounded-md px-3 py-2 bg-background resize-none text-sm"
                                defaultValue={inc.actionTaken ?? ""}
                                onChange={(e) => setPatch(inc.id, "actionTaken", e.target.value)}
                              />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">STATUS</p>
                              <select
                                className="border rounded-md px-3 py-1.5 text-sm bg-background"
                                defaultValue={inc.status}
                                onChange={(e) => setPatch(inc.id, "status", e.target.value)}
                              >
                                {STATUS_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  defaultChecked={inc.parentNotified}
                                  onChange={(e) => setPatch(inc.id, "parentNotified", e.target.checked)}
                                  className="rounded"
                                />
                                <span>Parent Notified</span>
                              </label>
                              {inc.parentNotified && (
                                <span className="text-xs text-green-600 font-medium">Notified</span>
                              )}
                            </div>
                            <div className="md:col-span-2 flex gap-2">
                              <button
                                onClick={() => handleUpdate(inc.id)}
                                disabled={saving || !editPatch[inc.id]}
                                className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => setExpandedId(null)}
                                className="px-4 py-1.5 border rounded-md text-sm hover:bg-muted/50"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
