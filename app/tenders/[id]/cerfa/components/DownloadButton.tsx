"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { CerfaDocument } from "./CerfaPreview";

interface DownloadButtonProps {
  document: CerfaDocument;
}

export function DownloadButton({ document }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const payload = JSON.parse(document.payload);
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = globalThis.document.createElement("a");
      a.href = url;
      a.download = `${document.formNumber}-${document.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const blob = new Blob([document.payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = globalThis.document.createElement("a");
      a.href = url;
      a.download = `${document.formNumber}-${document.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="btn-secondary flex items-center gap-2"
      aria-label={`Télécharger ${document.formNumber}`}
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
        {downloading ? "Téléchargement..." : "Télécharger"}
      </span>
    </button>
  );
}