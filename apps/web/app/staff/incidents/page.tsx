"use client";
import { AlertCircle } from "lucide-react";
export default function StaffIncidentsPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Incidents</h1><p className="text-sm text-muted-foreground mt-1">Log and track incident reports.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 6</h2><p className="text-muted-foreground text-sm">Incident logging and tracking will be available in Sprint 6.</p></div>
    </div>
  );
}
