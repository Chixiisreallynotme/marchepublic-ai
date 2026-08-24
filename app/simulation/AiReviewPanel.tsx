"use client";

import { useState } from "react";
import { KeyRound, Loader2, Sparkles } from "lucide-react";

export function AiReviewPanel({ memoryId }: { memoryId: string }) {
  const [review, setReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  async function requestReview() {
    setLoading(true);
    setError(null);
    setReview(null);
    setNeedsKey(false);

    try {
      const res = await fetch("/api/simulation/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryId }),
      });
      const data = await res.json();

      if (res.status === 503 && data.code === "MISSING_API_KEY") {
        setNeedsKey(true);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Échec de l'analyse IA.");

      setReview(data.review);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="ai-review">
      <h2 id="ai-review" className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Revue qualitative par IA
      </h2>

      {needsKey ? (
        <div className="rounded-xl border border-dashed border-brand-300 bg-brand-50/50 p-5 dark:bg-brand-900/10">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="h-4 w-4 text-brand-500" aria-hidden="true" />
            Clé API requise pour l&apos;analyse IA
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Le scoring pondéré ci-dessus est calculé localement. Pour obtenir une revue
            qualitative du contenu, configurez une clé compatible OpenAI :
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-900 p-3 text-xs leading-relaxed text-emerald-300"><code>{`# .env.local
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1   # optionnel
LLM_MODEL=gpt-4o-mini                    # optionnel`}</code></pre>
          <p className="mt-3 text-xs text-muted-foreground">
            Compatible OpenAI, Mistral, Groq, OpenRouter ou tout endpoint OpenAI-compatible.
            Redémarrez le serveur après modification.
          </p>
        </div>
      ) : (
        <>
          <button type="button" onClick={requestReview} disabled={loading} className="btn-secondary">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            {review ? "Relancer l'analyse" : loading ? "Analyse en cours…" : "Analyser mon mémoire"}
          </button>

          {error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300" role="alert">
              {error}
            </p>
          )}

          {review && (
            <div
              className="prose-sm mt-4 rounded-xl border border-border bg-card p-5 shadow-card"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(review) }}
            />
          )}
        </>
      )}
    </section>
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderMarkdown(md: string): string {
  return escapeHtml(md)
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("### ")) return `<h3 class="font-semibold mt-3">${inline(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith("## ")) return `<h3 class="font-semibold mt-3">${inline(trimmed.slice(3))}</h3>`;
      if (trimmed.startsWith("# ")) return `<h2 class="text-base font-bold mt-3">${inline(trimmed.slice(2))}</h2>`;
      if (/^[-*]\s/.test(trimmed)) return `<li class="ml-4 list-disc">${inline(trimmed.slice(2))}</li>`;
      if (/^\d+\.\s/.test(trimmed)) return `<li class="ml-4 list-decimal">${inline(trimmed.replace(/^\d+\.\s/, ""))}</li>`;
      return `<p class="mt-2 leading-relaxed">${inline(trimmed)}</p>`;
    })
    .filter(Boolean)
    .join("");
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-xs">$1</code>');
}
