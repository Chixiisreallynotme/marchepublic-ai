import Link from "next/link";
import { FileCheck2, FileText } from "lucide-react";
import { listAllCerfaDocuments } from "@/lib/actions/cerfa";

export const metadata = { title: "Documents CERFA" };

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function CerfaHubPage() {
  const result = await listAllCerfaDocuments();
  const documents = result.success ? result.data : [];

  const byTender = new Map<string, typeof documents>();
  for (const doc of documents) {
    const key = doc.memory.tenderId;
    if (!byTender.has(key)) byTender.set(key, []);
    byTender.get(key)!.push(doc);
  }

  return (
    <div className="container-page py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          <FileCheck2 className="h-8 w-8 text-brand-500" aria-hidden="true" />
          Documents CERFA
        </h1>
        <p className="mt-2 text-muted-foreground">
          Vue d&apos;ensemble de vos formulaires administratifs générés, classés par appel d&apos;offres.
        </p>
      </header>

      {byTender.size === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-lg font-semibold">Aucun document généré</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Ouvrez un appel d&apos;offres et générez vos DC1 / DC2 pré-remplis depuis l&apos;onglet CERFA.
          </p>
          <Link href="/tenders" className="btn-primary mt-6">
            Voir les appels d&apos;offres
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {[...byTender.entries()].map(([tenderId, docs]) => (
            <section key={tenderId} aria-label={`Documents pour ${tenderId}`}>
              <div className="mb-3 flex items-center justify-between">
                <Link
                  href={`/tenders/${tenderId}/cerfa`}
                  className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
                >
                  Gérer ce dossier →
                </Link>
                <span className="text-xs text-muted-foreground">
                  {docs.length} document{docs.length > 1 ? "s" : ""}
                </span>
              </div>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
                {docs.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={`/api/cerfa/${doc.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
                        <FileText className="h-5 w-5 text-brand-600" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{doc.label ?? doc.formNumber}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDate(doc.createdAt)} · PDF
                        </span>
                      </span>
                      <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                        {doc.formNumber}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
