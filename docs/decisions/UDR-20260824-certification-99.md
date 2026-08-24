# UDR — Certification jury multi-modèles ≥99 (MARCHEPUBLIC-CERT99R2)

## Décision
Le projet MarchéPublic.ai est certifié **≥99/100 par 5 juges indépendants sur 7**
(nemotron-3.5-lightning 100, mimo-v2.5 99, hy3 99, nemotron-3-ultra 99, muse-spark 99).
Critère utilisateur : « au moins 5 agents décident que ça vaut 99 ou plus » → SATISFAIT.

## Méthode (DECISION v4.0 HABF, failover opéré manuellement)
1. Binaire `decision` : quorum primaire insuffisant en parallèle (timeouts) →
   émission `ANTIGRAVITY_SUBAGENTS_REQUIRED` → failover exécuté via
   `opencode-runner -m <modèle>` séquentiel (7 modèles, prompt identique,
   inspection README + shared.ts + memories.ts, evidence machine fournie).
2. Boucle d'amélioration entre rounds (Git Ratchet) :
   - R1 YAGNI 87 → dedup shared.ts, code mort supprimé, 0 `any`, IDOR fix+tests (c0430ad)
   - R2 Chaos 58 (SHOWSTOPPER éditeur non persistant) → persistance réelle
     (autosave debounce+blur+Ctrl+S+beforeunload), statut persisté, DELETE 404,
     backoff Siren universel, PDF défensif, magic bytes upload (2e45334)
   - R3 Chaos 87 / YAGNI 91 → 14 gaps : title autosave, race draft guard,
     indicateur autosave réel, guards payload, LLM timeout 30s, anti-empoisonnement
     inconditionnel, cohérence criterion↔tender, PK serveur, headers sécurité,
     WinAnsi sanitize, org race-safe, confirm delete, 400 siren, pagination (5ebff81)
   - R4 jury flotte 2/7 ≥99 → rate-limit 5 routes, WAL+busy_timeout, progression
     pondérée exacte, axe-core a11y (6 composants 0 violation), plan V2 (045929d)
   - R5 org scoping complet (writes + reads bornés) (7c44bbf) → 5/7 ≥99

## Gaps résiduels CONSENSUS (assumés V2, documentés README)
- Rate-limit en mémoire : mono-instance, Redis au scale-out
- groupBy criteria agrégat global (borné en pratique par take 200 + where org)
- reorder en N updates transactionnels (pas de batch CASE) — volume ≤50
- Backup SQLite documenté, cron non fourni dans le repo
- Observabilité OTel : V2

## Invariants respectés
Rule 0 (tous les modèles jugent tous les axes) · evidence-based · Git Ratchet ·
évaluateur machine 100/100 · GATES 5/5 · chaos 3/3.
