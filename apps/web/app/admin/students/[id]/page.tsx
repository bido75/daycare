"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, User, Phone, AlertCircle, Car, FileText, CalendarCheck } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "emergency", label: "Emergency Contacts", icon: AlertCircle },
  { id: "pickups", label: "Authorized Pickups", icon: Car },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "attendance", label: "Attendance History", icon: CalendarCheck },
];

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", gender: "", allergies: "", medicalNotes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/students/${id}`)
      .then((res) => {
        setStudent(res.data);
        const s = res.data;
        setForm({
          firstName: s.firstName,
          lastName: s.lastName,
          gender: s.gender ?? "",
          allergies: s.allergies ?? "",
          medicalNotes: s.medicalNotes ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await api.patch(`/students/${id}`, form);
      setStudent((prev: any) => ({ ...prev, ...res.data }));
      setEditing(false);
    } finally {
      setSaving(false);
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

  return (
    <div>
      <button
        onClick={() => router.push("/admin/students")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{student.firstName} {student.lastName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {calcAge(student.dateOfBirth)} &bull;{" "}
            <span className={`font-medium ${student.isActive ? "text-green-600" : "text-gray-500"}`}>
              {student.isActive ? "Active" : "Inactive"}
            </span>
            {student.classrooms?.[0] && (
              <span> &bull; {student.classrooms[0].name}</span>
            )}
          </p>
        </div>
        {tab === "overview" && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            Edit
          </button>
        )}
      </div>

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
          </button>
        ))}
      </div>

      {/* Tab Content */}
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
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border rounded-md text-sm hover:bg-muted/50"
                >
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
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Allergies</dt><dd className="font-medium mt-0.5">{student.allergies || "None"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Medical Notes</dt><dd className="font-medium mt-0.5">{student.medicalNotes || "None"}</dd></div>
              <div>
                <dt className="text-muted-foreground">Parent(s)</dt>
                {student.studentParents?.map((sp: any) => (
                  <dd key={sp.id} className="font-medium mt-0.5">
                    {sp.parent.firstName} {sp.parent.lastName} ({sp.parent.user?.email})
                  </dd>
                ))}
              </div>
            </dl>
          )}
        </div>
      )}

      {tab === "emergency" && (
        <div className="space-y-3">
          {student.emergencyContacts?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No emergency contacts on file.</p>
          ) : (
            student.emergencyContacts?.map((ec: any) => (
              <div key={ec.id} className="bg-card border rounded-lg p-4">
                <div className="font-medium">{ec.firstName} {ec.lastName}</div>
                <div className="text-sm text-muted-foreground mt-1">{ec.relationship} &bull; {ec.phone}</div>
                {ec.email && <div className="text-sm text-muted-foreground">{ec.email}</div>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "pickups" && (
        <div className="space-y-3">
          {student.authorizedPickups?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No authorized pickups on file.</p>
          ) : (
            student.authorizedPickups?.map((ap: any) => (
              <div key={ap.id} className="bg-card border rounded-lg p-4">
                <div className="font-medium">{ap.firstName} {ap.lastName}</div>
                <div className="text-sm text-muted-foreground mt-1">{ap.relationship} &bull; {ap.phone}</div>
                <div className="text-sm mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${ap.idVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {ap.idVerified ? "ID Verified" : "ID Not Verified"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "documents" && (
        <div className="bg-card border rounded-lg p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Document management coming in Sprint 7.</p>
        </div>
      )}

      {tab === "attendance" && (
        <div className="space-y-2">
          {student.attendance?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No attendance records yet.</p>
          ) : (
            student.attendance?.map((a: any) => (
              <div key={a.id} className="bg-card border rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                <span>{new Date(a.date).toLocaleDateString()}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  a.status === "PRESENT" ? "bg-green-100 text-green-800" :
                  a.status === "ABSENT" ? "bg-red-100 text-red-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>{a.status}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
