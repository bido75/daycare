"use client";
import { Bell } from "lucide-react";
export default function ParentNotificationsPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Notifications</h1><p className="text-sm text-muted-foreground mt-1">Stay up to date with important announcements.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 4</h2><p className="text-muted-foreground text-sm">Notifications about your child and academy updates will appear here.</p></div>
    </div>
  );
}
