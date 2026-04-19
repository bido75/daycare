"use client";

import { CalendarCheck } from "lucide-react";

export default function AdminAttendancePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">Track and manage daily attendance records.</p>
      </div>
      <div className="bg-card border rounded-lg p-16 text-center">
        <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-semibold text-lg mb-2">Coming in Sprint 6</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          The attendance module will include daily check-in/check-out tracking and attendance reports.
        </p>
      </div>
    </div>
  );
}
