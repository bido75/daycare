"use client";

import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure system preferences and academy info.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Academy Profile", desc: "Update school name, address, and contact info." },
          { label: "Notification Preferences", desc: "Configure email and SMS notification settings." },
          { label: "Fee Structure", desc: "Set up tuition rates and fee categories." },
          { label: "Operating Hours", desc: "Set daily open/close times and holiday schedules." },
          { label: "Document Requirements", desc: "Define which documents are required for enrollment." },
          { label: "User Management", desc: "Manage admin and staff accounts and permissions." },
        ].map((item) => (
          <div key={item.label} className="bg-card border rounded-lg p-5">
            <h3 className="font-semibold text-sm">{item.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            <button className="mt-3 text-xs text-primary hover:underline">Configure →</button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-6 text-center">Full settings management coming in Sprint 7.</p>
    </div>
  );
}
