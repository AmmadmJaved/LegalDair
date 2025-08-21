import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Document, Case } from "@shared/schema";
import { useAuth } from "react-oidc-context";

export function Documents() {
  const auth = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    async function fetchCases() {
    const token = auth.user?.id_token; // or access_token depending on your config
    const res = await fetch("/api/cases", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  }
  const { data: cases = [] } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
    queryFn: () => fetchCases(),
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/cases", selectedCaseId, "documents"],
    enabled: !!selectedCaseId,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'fas fa-file-pdf text-red-500';
    if (mimeType.includes('image')) return 'fas fa-file-image text-blue-500';
    return 'fas fa-file text-slate-500';
  };

  return (
    <div className="px-4 py-4">
      {/* Case Selection */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-slate-700 mb-3">Select Case</h2>
        <div className="grid grid-cols-1 gap-2">
          {cases.map(caseItem => (
            <Button
              key={caseItem.id}
              variant={selectedCaseId === caseItem.id ? "default" : "outline"}
              className="justify-start text-left h-auto p-3"
              onClick={() => setSelectedCaseId(caseItem.id)}
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{caseItem.title}</p>
                <p className="text-xs opacity-70">{caseItem.court}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      {selectedCaseId && (
        <div>
          <h2 className="text-sm font-medium text-slate-700 mb-3">Documents</h2>
          <div className="space-y-3">
            {documents.length > 0 ? (
              documents.map(document => (
                <div key={document.id} className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start space-x-3">
                    <i className={`${getFileIcon(document.mimeType)} text-xl`}></i>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {document.originalName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatFileSize(document.size)} • {new Date(document.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-slate-400 hover:text-primary-600">
                        <i className="fas fa-download"></i>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <i className="far fa-folder-open text-4xl text-slate-300 mb-4"></i>
                <h3 className="text-lg font-medium text-slate-600 mb-2">No documents</h3>
                <p className="text-slate-500">Documents will appear here when uploaded</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedCaseId && (
        <div className="text-center py-12">
          <i className="far fa-folder text-4xl text-slate-300 mb-4"></i>
          <h3 className="text-lg font-medium text-slate-600 mb-2">Select a case</h3>
          <p className="text-slate-500">Choose a case to view its documents</p>
        </div>
      )}
    </div>
  );
}
