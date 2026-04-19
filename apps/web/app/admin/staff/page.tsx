"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Staff management coming in Sprint 3
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Staff</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage staff members and roles.</p>
      </div>
      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="text-center py-16 text-muted-foreground">
                <p className="font-medium">Staff management coming in Sprint 3.</p>
                <p className="text-xs mt-1">Staff will be listed here once the staff module is complete.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
