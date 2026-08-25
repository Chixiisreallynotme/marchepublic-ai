"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Le logger serveur capture déjà l'erreur côté action; côté client on
    // trace localement pour le support.
    console.error("[app-error]", error.message);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold sm:text-3xl">
        Une erreur inattendue est survenue
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Vos données sont en sécurité. Réessayez — si le problème persiste, rechargez la page.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/70">
          Référence : {error.digest}
        </p>
      )}
      <button type="button" onClick={reset} className="btn-primary mt-8">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Réessayer
      </button>
    </div>
  );
}
