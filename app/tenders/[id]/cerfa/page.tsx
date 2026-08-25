import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTenderById } from "@/lib/actions/tenders";
import { getMemoryByTenderId } from "@/lib/actions/memories";
import { getCerfaDocuments } from "@/lib/actions/cerfa";
import { CerfaGenerator } from "./components/CerfaGenerator";
import { SireneEnricher } from "./components/SireneEnricher";
import { CerfaPreview } from "./components/CerfaPreview";
import type { CerfaDocumentWithRelations } from "@/lib/actions/cerfa";

async function getCerfaData(tenderId: string): Promise<CerfaDocumentWithRelations[]> {
  const result = await getCerfaDocuments(tenderId);
  if (result.success) {
    return result.data;
  }
  return [];
}

function PageSkeleton() {
  return (
    <div className="container-page py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted rounded mb-2" />
        <div className="h-10 w-3/4 bg-muted rounded" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <div className="h-80 bg-muted rounded-xl" />
          <div className="h-80 bg-muted rounded-xl" />
        </div>
        <div className="lg:col-span-2">
          <div className="h-80 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}

async function CerfaContent({ tenderId, memoryId, documents }: { tenderId: string; memoryId: string; documents: CerfaDocumentWithRelations[] }) {
  return (
    <div className="container-page py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Documents CERFA
        </h1>
        <p className="mt-1 text-muted-foreground">
          Générez et gérez vos formulaires administratifs CERFA pour cet appel d'offres.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <CerfaGenerator tenderId={tenderId} memoryId={memoryId} />
          <SireneEnricher />
        </div>
        <div className="lg:col-span-2">
          <CerfaPreview documents={documents} />
        </div>
      </div>
    </div>
  );
}

export default async function CerfaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const tenderResult = await getTenderById(id);
  if (!tenderResult.success) {
    notFound();
  }
  
  const tender = tenderResult.data;
  const memoryResult = await getMemoryByTenderId(id);
  const memoryId = memoryResult.success && memoryResult.data ? memoryResult.data.id : "";
  
  const documents = await getCerfaData(id);

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CerfaContent tenderId={id} memoryId={memoryId} documents={documents} />
    </Suspense>
  );
}