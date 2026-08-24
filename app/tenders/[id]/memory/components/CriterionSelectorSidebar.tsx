"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Criterion {
  id: string;
  title: string;
  description?: string | null;
  weight: number;
  order: number;
}

interface Section {
  id: string;
  criterionId?: string | null;
  criterion?: {
    id: string;
  } | null;
}

interface CriterionSelectorSidebarProps {
  criteria: Criterion[];
  sections?: Section[];
  selectedCriterionId: string | null;
  onSelectCriterion: (criterionId: string | null) => void;
}

export function CriterionSelectorSidebar({
  criteria,
  sections = [],
  selectedCriterionId,
  onSelectCriterion,
}: CriterionSelectorSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getSectionCount = (criterionId: string) => {
    return sections.filter(s => s.criterion?.id === criterionId || s.criterionId === criterionId).length;
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-card border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
      aria-label="Sélecteur de critères"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className={cn("font-semibold text-foreground truncate", isCollapsed && "hidden")}>
          Critères d'évaluation
        </h2>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label={isCollapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
          aria-expanded={!isCollapsed}
        >
          <svg
            className={cn("w-5 h-5 text-muted-foreground transition-transform", isCollapsed && "rotate-180")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-2" role="listbox" aria-label="Liste des critères">
        {criteria.map((criterion) => {
          const isSelected = selectedCriterionId === criterion.id;
          const sectionCount = getSectionCount(criterion.id);
          const hasSections = sectionCount > 0;

          return (
            <button
              key={criterion.id}
              onClick={() => onSelectCriterion(criterion.id)}
              role="option"
              aria-selected={isSelected}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-all duration-200 relative group",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-accent text-foreground",
                hasSections && "border-l-2 border-emerald-500"
              )}
            >
              {!isCollapsed && (
                <>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{criterion.title}</h3>
                    {hasSections && (
                      <span
                        className={cn(
                          "flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full",
                          isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        )}
                      >
                        {sectionCount} section{sectionCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{criterion.weight}%</span>
                    <span className="w-full h-1 bg-muted rounded-full overflow-hidden" aria-hidden="true">
                      <span
                        className="block h-full bg-primary/50 transition-all duration-300"
                        style={{ width: `${criterion.weight}%` }}
                      />
                    </span>
                  </div>
                  {criterion.description && (
                    <p className="mt-1 text-xs line-clamp-2 text-muted-foreground/70">
                      {criterion.description}
                    </p>
                  )}
                </>
              )}
              {isCollapsed && (
                <span className="sr-only">{criterion.title} - {criterion.weight}%</span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => onSelectCriterion(null)}
          role="option"
          aria-selected={selectedCriterionId === null}
          className={cn(
            "w-full text-left p-3 rounded-lg transition-all duration-200 border-2 border-dashed",
            selectedCriterionId === null
              ? "bg-primary/10 border-primary text-primary"
              : "hover:bg-accent border-border"
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Vue globale</span>
            </div>
          )}
        </button>
      </nav>
    </aside>
  );
}