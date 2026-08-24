"use client";

import { useState } from "react";
import { Search, Building2, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export interface SireneCompany {
  siren: string;
  nic?: string;
  denomination: string;
  legalForm?: string;
  activityCode?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  fetchedAt?: Date | string;
}

interface SireneEnricherProps {
  onCompanySelect?: (company: SireneCompany) => void;
  initialSiren?: string;
}

export function SireneEnricher({ onCompanySelect, initialSiren }: SireneEnricherProps) {
  const [siren, setSiren] = useState(initialSiren ?? "");
  const [company, setCompany] = useState<SireneCompany | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateSiren = (value: string): boolean => {
    return /^\d{9}$/.test(value.replace(/\s/g, ""));
  };

  const handleSearch = async () => {
    const cleanSiren = siren.replace(/\s/g, "");
    if (!validateSiren(cleanSiren)) {
      setError("Le SIREN doit contenir exactement 9 chiffres.");
      return;
    }

    setLoading(true);
    setError(null);
    setCompany(null);

    try {
      const response = await fetch(`/api/sirene/${cleanSiren}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Entreprise introuvable");
      }

      setCompany(data);
      onCompanySelect?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSiren(e.target.value.replace(/\D/g, "").slice(0, 9));
    setError(null);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Building2 className="h-5 w-5" aria-hidden="true" />
        Enrichissement Sirene
      </h3>

      <div className="mb-4">
        <label htmlFor="siren-input" className="block text-sm font-medium text-foreground mb-2">
          SIREN de l'entreprise
        </label>
        <div className="flex gap-2">
          <input
            id="siren-input"
            type="text"
            value={siren}
            onChange={handleInputChange}
            placeholder="123 456 789"
            className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            maxLength={11}
            disabled={loading}
            aria-describedby={error ? "siren-error" : company ? "siren-success" : undefined}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !validateSiren(siren.replace(/\s/g, ""))}
            className="btn-primary flex items-center gap-2 px-4 py-2"
            aria-label="Rechercher l'entreprise"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Rechercher</span>
          </button>
        </div>
        {error && (
          <p id="siren-error" className="mt-2 text-sm text-destructive flex items-center gap-1" role="alert">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>

      {company && (
        <div
          id="siren-success"
          className="rounded-lg border border-green-200 bg-green-50 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-800">{company.denomination}</h4>
              <p className="text-sm text-green-700 font-mono">{company.siren}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-green-700">
                {company.legalForm && (
                  <div>
                    <span className="font-medium">Forme juridique : </span>
                    {company.legalForm}
                  </div>
                )}
                {company.activityCode && (
                  <div>
                    <span className="font-medium">Code APE : </span>
                    {company.activityCode}
                  </div>
                )}
                {company.address && (
                  <div className="col-span-2">
                    <span className="font-medium">Adresse : </span>
                    {company.address}
                    {company.postalCode && ` ${company.postalCode}`}
                    {company.city && ` ${company.city}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}