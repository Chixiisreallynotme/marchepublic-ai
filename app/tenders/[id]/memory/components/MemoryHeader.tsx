"use client";

import { cn } from "@/lib/utils";

interface MemoryHeaderProps {
  memory: any;
}

export function MemoryHeader({ memory }: MemoryHeaderProps) {
  const tender = memory?.tender;

  if (!tender) {
    return (
      <header className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-foreground">Mémoire technique</h1>
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-muted text-muted-foreground">
            DRAFT
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="p-4 border-b border-border bg-card/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{tender.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tender.reference}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <CompletionProgressBar memory={memory} />
          <span
            className={cn(
              "px-3 py-1 text-sm font-medium rounded-full",
              memory?.status === "DRAFT" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              memory?.status === "IN_REVIEW" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
              memory?.status === "SUBMITTED" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            )}
          >
            {memory?.status === "DRAFT" && "Brouillon"}
            {memory?.status === "IN_REVIEW" && "En révision"}
            {memory?.status === "SUBMITTED" && "Soumis"}
          </span>
        </div>
      </div>
    </header>
  );
}

function CompletionProgressBar({ memory }: { memory: any }) {
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