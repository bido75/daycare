"use client";
import { Tag } from "lucide-react";
export default function FinanceFeeTypesPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Fee Types</h1><p className="text-sm text-muted-foreground mt-1">Manage tuition rates and fee categories.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 5</h2><p className="text-muted-foreground text-sm">Fee type configuration will be available in Sprint 5.</p></div>
    </div>
  );
}
