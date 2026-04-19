"use client";

import { BarChart2 } from "lucide-react";

export default function AdminReportsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Analytics and operational reports.</p>
      </div>
      <div className="bg-card border rounded-lg p-16 text-center">
        <BarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-semibold text-lg mb-2">Coming in Sprint 7</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Reports will include enrollment trends, attendance summaries, revenue analytics, and more.
        </p>
      </div>
    </div>
  );
}
