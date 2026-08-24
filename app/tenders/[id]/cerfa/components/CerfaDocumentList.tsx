"use client";

import { use, Suspense } from "react";
import { FileText, Download, Eye, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CerfaDocumentListProps {
  documentsPromise: Promise<Array<{
    id: string;
    formNumber: string;
    label: string | null;
    createdAt: Date;
    payload: string;
  }>>;
}

export function CerfaDocumentList({ documentsPromise }: CerfaDocumentListProps) {
  const documents = use(documentsPromise);

  if (!documents || documents.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" aria-hidden="true" />
        <h3 className="text-lg font-medium text-foreground">Aucun document CERFA</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Générez votre premier document DC1, DC2, DC4 ou NOTI2
        </p>
      </div>
    );
  }

  const handleDownload = async (doc: { id: string; formNumber: string; payload: string }) => {
    try {
      const blob = new Blob([doc.payload], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.formNumber}-${doc.id}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Erreur de téléchargement:", err);
    }
  };

  const handlePreview = (doc: { id: string; formNumber: string; payload: string }) => {
    const event = new CustomEvent("cerfa:preview", { detail: doc });
    window.dispatchEvent(event);
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;
    try {
      const response = await fetch(`/api/cerfa/${docId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Erreur de suppression");
      window.location.reload();
    } catch (err) {
      console.error("Erreur de suppression:", err);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" aria-hidden="true" />
        Documents générés ({documents.length})
      </h2>
      <div className="space-y-3">
        {documents.map(doc => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-foreground">{doc.label || doc.formNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.formNumber} • {format(new Date(doc.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePreview(doc)}
                className="btn-ghost btn-sm"
                aria-label={`Aperçu ${doc.formNumber}`}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => handleDownload(doc)}
                className="btn-ghost btn-sm"
                aria-label={`Télécharger ${doc.formNumber}`}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => handleDelete(doc.id)}
                className="btn-ghost btn-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label={`Supprimer ${doc.formNumber}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="h-6 w-1/4 bg-muted rounded mb-4" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded" />
        ))}
      </div>
    </div>
  );
}