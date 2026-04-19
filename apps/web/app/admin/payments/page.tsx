"use client";

import { CreditCard } from "lucide-react";

export default function AdminPaymentsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage invoices, payments, and billing.</p>
      </div>
      <div className="bg-card border rounded-lg p-16 text-center">
        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-semibold text-lg mb-2">Coming in Sprint 5</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          The payments module will include invoicing, Stripe integration, and payment tracking.
        </p>
      </div>
    </div>
  );
}
