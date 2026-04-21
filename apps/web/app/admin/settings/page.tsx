"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Building2, Bell, DollarSign, Clock, FileCheck, Users,
  Loader2, Plus, Trash2, Save, Pencil, KeyRound, X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AcademyProfile {
  name: string; address: string; city: string; state: string; zipCode: string;
  phone: string; email: string; website: string; logo: string;
  description: string; taxId: string; licenseNumber: string;
}

interface NotificationPrefs {
  emailNotifications: boolean; smsNotifications: boolean;
  parentWelcomeEmail: boolean; attendanceAlerts: boolean;
  paymentReminders: boolean; paymentReminderDaysBefore: number;
  documentExpiryAlerts: boolean; documentExpiryDaysBefore: number;
  dailyReportNotify: boolean;
}

interface FeeStructure {
  currency: string; taxRate: number; lateFeeEnabled: boolean;
  lateFeeAmount: number; lateFeeGraceDays: number;
  autoInvoiceEnabled: boolean; invoiceDayOfMonth: number;
}

interface DaySchedule { open: string; close: string; closed: boolean; }
interface OperatingHours {
  timezone: string;
  weekdays: Record<string, DaySchedule>;
  holidays: Array<{ date: string; name: string }>;
  lateCheckInMinutes: number;
}

interface DocRequirement {
  type: string; label: string; required: boolean; expiryRequired: boolean;
}
interface DocumentRequirements { requiredDocuments: DocRequirement[]; }

