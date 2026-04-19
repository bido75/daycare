"use client";
import { FileText } from "lucide-react";
export default function FinanceInvoicesPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Invoices</h1><p className="text-sm text-muted-foreground mt-1">Manage and send invoices to families.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 5</h2><p className="text-muted-foreground text-sm">Invoice management will be available in Sprint 5.</p></div>
    </div>
  );
}
