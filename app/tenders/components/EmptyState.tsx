import Link from "next/link";
import { Gavel, Plus } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-6">
        <Gavel className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-foreground">Aucun appel d'offres</h3>
      <p className="mt-2 text-muted-foreground max-w-sm">
        Commencez par créer votre premier dossier pour suivre vos appels d'offres,
        gérer les critères et rédiger vos mémoires techniques.
      </p>
      <Link href="/tenders/new" className="btn-primary mt-6">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Créer votre premier dossier
      </Link>
    </div>
  );
}