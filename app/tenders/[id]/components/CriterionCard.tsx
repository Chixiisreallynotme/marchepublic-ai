import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function CriterionCard({
  criterion,
  totalWeight,
}: {
  criterion: { id: string; title: string; description?: string | null; weight: number; order: number; sections?: Array<{ id: string }> };
  totalWeight: number;
}) {
  const percentage = totalWeight > 0 ? Math.round((criterion.weight / totalWeight) * 100) : 0;
  const hasSections = criterion.sections && criterion.sections.length > 0;
  const sectionCount = criterion.sections?.length ?? 0;

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground">{criterion.title}</h4>
          {criterion.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{criterion.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl font-bold text-brand-600">{percentage}%</div>
          <div className="text-xs text-muted-foreground">Poids</div>
        </div>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Poids du critère: ${percentage}%`}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Ordre: {criterion.order}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            hasSections
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          )}
        >
          {hasSections ? (
            <>
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Mémoire: {sectionCount} section{sectionCount > 1 ? "s" : ""} rédigée{sectionCount > 1 ? "es" : ""}
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" aria-hidden="true" />
              Mémoire: Non commencé
            </>
          )}
        </span>
      </div>
    </article>
  );
}