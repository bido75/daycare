"use client";
import { CalendarCheck } from "lucide-react";
export default function StaffAttendancePage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Attendance</h1><p className="text-sm text-muted-foreground mt-1">Record daily check-ins and check-outs.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 6</h2><p className="text-muted-foreground text-sm">Attendance tracking tools will be available in a future sprint.</p></div>
    </div>
  );
}
