"use client";

import { useState, useEffect } from "react";
import { Users, School, ClipboardList, CalendarCheck } from "lucide-react";
import api from "@/lib/api";

const metrics = [
  { label: "Total Students", value: "–", icon: Users, color: "text-blue-600 bg-blue-50" },
  { label: "Active Classrooms", value: "3", icon: School, color: "text-green-600 bg-green-50" },
  { label: "Pending Registrations", value: "–", icon: ClipboardList, color: "text-orange-600 bg-orange-50" },
  { label: "Today's Attendance", value: "–", icon: CalendarCheck, color: "text-purple-600 bg-purple-50" },
];

export default function AdminDashboard() {
  const [academyName, setAcademyName] = useState("Creative Kids Academy");

  useEffect(() => {
    api.get("/settings/academy_profile").then((res) => {
      if (res.data?.value?.name) setAcademyName(res.data.value.name);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome to the {academyName} admin portal.</p>
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
