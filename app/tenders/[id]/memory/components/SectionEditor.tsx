"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Section } from "./types";

interface SectionEditorProps {
  section: Section | null;
  criterionTitle?: string;
  onSave: (section: Section) => Promise<boolean>;
  onDelete?: (sectionId: string) => Promise<void>;
}

function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).length;
}

const AUTOSAVE_DELAY_MS = 1500;

export function SectionEditor({
  section,
  criterionTitle,
  onSave,
  onDelete,
}: SectionEditorProps) {
  const [title, setTitle] = useState(section?.title || "");
  const [content, setContent] = useState(section?.content || "");
  const [wordCount, setWordCount] = useState(section?.wordCount || 0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title, content, wordCount });

  useEffect(() => {
    setTitle(section?.title || "");
    setContent(section?.content || "");
    setWordCount(section?.wordCount || 0);
    setHasChanges(false);
    setSaveError(null);
    setLastSaved(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, [section?.id, section?.criterionId]);

  useEffect(() => {
    latest.current = { title, content, wordCount };
  }, [title, content, wordCount]);

  const persist = useCallback(async () => {
    if (!section) return false;
    setIsSaving(true);
    setSaveError(null);
    const ok = await onSave({
      ...section,
      title: latest.current.title,
      content: latest.current.content,
      wordCount: latest.current.wordCount,
    });
    setIsSaving(false);
    if (ok) {
      setHasChanges(false);
      setLastSaved(new Date());
    } else {
      setSaveError("Échec de la sauvegarde — réessayez.");
      setHasChanges(true);
    }
    return ok;
  }, [section, onSave]);

  const scheduleAutosave = useCallback(() => {
    setHasChanges(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void persist(), AUTOSAVE_DELAY_MS);
  }, [persist]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (hasChanges || isSaving) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasChanges, isSaving]);

  // Clear any pending autosave only on unmount — never on state flips,
  // otherwise the pending timer would be cancelled by its own effect.
  useEffect(() => {
    const timerRef = saveTimer;
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      setWordCount(countWords(newContent));
      scheduleAutosave();
    },
    [scheduleAutosave]
  );

  const handleDelete = useCallback(async () => {
    if (!section || !onDelete) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await onDelete(section.id);
  }, [section, onDelete]);

  if (!section) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <svg className="w-16 h-16 text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 110 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a2 2 0 11-4 0v-1a1 1 0 00-1-1H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
        <h3 className="text-lg font-medium text-foreground mb-1">Sélectionnez un critère pour commencer</h3>
        <p className="text-muted-foreground">Les sections sont automatiquement liées aux critères d'évaluation.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {criterionTitle ? `Section — ${criterionTitle}` : "Section"}
          </h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span aria-live="polite" role="status">
              {isSaving
                ? "Sauvegarde…"
                : saveError
                ? saveError
                : hasChanges
                ? "Modifications non enregistrées"
                : lastSaved
                ? `Enregistré à ${lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </span>
            <button
              type="button"
              onClick={() => void persist()}
              disabled={isSaving || (!hasChanges && !lastSaved && content.length === 0)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              Enregistrer
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Supprimer la section"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <article className="bg-card border rounded-xl p-4 transition-all duration-200">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => { if (e.key === "Enter") setIsEditingTitle(false); }}
                    className="flex-1 px-2 py-1 text-lg font-semibold bg-transparent border-b border-primary focus:outline-none"
                    aria-label="Titre de la section"
                  />
                ) : (
                  <h3 onDoubleClick={() => setIsEditingTitle(true)} className="flex-1 text-lg font-semibold text-foreground cursor-text hover:underline">{title}</h3>
                )}
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-mono text-muted-foreground bg-muted rounded">
                  {wordCount} mots
                </span>
              </div>

              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onBlur={() => { if (hasChanges) void persist(); }}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                    e.preventDefault();
                    void persist();
                  }
                }}
                placeholder="Rédigez votre contenu ici... Sauvegarde automatique toutes les 1,5 s, Ctrl+S ou bouton Enregistrer."
                className="w-full min-h-[320px] p-3 bg-background border border-border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans text-sm leading-relaxed"
                rows={10}
                aria-label={`Contenu de la section ${title}`}
                spellCheck={true}
              />
            </div>
          </div>
        </article>
      </div>

      <div id="section-footer" className="p-4 border-t border-border bg-card/50 flex items-center justify-between text-sm text-muted-foreground" data-testid="section-footer">
        <span>Dernière sauvegarde: {lastSaved ? lastSaved.toLocaleTimeString() : "Jamais"}</span>
        <span>{isSaving ? "Sauvegarde en cours..." : `Total: ${wordCount} mots`}</span>
      </div>
    </div>
  );
}
