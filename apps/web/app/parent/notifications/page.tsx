"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, MessageCircle, CreditCard, CalendarCheck, ClipboardList } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  metadata?: { link?: string } | null;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MESSAGE: MessageCircle,
  PAYMENT: CreditCard,
  ATTENDANCE: CalendarCheck,
  REGISTRATION: ClipboardList,
};

export default function ParentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchNotifications(1, unreadOnly);
  }, [unreadOnly]);

  async function fetchNotifications(p: number, unread: boolean) {
    try {
      setLoading(true);
      const res = await api.get("/notifications", {
        params: { page: p, limit, unreadOnly: unread || undefined },
      });
      setNotifications(res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
      setPage(p);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark as read");
    }
  }

  async function markOneAsRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {}
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay up to date with important announcements.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="accent-primary"
            />
            Unread only
          </label>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-16 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">No notifications</h2>
          <p className="text-muted-foreground text-sm">
            {unreadOnly ? "No unread notifications." : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {notifications.map((n, idx) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-4 py-4 ${idx !== 0 ? "border-t border-border" : ""} ${!n.isRead ? "bg-primary/5" : ""}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? "bg-primary/10" : "bg-muted"}`}>
                  <Icon className={`w-4 h-4 ${!n.isRead ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markOneAsRead(n.id)}
                    className="shrink-0 text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => fetchNotifications(page - 1, unreadOnly)}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            disabled={page * limit >= total}
            onClick={() => fetchNotifications(page + 1, unreadOnly)}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
