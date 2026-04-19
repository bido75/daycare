"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Smartphone, Send, Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface SmsLog {
  id: string;
  to: string;
  from: string;
  body: string;
  status: string;
  twilioSid?: string;
  errorMessage?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  sent: { label: "Sent", icon: CheckCircle, color: "text-green-600" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-600" },
  failed: { label: "Failed", icon: XCircle, color: "text-destructive" },
  dev_logged: { label: "Dev (Logged)", icon: AlertCircle, color: "text-yellow-600" },
  pending: { label: "Pending", icon: Clock, color: "text-muted-foreground" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, icon: AlertCircle, color: "text-muted-foreground" };
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

export default function AdminSmsPage() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const limit = 20;

  // Send SMS form
  const [sendTo, setSendTo] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Bulk SMS
  const [bulkMessage, setBulkMessage] = useState("");
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  useEffect(() => {
    fetchLogs(1);
    fetchClassrooms();
  }, []);

  async function fetchLogs(p: number) {
    try {
      setLoadingLogs(true);
      const res = await api.get("/sms/logs", { params: { page: p, limit } });
      setLogs(res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
      setPage(p);
    } catch {
      toast.error("Failed to load SMS logs");
    } finally {
      setLoadingLogs(false);
    }
  }

  async function fetchClassrooms() {
    try {
      const res = await api.get("/classrooms", { params: { limit: 50 } });
      setClassrooms(res.data?.data ?? res.data ?? []);
    } catch {}
  }

  async function handleSend() {
    if (!sendTo.trim() || !sendMessage.trim()) {
      toast.error("Phone number and message are required");
      return;
    }
    setSending(true);
    try {
      await api.post("/sms/send", { to: sendTo, message: sendMessage });
      toast.success("SMS sent successfully");
      setSendTo(""); setSendMessage("");
      fetchLogs(1);
    } catch {
      toast.error("Failed to send SMS");
    } finally {
      setSending(false);
    }
  }

  async function handleBulkSend() {
    if (!bulkMessage.trim()) { toast.error("Message is required"); return; }
    setBulkSending(true);
    try {
      // Get parent phone numbers
      const params: any = { limit: 500 };
      if (selectedClassroomId) params.classroomId = selectedClassroomId;
      const res = await api.get("/parents", { params });
      const parentsList = res.data?.data ?? res.data ?? [];
      const phones = parentsList.map((p: any) => p.phone).filter(Boolean);

      if (phones.length === 0) {
        toast.error("No phone numbers found for selected audience");
        setBulkSending(false);
        return;
      }

      await api.post("/sms/bulk", { recipients: phones, message: bulkMessage });
      toast.success(`Bulk SMS sent to ${phones.length} recipient(s)`);
      setBulkMessage(""); setSelectedClassroomId("");
      setShowBulk(false);
      fetchLogs(1);
    } catch {
      toast.error("Failed to send bulk SMS");
    } finally {
      setBulkSending(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SMS Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Send text messages to parents and view SMS history.</p>
        </div>
        <button
          onClick={() => setShowBulk((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          <Users className="w-4 h-4" />
          {showBulk ? "Hide Bulk SMS" : "Bulk SMS"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Send SMS form */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            Send SMS
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                rows={4}
                placeholder="Type your message..."
                maxLength={160}
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{sendMessage.length}/160</p>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !sendTo.trim() || !sendMessage.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : "Send SMS"}
            </button>
          </div>
        </div>

        {/* Bulk SMS form */}
        {showBulk && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Bulk SMS
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Recipients</label>
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Parents</option>
                  {classrooms.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} parents</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  rows={4}
                  placeholder="Type your bulk message..."
                  maxLength={160}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{bulkMessage.length}/160</p>
              </div>
              <button
                onClick={handleBulkSend}
                disabled={bulkSending || !bulkMessage.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Users className="w-4 h-4" />
                {bulkSending ? "Sending..." : "Send to All"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SMS Logs */}
      <div>
        <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          SMS History
        </h2>

        {loadingLogs ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
            Loading...
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Smartphone className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No SMS messages sent yet</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={log.id} className={`border-b border-border last:border-b-0 ${idx % 2 === 1 ? "bg-muted/20" : ""}`}>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">{log.to}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                      <span className="line-clamp-2">{log.body}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                      {log.errorMessage && (
                        <p className="text-[10px] text-destructive mt-0.5">{log.errorMessage}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {total > limit && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{total} total records</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => fetchLogs(page - 1)}
                    className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-muted-foreground">Page {page} of {Math.ceil(total / limit)}</span>
                  <button
                    disabled={page * limit >= total}
                    onClick={() => fetchLogs(page + 1)}
                    className="px-3 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
