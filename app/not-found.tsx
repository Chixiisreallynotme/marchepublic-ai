import Link from "next/link";
import { Compass, FileSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-8xl font-bold tracking-tight text-gradient">404</p>
      <h1 className="mt-4 flex items-center gap-3 font-display text-2xl font-bold sm:text-3xl">
        <Compass className="h-7 w-7 text-brand-500" aria-hidden="true" />
        Cette page n&apos;existe pas
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Le lien est peut-être erroné, ou le dossier recherché a été supprimé.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          Retour à l&apos;accueil
        </Link>
        <Link href="/tenders" className="btn-secondary">
          <FileSearch className="h-4 w-4" aria-hidden="true" />
          Voir les appels d&apos;offres
        </Link>
      </div>
    </div>
  );
}
