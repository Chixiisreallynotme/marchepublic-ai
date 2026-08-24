import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, Gavel, Plus } from "lucide-react";
import { getTenders } from "@/lib/actions/tenders";
import { StatsCards } from "./StatsCards";
import { TenderGrid } from "./TenderGrid";

function StatsCardsSkeleton() {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Chargement des statistiques">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-card animate-pulse">
          <div className="h-4 w-3/4 bg-muted rounded mb-4" />
          <div className="h-8 w-1/2 bg-muted rounded" />
        </div>
      ))}
    </dl>
  );
}

function TenderGridSkeleton() {
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))" }} aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-card animate-pulse">
          <div className="h-5 w-3/4 bg-muted rounded mb-2" />
          <div className="h-4 w-1/2 bg-muted rounded mb-4" />
          <div className="h-4 w-full bg-muted rounded mb-4" />
          <div className="h-8 w-full bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export async function TendersDashboard() {
  const result = await getTenders();

  if (!result.success) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">Erreur de chargement</p>
            <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="tenders-heading">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 id="tenders-heading" className="text-3xl font-extrabold tracking-tight text-foreground">
            Appels d'offres publics
          </h1>
          <p className="mt-1 text-muted-foreground">
            Centralisez et suivez chaque appel d'offres : échéances, lots, statuts et pièces du DCE
          </p>
        </div>
        <Link href="/tenders/new" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvel appel d'offres
        </Link>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards tenders={result.data} />
      </Suspense>

      <div className="mt-8">
        <h2 className="sr-only">Liste des appels d'offres</h2>
        <Suspense fallback={<TenderGridSkeleton />}>
          <TenderGrid tenders={result.data} />
        </Suspense>
      </div>
    </section>
  );
}