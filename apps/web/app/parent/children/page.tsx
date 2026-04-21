"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Baby, Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WAITLISTED: "bg-blue-100 text-blue-800",
  INFO_REQUESTED: "bg-purple-100 text-purple-800",
};

export default function ParentChildrenPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/registrations")
      .then((res) => setRegistrations(res.data.data || []))
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }, []);

  function calcAge(dob: string) {
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (years === 0) return `${months < 0 ? months + 12 : months} months`;
    return `${years} years, ${months < 0 ? months + 12 : months} months`;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Children</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your children's enrollment and information.</p>
        </div>
        <button
          onClick={() => router.push("/parent/registration")}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Register Child
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      ) : registrations.length === 0 ? (
        <div className="bg-card border rounded-lg p-16 text-center">
          <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">No children registered yet</h2>
          <p className="text-muted-foreground text-sm mb-4">Start by registering your child for enrollment.</p>
          <button
            onClick={() => router.push("/parent/registration")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            Register Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div key={reg.id} className="bg-card border rounded-lg p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Baby className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">
                    {reg.student.firstName} {reg.student.lastName}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[reg.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {reg.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {calcAge(reg.student.dateOfBirth)} old
                  {reg.classroom && <> &bull; {reg.classroom.name}</>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Registered {new Date(reg.createdAt).toLocaleDateString()}
                </p>
              </div>
              {reg.student.isActive && (
                <Link
                  href={`/parent/children/${reg.student.id}`}
                  className="text-sm text-primary hover:underline flex-shrink-0"
                >
                  View Profile
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
