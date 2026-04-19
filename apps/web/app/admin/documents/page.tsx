"use client";

import { FileText } from "lucide-react";

export default function AdminDocumentsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage student and facility documents.</p>
      </div>
      <div className="bg-card border rounded-lg p-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-semibold text-lg mb-2">Coming in Sprint 7</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Document management will support uploading, storing, and verifying student-related documents.
        </p>
      </div>
    </div>
  );
}
