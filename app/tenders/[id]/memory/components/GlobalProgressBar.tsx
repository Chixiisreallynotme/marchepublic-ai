"use client";

import { cn } from "@/lib/utils";

interface GlobalProgressBarProps {
  memory: any;
}

export function GlobalProgressBar({ memory }: GlobalProgressBarProps) {
  if (!memory) {
    return (
      <div className="animate-pulse">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: "0%" }} />
        </div>
      </div>
    );
  }

  const totalCriteria = memory.tender?.criteria?.length ?? 0;
  const sections = memory.sections ?? [];
  const criteriaWithSections = new Set(sections.map((s: any) => s.criterionId).filter(Boolean));
  const completedCriteria = criteriaWithSections.size;
  const progress = totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;

  const totalWords = sections.reduce((acc: number, s: any) => acc + (s.wordCount ?? 0), 0);
  const totalSections = sections.length;

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-3 min-w-[280px]">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression globale du mémoire">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              progress === 100 && "bg-emerald-500",
              progress < 100 && "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={cn("font-mono font-medium w-12 text-right", progress === 100 && "text-emerald-600")}>
          {progress}%
        </span>
      </div>

      <div className="flex items-center gap-4 text-muted-foreground">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {totalSections} section{totalSections > 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {totalWords} mots
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          {completedCriteria}/{totalCriteria} critères
        </span>
      </div>
    </div>
  );
}