"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, User, AlertCircle, Car, FileText, CalendarCheck, Plus, Trash2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "emergency", label: "Emergency Contacts", icon: AlertCircle },
  { id: "pickups", label: "Authorized Pickups", icon: Car },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "attendance", label: "Attendance History", icon: CalendarCheck },
];

const EMPTY_EC = { firstName: "", lastName: "", relationship: "", phone: "", email: "" };
const EMPTY_AP = { firstName: "", lastName: "", relationship: "", phone: "" };

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", gender: "", allergies: "", medicalNotes: "", classroomId: "",
  });
  const [saving, setSaving] = useState(false);

  // Emergency contact modal
  const [showEcModal, setShowEcModal] = useState(false);
  const [ecForm, setEcForm] = useState(EMPTY_EC);
  const [ecSaving, setEcSaving] = useState(false);

  // Authorized pickup modal
  const [showApModal, setShowApModal] = useState(false);
  const [apForm, setApForm] = useState(EMPTY_AP);
  const [apSaving, setApSaving] = useState(false);

  // Transfer classroom
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferClassroomId, setTransferClassroomId] = useState("");

  const fetchStudent = useCallback(async () => {
    try {
      const res = await api.get(`/students/${id}`);
      setStudent(res.data);
      const s = res.data;
      setForm({
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender ?? "",
        allergies: s.allergies ?? "",
        medicalNotes: s.medicalNotes ?? "",
        classroomId: s.classrooms?.[0]?.id ?? "",
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchStudent(); }, [fetchStudent]);
  useEffect(() => {
    api.get("/classrooms").then((r) => setClassrooms(r.data.data || [])).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch(`/students/${id}`, form);
      toast.success("Student updated");
      await fetchStudent();
      setEditing(false);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleTransfer() {
    if (!transferClassroomId) return;
    setSaving(true);
    try {
      await api.patch(`/students/${id}`, { classroomId: transferClassroomId });
      toast.success("Classroom updated");
      await fetchStudent();
      setShowTransfer(false);
    } catch {
      toast.error("Failed to transfer");
    } finally {
      setSaving(false);
    }
  }

  async function addEmergencyContact() {
    setEcSaving(true);
    try {
      await api.post(`/students/${id}/emergency-contacts`, ecForm);
      toast.success("Emergency contact added");
      await fetchStudent();
      setShowEcModal(false);
      setEcForm(EMPTY_EC);
    } catch {
      toast.error("Failed to add emergency contact");
    } finally {
      setEcSaving(false);
    }
  }

  async function removeEmergencyContact(contactId: string) {
    try {
      await api.delete(`/students/${id}/emergency-contacts/${contactId}`);
      toast.success("Contact removed");
      await fetchStudent();
    } catch {
      toast.error("Failed to remove contact");
    }
  }

  async function addAuthorizedPickup() {
    setApSaving(true);
    try {
      await api.post(`/students/${id}/authorized-pickups`, apForm);
      toast.success("Authorized pickup added");
      await fetchStudent();
      setShowApModal(false);
      setApForm(EMPTY_AP);
    } catch {
      toast.error("Failed to add authorized pickup");
    } finally {
      setApSaving(false);
    }
  }

  async function removeAuthorizedPickup(pickupId: string) {
    try {
      await api.delete(`/students/${id}/authorized-pickups/${pickupId}`);
      toast.success("Pickup removed");
      await fetchStudent();
    } catch {
      toast.error("Failed to remove pickup");
    }
  }

  function calcAge(dob: string) {
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    return `${years} years old`;
  }

  if (loading) return <div className="text-center py-20 text-muted-foreground">Loading...</div>;
  if (!student) return <div className="text-center py-20 text-muted-foreground">Student not found.</div>;

  const ecCount = student.emergencyContacts?.length ?? 0;

  return (
    <div>
      <button
        onClick={() => router.push("/admin/students")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </button>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{student.firstName} {student.lastName}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {calcAge(student.dateOfBirth)} &bull;{" "}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  student.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}>
                  {student.isActive ? "Active" : "Inactive"}
                </span>
                {student.classrooms?.[0] && <span className="ml-2">· {student.classrooms[0].name}</span>}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-muted/50"
          >
            <ArrowRightLeft className="h-4 w-4" /> Transfer Classroom
          </button>
          {tab === "overview" && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="font-semibold text-lg mb-4">Transfer Classroom</h2>
            <label className="text-sm font-medium">Select Classroom</label>
            <select
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={transferClassroomId}
              onChange={(e) => setTransferClassroomId(e.target.value)}
            >
              <option value="">Select a classroom...</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name} (Ages {c.ageGroupMin}–{c.ageGroupMax})</option>
              ))}
            </select>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleTransfer}
                disabled={!transferClassroomId || saving}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? "Transferring..." : "Transfer"}
              </button>
              <button onClick={() => setShowTransfer(false)} className="flex-1 py-2 border rounded-md text-sm hover:bg-muted/50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b mb-6 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.id === "emergency" && ecCount < 2 && (
              <span className="ml-1 bg-red-100 text-red-700 text-xs px-1.5 rounded-full">!</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="bg-card border rounded-lg p-6">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <input
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <input
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Gender</label>
                <select
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                >
                  <option value="">Not specified</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Allergies</label>
                <textarea
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  value={form.allergies}
                  onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Medical Notes</label>
                <textarea
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  value={form.medicalNotes}
                  onChange={(e) => setForm((f) => ({ ...f, medicalNotes: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-60">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 border rounded-md text-sm hover:bg-muted/50">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-muted-foreground">First Name</dt><dd className="font-medium mt-0.5">{student.firstName}</dd></div>
              <div><dt className="text-muted-foreground">Last Name</dt><dd className="font-medium mt-0.5">{student.lastName}</dd></div>
              <div><dt className="text-muted-foreground">Date of Birth</dt><dd className="font-medium mt-0.5">{new Date(student.dateOfBirth).toLocaleDateString()}</dd></div>
              <div><dt className="text-muted-foreground">Gender</dt><dd className="font-medium mt-0.5">{student.gender ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Enrollment Date</dt><dd className="font-medium mt-0.5">{student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : "—"}</dd></div>
              <div><dt className="text-muted-foreground">Classroom</dt><dd className="font-medium mt-0.5">{student.classrooms?.[0]?.name ?? "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Allergies</dt><dd className="font-medium mt-0.5">{student.allergies || "None"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Medical Notes</dt><dd className="font-medium mt-0.5">{student.medicalNotes || "None"}</dd></div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground mb-1">Parent(s)</dt>
                {student.studentParents?.map((sp: any) => (
                  <dd key={sp.id} className="font-medium">
                    {sp.parent.firstName} {sp.parent.lastName}
                    {sp.isPrimary && <span className="ml-2 text-xs text-primary">(Primary)</span>}
                    <span className="text-xs text-muted-foreground ml-2">{sp.parent.user?.email}</span>
                  </dd>
                ))}
              </div>
            </dl>
          )}
        </div>
      )}

      {/* Emergency Contacts */}
      {tab === "emergency" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold">Emergency Contacts</h2>
              {ecCount < 2 && (
                <p className="text-xs text-red-600 mt-0.5">Minimum 2 emergency contacts required ({ecCount}/2)</p>
              )}
            </div>
            <button
              onClick={() => setShowEcModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add Contact
            </button>
          </div>
          <div className="space-y-3">
            {ecCount === 0 ? (
              <p className="text-muted-foreground text-sm">No emergency contacts on file.</p>
            ) : (
              student.emergencyContacts?.map((ec: any) => (
                <div key={ec.id} className="bg-card border rounded-lg p-4 flex items-start justify-between">
                  <div>
                    <div className="font-medium">{ec.firstName} {ec.lastName}</div>
                    <div className="text-sm text-muted-foreground mt-1">{ec.relationship} · {ec.phone}</div>
                    {ec.email && <div className="text-sm text-muted-foreground">{ec.email}</div>}
                  </div>
                  <button onClick={() => removeEmergencyContact(ec.id)} className="p-1.5 hover:bg-muted/50 rounded-md text-muted-foreground hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {showEcModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="font-semibold text-lg mb-4">Add Emergency Contact</h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">First Name</label>
                      <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={ecForm.firstName} onChange={(e) => setEcForm((f) => ({ ...f, firstName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Name</label>
                      <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={ecForm.lastName} onChange={(e) => setEcForm((f) => ({ ...f, lastName: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Relationship</label>
                    <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={ecForm.relationship} onChange={(e) => setEcForm((f) => ({ ...f, relationship: e.target.value }))} placeholder="e.g. Grandmother" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={ecForm.phone} onChange={(e) => setEcForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email (optional)</label>
                    <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={ecForm.email} onChange={(e) => setEcForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addEmergencyContact} disabled={ecSaving || !ecForm.firstName || !ecForm.phone}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-60">
                    {ecSaving ? "Saving..." : "Add Contact"}
                  </button>
                  <button onClick={() => setShowEcModal(false)} className="flex-1 py-2 border rounded-md text-sm hover:bg-muted/50">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Authorized Pickups */}
      {tab === "pickups" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Authorized Pickups</h2>
            <button
              onClick={() => setShowApModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add Pickup
            </button>
          </div>
          <div className="space-y-3">
            {student.authorizedPickups?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No authorized pickups on file.</p>
            ) : (
              student.authorizedPickups?.map((ap: any) => (
                <div key={ap.id} className="bg-card border rounded-lg p-4 flex items-start justify-between">
                  <div>
                    <div className="font-medium">{ap.firstName} {ap.lastName}</div>
                    <div className="text-sm text-muted-foreground mt-1">{ap.relationship} · {ap.phone}</div>
                    <div className="mt-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${ap.idVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {ap.idVerified ? "ID Verified" : "ID Not Verified"}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeAuthorizedPickup(ap.id)} className="p-1.5 hover:bg-muted/50 rounded-md text-muted-foreground hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {showApModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="font-semibold text-lg mb-4">Add Authorized Pickup</h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">First Name</label>
                      <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={apForm.firstName} onChange={(e) => setApForm((f) => ({ ...f, firstName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Name</label>
                      <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={apForm.lastName} onChange={(e) => setApForm((f) => ({ ...f, lastName: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Relationship</label>
                    <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={apForm.relationship} onChange={(e) => setApForm((f) => ({ ...f, relationship: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={apForm.phone} onChange={(e) => setApForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={addAuthorizedPickup} disabled={apSaving || !apForm.firstName || !apForm.phone}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-60">
                    {apSaving ? "Saving..." : "Add Pickup"}
                  </button>
                  <button onClick={() => setShowApModal(false)} className="flex-1 py-2 border rounded-md text-sm hover:bg-muted/50">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Documents</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm hover:bg-muted/50 opacity-50 cursor-not-allowed">
              <Plus className="h-4 w-4" /> Upload Document
            </button>
          </div>
          {student.documents?.length === 0 ? (
            <div className="bg-card border rounded-lg p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No documents on file. Upload functionality coming in Sprint 7.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {student.documents?.map((d: any) => (
                <div key={d.id} className="bg-card border rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.type} · {new Date(d.uploadedAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${d.verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {d.verified ? "Verified" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "attendance" && (
        <div>
          <h2 className="font-semibold mb-3">Attendance History (Last 30 days)</h2>
          {student.attendance?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No attendance records yet.</p>
          ) : (
            <div className="space-y-2">
              {student.attendance?.map((a: any) => (
                <div key={a.id} className="bg-card border rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{new Date(a.date).toLocaleDateString()}</span>
                    {a.checkInTime && (
                      <span className="ml-3 text-muted-foreground text-xs">
                        In: {new Date(a.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {a.checkOutTime && ` · Out: ${new Date(a.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    a.status === "PRESENT" ? "bg-green-100 text-green-800" :
                    a.status === "ABSENT" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
