import Link from "next/link";
import {
  Gavel,
  Building2,
  Calendar,
  Euro,
  Tag,
  FileText,
  TrendingUp,
  Edit3,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  XCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TenderWithRelations } from "@/lib/actions/tenders";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  IN_PROGRESS: "En cours",
  CLOSED: "Clôturé",
  AWARDED: "Attribué",
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  DRAFT: { icon: Clock, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
  PUBLISHED: { icon: AlertTriangle, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  IN_PROGRESS: { icon: Edit3, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  CLOSED: { icon: XCircle, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
  AWARDED: { icon: Award, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
};

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

function getTotalWeight(criteria: Array<{ weight: number }>): number {
  return criteria.reduce((sum, c) => sum + (c.weight ?? 0), 0);
}

export function Breadcrumb() {
  return (
    <nav className="mb-8" aria-label="Fil d'Ariane">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Gavel className="h-4 w-4" aria-hidden="true" />
            Accueil
          </Link>
        </li>
        <li className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link href="/tenders" className="hover:text-foreground transition-colors">
            Appels d'offres
          </Link>
        </li>
        <li className="flex items-center gap-1.5" aria-current="page">
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-foreground font-medium">Détail</span>
        </li>
      </ol>
    </nav>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const label = STATUS_LABELS[status] ?? status;
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium", config.bg, config.color)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
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

export function CriterionCard({
  criterion,
  totalWeight,
}: {
  criterion: { id: string; title: string; description?: string | null; weight: number; order: number; sections?: Array<{ id: string }> };
  totalWeight: number;
}) {
  const percentage = totalWeight > 0 ? Math.round((criterion.weight / totalWeight) * 100) : 0;
  const hasSections = criterion.sections && criterion.sections.length > 0;
  const sectionCount = criterion.sections?.length ?? 0;

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground">{criterion.title}</h4>
          {criterion.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{criterion.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl font-bold text-brand-600">{percentage}%</div>
          <div className="text-xs text-muted-foreground">Poids</div>
        </div>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Poids du critère: ${percentage}%`}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Ordre: {criterion.order}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            hasSections
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          )}
        >
          {hasSections ? (
            <>
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Mémoire: {sectionCount} section{sectionCount > 1 ? "s" : ""} rédigée{sectionCount > 1 ? "es" : ""}
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" aria-hidden="true" />
              Mémoire: Non commencé
            </>
          )}
        </span>
      </div>
    </article>
  );
}

export function CriteriaSection({
  criteria,
}: {
  criteria: Array<{ id: string; title: string; description?: string | null; weight: number; order: number; sections?: Array<{ id: string }> }>;
}) {
  const totalWeight = getTotalWeight(criteria);

  if (!criteria || criteria.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-card p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-foreground">Aucun critère défini</h3>
        <p className="mt-2 text-muted-foreground">
          Ajoutez des critères d'évaluation pour structurer votre mémoire technique.
        </p>
        <Link
          href={`/tenders/${criteria[0]?.id ?? ""}/criteria/new`}
          className="btn-primary mt-4 inline-flex"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Ajouter un critère
        </Link>
      </div>
    );
  }

  return (
    <section aria-labelledby="criteria-heading">
      <div className="flex items-center justify-between mb-6">
        <h2 id="criteria-heading" className="text-lg font-bold text-foreground">
          Critères d'évaluation
        </h2>
        <div className="flex items-center gap-2 text-sm font-medium text-brand-600">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          <span>Total: {totalWeight}%</span>
          {totalWeight !== 100 && (
            <span className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              totalWeight > 100
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            )}>
              {totalWeight > 100 ? "Dépasse 100%" : "Incomplet"}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4" role="list" aria-label="Liste des critères d'évaluation">
        {criteria.map((criterion) => (
          <CriterionCard key={criterion.id} criterion={criterion} totalWeight={totalWeight} />
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4">
        <h3 className="font-medium text-foreground">Répartition des poids</h3>
        <div className="mt-3 h-3 w-full rounded-full bg-muted overflow-hidden" role="img" aria-label={`Répartition visuelle des poids totalisant ${totalWeight}%`}>
          {criteria.map((criterion, index) => {
            const percentage = totalWeight > 0 ? (criterion.weight / totalWeight) * 100 : 0;
            const hue = (index * 137.5) % 360;
            return (
              <div
                key={criterion.id}
                className="h-full float-left transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: `hsl(${hue}, 65%, 50%)`,
                }}
                title={`${criterion.title}: ${percentage.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {criteria.map((criterion) => (
            <span key={criterion.id} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded" style={{ backgroundColor: `hsl(${((criteria.indexOf(criterion) * 137.5) % 360)}, 65%, 50%)` }} />
              {criterion.title}: {((criterion.weight / totalWeight) * 100).toFixed(1)}%
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

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