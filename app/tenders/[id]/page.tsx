import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenderById, getTenders } from "@/lib/actions/tenders";
import type { TenderWithCounts } from "@/lib/actions/tenders";
import { Breadcrumb } from "./components/Breadcrumb";
import { StatusBadge } from "./components/StatusBadge";
import { MetadataGrid } from "./components/MetadataGrid";
import { CriteriaSection } from "./components/CriteriaSection";
import { ActionButtons } from "./components/ActionButtons";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getTenderById(id);
  return { title: result.success ? result.data.title : "Appel d'offres" };
}

async function TenderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTenderById(id);

  if (!result.success) {
    notFound();
  }

  const tender = result.data;

  return (
    <div className="container-page py-8">
      <Breadcrumb />

      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={tender.status} />
              <span className="text-sm font-mono text-muted-foreground">{tender.reference}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {tender.title}
            </h1>
            {tender.buyerName && (
              <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                <span className="h-4 w-4" aria-hidden="true" />
                {tender.buyerName}
              </p>
            )}
          </div>
          <ActionButtons tenderId={tender.id} />
        </div>

        {tender.description && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-foreground whitespace-pre-wrap">{tender.description}</p>
          </div>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <MetadataGrid tender={tender} />
        </div>
        <div className="lg:col-span-2">
          <CriteriaSection tenderId={tender.id} criteria={tender.criteria} />
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const result = await getTenders();
  if (!result.success) return [];
  return result.data.map((tender: TenderWithCounts) => ({
    id: tender.id,
  }));
}

export default function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <TenderDetail params={params} />;
}