"use client";
import { Settings } from "lucide-react";
export default function ParentSettingsPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-sm text-muted-foreground mt-1">Manage your account and preferences.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 3</h2><p className="text-muted-foreground text-sm">Profile management, notification preferences, and account settings will be here.</p></div>
    </div>
  );
}
