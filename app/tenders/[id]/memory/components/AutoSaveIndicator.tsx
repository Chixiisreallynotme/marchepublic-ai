"use client";

import { cn } from "@/lib/utils";

interface Section {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  criterionId: string | null;
  order: number;
}

interface MemoryData {
  id: string;
  title: string;
  status: "DRAFT" | "IN_REVIEW" | "SUBMITTED";
  summary?: string | null;
  updatedAt: string;
  tender: {
    id: string;
    title: string;
    reference: string;
    criteria: {
      id: string;
      title: string;
      description?: string | null;
      weight: number;
      order: number;
      sections: { id: string }[];
    }[];
  };
  sections: Section[];
}

interface AutoSaveIndicatorProps {
  memory: MemoryData | null;
}

export function AutoSaveIndicator({ memory }: AutoSaveIndicatorProps) {
  if (!memory) {
    return (
      <div className="animate-pulse flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted" />
        <span className="w-24 h-4 bg-muted rounded" />
      </div>
    );
  }

  const isDirty = memory.sections?.some((s) => s.content && s.content.trim().length > 0) ?? false;
  const lastSaved = memory.updatedAt ? new Date(memory.updatedAt) : null;

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            isDirty ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
          )}
          aria-label={isDirty ? "Modifications non sauvegardées" : "Tout est sauvegardé"}
        />
        <span>{isDirty ? "Modifications en cours..." : "Tout est sauvegardé"}</span>
      </div>

      {lastSaved && (
        <span className="hidden sm:inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <time dateTime={lastSaved.toISOString()}>
            {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </time>
        </span>
      )}

      <div className="flex-1" />

      <button
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        aria-label="Sauvegarder manuellement"
      >
        Sauvegarder
      </button>
    </div>
  );
}