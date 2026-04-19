"use client";
import { MessageCircle } from "lucide-react";
export default function ParentMessagesPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Messages</h1><p className="text-sm text-muted-foreground mt-1">Communicate with your child's teachers and admin.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 4</h2><p className="text-muted-foreground text-sm">The messaging center will be available in a future update.</p></div>
    </div>
  );
}
