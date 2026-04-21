"use client";

import { Sidebar } from "@/app/components/sidebar";
import { NotificationBell } from "@/app/components/notification-bell";
import {
  LayoutDashboard,
  Baby,
  ClipboardList,
  CalendarCheck,
  CreditCard,
  MessageCircle,
  FileText,
  Bell,
  FolderOpen,
  Settings,
  QrCode,
} from "lucide-react";

const navItems = [
  { label: "My Dashboard", href: "/parent", icon: LayoutDashboard },
  { label: "My Children", href: "/parent/children", icon: Baby },
  { label: "Registration", href: "/parent/registration", icon: ClipboardList },
  { label: "Attendance", href: "/parent/attendance", icon: CalendarCheck },
  { label: "My QR Code", href: "/parent/qr-code", icon: QrCode },
  { label: "Payments", href: "/parent/payments", icon: CreditCard },
  { label: "Messages", href: "/parent/messages", icon: MessageCircle },
  { label: "Daily Reports", href: "/parent/daily-reports", icon: FileText },
  { label: "Notifications", href: "/parent/notifications", icon: Bell },
  { label: "Documents", href: "/parent/documents", icon: FolderOpen },
  { label: "Settings", href: "/parent/settings", icon: Settings },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar navItems={navItems} portalTitle="Parent Portal" />
      <div className="md:pl-56">
        <div className="flex items-center justify-end px-6 py-3 border-b border-border bg-card md:flex hidden">
          <NotificationBell viewAllHref="/parent/notifications" />
        </div>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
