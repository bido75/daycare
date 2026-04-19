"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, Heart } from "lucide-react";
import { logout, getStoredUser } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  navItems: NavItem[];
  portalTitle: string;
}

export function Sidebar({ navItems, portalTitle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const user = typeof window !== "undefined" ? getStoredUser() : null;

  async function handleLogout() {
    await logout();
    toast.success("Logged out");
    router.push("/auth/login");
  }

  const NavLinks = () => (
    <nav className="flex-1 overflow-y-auto py-4">
      <ul className="space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Heart className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-xs font-bold text-foreground leading-tight">Creative Kids</div>
          <div className="text-[10px] text-muted-foreground leading-tight">{portalTitle}</div>
        </div>
      </div>

      <NavLinks />

      {/* User + logout */}
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email : "User"}
            </div>
            <div className="text-xs text-muted-foreground truncate">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">{portalTitle}</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
