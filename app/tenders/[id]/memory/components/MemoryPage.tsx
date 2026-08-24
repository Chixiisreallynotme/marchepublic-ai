"use client";

import { useState, useCallback } from "react";
import { CriterionSelectorSidebar } from "./CriterionSelectorSidebar";
import { SectionEditor } from "./SectionEditor";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { CriterionProgress, GlobalProgress } from "./ProgressBar";
import { updateMemoryStatus } from "@/lib/actions/memories";
import type { Criterion, Section, MemoryData } from "./types";

function isDraftId(id: string): boolean {
  return id.startsWith("draft-") || id.startsWith("temp-");
}

export function MemoryPage({ initialData }: { initialData: MemoryData | null }) {
  const [memory, setMemory] = useState<MemoryData | null>(initialData);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | null>(null);

  const selectedCriterion =
    memory?.tender.criteria.find((c) => c.id === selectedCriterionId) || null;

  // A real persisted section when one exists for the criterion, otherwise a
  // local draft so the editor can create content on first save.
  const existingSection =
    selectedCriterionId
      ? memory?.sections.find(
          (s) =>
            (s.criterion?.id === selectedCriterionId ||
              s.criterionId === selectedCriterionId)
        ) ?? null
      : null;

  const selectedSection: Section | null = selectedCriterionId
    ? existingSection ?? {
        id: `draft-${selectedCriterionId}`,
        title: selectedCriterion?.title ?? "Nouvelle section",
        content: "",
        wordCount: 0,
        criterionId: selectedCriterionId,
        order: memory?.sections.length ?? 0,
      }
    : null;

  const totalWeight =
    memory?.tender.criteria.reduce((sum, c) => sum + c.weight, 0) || 0;
  const completedWeight =
    memory?.tender.criteria
      .filter((c) =>
        memory?.sections.some(
          (s) =>
            (s.criterion?.id === c.id || s.criterionId === c.id) &&
            s.content.trim().length > 0
        )
      )
      .reduce((sum, c) => sum + c.weight, 0) || 0;
  const totalSections = memory?.sections.length || 0;
  const completedSections =
    memory?.sections.filter((s) => s.content.trim().length > 0).length || 0;

  const handleSaveSection = useCallback(
    async (section: Section): Promise<boolean> => {
      if (!memory) return false;
      const payload = {
        memoryId: memory.id,
        criterionId: section.criterionId ?? null,
        title: section.title,
        content: section.content,
        order: section.order,
        ...(isDraftId(section.id) ? {} : { id: section.id }),
      };

      try {
        const response = await fetch("/api/memory/sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          console.error("Erreur sauvegarde:", body.error ?? response.status);
          return false;
        }

        const savedSection = (await response.json()) as Section & {
          criterion?: Criterion | null;
        };
        setMemory((prev) => {
          if (!prev) return prev;
          const withoutDraft = prev.sections.filter(
            (s) => s.id !== section.id
          );
          const exists = withoutDraft.some((s) => s.id === savedSection.id);
          return {
            ...prev,
            sections: exists
              ? withoutDraft.map((s) =>
                  s.id === savedSection.id ? { ...savedSection } : s
                )
              : [...withoutDraft, { ...savedSection }],
          };
        });
        return true;
      } catch (error) {
        console.error("Erreur sauvegarde:", error);
        return false;
      }
    },
    [memory]
  );

  const handleDeleteSection = useCallback(async (sectionId: string) => {
    if (isDraftId(sectionId)) {
      // Local draft: nothing persisted, just clear the editor selection.
      setMemory((prev) => (prev ? { ...prev } : prev));
      return;
    }
    try {
      const response = await fetch(`/api/memory/sections/${sectionId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.error("Erreur suppression:", body.error ?? response.status);
        return;
      }
      setMemory((prev) =>
        prev ? { ...prev, sections: prev.sections.filter((s) => s.id !== sectionId) } : prev
      );
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  }, []);

  const handleStatusChange = useCallback(
    async (newStatus: "DRAFT" | "IN_REVIEW" | "SUBMITTED") => {
      if (!memory) return;
      const previous = memory.status;
      setMemory((prev) => (prev ? { ...prev, status: newStatus } : prev));
      const result = await updateMemoryStatus(memory.id, newStatus);
      if (!result.success) {
        console.error("Erreur changement de statut:", result.error);
        setMemory((prev) => (prev ? { ...prev, status: previous } : prev));
      }
    },
    [memory]
  );

  const getCriterionProgress = (criterion: Criterion) => {
    const sections =
      memory?.sections.filter(
        (s) => s.criterion?.id === criterion.id || s.criterionId === criterion.id
      ) || [];
    const completed = sections.filter((s) => s.content.trim().length > 0).length;
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
            <AutoSaveIndicator isSaving={false} lastSaved={null} hasChanges={false} />
            <select
              value={memory.status}
              onChange={(e) => {
                const newStatus = e.target.value as "DRAFT" | "IN_REVIEW" | "SUBMITTED";
                void handleStatusChange(newStatus);
              }}
              aria-label="Statut du mémoire technique"
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
                section={selectedSection}
                criterionTitle={selectedCriterion?.title}
                onSave={handleSaveSection}
                onDelete={
                  existingSection ? handleDeleteSection : undefined
                }
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
                    {memory.tender.criteria.map((criterion) => {
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
