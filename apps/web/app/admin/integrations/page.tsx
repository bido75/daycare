"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Puzzle,
  Plus,
  CheckCircle,
  XCircle,
  Star,
  Trash2,
  TestTube,
  Settings2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  MessageSquare,
} from "lucide-react";

// ─── SMS ────────────────────────────────────────────────────────────────────

const SMS_CONTEXTS = ["attendance", "emergency", "general", "marketing"] as const;
type SmsContext = (typeof SMS_CONTEXTS)[number];

interface SmsProvider {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  isDefault: boolean;
  contexts: string[];
  config: {
    accountSid?: string;
    authToken?: string;
    username?: string;
    apiKey?: string;
    fromNumber?: string;
  };
  _count?: { smsLogs: number };
  createdAt: string;
}

interface SmsProviderFormData {
  name: string;
  displayName: string;
  isActive: boolean;
  contexts: string[];
  config: {
    accountSid: string;
    authToken: string;
    username: string;
    apiKey: string;
    fromNumber: string;
  };
}

const defaultSmsForm: SmsProviderFormData = {
  name: "twilio",
  displayName: "Twilio",
  isActive: false,
  contexts: [],
  config: { accountSid: "", authToken: "", username: "", apiKey: "", fromNumber: "" },
};

// ─── EMAIL ──────────────────────────────────────────────────────────────────

const EMAIL_CONTEXTS = ["auth", "notifications", "billing", "marketing"] as const;
type EmailContext = (typeof EMAIL_CONTEXTS)[number];

interface EmailProvider {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  isDefault: boolean;
  contexts: string[];
  config: {
    apiKey?: string;
    fromEmail?: string;
    fromName?: string;
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    encryption?: string;
  };
  createdAt: string;
}

interface EmailProviderFormData {
  name: string;
  displayName: string;
  isActive: boolean;
  contexts: string[];
  config: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    host: string;
    port: string;
    user: string;
    pass: string;
    encryption: string;
  };
}

const defaultEmailForm: EmailProviderFormData = {
  name: "resend",
  displayName: "Resend",
  isActive: false,
  contexts: [],
  config: {
    apiKey: "",
    fromEmail: "",
    fromName: "Creative Kids Academy",
    host: "",
    port: "587",
    user: "",
    pass: "",
    encryption: "tls",
  },
};

// ─── Shared UI Components ───────────────────────────────────────────────────

function ProviderBadge({ name, type }: { name: string; type: "sms" | "email" }) {
  const smsColors: Record<string, string> = {
    twilio: "bg-red-100 text-red-700",
    clicksend: "bg-blue-100 text-blue-700",
  };
  const emailColors: Record<string, string> = {
    resend: "bg-violet-100 text-violet-700",
    smtp: "bg-orange-100 text-orange-700",
    sendgrid: "bg-cyan-100 text-cyan-700",
    ses: "bg-yellow-100 text-yellow-700",
  };
  const colors = type === "sms" ? smsColors : emailColors;
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${colors[name] ?? "bg-muted text-muted-foreground"}`}
    >
      {name}
    </span>
  );
}

function ContextTag({ label }: { label: string }) {
  const colors: Record<string, string> = {
    attendance: "bg-yellow-100 text-yellow-700",
    emergency: "bg-red-100 text-red-700",
    general: "bg-green-100 text-green-700",
    marketing: "bg-purple-100 text-purple-700",
    auth: "bg-blue-100 text-blue-700",
    notifications: "bg-teal-100 text-teal-700",
    billing: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${colors[label] ?? "bg-muted text-muted-foreground"}`}>
      {label}
    </span>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-1"}`}
      />
    </button>
  );
}

// ─── SMS Section ────────────────────────────────────────────────────────────

