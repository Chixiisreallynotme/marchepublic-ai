"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { createOrUpdateMemorySection } from "@/lib/actions/memories";

interface Section {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  criterionId: string | null;
  order: number;
}

interface Criterion {
  id: string;
  title: string;
  description?: string | null;
  weight: number;
  order: number;
  sections: { id: string }[];
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
    criteria: Criterion[];
  };
  sections: Section[];
}

interface SectionEditorProps {
  memory: MemoryData | null;
}

function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).length;
}

export function SectionEditor({ memory }: SectionEditorProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (memory?.sections) {
      setSections(memory.sections);
    }
  }, [memory]);

  const criteria = memory?.tender?.criteria ?? [];
  const selectedCriterion = criteria.find((c) => c.id === selectedCriterionId);
  const criterionSections = selectedCriterionId
    ? sections.filter((s) => s.criterionId === selectedCriterionId)
    : sections.filter((s) => s.criterionId === null);

  const displaySections = selectedCriterionId ? criterionSections : sections.filter((s) => s.criterionId === null);
  const sectionTitle = selectedCriterionId ? `Sections — ${selectedCriterion?.title}` : "Sections globales";
  const emptyMessage = selectedCriterionId ? "Aucune section pour ce critère" : "Aucune section globale";

  const handleWordCountChange = useCallback((sectionId: string, content: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, content, wordCount: countWords(content) } : s
      )
    );
  }, []);

  const handleAutoSave = useCallback(async (section: Section) => {
    if (!memory) return;
    setIsSaving(true);
    try {
      await createOrUpdateMemorySection({
        id: section.id,
        memoryId: memory.id,
        title: section.title,
        content: section.content,
        criterionId: section.criterionId,
        order: section.order,
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [memory]);

  useEffect(() => {
    if (sections.length > 0) {
      const timer = setTimeout(() => {
        sections.forEach(handleAutoSave);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [sections, handleAutoSave]);

  const handleCreateSection = useCallback(async () => {
    if (!memory) return;
    const newSection = {
      memoryId: memory.id,
      title: "Nouvelle section",
      content: "",
      criterionId: selectedCriterionId,
      order: sections.length,
    };
    const result = await createOrUpdateMemorySection(newSection);
    if (result.success) {
      setSections((prev) => [...prev, { ...result.data, wordCount: 0 }]);
    }
  }, [memory, selectedCriterionId, sections.length]);

  const handleDeleteSection = useCallback(async (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  const handleReorder = useCallback(async (newSections: Section[]) => {
    setSections(newSections);
    await createOrUpdateMemorySection({
      sections: newSections.map((s) => ({ id: s.id, order: s.order })),
    } as any);
  }, []);

  if (!memory) {
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{sectionTitle}</h2>
          <button
            onClick={handleCreateSection}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            + Ajouter une section
          </button>
        </div>
      </div>

      {displaySections.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m4 0h4m-4 4h4" />
          </svg>
          <p className="text-lg font-medium">{emptyMessage}</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter une section" pour commencer</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {displaySections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              onContentChange={handleWordCountChange}
              onDelete={handleDeleteSection}
              allSections={displaySections}
              onReorder={handleReorder}
            />
          ))}
        </div>
      )}

      <div id="section-footer" className="p-4 border-t border-border bg-card/50 flex items-center justify-between text-sm text-muted-foreground" data-testid="section-footer">
        <span>{displaySections.length} section{displaySections.length > 1 ? "s" : ""}</span>
        <span>Total: {displaySections.reduce((acc, s) => acc + s.wordCount, 0)} mots</span>
      </div>
    </div>
  );
}

interface SectionCardProps {
  section: Section;
  index: number;
  onContentChange: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  allSections: Section[];
  onReorder: (sections: Section[]) => void;
}

function SectionCard({
  section,
  index,
  onContentChange,
  onDelete,
  allSections,
  onReorder,
}: SectionCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [content, setContent] = useState(section.content);

  const moveUp = () => {
    if (index > 0) {
      const newSections = [...allSections];
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      newSections.forEach((s, i) => (s.order = i));
      onReorder(newSections);
    }
  };

  const moveDown = () => {
    if (index < allSections.length - 1) {
      const newSections = [...allSections];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      newSections.forEach((s, i) => (s.order = i));
      onReorder(newSections);
    }
  };

  return (
    <article className="bg-card border rounded-xl p-4 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 text-muted-foreground/50 hover:text-muted-foreground mt-1">
          <button onClick={(e) => { e.stopPropagation(); moveUp(); }} disabled={index === 0} className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Monter la section">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <span className="font-mono text-xs text-muted-foreground">{index + 1}</span>
          <button onClick={(e) => { e.stopPropagation(); moveDown(); }} disabled={index === allSections.length - 1} className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Descendre la section">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>

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
              <h3 onDoubleClick={() => setIsEditingTitle(true)} className="flex-1 text-lg font-semibold text-foreground cursor-text hover:underline">{section.title}</h3>
            )}
            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-mono text-muted-foreground bg-muted rounded">
              {section.wordCount} mots
            </span>
            <button onClick={(e) => { e.stopPropagation(); onDelete(section.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" aria-label="Supprimer la section">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              onContentChange(section.id, e.target.value);
            }}
            placeholder="Rédigez votre contenu ici... Markdown supporté."
            className="w-full min-h-[120px] p-3 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans text-sm leading-relaxed"
            rows={6}
            aria-label={`Contenu de la section ${section.title}`}
            spellCheck={true}
          />
        </div>
      </div>
    </article>
  );
}