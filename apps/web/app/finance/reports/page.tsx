"use client";
import { BarChart2 } from "lucide-react";
export default function FinanceReportsPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Financial Reports</h1><p className="text-sm text-muted-foreground mt-1">Revenue analysis and financial summaries.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><BarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 7</h2><p className="text-muted-foreground text-sm">Financial reporting and analytics will be available in Sprint 7.</p></div>
    </div>
  );
}