function SmsSection() {
  const [providers, setProviders] = useState<SmsProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SmsProviderFormData>(defaultSmsForm);
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState<string | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  useEffect(() => { fetchProviders(); }, []);

  async function fetchProviders() {
    try {
      setLoading(true);
      const res = await api.get("/integrations/sms");
      setProviders(res.data ?? []);
    } catch {
      toast.error("Failed to load SMS providers");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { setForm(defaultSmsForm); setEditingId(null); setShowForm(true); }
  function openEdit(p: SmsProvider) {
    setForm({
      name: p.name, displayName: p.displayName, isActive: p.isActive, contexts: [...p.contexts],
      config: { accountSid: p.config.accountSid ?? "", authToken: p.config.authToken ?? "", username: p.config.username ?? "", apiKey: p.config.apiKey ?? "", fromNumber: p.config.fromNumber ?? "" },
    });
    setEditingId(p.id); setShowForm(true);
  }

  function toggleCtx(ctx: string) {
    setForm((f) => ({ ...f, contexts: f.contexts.includes(ctx) ? f.contexts.filter((c) => c !== ctx) : [...f.contexts, ctx] }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name, displayName: form.displayName, isActive: form.isActive, contexts: form.contexts,
        config: form.name === "twilio"
          ? { accountSid: form.config.accountSid, authToken: form.config.authToken, fromNumber: form.config.fromNumber }
          : { username: form.config.username, apiKey: form.config.apiKey, fromNumber: form.config.fromNumber },
      };
      if (editingId) { await api.patch(`/integrations/sms/${editingId}`, payload); toast.success("Provider updated"); }
      else { await api.post("/integrations/sms", payload); toast.success("Provider added"); }
      setShowForm(false); fetchProviders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to save provider");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this SMS provider?")) return;
    try { await api.delete(`/integrations/sms/${id}`); toast.success("Provider deleted"); fetchProviders(); }
    catch { toast.error("Failed to delete provider"); }
  }

  async function handleSetDefault(id: string) {
    try { await api.post(`/integrations/sms/${id}/default`); toast.success("Set as default provider"); fetchProviders(); }
    catch { toast.error("Failed to set default"); }
  }

  async function handleTest(id: string) {
    if (!testPhone.trim()) { toast.error("Enter a test phone number"); return; }
    setTestingId(id);
    try {
      const res = await api.post(`/integrations/sms/${id}/test`, { testPhoneNumber: testPhone });
      if (res.data?.success) toast.success(`Test SMS sent! Status: ${res.data.status}`);
      else toast.error(`Test failed: ${res.data?.errorMessage ?? "Unknown error"}`);
      setShowTestModal(null); setTestPhone("");
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Test failed"); }
    finally { setTestingId(null); }
  }

  const contextMatrix = SMS_CONTEXTS.map((ctx) => ({ ctx, provider: providers.find((p) => p.contexts.includes(ctx)) ?? null }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">SMS Providers</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{providers.length} configured</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add SMS Provider
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>
      ) : providers.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground mb-1">No SMS providers configured</p>
          <p className="text-sm text-muted-foreground mb-4">Add Twilio or ClickSend to enable SMS messaging.</p>
          <button onClick={openAdd} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Add your first provider</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {providers.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ProviderBadge name={p.name} type="sms" />
                  <span className="font-semibold text-sm">{p.displayName}</span>
                  {p.isDefault && <span className="flex items-center gap-0.5 text-xs text-yellow-600 font-medium"><Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> Default</span>}
                </div>
                {p.isActive ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
                  : <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium"><XCircle className="w-3.5 h-3.5" /> Inactive</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.contexts.length > 0 ? p.contexts.map((ctx) => <ContextTag key={ctx} label={ctx} />) : <span className="text-xs text-muted-foreground">No contexts assigned</span>}
              </div>
              <p className="text-xs text-muted-foreground mb-4">{p._count?.smsLogs ?? 0} messages sent</p>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => openEdit(p)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border hover:bg-muted transition-colors"><Settings2 className="w-3.5 h-3.5" /> Configure</button>
                <button onClick={() => setShowTestModal(p.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border hover:bg-muted transition-colors"><TestTube className="w-3.5 h-3.5" /> Test</button>
                {!p.isDefault && <button onClick={() => handleSetDefault(p.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border hover:bg-muted transition-colors"><Star className="w-3.5 h-3.5" /> Set Default</button>}
                <button onClick={() => handleDelete(p.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors ml-auto"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {providers.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 mb-4">
          <button className="w-full flex items-center justify-between" onClick={() => setShowMatrix((v) => !v)}>
            <h3 className="font-semibold text-sm">SMS Context Routing Matrix</h3>
            {showMatrix ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showMatrix && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-muted-foreground pr-4">Context</th>
                    {providers.map((p) => <th key={p.id} className="pb-2 text-center font-medium text-muted-foreground px-3">{p.displayName}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SMS_CONTEXTS.map((ctx) => (
                    <tr key={ctx} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4"><ContextTag label={ctx} /></td>
                      {providers.map((p) => (
                        <td key={p.id} className="py-2 text-center px-3">
                          {p.contexts.includes(ctx) ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-3">Edit a provider to assign contexts.</p>
            </div>
          )}
        </div>
      )}

      {/* SMS Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="font-semibold text-base mb-4">{editingId ? "Edit SMS Provider" : "Add SMS Provider"}</h2>
              <div className="space-y-4">
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Provider Type</label>
                    <select value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, displayName: e.target.value === "twilio" ? "Twilio" : "ClickSend" }))}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="twilio">Twilio</option>
                      <option value="clicksend">ClickSend</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                {form.name === "twilio" ? (
                  <>
                    <div><label className="block text-sm font-medium mb-1">Account SID</label>
                      <input value={form.config.accountSid} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, accountSid: e.target.value } }))}
                        placeholder={editingId ? "Leave blank to keep current" : "ACxxxxxxxxxxxxxxxx"}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono" /></div>
                    <div><label className="block text-sm font-medium mb-1">Auth Token</label>
                      <input type="password" value={form.config.authToken} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, authToken: e.target.value } }))}
                        placeholder={editingId ? "Leave blank to keep current" : "Auth token"}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" /></div>
                  </>
                ) : (
                  <>
                    <div><label className="block text-sm font-medium mb-1">Username</label>
                      <input value={form.config.username} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, username: e.target.value } }))}
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" /></div>
                    <div><label className="block text-sm font-medium mb-1">API Key</label>
                      <input type="password" value={form.config.apiKey} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, apiKey: e.target.value } }))}
                        placeholder={editingId ? "Leave blank to keep current" : "API key"}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" /></div>
                  </>
                )}
                <div><label className="block text-sm font-medium mb-1">From Number</label>
                  <input value={form.config.fromNumber} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, fromNumber: e.target.value } }))}
                    placeholder="+15551234567"
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" /></div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message Contexts</label>
                  <div className="flex flex-wrap gap-2">
                    {SMS_CONTEXTS.map((ctx) => (
                      <button key={ctx} type="button" onClick={() => toggleCtx(ctx)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${form.contexts.includes(ctx) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                        {ctx}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Active</label>
                  <Toggle value={form.isActive} onChange={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {saving ? "Saving..." : "Save Provider"}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test SMS Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="font-semibold text-base mb-3 flex items-center gap-2"><TestTube className="w-4 h-4 text-primary" /> Test SMS</h2>
            <p className="text-sm text-muted-foreground mb-4">Send a test SMS to verify provider configuration.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Test Phone Number</label>
              <input type="tel" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+15551234567"
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleTest(showTestModal)} disabled={testingId === showTestModal}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {testingId === showTestModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                {testingId === showTestModal ? "Sending..." : "Send Test"}
              </button>
              <button onClick={() => { setShowTestModal(null); setTestPhone(""); }} className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Email Section ───────────────────────────────────────────────────────────

function EmailSection() {
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmailProviderFormData>(defaultEmailForm);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState<string | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  useEffect(() => { fetchProviders(); }, []);

  async function fetchProviders() {
    try {
      setLoading(true);
      const res = await api.get("/integrations/email");
      setProviders(res.data ?? []);
    } catch {
      toast.error("Failed to load email providers");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() { setForm(defaultEmailForm); setEditingId(null); setShowForm(true); }
  function openEdit(p: EmailProvider) {
    setForm({
      name: p.name, displayName: p.displayName, isActive: p.isActive, contexts: [...p.contexts],
      config: {
        apiKey: p.config.apiKey ?? "", fromEmail: p.config.fromEmail ?? "", fromName: p.config.fromName ?? "Creative Kids Academy",
        host: p.config.host ?? "", port: String(p.config.port ?? "587"), user: p.config.user ?? "",
        pass: p.config.pass ?? "", encryption: p.config.encryption ?? "tls",
      },
    });
    setEditingId(p.id); setShowForm(true);
  }

  function toggleCtx(ctx: string) {
    setForm((f) => ({ ...f, contexts: f.contexts.includes(ctx) ? f.contexts.filter((c) => c !== ctx) : [...f.contexts, ctx] }));
  }

  function getDisplayName(name: string) {
    const map: Record<string, string> = { resend: "Resend", smtp: "Custom SMTP", sendgrid: "SendGrid", ses: "Amazon SES" };
    return map[name] ?? name;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const baseConfig = { fromEmail: form.config.fromEmail, fromName: form.config.fromName };
      const config =
        form.name === "smtp"
          ? { ...baseConfig, host: form.config.host, port: Number(form.config.port), user: form.config.user, pass: form.config.pass, encryption: form.config.encryption }
          : { ...baseConfig, apiKey: form.config.apiKey };

      const payload = { name: form.name, displayName: form.displayName, isActive: form.isActive, contexts: form.contexts, config };
      if (editingId) { await api.patch(`/integrations/email/${editingId}`, payload); toast.success("Email provider updated"); }
      else { await api.post("/integrations/email", payload); toast.success("Email provider added"); }
      setShowForm(false); fetchProviders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to save provider");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this email provider?")) return;
    try { await api.delete(`/integrations/email/${id}`); toast.success("Provider deleted"); fetchProviders(); }
    catch { toast.error("Failed to delete provider"); }
  }

  async function handleSetDefault(id: string) {
    try { await api.post(`/integrations/email/${id}/default`); toast.success("Set as default email provider"); fetchProviders(); }
    catch { toast.error("Failed to set default"); }
  }

  async function handleTest(id: string) {
    if (!testEmail.trim()) { toast.error("Enter a test email address"); return; }
    setTestingId(id);
    try {
      const res = await api.post(`/integrations/email/${id}/test`, { testEmail });
      if (res.data?.success) toast.success(`Test email sent! Message ID: ${res.data.messageId ?? "dev"}`);
      else toast.error(`Test failed: ${res.data?.error ?? "Unknown error"}`);
      setShowTestModal(null); setTestEmail("");
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Test failed"); }
    finally { setTestingId(null); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Email Providers</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{providers.length} configured</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Email Provider
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>
      ) : providers.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground mb-1">No email providers configured</p>
          <p className="text-sm text-muted-foreground mb-4">Add Resend or a custom SMTP server to enable email delivery.</p>
          <button onClick={openAdd} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Add your first provider</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {providers.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ProviderBadge name={p.name} type="email" />
                  <span className="font-semibold text-sm">{p.displayName}</span>
                  {p.isDefault && <span className="flex items-center gap-0.5 text-xs text-yellow-600 font-medium"><Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> Default</span>}
                </div>
                {p.isActive ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
                  : <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium"><XCircle className="w-3.5 h-3.5" /> Inactive</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.contexts.length > 0 ? p.contexts.map((ctx) => <ContextTag key={ctx} label={ctx} />) : <span className="text-xs text-muted-foreground">No contexts assigned</span>}
              </div>
              {p.config.fromEmail && <p className="text-xs text-muted-foreground mb-1">From: {p.config.fromEmail}</p>}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <button onClick={() => openEdit(p)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border hover:bg-muted transition-colors"><Settings2 className="w-3.5 h-3.5" /> Configure</button>
                <button onClick={() => setShowTestModal(p.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border hover:bg-muted transition-colors"><TestTube className="w-3.5 h-3.5" /> Test</button>
                {!p.isDefault && <button onClick={() => handleSetDefault(p.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border hover:bg-muted transition-colors"><Star className="w-3.5 h-3.5" /> Set Default</button>}
                <button onClick={() => handleDelete(p.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors ml-auto"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {providers.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 mb-4">
          <button className="w-full flex items-center justify-between" onClick={() => setShowMatrix((v) => !v)}>
            <h3 className="font-semibold text-sm">Email Context Routing Matrix</h3>
            {showMatrix ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showMatrix && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-muted-foreground pr-4">Context</th>
                    {providers.map((p) => <th key={p.id} className="pb-2 text-center font-medium text-muted-foreground px-3">{p.displayName}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {EMAIL_CONTEXTS.map((ctx) => (
                    <tr key={ctx} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4"><ContextTag label={ctx} /></td>
                      {providers.map((p) => (
                        <td key={p.id} className="py-2 text-center px-3">
                          {p.contexts.includes(ctx) ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-3">Edit a provider to assign email contexts.</p>
            </div>
          )}
        </div>
      )}

      {/* Email Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="font-semibold text-base mb-4">{editingId ? "Edit Email Provider" : "Add Email Provider"}</h2>
              <div className="space-y-4">
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Provider Type</label>
                    <select value={form.name} onChange={(e) => { const n = e.target.value; setForm((f) => ({ ...f, name: n, displayName: getDisplayName(n) })); }}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="resend">Resend</option>
                      <option value="smtp">Custom SMTP</option>
                      <option value="sendgrid">SendGrid (coming soon)</option>
                      <option value="ses">Amazon SES (coming soon)</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <input value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                {/* Resend fields */}
                {form.name === "resend" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">API Key</label>
                    <input type="password" value={form.config.apiKey} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, apiKey: e.target.value } }))}
                      placeholder={editingId ? "Leave blank to keep current" : "re_xxxxxxxxxxxx"}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                  </div>
                )}

                {/* SMTP fields */}
                {form.name === "smtp" && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">SMTP Host</label>
                        <input value={form.config.host} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, host: e.target.value } }))}
                          placeholder="smtp.example.com"
                          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Port</label>
                        <input value={form.config.port} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, port: e.target.value } }))}
                          placeholder="587"
                          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Username</label>
                      <input value={form.config.user} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, user: e.target.value } }))}
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password</label>
                      <input type="password" value={form.config.pass} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, pass: e.target.value } }))}
                        placeholder={editingId ? "Leave blank to keep current" : "SMTP password"}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Encryption</label>
                      <select value={form.config.encryption} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, encryption: e.target.value } }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="tls">TLS (STARTTLS)</option>
                        <option value="ssl">SSL</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Common fields */}
                <div>
                  <label className="block text-sm font-medium mb-1">From Email</label>
                  <input value={form.config.fromEmail} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, fromEmail: e.target.value } }))}
                    placeholder="noreply@creativekidsacademy.com"
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">From Name</label>
                  <input value={form.config.fromName} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, fromName: e.target.value } }))}
                    placeholder="Creative Kids Academy"
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Contexts</label>
                  <div className="flex flex-wrap gap-2">
                    {EMAIL_CONTEXTS.map((ctx) => (
                      <button key={ctx} type="button" onClick={() => toggleCtx(ctx)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${form.contexts.includes(ctx) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                        {ctx}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Active</label>
                  <Toggle value={form.isActive} onChange={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {saving ? "Saving..." : "Save Provider"}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="font-semibold text-base mb-3 flex items-center gap-2"><TestTube className="w-4 h-4 text-primary" /> Test Email</h2>
            <p className="text-sm text-muted-foreground mb-4">Send a test email to verify your provider configuration.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Test Email Address</label>
              <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com"
                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleTest(showTestModal)} disabled={testingId === showTestModal}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {testingId === showTestModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {testingId === showTestModal ? "Sending..." : "Send Test Email"}
              </button>
              <button onClick={() => { setShowTestModal(null); setTestEmail(""); }} className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Puzzle className="w-6 h-6 text-primary" />
          Integrations
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage SMS and email provider credentials, credentials, and message routing.
        </p>
      </div>

      {/* Divider */}
      <div className="border border-border rounded-xl p-6 bg-card">
        <SmsSection />
      </div>

      <div className="border border-border rounded-xl p-6 bg-card">
        <EmailSection />
      </div>

      {/* Provider Comparison */}
      <div className="bg-muted/40 border border-border rounded-lg p-5">
        <h2 className="font-semibold text-sm mb-3">Provider Notes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Twilio (SMS)</p>
            <p>Industry standard SMS. Pricing ~$0.0075/msg (US). Supports voice, 2FA, advanced features.</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">ClickSend (SMS)</p>
            <p>Cost-effective for AU/NZ and global reach. ~$0.015/msg. Good for marketing SMS.</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Resend (Email)</p>
            <p>Modern developer email API. 3,000 emails/month free. Excellent deliverability and logs.</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Custom SMTP (Email)</p>
            <p>Use your own mail server (Postal, Mailcow, Office 365). Full control over delivery.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
