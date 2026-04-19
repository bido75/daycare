"use client";

import { Sidebar } from "@/app/components/sidebar";
import { NotificationBell } from "@/app/components/notification-bell";
import {
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  AlertTriangle,
  Tag,
  BarChart2,
} from "lucide-react";

const navItems = [
  { label: "Financial Overview", href: "/finance", icon: LayoutDashboard },
  { label: "Invoices", href: "/finance/invoices", icon: FileText },
  { label: "Transactions", href: "/finance/transactions", icon: ArrowLeftRight },
  { label: "Outstanding Balances", href: "/finance/outstanding", icon: AlertTriangle },
  { label: "Fee Types", href: "/finance/fee-types", icon: Tag },
  { label: "Reports", href: "/finance/reports", icon: BarChart2 },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar navItems={navItems} portalTitle="Finance Portal" />
      <div className="md:pl-56">
        <div className="flex items-center justify-end px-6 py-3 border-b border-border bg-card md:flex hidden">
          <NotificationBell viewAllHref="/finance/notifications" />
        </div>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
