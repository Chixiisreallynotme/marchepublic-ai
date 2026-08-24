import { Building2, Calendar, Euro, Tag, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TenderWithRelations } from "@/lib/actions/tenders";

const PROCEDURE_LABELS: Record<string, string> = {
  APPEL_OFFRES_OUVERT: "Appel d'offres ouvert",
  APPEL_OFFRES_RESTREINT: "Appel d'offres restreint",
  PROCEDURE_ADAPTEE: "Procédure adaptée",
  PROCEDURE_NEGOCIEE: "Procédure négociée",
  DIALOGUE_COMPETITIF: "Dialogue compétitif",
  CONCOURS: "Concours",
};

function formatEUR(value: number | null | undefined): string {
  if (!value) return "Non défini";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "Non définie";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function MetadataGrid({
  tender,
}: {
  tender: TenderWithRelations;
}) {
  const metadata = [
    { label: "Acheteur public", value: tender.buyerName ?? "Non défini", icon: Building2 },
    { label: "Date limite de dépôt", value: formatDate(tender.deadline), icon: Calendar },
    { label: "Montant estimé", value: formatEUR(tender.estimatedValue), icon: Euro },
    { label: "Code CPV", value: tender.cpvCode ?? "Non défini", icon: Tag },
    { label: "Type de procédure", value: PROCEDURE_LABELS[tender.procedureType] ?? tender.procedureType, icon: FileText },
  ] as const;

  return (
    <div className="space-y-4" role="region" aria-label="Métadonnées de l'appel d'offres">
      <h2 className="text-lg font-bold text-foreground">Informations principales</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        {metadata.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-2 text-foreground font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {tender.description && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <dt className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Description
          </dt>
          <dd className="mt-2 text-foreground whitespace-pre-wrap">{tender.description}</dd>
        </div>
      )}
    </div>
  );
}