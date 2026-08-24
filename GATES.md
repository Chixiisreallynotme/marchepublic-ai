# Unlazy Gates Ledger

## Task
Boucle de vérification objectif 99/100 — MarchéPublic.ai (Next.js 15 + Prisma/SQLite + vitest)

## Gates
- [ ] G1: Le typage strict passe sans erreur
  CHECK: bash -c 'cd /home/chixi/.gemini/antigravity/scratch/marchepublic-ai && npx tsc --noEmit && echo TYPECHECK_GATE_OK'
  EXPECT: TYPECHECK_GATE_OK
- [ ] G2: La suite de tests vitest est 100% verte
  CHECK: bash -c 'cd /home/chixi/.gemini/antigravity/scratch/marchepublic-ai && npm test --silent >/dev/null 2>&1 && echo TESTS_GATE_OK'
  EXPECT: TESTS_GATE_OK
- [ ] G3: Toutes les routes applicatives répondent HTTP 200
  CHECK: bash -c 'ok=1; for p in / /tenders /tenders/new /memories /cerfa /sirene /mentions-legales /confidentialite /cgu /accessibilite; do c=$(curl -s -m 20 -o /dev/null -w "%{http_code}" "http://localhost:3000$p"); [ "$c" = 200 ] || ok=0; done; [ "$ok" = 1 ] && echo ROUTES_GATE_OK'
  EXPECT: ROUTES_GATE_OK
- [ ] G4: Le PDF CERFA DC1 se génère réellement (%PDF magic bytes)
  CHECK: bash -c 'curl -s -m 20 http://localhost:3000/api/cerfa/cerfa-dc1-novatech/pdf | head -c5 | grep -q "%PDF-" && echo PDF_GATE_OK'
  EXPECT: PDF_GATE_OK
- [ ] G5: La recherche Sirene interroge le registre ETALAB réel (données factuelles)
  CHECK: bash -c 'curl -s -m 25 http://localhost:3000/api/sirene/552100554 | grep -q "PEUGEOT" && echo SIRENE_GATE_OK'
  EXPECT: SIRENE_GATE_OK

## Notes
- A gate counts as met only on process exit 0 AND matching EXPECT:.
- Gates verified via gate-check.mjs --status before certification.
