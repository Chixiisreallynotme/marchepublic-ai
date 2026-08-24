import Link from "next/link";
import { Sparkles, TriangleAlert } from "lucide-react";
import type { SimulationResult } from "@/lib/simulation";
import { AiReviewPanel } from "./AiReviewPanel";

export function SimulationView({
  simulation,
  tenderId,
  tenderTitle,
}: {
  simulation: SimulationResult | null;
  tenderId: string;
  tenderTitle: string;
}) {
  if (!simulation) {
    return (
      <div className="container-page py-10">
        <Link href="/simulation" className="text-sm text-muted-foreground hover:text-brand-600">
          ← Changer d&apos;appel d&apos;offres
        </Link>
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <TriangleAlert className="mx-auto mb-4 h-12 w-12 text-amber-400" aria-hidden="true" />
          <p className="text-lg font-semibold">Pas encore de mémoire technique</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            La simulation pondérée nécessite un mémoire technique lié aux critères de «&nbsp;{tenderTitle}&nbsp;».
          </p>
          <Link href={`/tenders/${tenderId}/memory`} className="btn-primary mt-6">
            Créer le mémoire technique
          </Link>
        </div>
      </div>
    );
  }

  const score = simulation.score100;
  const scoreTone =
    score >= 80 ? "text-emerald-600" : score >= 50 ? "text-brand-600" : "text-red-500";

  return (
    <div className="container-page py-10">
      <Link href="/simulation" className="text-sm text-muted-foreground hover:text-brand-600">
        ← Changer d&apos;appel d&apos;offres
      </Link>

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            <Sparkles className="h-8 w-8 text-brand-500" aria-hidden="true" />
            Simulation
          </h1>
          <p className="mt-2 truncate text-muted-foreground">{simulation.memoryTitle}</p>
        </div>

        <div className="flex items-center gap-6 rounded-2xl border border-border bg-card px-6 py-4 shadow-card">
          <div className="text-center">
            <p className={`font-display text-4xl font-bold ${scoreTone}`}>{score}</p>
            <p className="text-xs text-muted-foreground">score /100</p>
          </div>
          <div className="h-10 w-px bg-border" aria-hidden="true" />
          <div className="text-center">
            <p className="font-display text-2xl font-bold">{simulation.score20}</p>
            <p className="text-xs text-muted-foreground">note /20</p>
          </div>
        </div>
      </header>

      <section aria-labelledby="criteria-breakdown" className="mb-8">
        <h2 id="criteria-breakdown" className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Décomposition pondérée par critère
        </h2>
        <ul className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          {simulation.criteria.map((criterion) => (
            <li key={criterion.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
                <span className="font-medium">
                  {criterion.title}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (pondération {Math.round(criterion.weight)}%)
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {criterion.sectionsDone}/{criterion.sectionsTotal || 0} sections ·{" "}
                  <span className="font-semibold text-foreground">
                    +{Math.round(criterion.weightedPoints * 10) / 10} pts
                  </span>
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={Math.round(criterion.completion * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${criterion.title} : ${Math.round(criterion.completion * 100)}% complété`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500"
                  style={{ width: `${Math.round(criterion.completion * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <AiReviewPanel memoryId={simulation.memoryId} />
    </div>
  );
}
