"use client";

import { cn } from "@/lib/utils";

interface CompletionProgressBarProps {
  memory: any;
}

export function CompletionProgressBar({ memory }: CompletionProgressBarProps) {
  const totalCriteria = memory?.tender?.criteria?.length ?? 0;
  const sections = memory?.sections ?? [];
  const completedCriteria = new Set(sections.map((s: any) => s.criterionId).filter(Boolean)).size;
  const progress = totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;

  return (
    <div className="flex items-center gap-3 min-w-[200px]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression par critère">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-sm font-mono text-muted-foreground w-16 text-right">
        {progress}%
      </span>
    </div>
  );
}