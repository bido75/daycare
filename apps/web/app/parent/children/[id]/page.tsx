"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Baby, ArrowLeft, Calendar, BookOpen, FileText, Activity,
  Phone, User, CheckCircle, XCircle, Loader2, AlertTriangle, Camera,
} from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  allergies?: string;
  medicalNotes?: string;
  isActive: boolean;
  enrollmentDate?: string;
  photoUrl?: string;
  classrooms?: { id: string; name: string }[];
  emergencyContacts?: { id: string; firstName: string; lastName: string; relationship: string; phone: string }[];
  documents?: { id: string; name: string; type: string; verified: boolean; expiresAt?: string }[];
  attendance?: { id: string; date: string; status: string }[];
}

function calcAge(dob: string) {
  const birth = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth() + (years * 12);
  const totalMonths = months - (now.getDate() < birth.getDate() ? 1 : 0);
  if (totalMonths < 12) return `${totalMonths} months old`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return `${y} year${y !== 1 ? "s" : ""}${m > 0 ? `, ${m} month${m !== 1 ? "s" : ""}` : ""} old`;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-2.5 border-b border-border last:border-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-foreground">{value || <span className="text-muted-foreground italic">Not provided</span>}</p>
    </div>
  );
}

export default function ChildProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!params.id) return;
    api.get(`/students/${params.id}`)
      .then((res) => setStudent(res.data?.data ?? res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post(`/students/${student.id}/avatar`, form, { headers: { "Content-Type": "multipart/form-data" } });
      setStudent((s) => s ? { ...s, photoUrl: res.data.photoUrl } : s);
      toast.success("Photo updated");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        Loading profile...
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium text-foreground">Profile not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-primary hover:underline">Go back</button>
      </div>
    );
  }

  const recentAttendance = (student.attendance ?? []).slice(0, 7);
  const presentCount = recentAttendance.filter((a) => a.status === "PRESENT").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{student.firstName} {student.lastName}</h1>
          <p className="text-sm text-muted-foreground">{student.dateOfBirth ? calcAge(student.dateOfBirth) : ""}</p>
        </div>
        <div className="ml-auto">
          {student.isActive
            ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="h-3.5 w-3.5" /> Enrolled</span>
            : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><XCircle className="h-3.5 w-3.5" /> Inactive</span>
          }
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Baby className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Child Information</h2>
            </div>
            <InfoRow label="Full Name" value={`${student.firstName} ${student.lastName}`} />
            <InfoRow label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : null} />
            <InfoRow label="Gender" value={student.gender} />
            <InfoRow label="Enrollment Date" value={student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : null} />
            <InfoRow label="Classroom" value={student.classrooms?.map((c) => c.name).join(", ")} />
          </div>

          {/* Medical */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Health Information</h2>
            </div>
            <InfoRow label="Allergies" value={student.allergies} />
            <InfoRow label="Medical Notes" value={student.medicalNotes} />
          </div>

          {/* Emergency contacts */}
          {(student.emergencyContacts ?? []).length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Emergency Contacts</h2>
              </div>
              <div className="space-y-3">
                {student.emergencyContacts!.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-muted-foreground">{c.relationship}</p>
                    </div>
                    <a href={`tel:${c.phone}`} className="text-sm text-primary hover:underline">{c.phone}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {/* Avatar card */}
          <div className="bg-card border border-border rounded-lg p-5 text-center">
            <div className="relative inline-block mb-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative h-20 w-20 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring group"
                title="Change photo"
              >
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.firstName} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <div className="h-full w-full rounded-full bg-primary/10 flex items-center justify-center">
                    <Baby className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
            </div>
            <p className="font-semibold text-foreground">{student.firstName} {student.lastName}</p>
            <p className="text-xs text-muted-foreground mt-1">{student.classrooms?.[0]?.name ?? "No classroom assigned"}</p>
          </div>

          {/* Attendance summary */}
          {recentAttendance.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Recent Attendance</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Last {recentAttendance.length} days</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl font-bold text-foreground">{presentCount}/{recentAttendance.length}</span>
                <span className="text-xs text-muted-foreground">days present</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {recentAttendance.map((a) => (
                  <span key={a.id} title={`${new Date(a.date).toLocaleDateString()} — ${a.status}`}
                    className={`h-6 w-6 rounded text-xs flex items-center justify-center font-medium ${
                      a.status === "PRESENT" ? "bg-green-100 text-green-700"
                      : a.status === "ABSENT" ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                    }`}>
                    {a.status[0]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documents summary */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Documents</h2>
            </div>
            {(student.documents ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {student.documents!.map((d) => (
                  <div key={d.id} className="flex items-center gap-2">
                    {d.verified
                      ? <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      : <XCircle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                    }
                    <span className="text-sm text-foreground truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
