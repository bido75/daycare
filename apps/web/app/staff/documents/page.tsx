"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { FolderOpen, Download, Search } from "lucide-react";

interface Document {
  id: string;
  type: string;
  name: string;
  uploadedAt: string;
  expiresAt: string | null;
  verified: boolean;
  mimeType: string | null;
  sizeBytes: number | null;
  student: { id: string; firstName: string; lastName: string };
}

const DOC_TYPE_LABELS: Record<string, string> = {
  BIRTH_CERT: "Birth Certificate",
  IMMUNIZATION: "Immunization",
  MEDICAL: "Medical",
  ID_CARD: "ID Card",
  ENROLLMENT_FORM: "Enrollment Form",
  OTHER: "Other",
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StaffDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [students, setStudents] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [classroomName, setClassroomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [filterVerified, setFilterVerified] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadClassroom();
  }, []);

  useEffect(() => {
    if (classroomId) loadDocuments();
  }, [classroomId, filterType, filterStudent, filterVerified]);

  async function loadClassroom() {
    try {
      const clsRes = await api.get("/classrooms");
      const classrooms = clsRes.data.data || [];
      if (classrooms.length > 0) {
        const c = classrooms[0];
        setClassroomId(c.id);
        setClassroomName(c.name);

        const stuRes = await api.get(`/classrooms/${c.id}/students`);
        setStudents(stuRes.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments() {
    if (!classroomId) return;
    setLoading(true);
    try {
      const params: any = { classroomId, limit: 100 };
      if (filterType) params.type = filterType;
      if (filterStudent) params.studentId = filterStudent;
      if (filterVerified !== "") params.verified = filterVerified === "true";

      const res = await api.get("/documents", { params });
      setDocuments(res.data.data || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(docId: string, name: string) {
    setDownloadingId(docId);
    try {
      const res = await api.get(`/documents/${docId}`);
      const url = res.data.downloadUrl;
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.target = "_blank";
        a.click();
      }
    } catch {
      // ignore
    } finally {
      setDownloadingId(null);
    }
  }

  const filtered = documents.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.student.firstName.toLowerCase().includes(q) ||
      d.student.lastName.toLowerCase().includes(q)
    );
  });

  if (!classroomId && !loading) {
    return (
      <div className="text-center py-20">
        <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No classroom assigned.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {classroomName ? `${classroomName} · ` : ""}Student documents (view & download only)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="pl-9 pr-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-48"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
        >
          <option value="">All Students</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
          ))}
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background"
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="true">Verified</option>
          <option value="false">Pending</option>
        </select>
        {(search || filterType || filterStudent || filterVerified) && (
          <button
            onClick={() => { setSearch(""); setFilterType(""); setFilterStudent(""); setFilterVerified(""); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-lg p-16 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">No Documents Found</h2>
          <p className="text-muted-foreground text-sm">
            {documents.length === 0
              ? "No documents have been uploaded for students in your classroom yet."
              : "No documents match the current filters."}
          </p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b text-xs text-muted-foreground font-medium">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Document</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Uploaded</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {doc.student.firstName} {doc.student.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{doc.name}</div>
                    {doc.sizeBytes && (
                      <div className="text-xs text-muted-foreground">{formatBytes(doc.sizeBytes)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                    {doc.expiresAt && (
                      <div className="text-xs text-orange-500">
                        Expires {new Date(doc.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        doc.verified
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {doc.verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDownload(doc.id, doc.name)}
                      disabled={downloadingId === doc.id}
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {downloadingId === doc.id ? "..." : "Download"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
