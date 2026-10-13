---
title: "fix: Restore Monte Carlo regression and scenario-transfer workflows"
type: fix
status: active
date: 2026-09-05
---

# Prioritized project repair plan

## Scope and baseline

Requested work: inspect project files, execute existing tests, trace failed workflows, and specify prioritized changes with acceptance checks. This inspection changes documentation only; repairs below remain unimplemented.

Inspected at commit `eb04230` on Windows with Node `v25.9.0`. The initial working tree was clean. This is a build-free application: `retirement-simulator.html` contains the deterministic core and UI; `retirement-monte-carlo-v0.7.html` contains a separate simulator core, UI and stochastic reporting engine. Tests extract embedded scripts into Node VM contexts. There is no package manifest or existing browser-test runner. CI specifies Node 20.

| Check executed | Result | Interpretation |
|---|---|---|
| `node tests/retirement-simulator.test.mjs` | Exit 0; 379 passed, 0 failed | Core regression and source/UI-contract checks pass; not a rendered-browser check. |
| `node tests/retirement-monte-carlo.test.mjs` | Exit 1 at line 1066 | Other-income zero-volatility parity assertion aborts the suite. |
| Diagnostic continuation of Monte Carlo assertions | Three assertion failures | Other income, Defined Benefit, and UK State Pension parity fail. Later assertions were reached with an in-memory assertion wrapper; this is diagnostic evidence, not a passing suite. |
| Current deterministic sample JSON passed to Monte Carlo importer, Couple and Single | Both throw `Unsupported schema version: 14.` | Current exports fail at schema adaptation before feature validation. |
| Seven archive/tag comparisons declared in `.github/workflows/test.yml` | All match | No archive-provenance failure reproduced. |
| Four additional archived v1.0.4–v1.0.7 source-commit comparisons | All match | Sources documented in `archive/README.md` remain consistent. |

The diagnostic run evaluated the unchanged test source in memory, replacing the imported assertion object with a logging wrapper and preserving its original file URL for relative reads. No tests were edited or skipped on disk. The normal suite remains red. Its final success message during diagnostic continuation must not be interpreted as a successful run.

Limits: no GitHub Actions run history, remote deployment, real-browser interaction, iPad Safari session, or Node 20 execution was verified. The Pages artifact-building shell commands were inspected but not executed. Git emitted a permission warning for the user-global ignore file; commands still completed. Private scenarios and handoff material were outside inspection scope. This is code/workflow diagnosis, not verification of current financial rules.

## Failure traces

### Tax parity drift

`tests/retirement-monte-carlo.test.mjs` constructs a fictional couple with ages 64/62, a fixed first death in 2027, continuing Other income, zero returns and 2% inflation. In 2031 the survivor reaches 67. Gross Other-income allocation still agrees, but Monte Carlo reports tax of 931.971340 versus deterministic tax of zero. The discrepancy reduces net Other income, net Age Pension, total income and remaining assets.

| 2031 output | Monte Carlo | Deterministic |
|---|---:|---:|
| Other income net | 17,681.140253 | 18,000.000000 |
| Age Pension net | 22,460.792131 | 23,073.903723 |
| Total income | 40,141.932384 | 41,073.903723 |
| Total assets | 188,710.934016 | 189,642.905356 |

The Monte Carlo annual projection calls per-person `projectionNetTax`, which uses a fixed partnered SAPTO schedule and age-only senior eligibility, and subtracts offsets from income tax plus Medicare together. The deterministic engine now uses `householdTaxAssessment`, household status and living-person inputs, spouse transfer, Medicare family reduction, and separate offset ordering. That implementation drift explains why income and pension parity tests now disagree. The existing August evidence in `docs/independent-review/test-evidence.md` already records the first failure and associates it with issue #37; issue status was not checked remotely.

### Current-export transfer

