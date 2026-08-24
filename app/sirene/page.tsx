import { Building2 } from "lucide-react";
import { listCachedSireneCompanies } from "@/lib/actions/sirene";
import { SireneEnricher } from "@/app/tenders/[id]/cerfa/components/SireneEnricher";

export const metadata = { title: "Open Data Sirene" };

export default async function SirenePage() {
  const result = await listCachedSireneCompanies(12);
  const companies = result.success ? result.data : [];

  return (
    <div className="container-page py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          <Building2 className="h-8 w-8 text-brand-500" aria-hidden="true" />
          Open Data Sirene
        </h1>
        <p className="mt-2 text-muted-foreground">
          Interrogez le registre officiel des entreprises (recherche-entreprises.api.gouv.fr)
          et enrichissez vos candidatures avec des données factuelles.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SireneEnricher />
        </div>

        <section className="lg:col-span-3" aria-labelledby="cached-heading">
          <h2 id="cached-heading" className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recherches récentes
          </h2>
          {companies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
              <p className="font-medium">Aucune entreprise en cache</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Lancez votre première recherche par SIREN pour peupler l&apos;historique local.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {companies.map((c) => (
                <li key={c.siren} className="rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-glow">
                  <p className="truncate font-semibold">{c.denomination}</p>
                  <p className="font-mono text-xs text-muted-foreground">{c.siren}</p>
                  <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {c.activityCode && <div>Activité : <span className="text-foreground">{c.activityCode}</span></div>}
                    {(c.address || c.city) && (
                      <div className="truncate">
                        {[c.address, c.postalCode, c.city].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
