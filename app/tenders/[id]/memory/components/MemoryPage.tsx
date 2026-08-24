"use client";

import { useState, useCallback, useEffect } from "react";
import { CriterionSelectorSidebar } from "./CriterionSelectorSidebar";
import { SectionEditor } from "./SectionEditor";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { CriterionProgress, GlobalProgress } from "./ProgressBar";
import { cn } from "@/lib/utils";
import type { Criterion, Section, MemoryData } from "./types";

export function MemoryPage({ initialData }: { initialData: MemoryData | null }) {
  const [memory, setMemory] = useState<MemoryData | null>(initialData);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const selectedCriterion = memory?.tender.criteria.find(c => c.id === selectedCriterionId) || null;
  const selectedSection = selectedCriterionId
    ? memory?.sections.find(s => s.criterion?.id === selectedCriterionId || s.criterionId === selectedCriterionId)
    : null;

  const totalWeight = memory?.tender.criteria.reduce((sum, c) => sum + c.weight, 0) || 0;
  const completedWeight = memory?.tender.criteria
    .filter(c => memory?.sections.some(s => (s.criterion?.id === c.id || s.criterionId === c.id) && s.content.trim().length > 0))
    .reduce((sum, c) => sum + c.weight, 0) || 0;
  const totalSections = memory?.sections.length || 0;
  const completedSections = memory?.sections.filter(s => s.content.trim().length > 0).length || 0;

  const handleSaveSection = useCallback(async (section: Section) => {
    setIsSaving(true);
    setHasUnsavedChanges(false);
    try {
      const response = await fetch("/api/memory/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(section),
      });
      if (!response.ok) throw new Error("Erreur lors de la sauvegarde");

      const savedSection = await response.json();
      setMemory(prev => prev ? {
        ...prev,
        sections: prev.sections.map(s => s.id === section.id ? savedSection : s),
      } : null);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      setHasUnsavedChanges(true);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleDeleteSection = useCallback(async (sectionId: string) => {
    try {
      const response = await fetch(`/api/memory/sections/${sectionId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");

      setMemory(prev => prev ? {
        ...prev,
        sections: prev.sections.filter(s => s.id !== sectionId),
      } : null);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  }, []);

  const handleCreateSection = useCallback(async () => {
    if (!memory || !selectedCriterionId) return;

    const newSection: Section = {
      id: `temp-${Date.now()}`,
      title: "Nouvelle section",
      content: "",
      wordCount: 0,
      criterionId: selectedCriterionId,
      order: memory.sections.filter(s => s.criterion?.id === selectedCriterionId || s.criterionId === selectedCriterionId).length,
    };

    setMemory(prev => prev ? {
      ...prev,
      sections: [...prev.sections, newSection],
    } : null);
    setSelectedCriterionId(selectedCriterionId);
  }, [memory, selectedCriterionId]);

  const handleReorderSections = useCallback(async (sections: { id: string; order: number }[]) => {
    try {
      const response = await fetch("/api/memory/sections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      if (!response.ok) throw new Error("Erreur lors de la réorganisation");
    } catch (error) {
      console.error("Erreur réorganisation:", error);
    }
  }, []);

  const getCriterionProgress = (criterion: Criterion) => {
    const sections = memory?.sections.filter(s => s.criterion?.id === criterion.id || s.criterionId === criterion.id) || [];
    const completed = sections.filter(s => s.content.trim().length > 0).length;
    return { completed, total: sections.length };
  };

  if (!memory) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center p-8">
          <svg className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold text-foreground mb-2">Aucun mémoire technique</h2>
          <p className="text-muted-foreground">Créez un mémoire technique pour cet appel d'offres pour commencer la rédaction.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 bg-background">
      <CriterionSelectorSidebar
        criteria={memory.tender.criteria}
        sections={memory.sections}
        selectedCriterionId={selectedCriterionId}
        onSelectCriterion={setSelectedCriterionId}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">{memory.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {memory.tender.title} — {memory.tender.criteria.length} critère{memory.tender.criteria.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <AutoSaveIndicator
              isSaving={isSaving}
              lastSaved={lastSaved}
              hasChanges={hasUnsavedChanges}
            />
            <select
              value={memory.status}
              onChange={(e) => {
                const newStatus = e.target.value as "DRAFT" | "IN_REVIEW" | "SUBMITTED";
                setMemory(prev => prev ? { ...prev, status: newStatus } : null);
              }}
              className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="IN_REVIEW">En révision</option>
              <option value="SUBMITTED">Soumis</option>
            </select>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {selectedCriterionId ? (
            <div className="flex-1 flex flex-col min-w-0 p-6">
              <SectionEditor
                section={selectedSection || null}
                criterionTitle={selectedCriterion?.title}
                onSave={handleSaveSection}
                onDelete={selectedSection ? handleDeleteSection : undefined}
                isSaving={isSaving}
                lastSaved={lastSaved}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <GlobalProgress
                  totalWeight={totalWeight}
                  completedWeight={completedWeight}
                  totalSections={totalSections}
                  completedSections={completedSections}
                />

                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Progression par critère
                  </h2>
                  <div className="space-y-4">
                    {memory.tender.criteria.map(criterion => {
                      const { completed, total } = getCriterionProgress(criterion);
                      return (
                        <CriterionProgress
                          key={criterion.id}
                          criterionId={criterion.id}
                          criterionTitle={criterion.title}
                          weight={criterion.weight}
                          completedSections={completed}
                          totalSections={total}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <button
                    onClick={() => setSelectedCriterionId(memory.tender.criteria[0]?.id || null)}
                    className="w-full px-6 py-3 text-base font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                  >
                    Commencer la rédaction
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}