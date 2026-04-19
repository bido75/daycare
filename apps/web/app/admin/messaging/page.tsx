"use client";

import { MessageCircle } from "lucide-react";

export default function AdminMessagingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Messaging</h1>
        <p className="text-muted-foreground text-sm mt-1">Send and receive messages with parents and staff.</p>
      </div>
      <div className="bg-card border rounded-lg p-16 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-semibold text-lg mb-2">Coming in Sprint 4</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          The messaging center will allow two-way communication between administrators, staff, and parents.
        </p>
      </div>
    </div>
  );
}