Deterministic `SCHEMA_VERSION` is 14. Monte Carlo's `adaptV1ScenarioForExperimentalMonteCarlo` admits only deterministic schemas 6–12; its native schema is 5. Current schema 14 passes unchanged into `migrateScenario`, which rejects it. Schema 13 is excluded by the same branch, though only schema 14 was runtime-probed. Broadening the list alone is insufficient: Single households have different ownership and lifecycle semantics, and the current sample also has active lump sums that the companion intentionally rejects.

### Workflow impact

The regression workflow runs archive checks, deterministic tests, then Monte Carlo tests. The reproduced assertion makes the equivalent local regression sequence fail at the final step. No remote CI status is asserted here.

Pages validation deliberately runs only the deterministic suite and publishes a controlled two-file artifact. This is an approved boundary in `docs/superpowers/specs/2026-07-23-github-pages-ipad-hosting-design.md`, not a defect requiring Monte Carlo to gate Pages.

## Prioritized implementation units

**Execution decision:** `docs/superpowers/specs/2026-07-20-monte-carlo-paused-status-design.md` records a target of indefinite pause, while its proposed `MONTE-CARLO.md` is absent and the current README still describes unreleased parity work. This plan does not restart that roadmap. Units 1–2 specify bounded repairs if focused companion maintenance is pursued. Before implementation, reconcile whether the recorded pause permits these repairs; otherwise publish accurate status and retain explicit failing-regression evidence without presenting the companion as repaired. The inspection and plan are complete regardless of that later product decision.

### P1 — Restore household tax parity before trusting companion results

- [ ] **Unit 1: Port the established household-tax behavior into the companion.**

**Files to change:** `retirement-monte-carlo-v0.7.html`; `tests/retirement-monte-carlo.test.mjs`; `docs/MODEL-METHODOLOGY.md`; `CHANGELOG.md`.

**Reference files:** `retirement-simulator.html` (`householdTaxAssessment`, tax helpers, annual base/ordinary/total assessments); `tests/retirement-simulator.test.mjs` household-tax fixtures; `docs/superpowers/plans/2026-07-21-household-tax-status.md`.

**Approach:** Characterize the three existing failures first. Bring household status, living-person eligibility, SAPTO, Medicare and offset order into the companion's annual tax calculation. Reconcile total tax and incremental CGT through consistent household assessments. Preserve stochastic return injection, income attribution and the standalone HTML delivery model. Do not weaken parity assertions or change deterministic expected values merely to make the companion green. No broad shared-engine extraction is required for this repair.

**Required checks:**

- All three existing zero-volatility Other-income, Defined Benefit and UK State Pension parity comparisons pass at their existing precision, including tax, net components, drawdown and assets.
- Add focused companion cases for uneven-income couples, spouse transfer, zero/one/two senior-eligible people, both possible deceased partners, transition into survivor pension age, and offsets that cannot erase Medicare.
- Cover inflation factor one and a later inflated year, the existing tax-rate year boundary, deceased-person zero tax, and CGT marginal tax without double counting.
- Seed reproducibility, stochastic finite-value/non-negative-asset invariants, pension start/indexation/UPP behavior and all existing unsupported-feature guards remain green.
- Both complete unmodified regression suites exit zero under the CI Node 20 runtime and the recorded local runtime. Retain the deterministic baseline of 379 checks plus any deliberate additions.
- Compare at least one household result with the documented worked-example/source protocol. Reuse dated source references; any changed legal interpretation requires fresh authoritative verification, separate from code parity.

**Dependencies:** None. Priority reflects an existing failing merge gate and materially different reported amounts.

### P1 — Restore compatible current-export imports with explicit boundaries

- [ ] **Unit 2: Adapt supported Couple exports from current deterministic schemas.**

**Files to change:** `retirement-monte-carlo-v0.7.html` (`adaptV1ScenarioForExperimentalMonteCarlo`, import validation, both generic and Monte Carlo `scenarioFile` change handlers); `tests/retirement-monte-carlo.test.mjs`; `README.md`; `docs/TESTING.md`; `CHANGELOG.md`.

