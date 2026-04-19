"use client";
import { Users } from "lucide-react";
export default function StaffStudentsPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Student Roster</h1><p className="text-sm text-muted-foreground mt-1">View the students in your classroom.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 3</h2><p className="text-muted-foreground text-sm">Your classroom student roster will appear here.</p></div>
    </div>
  );
}
