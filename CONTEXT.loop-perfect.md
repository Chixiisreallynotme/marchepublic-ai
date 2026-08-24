# CONTEXT.md — Domain Model of the Loop-Until-Is-Perfect Engine

Ubiquitous language, entity model, and invariants for the autonomous perfection
engine (`loop-until-is-perfect`). Read this before modifying the evaluator,
the loop driver, or any orchestration phase. Terminology here is normative:
`SKILL.md`, `scripts/perfection_evaluator.py`, `scripts/ralph_score.sh`, and
all ADRs under `/home/chixi/docs/adr/` must use these terms with exactly these
meanings.

---

## 1. Bounded Contexts

| Context | Owner | Responsibility |
|---------|-------|----------------|
| **Intelligence** | Phase 0 (Exa / agent-reach) | Jury rubrics, competitor gaps, sponsor criteria. |
| **Arbitration** | `/decision` (DECISION v4.0) | Every trade-off becomes a persisted UDR/ADR. |
| **Construction** | Ox-Alpha swarm | 100% of workspace mutations, 4-Pass discipline. |
| **Verification** | `perfection_evaluator.py` | Machine scoring, elimination gates, telemetry. |
| **Iteration** | `ralph_score.sh` | Ratchet, floor enforcement, chaos gauntlet. |

The orchestrator (Gemini) owns nothing but coordination: it never edits files,
never self-scores, never certifies completion.

## 2. Core Entities

- **Perfection Loop** — one run of `ralph_score.sh`: baseline evaluation,
  N mandatory passes, chaos gauntlet, certification or exhaustion.
- **Pass (Iteration)** — one dispatch-to-Ox-Alpha + re-evaluation cycle.
  The unit of ratchet progress; one atomic change-set per pass.
- **Composite Score ($S$)** — weighted sum of the 10 FAANG Jury dimensions,
  0–100, computed only by the evaluator. Prose claims of quality do not exist.
- **Git Ratchet** — transactional advance/rollback: $\Delta S > 0$ commits;
  $\Delta S \le 0$ executes `git reset --hard HEAD && git clean -fd`.
- **GATES.md Ledger** — Unlazy acceptance gates (`CHECK:`/`EXPECT:`) that must
  exist and pass before construction and before certification.

## 3. Verification Vocabulary (v2.0)

### Scope Amplification Protocol (SAP)
Requirements enter the loop multiplied by **10** in rigor. The five amplified
axes are:

1. **UI High-End & GSAP Motion** — not "has animations" but agency-grade motion:
   ScrollTrigger choreography, easing curves, `prefers-reduced-motion` respect,
   60 FPS GPU-composited transforms.
2. **Deep Architecture** — deep modules, narrow interfaces, no god files,
   acyclic imports, seams that hide implementation.
3. **Network Resilience** — every network call carries timeout + retry with
   exponential backoff/jitter (or a circuit breaker); bare calls are defects.
4. **WCAG 2.1 AA Accessibility** — zero violations, not "mostly accessible".
5. **Security Hardening** — OWASP-grade defaults: parameterized SQL, TLS
   verification on, no `eval`/`exec`, secrets out of source.

Amplification means the *verification bar*, not gold-plating: each axis has a
machine-checkable signal set in the evaluator (see §5).

### 10-Dimension FAANG Jury Rubric
The composite score is a weighted jury verdict over ten dimensions, scored by
static/dynamic evidence only:

| # | Dimension | Weight | Elimination |
|---|-----------|-------:|-------------|
| 1 | Correctness (test suite) | 16% | < floor 40 |
| 2 | Mutation Resilience | 12% | kill ratio < 85% |
| 3 | Unlazy Hygiene (zero-placeholder) | 12% | any hit |
| 4 | Anti-Slop Copy | 6% | < floor 40 |
| 5 | Security (secrets + patterns) | 14% | any secret / severe pattern |
| 6 | Network Resilience | 8% | < floor 40 |
| 7 | Accessibility (WCAG 2.1 AA) | 10% | < floor 40 |
| 8 | UI Craft & Motion | 8% | < floor 40 |
| 9 | Architecture Depth | 8% | < floor 40 |
| 10 | Docs & DX | 6% | < floor 40 |

**Eliminating penalties** are verdict killers independent of the composite:
any elimination sets `hard_block = true`, and `PERFECTION_REACHED` is
unreachable while it stands — even at $S \ge$ target.

### Incompressible Iteration Floor (MIN_ITER)
Completion cannot be certified before **MIN_ITER passes have completed**
(default **5**), regardless of how early the target score is reached. Early
target hits trigger *more* mandatory improvement passes, not early exit.
Rationale: score is necessary but not sufficient; sustained improvement across
multiple adversarial cycles is the evidence of perfection, not a lucky spike.

### Mutation Testing Gate
The test suite must **kill ≥ 85% of generated operator mutants** (comparison
flips, boolean flips, arithmetic swaps, constant toggles). A suite that asserts
nothing kills nothing; survivors are recorded as actionable defects
(`count = survived`) so triage targets untested behavior directly. No tests →
mutation gate unsatisfiable → elimination.

### Popperian Chaos & Red-Teaming Gauntlet
Before `PERFECTION_REACHED`, the certified candidate state must survive
**3 consecutive falsification rounds**: Ox-Alpha is dispatched as an adversary
instructed to break the system (fuzz inputs, abuse API contracts, stress
network paths, violate accessibility/security assumptions). Each round ends in
re-evaluation. Any regression or new hard block rolls back that round's diff
transactionally and returns the loop to fixing. Three clean rounds certify;
two clean rounds plus one failure certify nothing.

## 4. State Model of a Pass

```text
PASS k:
  triage (/decision on weakest dimension)  ->  dispatch (Ox-Alpha 4-Pass)
  -> evaluate (rubric + eliminations)      ->  ΔS ?
       ΔS > 0 : commit (ratchet up)        -> stagnation reset
       ΔS ≤ 0 : rollback (transactional)   -> stagnation += 1
```

Termination requires ALL of:
1. $S_{\text{comp}} \ge$ Target
2. `hard_block == false` (no eliminating penalties)
3. All GATES.md gates met with evidence
4. Completed passes ≥ MIN_ITER (default 5)
5. Chaos gauntlet: 3 clean Popperian rounds

## 5. Evaluator Contract (JSON, v2.0)

Key fields emitted by `perfection_evaluator.py --json`:

- `composite` — weighted rubric sum (float).
- `dimensions.<name>` — `{score, weight, count?, findings?}` for each of the
  10 dimensions; `count` on mutation = survivors.
- `eliminations[]` — machine-readable list of eliminating penalties found.
- `hard_block` — true iff any elimination fired.
- `scope_amplification.multiplier` — always `10`; per-axis signal names.
- `mutation` — `{kill_ratio, killed, survived, total_mutants, truncated?}`;
  absent ratio ⇒ gate unsatisfiable.
- `verdict`, `exit_code`, telemetry appended to `.perfection/telemetry.jsonl`.

## 6. Decision Records

Every arbitration persists a UDR in `docs/decisions/`; architecture-shaping
outcomes persist ADRs in `/home/chixi/docs/adr/`. This protocol itself is
ratified by **ADR 0055 — Scope Amplification and Adversarial Verification
Gates**; treat that document as the constitution for everything above.
