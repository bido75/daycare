"use client";

import { Sidebar } from "@/app/components/sidebar";
import { NotificationBell } from "@/app/components/notification-bell";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  MessageCircle,
  AlertCircle,
  FolderOpen,
  BookOpen,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
  { label: "My Classroom", href: "/staff/classroom", icon: BookOpen },
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
        <div className="flex items-center justify-end px-6 py-3 border-b border-border bg-card md:flex hidden">
          <NotificationBell viewAllHref="/staff/notifications" />
        </div>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
