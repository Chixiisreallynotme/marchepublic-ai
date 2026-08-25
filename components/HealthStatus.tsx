"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type CheckState = "ok" | "degraded" | "down";

const LABELS: Record<keyof Checks, string> = {
  database: "Base de données",
  sireneRegistry: "Registre Sirene",
  cerfaPdf: "Génération CERFA",
};

interface Checks {
  database: CheckState;
  sireneRegistry: CheckState;
  cerfaPdf: CheckState;
}

const TONES: Record<CheckState, { dot: string; ping: string; label: string }> = {
  ok: { dot: "bg-emerald-500", ping: "animate-ping", label: "Opérationnel" },
  degraded: { dot: "bg-amber-500", ping: "animate-pulse", label: "Dégradé" },
  down: { dot: "bg-red-500", ping: "", label: "Indisponible" },
};

export function HealthStatus() {
  const [checks, setChecks] = useState<Checks | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = (await res.json()) as { checks: Checks };
        if (!cancelled) setChecks(data.checks);
      } catch {
        if (!cancelled) {
          setChecks({ database: "down", sireneRegistry: "down", cerfaPdf: "down" });
        }
      }
    }

    void load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!checks) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Vérification des services…
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {(Object.keys(LABELS) as Array<keyof Checks>).map((key) => {
        const state = checks[key];
        const tone = TONES[state];
        return (
          <li key={key} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              {tone.ping && (
                <span
                  className={`absolute inline-flex h-full w-full ${tone.ping} rounded-full ${tone.dot} opacity-60`}
                />
              )}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${tone.dot}`} />
            </span>
            {LABELS[key]}
            <span className="sr-only">: {tone.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
