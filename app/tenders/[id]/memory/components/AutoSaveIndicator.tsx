"use client";

import { cn } from "@/lib/utils";

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasChanges: boolean;
}

export function AutoSaveIndicator({ isSaving, lastSaved, hasChanges }: AutoSaveIndicatorProps) {
  if (!lastSaved && !isSaving && !hasChanges) {
    return (
      <div data-testid="autosave-skeleton" className="animate-pulse flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted" />
        <span className="w-24 h-4 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            isSaving ? "bg-blue-500 animate-pulse" : hasChanges ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
          )}
          aria-hidden="true"
        />
        <span>{isSaving ? "Sauvegarde en cours..." : hasChanges ? "Modifications en cours..." : "Tout est sauvegardé"}</span>
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
    </div>
  );
}