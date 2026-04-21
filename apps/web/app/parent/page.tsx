"use client";

import { useState, useEffect } from "react";
import { Baby, CalendarCheck, CreditCard, MessageCircle } from "lucide-react";
import api from "@/lib/api";

const metrics = [
  { label: "My Children", value: "–", icon: Baby, color: "text-pink-600 bg-pink-50" },
  { label: "Days Present This Month", value: "–", icon: CalendarCheck, color: "text-green-600 bg-green-50" },
  { label: "Outstanding Balance", value: "–", icon: CreditCard, color: "text-orange-600 bg-orange-50" },
  { label: "Unread Messages", value: "–", icon: MessageCircle, color: "text-blue-600 bg-blue-50" },
];

export default function ParentDashboard() {
  const [academyName, setAcademyName] = useState("Creative Kids Academy");

  useEffect(() => {
    api.get("/settings/academy_profile").then((res) => {
      if (res.data?.value?.name) setAcademyName(res.data.value.name);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome to your parent portal at {academyName}.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl bg-card border border-border p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${m.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-foreground">{m.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{m.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