**Approach:** Accept schema 13/14 Couple scenarios only after normalizing the supported fields and retaining all unsupported-feature checks. Reject schema-14 Single imports with an actionable explanation before any projection or saved-scenario replacement. Single parity is explicitly outside current companion scope, so silently treating Single as Couple is unacceptable. Generate a transfer fixture from the current deterministic core, removing active unsupported features explicitly rather than relabeling its schema. Update the README's sample-transfer wording: the default sample includes active lump sums and cannot be imported unchanged even after schema support is repaired.

**Required checks:**

- A supported current deterministic Couple export imports into native schema 5, validates, preserves salary growth, pension and Other-income fields, and produces finite projections.
- Supported schema-13 Couple and earlier accepted schemas continue to import; native schema-4 migration and native schema-5 round trips remain green.
- Single imports fail with a household-specific explanation; unknown future schemas and malformed JSON remain rejected.
- Active lump sums, unsupported Other Assets and active share-return assumptions retain feature-specific errors. Disabled/inert records retain the existing acceptance policy.
- In a real browser, export a fictional supported Couple scenario from the deterministic UI, import it into the companion, run the report and export/reimport it. A failed Single or unsupported-feature import must leave the previous saved scenario and usable report context intact, allow rerunning that scenario, and permit a subsequent valid import and same-file reselection.
- Both full suites pass; after Unit 1, the imported fixture also satisfies zero-volatility cross-engine parity for supported flows.

**Dependencies:** Adapter work can be developed independently; final numerical acceptance depends on Unit 1.

**Source-inspection recovery risk:** The generic import handler preserves state on error, while the separate Monte Carlo handler clears its own scenario and disables Run. This was traced in source, not reproduced in a browser. Verify both handlers together when implementing the import boundary; preserving local storage alone does not prove that the report remains usable.

### P2 — Make regression evidence complete and keep delivery boundaries visible

- [ ] **Unit 3: Improve test reporting and refresh evidence after repairs.**

**Files to change:** `tests/retirement-monte-carlo.test.mjs`; `docs/TESTING.md`; `docs/independent-review/test-evidence.md`.

**Approach:** Split independent parity scenarios into named test cases using the existing runtime's test facilities or a small local harness. Keep prerequisite/setup errors fatal, but report independent assertion failures without concealing later cases. Append dated results to the evidence document, preserving the August failure record. Explain the distinction between the full regression gate and the intentionally deterministic-only Pages validation.

Correct the archive claim in `docs/TESTING.md`: CI currently verifies seven archives against tags; v1.0.4–v1.0.7 instead have source-commit provenance and are not covered by that workflow. Narrow the claim to actual coverage in this bounded documentation repair. A comprehensive provenance checker is optional separate work; all eleven files matched their documented sources during this inspection.

**Required checks:**

- An isolated temporary failing fixture produces a nonzero process exit and a named failure while a later independent case still executes; clean fixtures produce zero failures and exit zero.
- Run both suites on Node 20 and record commit, runtime, counts and outcome without treating source-string assertions as browser verification.
- Re-run all seven workflow archive comparisons unchanged. Do not regenerate historical release HTML.
- Before any deployment, execute the controlled Pages artifact build in a clean workspace, verify `index.html` matches `retirement-simulator.html`, and verify the complete artifact contains only `index.html` and `.nojekyll`.
- Record a browser pass for the repaired import/report workflow, including validation recovery, persistence and export. Retain the existing real-iPad requirement for a release involving UI changes; desktop emulation is not equivalent.

**Dependencies:** Reporting improvements may precede Unit 1 to expose all failures; final evidence refresh follows Units 1 and 2.

## Completion and deferred work

Completion requires green original regression intent, supported current Couple transfer, explicit Single/unsupported-feature rejection, and dated reproducible evidence. Do not deploy, publish a release, modify archived snapshots, or change financial assumptions as part of implementing this plan without the corresponding task scope.

No workflow YAML change is required to fix the reproduced assertion or import failures. Browser automation expansion, shared-engine refactoring, Single Monte Carlo support and the remaining guarded financial features are separate follow-up work, not prerequisites invented for these repairs. Remote Actions status and real-device behavior remain unverified until those checks are actually performed.
