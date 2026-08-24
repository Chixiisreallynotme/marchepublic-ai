import Link from "next/link";
import { Edit3, FileCheck2, ExternalLink } from "lucide-react";

export function ActionButtons({ tenderId }: { tenderId: string }) {
  return (
    <div className="flex flex-wrap gap-3" role="group" aria-label="Actions principales">
      <Link
        href={`/tenders/${tenderId}/memory`}
        className="btn-primary"
      >
        <Edit3 className="h-4 w-4" aria-hidden="true" />
        Rédiger le Mémoire Technique
      </Link>
      <Link
        href={`/cerfa?tenderId=${tenderId}`}
        className="btn-secondary"
      >
        <FileCheck2 className="h-4 w-4" aria-hidden="true" />
        Générer CERFA DC1/DC2
      </Link>
      <Link
        href="/sirene"
        className="btn-secondary"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Voir fiche Sirene
      </Link>
    </div>
  );
}