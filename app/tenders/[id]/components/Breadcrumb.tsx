import Link from "next/link";
import { Gavel, Building2, ChevronRight } from "lucide-react";

export function Breadcrumb() {
  return (
    <nav className="mb-8" aria-label="Fil d'Ariane">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Gavel className="h-4 w-4" aria-hidden="true" />
            Accueil
          </Link>
        </li>
        <li className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link href="/tenders" className="hover:text-foreground transition-colors">
            Appels d'offres
          </Link>
        </li>
        <li className="flex items-center gap-1.5" aria-current="page">
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-foreground font-medium">Détail</span>
        </li>
      </ol>
    </nav>
  );
}