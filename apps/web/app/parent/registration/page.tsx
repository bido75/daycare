"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { Check, ChevronRight, ChevronLeft, Baby, AlertCircle, Car, ClipboardList } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChildInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  allergies: string;
  medicalNotes: string;
  classroomId: string;
  startDate: string;
}

interface EmergencyContact {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
  email: string;
}

interface AuthorizedPickup {
  firstName: string;
  lastName: string;
  relationship: string;
  phone: string;
}

const EMPTY_CHILD: ChildInfo = {
  firstName: "", lastName: "", dateOfBirth: "", gender: "",
  allergies: "", medicalNotes: "", classroomId: "", startDate: "",
};
const EMPTY_EC: EmergencyContact = { firstName: "", lastName: "", relationship: "", phone: "", email: "" };
const EMPTY_AP: AuthorizedPickup = { firstName: "", lastName: "", relationship: "", phone: "" };

const STEPS = [
  { id: 1, label: "Child Info", icon: Baby },
  { id: 2, label: "Emergency Contacts", icon: AlertCircle },
  { id: 3, label: "Authorized Pickups", icon: Car },
  { id: 4, label: "Review & Submit", icon: ClipboardList },
];

const DRAFT_KEY = "reg_draft_v1";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ParentRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [child, setChild] = useState<ChildInfo>(EMPTY_CHILD);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([{ ...EMPTY_EC }, { ...EMPTY_EC }]);
  const [pickups, setPickups] = useState<AuthorizedPickup[]>([{ ...EMPTY_AP }]);
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; ageGroupMin: number; ageGroupMax: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load draft & classrooms
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.child) setChild(d.child);
        if (d.emergencyContacts) setEmergencyContacts(d.emergencyContacts);
        if (d.pickups) setPickups(d.pickups);
        if (d.step) setStep(d.step);
      } catch {}
    }
    api.get("/classrooms").then((res) => setClassrooms(res.data.data || [])).catch(() => {});
  }, []);

  // Save draft on change
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ child, emergencyContacts, pickups, step }));
  }, [child, emergencyContacts, pickups, step]);

  // ─── Validation ─────────────────────────────────────────────────────────────
  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!child.firstName.trim()) errs.firstName = "Required";
    if (!child.lastName.trim()) errs.lastName = "Required";
    if (!child.dateOfBirth) errs.dateOfBirth = "Required";
    if (!child.classroomId) errs.classroomId = "Please select a classroom";
    if (!child.startDate) errs.startDate = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    emergencyContacts.forEach((ec, i) => {
      if (!ec.firstName.trim()) errs[`ec_${i}_firstName`] = "Required";
      if (!ec.lastName.trim()) errs[`ec_${i}_lastName`] = "Required";
      if (!ec.relationship.trim()) errs[`ec_${i}_relationship`] = "Required";
      if (!ec.phone.trim()) errs[`ec_${i}_phone`] = "Required";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, 4));
  }

  function back() { setStep((s) => Math.max(s - 1, 1)); }

  // ─── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.post("/registrations", {
        ...child,
        emergencyContacts: emergencyContacts.filter((ec) => ec.firstName || ec.phone),
        authorizedPickups: pickups.filter((ap) => ap.firstName || ap.phone),
      });
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
      toast.success("Registration submitted successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Success State ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Registration Submitted!</h1>
        <p className="text-muted-foreground text-sm mb-6">
          We've received your registration request. Our team will review it and get back to you shortly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/parent/children")}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            View My Children
          </button>
          <button
            onClick={() => { setSubmitted(false); setChild(EMPTY_CHILD); setStep(1); }}
            className="px-6 py-2 border rounded-md text-sm hover:bg-muted/50"
          >
            Register Another Child
          </button>
        </div>
      </div>
    );
  }

  const classroom = classrooms.find((c) => c.id === child.classroomId);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Register a Child</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete all steps to submit your enrollment request.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={`flex items-center gap-2 ${step > s.id ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                step === s.id ? "bg-primary text-primary-foreground" :
                step > s.id ? "bg-green-600 text-white" :
                "bg-muted text-muted-foreground"
              }`}>
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={`text-xs hidden sm:block ${step === s.id ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? "bg-green-600" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Child Info */}
      {step === 1 && (
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Baby className="h-5 w-5 text-primary" /> Child Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" error={errors.firstName}>
              <input className={input(errors.firstName)} value={child.firstName} onChange={(e) => setChild((c) => ({ ...c, firstName: e.target.value }))} placeholder="First name" />
            </Field>
            <Field label="Last Name" error={errors.lastName}>
              <input className={input(errors.lastName)} value={child.lastName} onChange={(e) => setChild((c) => ({ ...c, lastName: e.target.value }))} placeholder="Last name" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of Birth" error={errors.dateOfBirth}>
              <input type="date" className={input(errors.dateOfBirth)} value={child.dateOfBirth} onChange={(e) => setChild((c) => ({ ...c, dateOfBirth: e.target.value }))} />
            </Field>
            <Field label="Gender (optional)">
              <select className={input()} value={child.gender} onChange={(e) => setChild((c) => ({ ...c, gender: e.target.value }))}>
                <option value="">Not specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
          </div>
          <Field label="Preferred Classroom" error={errors.classroomId}>
            <select className={input(errors.classroomId)} value={child.classroomId} onChange={(e) => setChild((c) => ({ ...c, classroomId: e.target.value }))}>
              <option value="">Select a classroom</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name} (Ages {c.ageGroupMin}–{c.ageGroupMax})</option>
              ))}
            </select>
          </Field>
          <Field label="Desired Start Date" error={errors.startDate}>
            <input type="date" className={input(errors.startDate)} value={child.startDate} onChange={(e) => setChild((c) => ({ ...c, startDate: e.target.value }))} />
          </Field>
          <Field label="Allergies (optional)">
            <textarea className={input()} rows={3} value={child.allergies} onChange={(e) => setChild((c) => ({ ...c, allergies: e.target.value }))} placeholder="List any food or environmental allergies..." />
          </Field>
          <Field label="Medical Notes (optional)">
            <textarea className={input()} rows={3} value={child.medicalNotes} onChange={(e) => setChild((c) => ({ ...c, medicalNotes: e.target.value }))} placeholder="Any medications, conditions, or special needs..." />
          </Field>
        </div>
      )}

      {/* Step 2: Emergency Contacts */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="font-semibold flex items-center gap-2 mb-4"><AlertCircle className="h-5 w-5 text-primary" /> Emergency Contacts</h2>
            <p className="text-sm text-muted-foreground mb-4">Please provide at least 2 emergency contacts who can be reached if we cannot contact you.</p>
            {emergencyContacts.map((ec, i) => (
              <div key={i} className="border rounded-lg p-4 mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Contact {i + 1} {i < 2 && <span className="text-red-500">*</span>}</h3>
                  {i >= 2 && (
                    <button onClick={() => setEmergencyContacts((arr) => arr.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:underline">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" error={errors[`ec_${i}_firstName`]}>
                    <input className={input(errors[`ec_${i}_firstName`])} value={ec.firstName} onChange={(e) => setEmergencyContacts((arr) => arr.map((x, j) => j === i ? { ...x, firstName: e.target.value } : x))} />
                  </Field>
                  <Field label="Last Name" error={errors[`ec_${i}_lastName`]}>
                    <input className={input(errors[`ec_${i}_lastName`])} value={ec.lastName} onChange={(e) => setEmergencyContacts((arr) => arr.map((x, j) => j === i ? { ...x, lastName: e.target.value } : x))} />
                  </Field>
                  <Field label="Relationship" error={errors[`ec_${i}_relationship`]}>
                    <input className={input(errors[`ec_${i}_relationship`])} value={ec.relationship} onChange={(e) => setEmergencyContacts((arr) => arr.map((x, j) => j === i ? { ...x, relationship: e.target.value } : x))} placeholder="e.g. Grandmother" />
                  </Field>
                  <Field label="Phone" error={errors[`ec_${i}_phone`]}>
                    <input className={input(errors[`ec_${i}_phone`])} value={ec.phone} onChange={(e) => setEmergencyContacts((arr) => arr.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))} placeholder="(555) 000-0000" />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Email (optional)">
                      <input className={input()} value={ec.email} onChange={(e) => setEmergencyContacts((arr) => arr.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setEmergencyContacts((arr) => [...arr, { ...EMPTY_EC }])} className="text-sm text-primary hover:underline mt-2">+ Add another contact</button>
          </div>
        </div>
      )}

      {/* Step 3: Authorized Pickups */}
      {step === 3 && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-2"><Car className="h-5 w-5 text-primary" /> Authorized Pickups</h2>
          <p className="text-sm text-muted-foreground mb-4">Who else is authorized to pick up your child? (Optional)</p>
          {pickups.map((ap, i) => (
            <div key={i} className="border rounded-lg p-4 mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Pickup Person {i + 1}</h3>
                {i > 0 && (
                  <button onClick={() => setPickups((arr) => arr.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:underline">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name">
                  <input className={input()} value={ap.firstName} onChange={(e) => setPickups((arr) => arr.map((x, j) => j === i ? { ...x, firstName: e.target.value } : x))} />
                </Field>
                <Field label="Last Name">
                  <input className={input()} value={ap.lastName} onChange={(e) => setPickups((arr) => arr.map((x, j) => j === i ? { ...x, lastName: e.target.value } : x))} />
                </Field>
                <Field label="Relationship">
                  <input className={input()} value={ap.relationship} onChange={(e) => setPickups((arr) => arr.map((x, j) => j === i ? { ...x, relationship: e.target.value } : x))} placeholder="e.g. Uncle" />
                </Field>
                <Field label="Phone">
                  <input className={input()} value={ap.phone} onChange={(e) => setPickups((arr) => arr.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))} />
                </Field>
              </div>
            </div>
          ))}
          <button onClick={() => setPickups((arr) => [...arr, { ...EMPTY_AP }])} className="text-sm text-primary hover:underline mt-2">+ Add another pickup person</button>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Baby className="h-4 w-4 text-primary" /> Child Information</h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-muted-foreground">Name</dt><dd className="font-medium">{child.firstName} {child.lastName}</dd></div>
              <div><dt className="text-muted-foreground">DOB</dt><dd className="font-medium">{child.dateOfBirth}</dd></div>
              <div><dt className="text-muted-foreground">Gender</dt><dd className="font-medium">{child.gender || "Not specified"}</dd></div>
              <div><dt className="text-muted-foreground">Classroom</dt><dd className="font-medium">{classroom?.name ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Start Date</dt><dd className="font-medium">{child.startDate}</dd></div>
              <div><dt className="text-muted-foreground">Allergies</dt><dd className="font-medium">{child.allergies || "None"}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Medical Notes</dt><dd className="font-medium">{child.medicalNotes || "None"}</dd></div>
            </dl>
          </div>
          <div className="bg-card border rounded-lg p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-primary" /> Emergency Contacts</h2>
            {emergencyContacts.map((ec, i) => (
              <div key={i} className="text-sm mb-2 last:mb-0">
                <span className="font-medium">{ec.firstName} {ec.lastName}</span>
                <span className="text-muted-foreground ml-2">({ec.relationship}) {ec.phone}</span>
              </div>
            ))}
          </div>
          <div className="bg-card border rounded-lg p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Car className="h-4 w-4 text-primary" /> Authorized Pickups</h2>
            {pickups.filter((ap) => ap.firstName).length === 0 ? (
              <p className="text-sm text-muted-foreground">None added.</p>
            ) : (
              pickups.filter((ap) => ap.firstName).map((ap, i) => (
                <div key={i} className="text-sm mb-2 last:mb-0">
                  <span className="font-medium">{ap.firstName} {ap.lastName}</span>
                  <span className="text-muted-foreground ml-2">({ap.relationship}) {ap.phone}</span>
                </div>
              ))
            )}
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            By submitting, you confirm all information is accurate. Our team will review your registration and contact you within 2–3 business days.
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        {step > 1 ? (
          <button onClick={back} className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted/50">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        ) : <div />}
        {step < 4 ? (
          <button onClick={next} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit Registration"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function input(error?: string) {
  return `w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring ${error ? "border-red-400" : "border-input"}`;
}
