"use client";

import { cn } from "@/lib/utils";

interface CriterionProgressProps {
  criterionId: string;
  criterionTitle: string;
  weight: number;
  completedSections: number;
  totalSections: number;
}

export function CriterionProgress({
  criterionId,
  criterionTitle,
  weight,
  completedSections,
  totalSections,
}: CriterionProgressProps) {
  const progress = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  const isComplete = progress === 100;

  return (
    <div className="bg-card border rounded-lg p-4 transition-all duration-200" data-criterion-id={criterionId}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center font-medium text-sm",
            isComplete ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
          )}>
            {isComplete ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="font-mono">{weight}%</span>
            )}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{criterionTitle}</h3>
            <p className="text-sm text-muted-foreground">
              {completedSections}/{totalSections} sections
            </p>
          </div>
        </div>
        <span className={cn("font-mono text-sm", isComplete ? "text-emerald-600" : "text-muted-foreground")}>
          {progress}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progression du critère ${criterionTitle}`}>
        <div
          className={cn(
            "h-full transition-all duration-500 rounded-full",
            isComplete ? "bg-emerald-500" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

interface GlobalProgressProps {
  totalWeight: number;
  completedWeight: number;
  totalSections: number;
  completedSections: number;
}

export function GlobalProgress({
  totalWeight,
  completedWeight,
  totalSections,
  completedSections,
}: GlobalProgressProps) {
  const weightProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  const isComplete = weightProgress === 100;

  return (
    <div className="bg-card border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Progression globale</h2>
        <span className={cn("text-2xl font-bold font-mono", isComplete ? "text-emerald-600" : "text-primary")}>
          {weightProgress}%
        </span>
      </div>

      <div className="h-3 bg-muted rounded-full overflow-hidden mb-6" role="progressbar" aria-valuenow={weightProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression globale du mémoire">
        <div
          className={cn(
            "h-full transition-all duration-700 rounded-full",
            isComplete ? "bg-emerald-500" : "bg-primary"
          )}
          style={{ width: `${weightProgress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-2xl font-bold font-mono text-foreground">{completedSections}/{totalSections}</div>
          <div className="text-sm text-muted-foreground">Sections complétées</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-2xl font-bold font-mono text-foreground">{completedWeight}/{totalWeight}%</div>
          <div className="text-sm text-muted-foreground">Poids complété</div>
        </div>
      </div>
    </div>
  );
}