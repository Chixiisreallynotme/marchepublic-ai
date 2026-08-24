"use client";

import { useState } from "react";
import { FileText, Download, ExternalLink } from "lucide-react";

export interface CerfaDocument {
  id: string;
  formNumber: string;
  label: string | null;
  payload: string;
  fileUrl: string | null;
  createdAt: Date | string;
  memoryId: string;
}

interface CerfaPreviewProps {
  documents: CerfaDocument[];
}

export function CerfaPreview({ documents }: CerfaPreviewProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-foreground mb-2">Aucun document CERFA</h3>
        <p className="text-muted-foreground">
          Générez votre premier document CERFA à l'aide du générateur ci-dessus.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border px-6 py-4 bg-muted/50">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5" aria-hidden="true" />
          Documents CERFA générés ({documents.length})
        </h3>
      </div>
      <div className="divide-y divide-border">
        {documents.map((doc) => (
          <CerfaDocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </div>
  );
}

function CerfaDocumentCard({ document }: { document: CerfaDocument }) {
  const createdAt = new Date(document.createdAt);
  const formattedDate = createdAt.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-6 hover:bg-muted/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-foreground truncate">
              {document.label || document.formNumber}
            </h4>
            <p className="text-sm text-muted-foreground font-mono">
              {document.formNumber} — {formattedDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DownloadButton document={document} />
          {document.fileUrl && (
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
              aria-label="Ouvrir le document"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Ouvrir</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface DownloadButtonProps {
  document: CerfaDocument;
}

function DownloadButton({ document }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      window.open(`/api/cerfa/${document.id}/pdf`, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <a
      href={`/api/cerfa/${document.id}/pdf`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => setDownloading(true)}
      className="btn-secondary flex items-center gap-2"
      aria-label={`Télécharger ${document.formNumber} en PDF`}
    >
      {downloading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <Download className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">
        {downloading ? "Ouverture…" : "PDF"}
      </span>
    </a>
  );
}