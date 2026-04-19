"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, CheckCircle, XCircle, Info } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WAITLISTED: "bg-blue-100 text-blue-800",
  INFO_REQUESTED: "bg-purple-100 text-purple-800",
};

export default function RegistrationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reg, setReg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get(`/registrations/${id}`)
      .then((res) => {
        setReg(res.data);
        setAdminNotes(res.data.notes ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction(status: string) {
    setUpdating(true);
    try {
      const res = await api.patch(`/registrations/${id}/status`, { status, adminNotes });
      setReg((prev: any) => ({ ...prev, status: res.data.status, notes: res.data.notes }));
      toast.success(`Registration ${status.toLowerCase()} successfully`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="text-center py-20 text-muted-foreground">Loading...</div>;
  if (!reg) return <div className="text-center py-20 text-muted-foreground">Registration not found.</div>;

  const parent = reg.student?.studentParents?.[0]?.parent;

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/admin/registrations")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Registrations
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registration Review</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Submitted {new Date(reg.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[reg.status] ?? "bg-gray-100 text-gray-600"}`}>
          {reg.status}
        </span>
      </div>

      <div className="space-y-4">
        {/* Child Info */}
        <div className="bg-card border rounded-lg p-5">
          <h2 className="font-semibold mb-3">Child Information</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{reg.student.firstName} {reg.student.lastName}</dd></div>
            <div><dt className="text-muted-foreground">Date of Birth</dt><dd className="font-medium">{new Date(reg.student.dateOfBirth).toLocaleDateString()}</dd></div>
            <div><dt className="text-muted-foreground">Gender</dt><dd className="font-medium">{reg.student.gender ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Classroom</dt><dd className="font-medium">{reg.classroom?.name ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Start Date</dt><dd className="font-medium">{new Date(reg.startDate).toLocaleDateString()}</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">Allergies</dt><dd className="font-medium">{reg.student.allergies || "None"}</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">Medical Notes</dt><dd className="font-medium">{reg.student.medicalNotes || "None"}</dd></div>
          </dl>
        </div>

        {/* Parent Info */}
        {parent && (
          <div className="bg-card border rounded-lg p-5">
            <h2 className="font-semibold mb-3">Parent / Guardian</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{parent.firstName} {parent.lastName}</dd></div>
              <div><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{parent.user?.email ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{parent.phone ?? "—"}</dd></div>
            </dl>
          </div>
        )}

        {/* Emergency Contacts */}
        {reg.student.emergencyContacts?.length > 0 && (
          <div className="bg-card border rounded-lg p-5">
            <h2 className="font-semibold mb-3">Emergency Contacts</h2>
            <div className="space-y-2">
              {reg.student.emergencyContacts.map((ec: any) => (
                <div key={ec.id} className="text-sm border rounded-md px-3 py-2">
                  <span className="font-medium">{ec.firstName} {ec.lastName}</span>
                  <span className="text-muted-foreground ml-2">({ec.relationship})</span>
                  <span className="ml-2">{ec.phone}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div className="bg-card border rounded-lg p-5">
          <h2 className="font-semibold mb-3">Admin Notes</h2>
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
            placeholder="Add notes for this registration..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            disabled={updating}
          />
        </div>

        {/* Actions */}
        {reg.status === "PENDING" && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleAction("APPROVED")}
              disabled={updating}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-60"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => handleAction("REJECTED")}
              disabled={updating}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
            <button
              onClick={() => handleAction("INFO_REQUESTED")}
              disabled={updating}
              className="flex items-center gap-2 px-5 py-2.5 border rounded-md text-sm hover:bg-muted/50 disabled:opacity-60"
            >
              <Info className="h-4 w-4" />
              Request Info
            </button>
            <button
              onClick={() => handleAction("WAITLISTED")}
              disabled={updating}
              className="flex items-center gap-2 px-5 py-2.5 border rounded-md text-sm hover:bg-muted/50 disabled:opacity-60"
            >
              Waitlist
            </button>
          </div>
        )}
        {reg.status !== "PENDING" && (
          <div className="flex gap-3">
            <button
              onClick={() => handleAction("PENDING")}
              disabled={updating}
              className="px-4 py-2 border rounded-md text-sm hover:bg-muted/50 disabled:opacity-60"
            >
              Revert to Pending
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
