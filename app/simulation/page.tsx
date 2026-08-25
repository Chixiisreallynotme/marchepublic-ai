import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getTenderById } from "@/lib/actions/tenders";
import { getMemoryByTenderId } from "@/lib/actions/memories";
import { computeSimulation } from "@/lib/simulation";
import { SimulationView } from "./SimulationView";

export const metadata = { title: "Simulation" };

export default async function SimulationPage({
  searchParams,
}: {
  searchParams: Promise<{ tenderId?: string }>;
}) {
  const { tenderId } = await searchParams;

  if (!tenderId) {
    return <TenderPicker />;
  }

  const tenderResult = await getTenderById(tenderId);
  if (!tenderResult.success) notFound();

  const memoryResult = await getMemoryByTenderId(tenderId);
  const memory = memoryResult.success ? memoryResult.data : null;

  const simulation = memory
    ? computeSimulation({
        id: memory.id,
        title: memory.title,
        tenderId: memory.tenderId,
        tenderTitle: memory.tender.title,
        sections: memory.sections.map((s) => ({
          content: s.content,
          criterionId: s.criterion?.id ?? s.criterionId ?? null,
        })),
        tender: {
          criteria: memory.tender.criteria.map((c) => ({
            id: c.id,
            title: c.title,
            weight: c.weight,
          })),
        },
      })
    : null;

  return (
    <SimulationView
      simulation={simulation}
      tenderId={tenderId}
      tenderTitle={tenderResult.data.title}
    />
  );
}

async function TenderPicker() {
  const { getTenders } = await import("@/lib/actions/tenders");
  const result = await getTenders();
  const tenders = result.success ? result.data : [];

  return (
    <div className="container-page py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          <Sparkles className="h-8 w-8 text-brand-500" aria-hidden="true" />
          Simulation de score
        </h1>
        <p className="mt-2 text-muted-foreground">
          Estimez votre score pondéré avant l&apos;envoi, critère par critère.
        </p>
      </header>

      {tenders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-lg font-semibold">Aucun appel d&apos;offres</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez un appel d&apos;offres puis un mémoire technique pour lancer une simulation.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tenders.map((tender) => (
            <li key={tender.id}>
              <a
                href={`/simulation?tenderId=${tender.id}`}
                className="block rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-glow"
              >
                <p className="line-clamp-2 font-semibold">{tender.title}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{tender.reference}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {tender._count.criteria} critères
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
