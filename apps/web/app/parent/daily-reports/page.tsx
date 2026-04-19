"use client";
import { FileText } from "lucide-react";
export default function ParentDailyReportsPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Daily Reports</h1><p className="text-sm text-muted-foreground mt-1">See how your child's day went.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 6</h2><p className="text-muted-foreground text-sm">Daily activity reports from teachers will appear here.</p></div>
    </div>
  );
}
