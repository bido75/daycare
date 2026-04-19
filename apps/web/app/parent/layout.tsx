import { Sidebar } from "@/app/components/sidebar";
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
} from "lucide-react";

const navItems = [
  { label: "My Dashboard", href: "/parent", icon: LayoutDashboard },
  { label: "My Children", href: "/parent/children", icon: Baby },
  { label: "Registration", href: "/parent/registration", icon: ClipboardList },
  { label: "Attendance", href: "/parent/attendance", icon: CalendarCheck },
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
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
