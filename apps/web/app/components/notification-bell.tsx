"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  metadata?: { link?: string } | null;
}

const TYPE_COLORS: Record<string, string> = {
  MESSAGE: "bg-blue-500",
  REGISTRATION: "bg-green-500",
  PAYMENT: "bg-yellow-500",
  ATTENDANCE: "bg-orange-500",
  DEFAULT: "bg-muted-foreground",
};

export function NotificationBell({ viewAllHref = "/parent/notifications" }: { viewAllHref?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function fetchUnreadCount() {
    try {
      if (typeof window !== 'undefined' && !localStorage.getItem('accessToken')) return;
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data?.count ?? 0);
    } catch {}
  }

  async function fetchNotifications() {
    try {
      const res = await api.get("/notifications", { params: { limit: 10 } });
      setNotifications(res.data?.data ?? []);
    } catch {}
  }

  async function markAllAsRead() {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      toast.error("Failed to mark as read");
    }
  }

  async function handleNotificationClick(notification: Notification) {
    try {
      if (!notification.isRead) {
        await api.patch(`/notifications/${notification.id}/read`);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      }
      const link = notification.metadata?.link;
      if (link) {
        setOpen(false);
        router.push(link);
      }
    } catch {}
  }

  const dotColor = TYPE_COLORS[notifications[0]?.type] ?? TYPE_COLORS.DEFAULT;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors flex items-start gap-3 ${!n.isRead ? "bg-primary/5" : ""}`}
                >
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? TYPE_COLORS[n.type] ?? TYPE_COLORS.DEFAULT : "bg-transparent"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {n.metadata?.link && <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 mt-1" />}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border">
            <button
              onClick={() => { setOpen(false); router.push(viewAllHref); }}
              className="text-xs text-primary hover:underline"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
