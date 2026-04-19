"use client";

import { Sidebar } from "@/app/components/sidebar";
import { NotificationBell } from "@/app/components/notification-bell";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  School,
  UserCheck,
  MessageCircle,
  CreditCard,
  CalendarCheck,
  FileText,
  BarChart2,
  Settings,
  UserCog,
  Smartphone,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Registrations", href: "/admin/registrations", icon: ClipboardList },
  { label: "Classrooms", href: "/admin/classrooms", icon: School },
  { label: "Staff", href: "/admin/staff", icon: UserCog },
  { label: "Parents", href: "/admin/parents", icon: UserCheck },
  { label: "Messaging", href: "/admin/messaging", icon: MessageCircle },
  { label: "SMS Management", href: "/admin/sms", icon: Smartphone },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck },
  { label: "Documents", href: "/admin/documents", icon: FileText },
  { label: "Reports", href: "/admin/reports", icon: BarChart2 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar navItems={navItems} portalTitle="Admin Portal" />
      <div className="md:pl-56">
        <div className="flex items-center justify-end px-6 py-3 border-b border-border bg-card md:flex hidden">
          <NotificationBell viewAllHref="/admin/notifications" />
        </div>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
