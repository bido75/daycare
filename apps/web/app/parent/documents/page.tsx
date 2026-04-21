"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import {
  FolderOpen, Upload, Download, CheckCircle, XCircle,
  AlertTriangle, Loader2, X, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  expiresAt?: string;
  verified: boolean;
  student: { id: string; firstName: string; lastName: string };
}

interface DocRequirement {
  type: string;
  label: string;
  required: boolean;
  expiryRequired: boolean;
}

const FALLBACK_TYPES = [
  { value: "BIRTH_CERT", label: "Birth Certificate" },
  { value: "IMMUNIZATION", label: "Immunization Record" },
  { value: "MEDICAL", label: "Medical Form" },
  { value: "ID_CARD", label: "ID Card" },
  { value: "ENROLLMENT_FORM", label: "Enrollment Form" },
  { value: "OTHER", label: "Other" },
];

const typeLabel = (t: string, reqs: DocRequirement[]) =>
  reqs.find((r) => r.type === t)?.label ?? FALLBACK_TYPES.find((f) => f.value === t)?.label ?? t;

function Badge({ verified, expired }: { verified: boolean; expired: boolean }) {
  if (expired) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Expired</span>;
  if (verified) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Verified</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Unverified</span>;
}

export default function ParentDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [children, setChildren] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [requirements, setRequirements] = useState<DocRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [upStudentId, setUpStudentId] = useState("");
  const [upType, setUpType] = useState("OTHER");
  const [upName, setUpName] = useState("");
  const [upExpiry, setUpExpiry] = useState("");
  const [upFile, setUpFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, childrenRes, reqRes] = await Promise.all([
        api.get("/documents", { params: { limit: "100" } }),
        api.get("/parents/me/students"),
        api.get("/settings/public/document_requirements"),
      ]);
      setDocuments(docsRes.data?.data ?? []);
      setChildren(childrenRes.data ?? []);
      const reqs: DocRequirement[] = reqRes.data?.data?.requiredDocuments ?? [];
      setRequirements(reqs.length ? reqs : []);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upFile || !upStudentId) { toast.error("Select a child and a file"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", upFile);
      fd.append("studentId", upStudentId);
      fd.append("type", upType);
      if (upName) fd.append("name", upName);
      if (upExpiry) fd.append("expiresAt", upExpiry);
      await api.post("/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Document uploaded");
      setShowUpload(false);
      setUpFile(null); setUpStudentId(""); setUpName(""); setUpExpiry(""); setUpType("OTHER");
      if (fileRef.current) fileRef.current.value = "";
      fetchData();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await api.get(`/documents/${id}`);
      const url = res.data?.downloadUrl;
      if (url) window.open(url, "_blank");
    } catch { toast.error("Failed to get download link"); }
  };

  const isExpired = (doc: Document) => !!doc.expiresAt && new Date(doc.expiresAt) < new Date();

  const expiring = documents.filter((d) => {
    if (!d.expiresAt) return false;
    const exp = new Date(d.expiresAt);
    const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return exp >= new Date() && exp <= soon;
  });

  // Build per-child requirement checklist
  const requiredTypes = requirements.filter((r) => r.required);

  const childChecklist = children.map((child) => {
    const childDocs = documents.filter((d) => d.student.id === child.id);
    const missing = requiredTypes.filter((req) => {
      const uploaded = childDocs.find((d) => d.type === req.type);
      return !uploaded || isExpired(uploaded);
    });
    return { child, missing };
  }).filter((c) => c.missing.length > 0);

  // Upload type options: combine requirements + fallbacks, dedup
  const uploadTypes = [
    ...requirements.map((r) => ({ value: r.type, label: r.label })),
    ...FALLBACK_TYPES.filter((f) => !requirements.find((r) => r.type === f.value)),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 text-sm mt-1">Upload and manage your child&apos;s documents</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {expiring.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-medium">{expiring.length} document{expiring.length > 1 ? "s" : ""}</span> expiring within 30 days — please renew them soon.
          </p>
        </div>
      )}

      {/* Required documents checklist */}
      {childChecklist.length > 0 && (
        <div className="bg-white border border-orange-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-orange-700">
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm font-semibold">Missing Required Documents</span>
          </div>
          {childChecklist.map(({ child, missing }) => (
            <div key={child.id} className="pl-2">
              <p className="text-sm font-medium text-gray-800 mb-1">{child.firstName} {child.lastName}</p>
              <div className="flex flex-wrap gap-2">
                {missing.map((req) => (
                  <span key={req.type}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-100">
                    <XCircle className="w-3 h-3" /> {req.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All requirements overview (if loaded) */}
      {requiredTypes.length > 0 && childChecklist.length === 0 && children.length > 0 && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-800 font-medium">All required documents are uploaded and current.</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-16 text-center">
            <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No documents yet</p>
            <p className="text-gray-400 text-sm mt-1">Upload your child&apos;s documents to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3">Child</th>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Upload Date</th>
                  <th className="px-5 py-3">Expiry</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Download</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const expired = isExpired(doc);
                  return (
                    <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{doc.student.firstName} {doc.student.lastName}</td>
                      <td className="px-5 py-3 text-gray-700">{doc.name}</td>
                      <td className="px-5 py-3 text-gray-500">{typeLabel(doc.type, requirements)}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        {doc.expiresAt
                          ? <span className={expired ? "text-red-600 font-medium" : "text-gray-500"}>{new Date(doc.expiresAt).toLocaleDateString()}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3"><Badge verified={doc.verified} expired={expired} /></td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleDownload(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Child *</label>
                <select value={upStudentId} onChange={(e) => setUpStudentId(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="">Select child...</option>
                  {children.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                <select value={upType} onChange={(e) => setUpType(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {uploadTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Name</label>
                <input type="text" value={upName} onChange={(e) => setUpName(e.target.value)}
                  placeholder="Optional — defaults to file name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="date" value={upExpiry} onChange={(e) => setUpExpiry(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <input ref={fileRef} type="file" onChange={(e) => setUpFile(e.target.files?.[0] ?? null)} required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUpload(false)}
                  className="flex-1 border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={uploading}
                  className="flex-1 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