interface UserRow {
  id: string; email: string; role: string; isActive: boolean;
  parentProfile?: { firstName: string; lastName: string } | null;
  staffProfile?: { firstName: string; lastName: string } | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "academy", label: "Academy Profile", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "fees", label: "Fee Structure", icon: DollarSign },
  { id: "hours", label: "Operating Hours", icon: Clock },
  { id: "documents", label: "Document Requirements", icon: FileCheck },
  { id: "users", label: "User Management", icon: Users },
];

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DOC_TYPES = ["BIRTH_CERT", "IMMUNIZATION", "MEDICAL", "ID_CARD", "ENROLLMENT_FORM", "OTHER"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];
const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Paris",
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-indigo-600" : "bg-gray-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function SaveBtn({ saving }: { saving: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {saving ? "Saving…" : "Save Changes"}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${props.className ?? ""}`}
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 bg-gray-100 rounded-lg" />
      ))}
    </div>
  );
}

// ─── Fetch / Save ───────────────────────────────────────────────────────────

async function fetchSetting<T>(key: string): Promise<T | null> {
  try {
    const res = await api.get(`/settings/${key}`);
    return res.data.data as T;
  } catch {
    return null;
  }
}

async function saveSetting(key: string, value: any) {
  await api.put(`/settings/${key}`, { value });
}

// ─── Tab: Academy Profile ───────────────────────────────────────────────────

function AcademyTab() {
  const [form, setForm] = useState<AcademyProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSetting<AcademyProfile>("academy_profile").then((d) => {
      setForm(d ?? {
        name: "", address: "", city: "", state: "", zipCode: "",
        phone: "", email: "", website: "", logo: "", description: "",
        taxId: "", licenseNumber: "",
      });
    });
  }, []);

  const set = (k: keyof AcademyProfile, v: string) => setForm((f) => f ? { ...f, [k]: v } : f);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveSetting("academy_profile", form);
      toast.success("Academy profile saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <Skeleton />;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Label>Academy Name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Creative Kids Academy" />
        </div>
        <div className="md:col-span-2">
          <Label>Address</Label>
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St" />
        </div>
        <div>
          <Label>City</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Springfield" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="IL" maxLength={2} />
          </div>
          <div>
            <Label>ZIP Code</Label>
            <Input value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} placeholder="62701" />
          </div>
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 000-0000" type="tel" />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="admin@school.edu" type="email" />
        </div>
        <div>
          <Label>Website</Label>
          <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://creativekids.edu" />
        </div>
        <div>
          <Label>Logo URL</Label>
          <Input value={form.logo} onChange={(e) => set("logo", e.target.value)} placeholder="https://…/logo.png" />
        </div>
        <div>
          <Label>Tax ID</Label>
          <Input value={form.taxId} onChange={(e) => set("taxId", e.target.value)} placeholder="12-3456789" />
        </div>
        <div>
          <Label>License Number</Label>
          <Input value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} placeholder="LIC-000000" />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="A brief description of your academy…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <SaveBtn saving={saving} />
      </div>
    </form>
  );
}

// ─── Tab: Notifications ─────────────────────────────────────────────────────

function NotificationsTab() {
  const [form, setForm] = useState<NotificationPrefs | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSetting<NotificationPrefs>("notification_preferences").then((d) =>
      setForm(d ?? {
        emailNotifications: true, smsNotifications: false, parentWelcomeEmail: true,
        attendanceAlerts: true, paymentReminders: true, paymentReminderDaysBefore: 3,
        documentExpiryAlerts: true, documentExpiryDaysBefore: 30, dailyReportNotify: true,
      })
    );
  }, []);

  const set = <K extends keyof NotificationPrefs>(k: K, v: NotificationPrefs[K]) =>
    setForm((f) => f ? { ...f, [k]: v } : f);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveSetting("notification_preferences", form);
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <Skeleton />;

  const rows: Array<{ label: string; sub?: string; key: keyof NotificationPrefs; numKey?: keyof NotificationPrefs; numLabel?: string }> = [
    { label: "Email Notifications", sub: "Send all email notifications", key: "emailNotifications" },
    { label: "SMS Notifications", sub: "Send text message notifications", key: "smsNotifications" },
    { label: "Parent Welcome Email", sub: "Send welcome email on registration", key: "parentWelcomeEmail" },
    { label: "Attendance Alerts", sub: "Notify parents about attendance", key: "attendanceAlerts" },
    { label: "Payment Reminders", sub: "Send payment due reminders", key: "paymentReminders", numKey: "paymentReminderDaysBefore", numLabel: "Days before due" },
    { label: "Document Expiry Alerts", sub: "Alert before documents expire", key: "documentExpiryAlerts", numKey: "documentExpiryDaysBefore", numLabel: "Days before expiry" },
    { label: "Daily Report Notifications", sub: "Send daily reports to parents", key: "dailyReportNotify" },
  ];

  return (
    <form onSubmit={submit} className="space-y-3">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4">
          <div>
            <p className="text-sm font-medium text-gray-800">{r.label}</p>
            {r.sub && <p className="text-xs text-gray-500 mt-0.5">{r.sub}</p>}
          </div>
          <div className="flex items-center gap-4">
            {r.numKey && form[r.key] && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">{r.numLabel}</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form[r.numKey] as number}
                  onChange={(e) => set(r.numKey!, parseInt(e.target.value) as any)}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            )}
            <Toggle
              checked={form[r.key] as boolean}
              onChange={(v) => set(r.key, v as any)}
            />
          </div>
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <SaveBtn saving={saving} />
      </div>
    </form>
  );
}

// ─── Tab: Fee Structure ─────────────────────────────────────────────────────

function FeesTab() {
  const [form, setForm] = useState<FeeStructure | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSetting<FeeStructure>("fee_structure").then((d) =>
      setForm(d ?? {
        currency: "USD", taxRate: 0, lateFeeEnabled: false,
        lateFeeAmount: 25, lateFeeGraceDays: 5,
        autoInvoiceEnabled: false, invoiceDayOfMonth: 1,
      })
    );
  }, []);

  const set = <K extends keyof FeeStructure>(k: K, v: FeeStructure[K]) =>
    setForm((f) => f ? { ...f, [k]: v } : f);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveSetting("fee_structure", form);
      toast.success("Fee structure saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <Skeleton />;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label>Currency</Label>
          <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div>
          <Label>Tax Rate (%)</Label>
          <Input
            type="number" min={0} max={100} step={0.01}
            value={form.taxRate * 100}
            onChange={(e) => set("taxRate", parseFloat(e.target.value) / 100 || 0)}
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Late Fee</p>
            <p className="text-xs text-gray-500">Charge a fee for late payments</p>
          </div>
          <Toggle checked={form.lateFeeEnabled} onChange={(v) => set("lateFeeEnabled", v)} />
        </div>
        {form.lateFeeEnabled && (
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <Label>Late Fee Amount ($)</Label>
              <Input
                type="number" min={0} step={0.01}
                value={form.lateFeeAmount}
                onChange={(e) => set("lateFeeAmount", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Grace Period (days)</Label>
              <Input
                type="number" min={0}
                value={form.lateFeeGraceDays}
                onChange={(e) => set("lateFeeGraceDays", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Auto Invoice</p>
            <p className="text-xs text-gray-500">Automatically generate invoices monthly</p>
          </div>
          <Toggle checked={form.autoInvoiceEnabled} onChange={(v) => set("autoInvoiceEnabled", v)} />
        </div>
        {form.autoInvoiceEnabled && (
          <div className="pt-1">
            <Label>Invoice Day of Month</Label>
            <Input
              type="number" min={1} max={28}
              value={form.invoiceDayOfMonth}
              onChange={(e) => set("invoiceDayOfMonth", parseInt(e.target.value) || 1)}
              className="max-w-xs"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <SaveBtn saving={saving} />
      </div>
    </form>
  );
}

// ─── Tab: Operating Hours ───────────────────────────────────────────────────

function HoursTab() {
  const [form, setForm] = useState<OperatingHours | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSetting<OperatingHours>("operating_hours").then((d) =>
      setForm(d ?? {
        timezone: "America/New_York",
        weekdays: Object.fromEntries(WEEKDAYS.map((d) => [d, { open: "07:00", close: "18:00", closed: d === "saturday" || d === "sunday" }])),
        holidays: [],
        lateCheckInMinutes: 15,
      })
    );
  }, []);

  const setDay = (day: string, field: keyof DaySchedule, value: any) =>
    setForm((f) => f ? { ...f, weekdays: { ...f.weekdays, [day]: { ...f.weekdays[day], [field]: value } } } : f);

  const addHoliday = () =>
    setForm((f) => f ? { ...f, holidays: [...f.holidays, { date: "", name: "" }] } : f);

  const removeHoliday = (i: number) =>
    setForm((f) => f ? { ...f, holidays: f.holidays.filter((_, idx) => idx !== i) } : f);

  const setHoliday = (i: number, field: "date" | "name", value: string) =>
    setForm((f) => f ? {
      ...f,
      holidays: f.holidays.map((h, idx) => idx === i ? { ...h, [field]: value } : h),
    } : f);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveSetting("operating_hours", form);
      toast.success("Operating hours saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <Skeleton />;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label>Timezone</Label>
          <Select value={form.timezone} onChange={(e) => setForm((f) => f ? { ...f, timezone: e.target.value } : f)}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </Select>
        </div>
        <div>
          <Label>Late Check-in Threshold (minutes)</Label>
          <Input
            type="number" min={0}
            value={form.lateCheckInMinutes}
            onChange={(e) => setForm((f) => f ? { ...f, lateCheckInMinutes: parseInt(e.target.value) || 0 } : f)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly Schedule</h3>
        <div className="space-y-2">
          {WEEKDAYS.map((day) => {
            const d = form.weekdays[day] ?? { open: "07:00", close: "18:00", closed: false };
            return (
              <div key={day} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-gray-700 w-24 capitalize">{day}</span>
                <Toggle checked={!d.closed} onChange={(v) => setDay(day, "closed", !v)} />
                <span className="text-xs text-gray-400 w-10">{d.closed ? "Closed" : "Open"}</span>
                {!d.closed && (
                  <>
                    <input
                      type="time" value={d.open}
                      onChange={(e) => setDay(day, "open", e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <input
                      type="time" value={d.close}
                      onChange={(e) => setDay(day, "close", e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Holidays</h3>
          <button type="button" onClick={addHoliday}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            <Plus className="w-4 h-4" /> Add Holiday
          </button>
        </div>
        <div className="space-y-2">
          {form.holidays.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <Input type="date" value={h.date} onChange={(e) => setHoliday(i, "date", e.target.value)} className="max-w-[160px]" />
              <Input value={h.name} onChange={(e) => setHoliday(i, "name", e.target.value)} placeholder="Holiday name" />
              <button type="button" onClick={() => removeHoliday(i)} className="text-red-400 hover:text-red-600 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {form.holidays.length === 0 && (
            <p className="text-sm text-gray-400 py-2">No holidays added yet</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <SaveBtn saving={saving} />
      </div>
    </form>
  );
}

// ─── Tab: Document Requirements ─────────────────────────────────────────────

function DocumentsTab() {
  const [form, setForm] = useState<DocumentRequirements | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSetting<DocumentRequirements>("document_requirements").then((d) =>
      setForm(d ?? { requiredDocuments: [] })
    );
  }, []);

  const setDoc = (i: number, field: keyof DocRequirement, value: any) =>
    setForm((f) => f ? {
      ...f,
      requiredDocuments: f.requiredDocuments.map((d, idx) => idx === i ? { ...d, [field]: value } : d),
    } : f);

  const addDoc = () =>
    setForm((f) => f ? {
      ...f,
      requiredDocuments: [...f.requiredDocuments, { type: "OTHER", label: "", required: true, expiryRequired: false }],
    } : f);

  const removeDoc = (i: number) =>
    setForm((f) => f ? { ...f, requiredDocuments: f.requiredDocuments.filter((_, idx) => idx !== i) } : f);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveSetting("document_requirements", form);
      toast.success("Document requirements saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <Skeleton />;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Configure which documents parents must provide</p>
        <button type="button" onClick={addDoc}
          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          <Plus className="w-4 h-4" /> Add Document Type
        </button>
      </div>

      <div className="space-y-2">
        {form.requiredDocuments.map((doc, i) => (
          <div key={i} className="bg-gray-50 rounded-xl px-4 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Document Type</Label>
                  <Select value={doc.type} onChange={(e) => setDoc(i, "type", e.target.value)}>
                    {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Display Label</Label>
                  <Input value={doc.label} onChange={(e) => setDoc(i, "label", e.target.value)} placeholder="e.g. Birth Certificate" />
                </div>
              </div>
              <button type="button" onClick={() => removeDoc(i)} className="text-red-400 hover:text-red-600 mt-6 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Toggle checked={doc.required} onChange={(v) => setDoc(i, "required", v)} />
                <span className="text-sm text-gray-600">Required</span>
              </div>
              <div className="flex items-center gap-2">
                <Toggle checked={doc.expiryRequired} onChange={(v) => setDoc(i, "expiryRequired", v)} />
                <span className="text-sm text-gray-600">Expiry Date Required</span>
              </div>
            </div>
          </div>
        ))}
        {form.requiredDocuments.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-xl">
            No document types configured yet
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <SaveBtn saving={saving} />
      </div>
    </form>
  );
}

// ─── Tab: User Management ───────────────────────────────────────────────────

const ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "PARENT"];

interface EditUserForm { email: string; role: string; }
interface ResetPasswordForm { password: string; confirm: string; }

function UserManagementTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({ email: "", role: "" });
  const [editSaving, setEditSaving] = useState(false);

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [resetForm, setResetForm] = useState<ResetPasswordForm>({ password: "", confirm: "" });
  const [resetSaving, setResetSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data.data.users ?? []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const toggleActive = async (user: UserRow) => {
    setToggling(user.id);
    try {
      await api.patch(`/users/${user.id}/toggle-active`, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      toast.success(`User ${!user.isActive ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update user");
    } finally {
      setToggling(null);
    }
  };

  const openEdit = (user: UserRow) => {
    setEditTarget(user);
    setEditForm({ email: user.email, role: user.role });
  };

  const closeEdit = () => { setEditTarget(null); };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const res = await api.put(`/users/${editTarget.id}`, editForm);
      const updated = res.data.data;
      setUsers((prev) => prev.map((u) => u.id === editTarget.id ? { ...u, ...updated } : u));
      toast.success("User updated");
      closeEdit();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setEditSaving(false);
    }
  };

  const openReset = (user: UserRow) => {
    setResetTarget(user);
    setResetForm({ password: "", confirm: "" });
  };

  const closeReset = () => { setResetTarget(null); };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (resetForm.password !== resetForm.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (resetForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setResetSaving(true);
    try {
      await api.put(`/users/${resetTarget.id}/reset-password`, { password: resetForm.password });
      toast.success("Password updated successfully");
      closeReset();
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setResetSaving(false);
    }
  };

  const getName = (u: UserRow) => {
    if (u.staffProfile) return `${u.staffProfile.firstName} ${u.staffProfile.lastName}`;
    if (u.parentProfile) return `${u.parentProfile.firstName} ${u.parentProfile.lastName}`;
    return "—";
  };

  const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    ADMIN: "bg-indigo-100 text-indigo-700",
    STAFF: "bg-blue-100 text-blue-700",
    PARENT: "bg-gray-100 text-gray-600",
  };

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{users.length} users found</p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 bg-gray-50 border-b border-gray-100">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-900">{getName(u)}</td>
                <td className="px-5 py-3 text-gray-500">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {u.role.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Edit user"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => openReset(u)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      title="Reset password"
                    >
                      <KeyRound className="w-3 h-3" /> Reset Password
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={toggling === u.id}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${u.isActive
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                      } disabled:opacity-50`}
                    >
                      {toggling === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-10 text-gray-400">No users found</div>
        )}
      </div>

      {/* Edit User Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Edit User</h2>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.replace("_", " ")}</option>
                  ))}
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Reset Password</h2>
                <p className="text-xs text-gray-500 mt-0.5">{getName(resetTarget)} · {resetTarget.email}</p>
              </div>
              <button onClick={closeReset} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitReset} className="space-y-4">
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={resetForm.password}
                  onChange={(e) => setResetForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={resetForm.confirm}
                  onChange={(e) => setResetForm((f) => ({ ...f, confirm: e.target.value }))}
                  placeholder="Re-enter password"
                  required
                />
              </div>
              {resetForm.confirm && resetForm.password !== resetForm.confirm && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeReset}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSaving || (!!resetForm.confirm && resetForm.password !== resetForm.confirm)}
                  className="flex items-center gap-2 bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-60 transition-colors"
                >
                  {resetSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {resetSaving ? "Updating…" : "Set Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [tab, setTab] = useState("academy");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure system preferences and academy information</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {tab === "academy" && <AcademyTab />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "fees" && <FeesTab />}
        {tab === "hours" && <HoursTab />}
        {tab === "documents" && <DocumentsTab />}
        {tab === "users" && <UserManagementTab />}
      </div>
    </div>
  );
}
