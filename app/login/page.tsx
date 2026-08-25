import { KeyRound, LogIn } from "lucide-react";

export const metadata = {
  title: "Connexion",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-50 p-8 shadow-card dark:bg-surface-950">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
          <KeyRound className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold">Session locale</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Saisis le token d&apos;accès défini dans ton fichier{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env</code>{" "}
          (<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">ACCESS_TOKEN</code>).
        </p>
        {params.error && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            Token invalide. Réessaie.
          </p>
        )}
        <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={params.next ?? "/"} />
          <div>
            <label htmlFor="token" className="mb-1.5 block text-sm font-medium">
              Token d&apos;accès
            </label>
            <input
              id="token"
              name="token"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button type="submit" className="btn-primary w-full justify-center">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Entrer
          </button>
        </form>
      </div>
    </div>
  );
}
