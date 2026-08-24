import { FileText, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CriterionCard } from "./CriterionCard";

function getTotalWeight(criteria: Array<{ weight: number }>): number {
  return criteria.reduce((sum, c) => sum + (c.weight ?? 0), 0);
}

export function CriteriaSection({
  criteria,
}: {
  criteria: Array<{ id: string; title: string; description?: string | null; weight: number; order: number; sections?: Array<{ id: string }> }>;
}) {
  const totalWeight = getTotalWeight(criteria);

  if (!criteria || criteria.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-card p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-foreground">Aucun critère défini</h3>
        <p className="mt-2 text-muted-foreground">
          Ajoutez des critères d'évaluation pour structurer votre mémoire technique.
        </p>
        <Link
          href={`/tenders/${criteria[0]?.id ?? ""}/criteria/new`}
          className="btn-primary mt-4 inline-flex"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Ajouter un critère
        </Link>
      </div>
    );
  }

  return (
    <section aria-labelledby="criteria-heading">
      <div className="flex items-center justify-between mb-6">
        <h2 id="criteria-heading" className="text-lg font-bold text-foreground">
          Critères d'évaluation
        </h2>
        <div className="flex items-center gap-2 text-sm font-medium text-brand-600">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          <span>Total: {totalWeight}%</span>
          {totalWeight !== 100 && (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              totalWeight > 100
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            )}>
              {totalWeight > 100 ? "Dépasse 100%" : "Incomplet"}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4" role="list" aria-label="Liste des critères d'évaluation">
        {criteria.map((criterion) => (
          <CriterionCard key={criterion.id} criterion={criterion} totalWeight={totalWeight} />
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4">
        <h3 className="font-medium text-foreground">Répartition des poids</h3>
        <div className="mt-3 h-3 w-full rounded-full bg-muted overflow-hidden" role="img" aria-label={`Répartition visuelle des poids totalisant ${totalWeight}%`}>
          {criteria.map((criterion, index) => {
            const percentage = totalWeight > 0 ? (criterion.weight / totalWeight) * 100 : 0;
            const hue = (index * 137.5) % 360;
            return (
              <div
                key={criterion.id}
                className="h-full float-left transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: `hsl(${hue}, 65%, 50%)`,
                }}
                title={`${criterion.title}: ${percentage.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {criteria.map((criterion) => (
            <span key={criterion.id} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded" style={{ backgroundColor: `hsl(${((criteria.indexOf(criterion) * 137.5) % 360)}, 65%, 50%)` }} />
              {criterion.title}: {((criterion.weight / totalWeight) * 100).toFixed(1)}%
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}