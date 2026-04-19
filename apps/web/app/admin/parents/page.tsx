"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminParentsPage() {
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Parents</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage parent accounts and contact info.</p>
      </div>
      <div className="bg-card border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Children</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="text-center py-16 text-muted-foreground">
                <p className="font-medium">Parent directory coming in Sprint 3.</p>
                <p className="text-xs mt-1">Parents will be listed here once the parents module is complete.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
