import Link from "next/link";
import { FileText } from "lucide-react";
import { listMemories } from "@/lib/actions/memories";

export const metadata = { title: "Mémoires Techniques" };

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  IN_REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  SUBMITTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  IN_REVIEW: "En révision",
  SUBMITTED: "Soumis",
};

export default async function MemoriesPage() {
  const result = await listMemories();
  const memories = result.success ? result.data : [];

  return (
    <div className="container-page py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          <FileText className="h-8 w-8 text-brand-500" aria-hidden="true" />
          Mémoires Techniques
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tous vos mémoires en cours, avec leur avancement pondéré par critère.
        </p>
      </header>

      {memories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-lg font-semibold">Aucun mémoire technique</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Ouvrez un appel d&apos;offres pour démarrer la rédaction critère par critère.
          </p>
          <Link href="/tenders" className="btn-primary mt-6">
            Voir les appels d&apos;offres
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {memories.map((memory) => (
            <li key={memory.id}>
              <Link
                href={`/tenders/${memory.tenderId}/memory`}
                className="group block rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-glow"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold leading-snug group-hover:text-brand-700">{memory.title}</h2>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[memory.status] ?? STATUS_STYLES.DRAFT}`}>
                    {STATUS_LABELS[memory.status] ?? memory.status}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{memory.tenderTitle}</p>

                <div className="mt-4" role="progressbar" aria-valuenow={memory.totalWeightedProgress} aria-valuemin={0} aria-valuemax={100} aria-label={`Avancement ${memory.totalWeightedProgress}%`}>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{memory.sectionsDone}/{memory.criteriaCount} sections</span>
                    <span className="font-semibold text-foreground">{memory.totalWeightedProgress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all"
                      style={{ width: `${Math.min(100, memory.totalWeightedProgress)}%` }}
                    />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
