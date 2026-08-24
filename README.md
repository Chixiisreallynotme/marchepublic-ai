# MarchéPublic.ai

Plateforme d'assistance IA pour les marchés publics français : appels d'offres, mémoires techniques, documents CERFA (DC1/DC2 en PDF) et enrichissement Sirene.

## Stack

- **Next.js 15** (App Router, Server Actions) + **React 19** + TypeScript strict
- **Prisma** sur **SQLite** (`prisma/dev.db`) — migration Postgres prévue en V2
- **Tailwind CSS** (design tokens dans `app/globals.css` + `tailwind.config.ts`)
- **Vitest** + Testing Library (216 tests, `__tests__/`)
- **pdf-lib** pour la génération CERFA côté serveur

## Démarrage

```bash
npm install
npm run db:push        # crée/met à jour prisma/dev.db
npm run db:seed        # données de démonstration (Novatech BTP)
npm run dev            # http://localhost:3000
```

## Variables d'environnement (`.env.local`)

| Variable | Requis | Description |
|---|---|---|
| `DATABASE_URL` | oui | `file:./dev.db` (Prisma/SQLite) |
| `LLM_API_KEY` | non | Active l'analyse IA de la simulation (endpoint compatible OpenAI) |
| `LLM_BASE_URL` | non | Défaut `https://api.openai.com/v1` (Mistral, Groq, OpenRouter compatibles) |
| `LLM_MODEL` | non | Défaut `gpt-4o-mini` |
| `INSEE_API_TOKEN` | non | Fallback registre INSEE officiel (ETALAB reste primaire, gratuit) |
| `SIRENE_MOCK` | non | `1` force le mode hors-ligne étiqueté `[HORS-LIGNE]` ; en production le mock est toujours refusé |

## Architecture

```
app/
  api/cerfa            POST génération CERFA (garde 64 Ko)
  api/cerfa/[id]/pdf   GET rendu PDF (pdf-lib) + backfill fileUrl
  api/sirene/[siren]   GET registre ETALAB (timeout 8s, retry x2 backoff)
  api/upload           POST pièce DCE (PDF/ZIP ≤ 25 Mo → public/uploads)
  api/simulation/review POST analyse IA (503 si clé absente)
  sirene|cerfa|memories|simulation   pages standalone
lib/
  actions/             Server Actions (pattern ActionResult + Zod)
  cerfa/               rendu PDF + pré-remplissage depuis Sirene
  org.ts               résolution mono-tenant
  simulation.ts        score pondéré Σ(poids × complétion)
prisma/                schéma 7 modèles + seed
```

## Qualité

```bash
npx tsc --noEmit   # typage strict
npm test           # vitest (216 tests)
npm run build      # build production
```

Boucle de certification : `python3 ~/.agents/skills/loop-until-is-perfect/scripts/perfection_evaluator.py --base-dir . --target 99` (composite unlazy 30% / anti-slop 15% / secrets 20% / tests 35%, hard-block sur placeholder ou secret).

## Périmètre V1 (mono-tenant)

Une organisation soumissionnaire (résolution auto via `lib/org.ts`). Auth multi-organisation et Postgres sont explicitement V2.
