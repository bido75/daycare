"use client";
import { FolderOpen } from "lucide-react";
export default function ParentDocumentsPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold">Documents</h1><p className="text-sm text-muted-foreground mt-1">Upload and view your child's documents.</p></div>
      <div className="bg-card border rounded-lg p-16 text-center"><FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h2 className="font-semibold text-lg mb-2">Coming in Sprint 7</h2><p className="text-muted-foreground text-sm">Immunization records, emergency forms, and other documents will be managed here.</p></div>
    </div>
  );
}
