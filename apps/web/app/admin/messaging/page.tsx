"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle, Send, Plus, Radio, Search, X, Users, ChevronLeft,
} from "lucide-react";

interface Message {
  id: string;
  body: string;
  senderId: string;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    role: string;
    parentProfile?: { firstName: string; lastName: string } | null;
    staffProfile?: { firstName: string; lastName: string } | null;
  };
}

interface Thread {
  id: string;
  subject?: string;
  updatedAt: string;
  unreadCount: number;
  messages: Message[];
  parent: {
    firstName: string;
    lastName: string;
    user: { id: string; email: string };
  };
}

function senderName(sender: Message["sender"]): string {
  if (sender.staffProfile) return `${sender.staffProfile.firstName} ${sender.staffProfile.lastName}`;
  if (sender.parentProfile) return `${sender.parentProfile.firstName} ${sender.parentProfile.lastName}`;
  return sender.email;
}

function threadPreview(thread: Thread): string {
  const last = thread.messages[0];
  return last ? last.body : "No messages yet";
}

function threadLabel(thread: Thread): string {
  return `${thread.parent.firstName} ${thread.parent.lastName}`;
}

export default function AdminMessagingPage() {
  const currentUser = getStoredUser();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  // Compose modal
  const [showCompose, setShowCompose] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeParentId, setComposeParentId] = useState("");
  const [parents, setParents] = useState<any[]>([]);
  const [parentSearch, setParentSearch] = useState("");

  // Broadcast modal
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastClassroomId, setBroadcastClassroomId] = useState("");
  const [classrooms, setClassrooms] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchThreads();
    fetchParents();
    fetchClassrooms();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  async function fetchThreads(q = "") {
    try {
      setLoading(true);
      const res = await api.get("/messages/threads", { params: { search: q || undefined, limit: 50 } });
      setThreads(res.data?.data ?? res.data ?? []);
    } catch {
      toast.error("Failed to load threads");
    } finally {
      setLoading(false);
    }
  }

  async function fetchParents() {
    try {
      const res = await api.get("/parents", { params: { limit: 100 } });
      setParents(res.data?.data ?? res.data ?? []);
    } catch {}
  }

  async function fetchClassrooms() {
    try {
      const res = await api.get("/classrooms", { params: { limit: 50 } });
      setClassrooms(res.data?.data ?? res.data ?? []);
    } catch {}
  }

  async function openThread(thread: Thread) {
    setSelectedThread(thread);
    setMobileView("thread");
    try {
      const res = await api.get(`/messages/threads/${thread.id}`);
      const full = res.data;
      setThreadMessages(full.messages ?? []);
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
      );
    } catch {
      toast.error("Failed to load messages");
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selectedThread) return;
    setSending(true);
    try {
      const res = await api.post(`/messages/threads/${selectedThread.id}/messages`, { content: reply });
      setThreadMessages((prev) => [...prev, res.data]);
      setReply("");
      fetchThreads(search);
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleCompose() {
    if (!composeParentId || !composeMessage.trim()) return;
    try {
      await api.post("/messages/threads", {
        subject: composeSubject || undefined,
        message: composeMessage,
        parentId: composeParentId,
      });
      toast.success("Thread created");
      setShowCompose(false);
      setComposeSubject(""); setComposeMessage(""); setComposeParentId("");
      fetchThreads(search);
    } catch {
      toast.error("Failed to create thread");
    }
  }

  async function handleBroadcast() {
    if (!broadcastSubject || !broadcastMessage.trim()) return;
    try {
      await api.post("/messages/broadcast", {
        subject: broadcastSubject,
        message: broadcastMessage,
        classroomId: broadcastClassroomId || undefined,
      });
      toast.success("Broadcast sent");
      setShowBroadcast(false);
      setBroadcastSubject(""); setBroadcastMessage(""); setBroadcastClassroomId("");
      fetchThreads(search);
    } catch {
      toast.error("Failed to send broadcast");
    }
  }

  const filteredParents = parents.filter((p) => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    return !parentSearch || name.includes(parentSearch.toLowerCase());
  });

  const handleSearchChange = (v: string) => {
    setSearch(v);
    fetchThreads(v);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messaging</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Communicate with parents and staff.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBroadcast(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Radio className="w-4 h-4" /> Broadcast
          </button>
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Message
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden flex h-[calc(100vh-200px)] min-h-[500px]">
        {/* Thread list */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col shrink-0 ${mobileView === "thread" ? "hidden md:flex" : "flex"}`}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No threads yet</p>
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => openThread(thread)}
                  className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors ${selectedThread?.id === thread.id ? "bg-muted" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm truncate ${thread.unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                      {threadLabel(thread)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {thread.unreadCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {thread.subject && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{thread.subject}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{threadPreview(thread)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className={`flex-1 flex flex-col ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Select a conversation to start reading</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <button
                  className="md:hidden p-1 rounded hover:bg-muted"
                  onClick={() => setMobileView("list")}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{threadLabel(selectedThread)}</p>
                  {selectedThread.subject && (
                    <p className="text-xs text-muted-foreground">{selectedThread.subject}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                        {!isMe && (
                          <p className="text-[10px] font-medium mb-1 opacity-70">{senderName(msg.sender)}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60 text-right" : "text-muted-foreground"}`}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              <div className="p-3 border-t border-border">
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }
                    }}
                    placeholder="Type a message... (Enter to send)"
                    rows={2}
                    className="flex-1 resize-none px-3 py-2 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="p-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">New Message</h2>
              <button onClick={() => setShowCompose(false)} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Recipient (Parent)</label>
                <input
                  placeholder="Search parents..."
                  value={parentSearch}
                  onChange={(e) => setParentSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {parentSearch && (
                  <div className="mt-1 border border-border rounded-md bg-card max-h-40 overflow-y-auto">
                    {filteredParents.slice(0, 8).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setComposeParentId(p.id); setParentSearch(`${p.firstName} ${p.lastName}`); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      >
                        {p.firstName} {p.lastName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject (optional)</label>
                <input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Message subject"
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  rows={4}
                  placeholder="Write your message..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted">Cancel</button>
              <button onClick={handleCompose} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">Broadcast Message</h2>
              <button onClick={() => setShowBroadcast(false)} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Audience</label>
                <select
                  value={broadcastClassroomId}
                  onChange={(e) => setBroadcastClassroomId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Parents</option>
                  {classrooms.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} parents</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="Broadcast subject"
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={4}
                  placeholder="Write your broadcast message..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setShowBroadcast(false)} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted">Cancel</button>
              <button onClick={handleBroadcast} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Send Broadcast</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
