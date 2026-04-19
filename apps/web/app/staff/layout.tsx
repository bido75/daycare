import { Sidebar } from "@/app/components/sidebar";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  MessageCircle,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

const navItems = [
  { label: "My Classroom", href: "/staff", icon: LayoutDashboard },
  { label: "Student Roster", href: "/staff/students", icon: Users },
  { label: "Attendance", href: "/staff/attendance", icon: CalendarCheck },
  { label: "Daily Reports", href: "/staff/daily-reports", icon: FileText },
  { label: "Messages", href: "/staff/messages", icon: MessageCircle },
  { label: "Incidents", href: "/staff/incidents", icon: AlertCircle },
  { label: "Documents", href: "/staff/documents", icon: FolderOpen },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar navItems={navItems} portalTitle="Staff Portal" />
      <div className="md:pl-56">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
