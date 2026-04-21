"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import {
  FileText, Upload, CheckCircle, XCircle, Download, Trash2,
  AlertTriangle, Search, X, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Student { id: string; firstName: string; lastName: string; }
interface Document {
  id: string;
  name: string;
  type: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt: string;
  expiresAt?: string;
  verified: boolean;
  student: { id: string; firstName: string; lastName: string };
}

const DOC_TYPES = [
  { value: "BIRTH_CERT", label: "Birth Certificate" },
  { value: "IMMUNIZATION", label: "Immunization Record" },
  { value: "MEDICAL", label: "Medical Form" },
  { value: "ID_CARD", label: "ID Card" },
  { value: "ENROLLMENT_FORM", label: "Enrollment Form" },
  { value: "OTHER", label: "Other" },
];

const typeLabel = (t: string) => DOC_TYPES.find((d) => d.value === t)?.label ?? t;

function Badge({ verified, expired }: { verified: boolean; expired: boolean }) {
  if (expired) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Expired</span>;
  if (verified) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Verified</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Unverified</span>;
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expiring, setExpiring] = useState<Document[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterVerified, setFilterVerified] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const [upStudentId, setUpStudentId] = useState("");
  const [upType, setUpType] = useState("OTHER");
  const [upName, setUpName] = useState("");
  const [upExpiry, setUpExpiry] = useState("");
  const [upFile, setUpFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (filterType) params.type = filterType;
      if (filterVerified !== "") params.verified = filterVerified;
      if (filterStudent) params.studentId = filterStudent;
      const [docsRes, expRes, studRes] = await Promise.all([
        api.get("/documents", { params }),
        api.get("/documents/expiring", { params: { days: "30" } }),
        api.get("/students", { params: { limit: "200" } }),
      ]);
      setDocuments(docsRes.data?.data ?? []);
      setExpiring(expRes.data ?? []);
      setStudents(studRes.data?.data ?? []);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterVerified, filterStudent]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upFile || !upStudentId) { toast.error("Student and file are required"); return; }
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
      fetchDocuments();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (id: string, verified: boolean) => {
    setVerifying(id);
    try {
      await api.patch(`/documents/${id}/verify`, { verified });
      toast.success(verified ? "Document verified" : "Document unverified");
      setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, verified } : d));
    } catch {
      toast.error("Failed to update verification");
    } finally {
      setVerifying(null);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await api.get(`/documents/${id}`);
      const url = res.data?.downloadUrl;
      if (url) window.open(url, "_blank");
    } catch { toast.error("Failed to get download link"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/documents/${id}`);
      toast.success("Document deleted");
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeleting(null);
    }
  };

  const isExpired = (doc: Document) => !!doc.expiresAt && new Date(doc.expiresAt) < new Date();

  const filtered = documents.filter((d) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return d.name.toLowerCase().includes(q) || `${d.student.firstName} ${d.student.lastName}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 text-sm mt-1">Manage student and facility documents</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {expiring.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {expiring.length} document{expiring.length > 1 ? "s" : ""} expiring within 30 days
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {expiring.slice(0, 3).map((d) => `${d.student.firstName} ${d.student.lastName} — ${d.name}`).join(" · ")}
              {expiring.length > 3 && ` · and ${expiring.length - 3} more`}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search by name or student..." value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">All Types</option>
          {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterVerified} onChange={(e) => setFilterVerified(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">All Status</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
        <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">All Students</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
        </select>
        {(filterType || filterVerified || filterStudent || searchQ) && (
          <button onClick={() => { setFilterType(""); setFilterVerified(""); setFilterStudent(""); setSearchQ(""); }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No documents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Upload Date</th>
                  <th className="px-5 py-3">Expiry</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const expired = isExpired(doc);
                  return (
                    <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{doc.student.firstName} {doc.student.lastName}</td>
                      <td className="px-5 py-3 text-gray-700">{doc.name}</td>
                      <td className="px-5 py-3 text-gray-500">{typeLabel(doc.type)}</td>
                      <td className="px-5 py-3 text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        {doc.expiresAt
                          ? <span className={expired ? "text-red-600 font-medium" : "text-gray-500"}>{new Date(doc.expiresAt).toLocaleDateString()}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3"><Badge verified={doc.verified} expired={expired} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleDownload(doc.id)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleVerify(doc.id, !doc.verified)} disabled={verifying === doc.id}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title={doc.verified ? "Unverify" : "Verify"}>
                            {verifying === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : doc.verified ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            {deleting === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select value={upStudentId} onChange={(e) => setUpStudentId(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  <option value="">Select student...</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                <select value={upType} onChange={(e) => setUpType(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
