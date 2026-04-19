import { Users, CalendarCheck, FileText, AlertCircle } from "lucide-react";

const metrics = [
  { label: "My Students", value: "–", icon: Users, color: "text-blue-600 bg-blue-50" },
  { label: "Checked In Today", value: "–", icon: CalendarCheck, color: "text-green-600 bg-green-50" },
  { label: "Reports This Week", value: "–", icon: FileText, color: "text-purple-600 bg-purple-50" },
  { label: "Open Incidents", value: "–", icon: AlertCircle, color: "text-red-600 bg-red-50" },
];

export default function StaffDashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Classroom</h1>
        <p className="text-muted-foreground text-sm mt-1">Good morning! Here&apos;s your classroom overview.</p>
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
