"use client";
import { CalendarCheck } from "lucide-react";
export default function ParentAttendancePage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Attendance</h1><p className="text-sm text-muted-foreground mt-1">View your child's attendance history.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 6</h2><p className="text-muted-foreground text-sm">Attendance records will appear here once the module is live.</p></div>
    </div>
  );
}
