# Retirement simulator v1.1.1 Implementation Plan

> **Decision update — 13 October 2026:** Replace the Cash + Savings buffer control with static strategy guidance. Do not implement buffer calculations or chart/table output; retain pre-buffer v1.1.0 projection behavior. This supersedes Task 3 and buffer-related checks below.

> **For agentic workers:** Execute inline in the existing `codex/release-1.1.1` checkout. Keep each task reviewable and run its listed checks before moving on.

**Goal:** Deliver GitHub issues #44–#47, refresh date-sensitive rates and their staleness notice, and make current-source review a routine PR checklist step.

**Architecture:** Preserve the single-file deterministic app and its pure-core test harness. Advance scenario data to schema 15 for the new spending semantics and cash-buffer setting. Keep engine values in today’s dollars and convert only in presentation/export. Model Cash + Savings as a virtual target over existing accounts, preserving ownership, means-test, interest and annual-access assumptions. Assess currency independently for each dated source group.

**Tech Stack:** `retirement-simulator.html`, Node.js `.mjs` regression suites, browser smoke test, Markdown documentation, CSV source register, GitHub PR template.

---

## Handoff status (2026-10-13)

- Latest user direction: do not spend any further time on Monte Carlo, including checks. It is permanently parked. Continue deterministic work only.
- Deterministic candidate complete locally: 457 regression checks, focused v1.1.1 invariants and focused Chrome checks pass. Desktop/mobile screenshots inspected. No commit, push or publication performed.

- Branch: `codex/release-1.1.1`, based on `origin/main`.
- Task 1 implemented on 2026-10-12: refreshed government rates, per-source review schedules, source register and methodology. Deterministic regression: 457 passed, 0 failed. Monte Carlo regression also passes after the user-authorized shared-rate refresh.
- User clarification on 2026-10-12: Monte Carlo is permanently parked for now. Shared government-rate maintenance in this pass is explicitly authorized; no feature, import expansion or schema-15 parity work is authorized for it.
- Tasks 2–6 implemented locally: schema 15, Preferred normal spending, migration review, buffer ownership ledger, explicit stress caller, lump details and return context. Source displays candidate v1.1.1. Final candidate verification is recorded in docs/TESTING.md; actual downloads, real iPad and release-tag archive comparison remain limited as noted below.
- Browser evidence: focused v1.1.1 migration/buffer/export-writer and desktop/mobile layout checks pass; screenshots inspected. The full Simple/Advanced browser suite reaches export then fails with Chrome `download.path: canceled`, including with an explicit workspace download directory; do not report that suite as passing.
- Archived the exact pre-change checkout (including #48) as `archive/retirement-simulator-v1.1.0.html`, verified against HEAD blob `4511fe1d3e2c3a78e0663d2a40b4cd08f34451e6`. Release tag/asset comparison remains pending; GitHub network access failed and no local v1.1.0 tag exists.
- Baseline on `origin/main`: `node tests/retirement-simulator.test.mjs` passed (450 passed, 0 failed); `node tests/retirement-monte-carlo.test.mjs` passed. Re-run after changes.
- Preserve the user's untracked `docs/plans/` directory. Do not clean it.
- The main source is `retirement-simulator.html`; deterministic tests are in `tests/retirement-simulator.test.mjs`. The experimental Monte Carlo companion is intentionally out of scope for schema-15 parity.
- User ownership clarification: retain the source owner for buffer top-ups and allocate interest by beneficial ownership. Lower-taxed ownership requires an explicit actual ownership decision; do not silently reassign.
- Approved design is in `docs/superpowers/specs/2026-10-12-retirement-sim-v1.1.1-design.md` before implementation. It records the agreed Cash/Savings definitions, event-source order, migration behavior and scope.
- Rate pages are time-sensitive. Re-open and check them on the actual implementation date; the 2026-10-12 verification below is a starting point, not a substitute for a fresh check.
- No commits or pushes are authorized by this handoff.

## File map

- `retirement-simulator.html` — source metadata and constants; independent rates-currency checks; schema-15 migration/validation; spending, bucket, lump-sum and return-guidance behavior; accessible UI; release version.
- `tests/retirement-simulator.test.mjs` — deterministic tests for rates, migrations, spending, bucket accounting, funding disclosure, display conversion and warnings.
- `tests/retirement-monte-carlo.test.mjs` — regression gate only; don't add or claim schema-15 parity in this release.
- `docs/independent-review/source-register.csv` — official source, effective date, checked date and model values.
- `docs/MODEL-METHODOLOGY.md`, `docs/TESTING.md` — model semantics, approximations, limitations and verification evidence.
- `CONTRIBUTING.md`, `.github/pull_request_template.md` — ongoing source-date review checklist (already added).
- `CHANGELOG.md`, `README.md` — release notes and simple, screenshot-first product orientation.
- `archive/retirement-simulator-v1.1.0.html`, `archive/README.md` — archive/provenance for outgoing production executable before replacement.

## Task 1: Re-verify and refresh dated government inputs

1. Open and verify the official pages on implementation day. Confirm every numeric input the app uses, not only headline rates:
   - Age Pension maximum rates: [Services Australia](https://www.servicesaustralia.gov.au/how-much-age-pension-you-can-get?context=22526).
   - Age Pension income and asset limits: [income test](https://www.servicesaustralia.gov.au/income-test-for-age-pension?context=22526) and [assets test](https://www.servicesaustralia.gov.au/assets-test-for-age-pension?context=22526).
   - CSHC income limits: [Services Australia](https://www.servicesaustralia.gov.au/income-test-for-commonwealth-seniors-health-card?context=21966).
   - Deeming rates/thresholds: [DSS Social Security Guide](https://guides.dss.gov.au/social-security-guide/4/4/1/10) and [Services Australia](https://www.servicesaustralia.gov.au/deeming?context=22526).
2. Confirmed starting point from 2026-10-12 official pages: maximum Age Pension is $1,237.70 single and $1,866 combined couple per fortnight; CSHC limits are $105,048 single / $168,076 couple; deeming is 1.75% / 3.75%, thresholds $66,800 / $110,600. Confirm related free areas and formulae independently before retaining them.
3. Update `retirement-simulator.html` constants with the checked/effective/page-updated dates and URLs. Preserve the project's existing annual approximations; test conversion from fortnightly values.
4. Replace `INDEXATION_SCHEDULE`/global-oldest logic with per-source groups. Groups: Age Pension rates (20 Mar and 20 Sep), Age Pension thresholds (20 Mar, 1 Jul and 20 Sep, reflecting the official review schedule), CSHC (20 Sep), tax/SAPTO/Medicare (1 Jul), deeming thresholds (1 Jul), deeming rates (no fixed schedule), Work Bonus (no fixed schedule). Invalid/missing dates return `unknown`; due dates for one group cannot mark another group stale.
5. Update `datedRateSources`, `ratesStaleness`, the currency UI and disclosure. Report the affected source group and due date, or the next due review. For unscheduled groups say no routine date is scheduled and link the source; don't claim they are guaranteed current.
6. Update `docs/independent-review/source-register.csv`, methodology, and rate tests. Add boundary coverage around each group's effective date and verify that an Age Pension indexation does not stale July-reviewed tax/SAPTO/Medicare or unscheduled deeming rates.

Run: `node tests/retirement-simulator.test.mjs`.
Expected: all rate/source tests and the full deterministic suite pass.

## Task 2: Schema 15 and revised spending semantics (#47)

1. Add failing migration cases in `tests/retirement-simulator.test.mjs`: schema 14 with Preferred > Essential; schema 14 with equal amounts; unrelated-field preservation; second migration/reload remains unchanged.
2. Run `node tests/retirement-simulator.test.mjs` and confirm the new cases fail against schema 14 behavior.
3. In `retirement-simulator.html`, increment `SCHEMA_VERSION`, add the 14→15 migration, set new-schema fields explicitly, and validate Essential ≤ Preferred plus `cashBufferYears` as a nonnegative integer. Limit the effective target horizon to the remaining modeled years. Preserve unrelated legacy values; set the bucket disabled for migrated cases.
4. On migration, preserve a one-time review notice with prior Preferred/Essential values and revised definitions. Confirm saved/imported migrated scenarios keep it until the user can see/dismiss it; do not show it repeatedly after dismissal.
5. Make Preferred the normal spending/draw target. Implement a pure bad-year evaluator for the issue's 1 July comparison (total liquid assets more than configurable X%, default 10%, below the planned deterministic path) and return the status/deficit needed by a stressed caller. A normal deterministic run follows its planned path and the trigger does not fire. Do not add an unapproved stress-path editor or claim the ordinary UI exercises this branch; keep that limitation explicit.
6. Add a per-lump `deferrable` boolean (default true for new entries) and test migration/default behavior. When a supported stressed caller marks a bad year, move deferrable lumps by one year, retain non-deferrable events, use Essential for spending, and resume Preferred after assets return within the configured threshold. Expose any Essential shortfall without calling it ordinary spending.
7. Update survivor percentages and all labels/help to match the two new meanings. Add regression tests for trigger boundary, normal deterministic no-trigger, Essential floor/helper behavior, deferral decision, recovery boundary, shortfall rule, validation and preservation of unrelated scenario behavior.

Run: `node tests/retirement-simulator.test.mjs`.
Expected: schema is 15; migration and revised normal-spending tests pass.

## Task 3: Cash + Savings bucket (#45)

1. Add failing tests for schema-15 default target (two years), 0 disabled, migrated scenarios off, horizon truncation, target composition, and separate owner/interest treatment.
2. Trace `makeProjectionState`, `projectScenario`, `projectYear`, `drawFromTiers`, `drawForLumpSum`, `assessableFinancialAssets`, `mandatoryDraws`, and issue #28 ordering before implementation. Write down the exact current annual transaction order in `docs/MODEL-METHODOLOGY.md`.
3. Add `cashBufferYears` as a nonnegative integer; default new scenarios to 2 and let 0 disable. Calculate the target as `cashBufferYears` years of indexed Preferred plus planned lump sums due within that same horizon. Truncate the horizon to remaining modeled years and recompute annually. Cash remains on-demand; Savings retains existing annual access behavior. Do not introduce maturity schedules or penalties.
4. Implement bounded top-ups from available super using issue #28 assessed-super-first ordering; account for required ABP minimum draws and liquid resources. Support the bad-year skip-or-halve choice from #45 when the stressed caller supplies bad-year status. Do not count top-ups as income or change tax/means-test rules. Cap at target and source balance.
5. Funding order: automatic lump sums use bucket funds first; an explicitly selected source is first, then bucket funds for the remainder, then existing fallback tiers. Preserve separate Cash and Savings balances/ownership. Any internal transfer must reconcile exactly and no account may go negative.
6. Report yearly opening liquid balances, additions/top-ups, spending and lump withdrawals, closing balance, target and any below-target/skip/halve reason. Draw the target against the Savings series, mark below-target years, and provide equivalent table/CSV/accessibility detail. Keep Simple view concise.
7. Add tests for enabled/disabled behavior, target horizon/indexing, explicit vs automatic sources, tier order, minimum draw interaction, bad-year top-up choice, account exhaustion, no negative balances, unchanged ownership/assessment/interest, chart target output and per-year reconciliation.

Run: `node tests/retirement-simulator.test.mjs`.
Expected: focused bucket cases and all prior deterministic cases pass.

## Task 4: Lump-sum display and funding disclosure (#44)

1. Add failing tests for `lumpSumEventLabel(event, people, displayFactor)` and event/chart/table values in real and nominal displays, including automatic/explicit fallback and unfunded balance.
2. Keep engine event fields numeric and in today’s dollars. Update event labels at presentation time to apply the current display factor once; don't bake formatting into engine transactions.
3. Retain requested source separately from actual source amounts. Show requested, funded, unfunded, actual source split and fallbacks in table/accessibility text. Add a subtle amber chart marker only on event years.
4. Ensure display-mode changes rerender tooltip/event labels, chart, table and visible CSV. CSV must match displayed table values and source detail.
5. Add tests asserting funded + unfunded = requested and sum(actual draws) = funded, including named assets/shares and bucket fallback.

Run: `node tests/retirement-simulator.test.mjs`.
Expected: all requested-vs-actual source and display-conversion tests pass without double conversion.

## Task 5: Contextual return guidance (#46)

1. Verify the proposed project reference ranges and document their scope before encoding. Candidate super reference: Chant West's [18 December 2025 media release](https://www.chantwest.com.au/media/hn3hirue/chant-west-media-release-18-december-2025.pdf), which reports Growth typical objective CPI+3.5%; issue #46 gives a ±1 percentage-point band. Candidate cash/savings real-return context is 0–2% from issue #46. Explain that these are project reference bands, not universal regulatory or suitability rules.
2. Add pure helper tests for real-return calculation, inside/outside boundaries, manual inflation and Treasury inflation (including horizon average and any >2 percentage-point single-year deviation specified by #46).
3. In Treasury mode, compare each year's real-return gap with the band and flag a year only when it is more than 2 percentage points below the lower bound or above the upper bound, as specified by #46.
4. Add compact inline context beside each relevant return assumption, using existing app typography/color tokens. Warnings are informational only; they must not mutate values, block a run or change projection results.
5. Add accessible source/effective-date details and state that return-linking/Stress labeling remain out of scope.

Run: `node tests/retirement-simulator.test.mjs`.
Expected: warning cases pass and before/after projection output is identical for the same scenario.

## Task 6: Contributor reminder checklist (documentation already started)

1. Review `CONTRIBUTING.md` and `.github/pull_request_template.md` for consistency. Checklist requires checking current authoritative source/effective date/page-updated date when relevant, updating checked-date/source evidence and marking unrelated PRs N/A.
2. Keep the checklist-only choice: do not create scheduled reminders or automation.
3. Validate Markdown links, confirm GitHub template path and inspect `git diff --check`.

Run: `git diff --check`.
Expected: no whitespace errors; PR template has both applicable and N/A choices.

## Task 7: Release documentation, archive and final verification

1. Before replacing the production HTML, copy the exact current sanitized v1.1.0 file to `archive/retirement-simulator-v1.1.0.html`; verify it against the v1.1.0 release/tag asset, then update `archive/README.md`. Never include personal data or screenshots containing it.
2. Update in-app release version, `CHANGELOG.md`, methodology, `docs/TESTING.md`, source register and any necessary README copy. Preserve the README's download-links-then-screenshot opening.
3. Run `node tests/retirement-simulator.test.mjs` and `node tests/retirement-monte-carlo.test.mjs`. Treat the Monte Carlo suite as a regression gate only; explicitly state if deterministic schema-15 imports are unsupported there.
4. Run the repo's documented workflow checks from `docs/TESTING.md`. Run focused browser flows for v1.1.0 save migration, schema-15 import/export, Simple/Advanced switch, cash bucket, lump-sum fallback, display mode and rate currency notice. Inspect a screenshot at desktop and narrow/mobile widths.
5. Run a privacy scan over changed files, `git diff --check`, and verify tag/archive/version/changelog consistency. Review full diff before considering the release candidate complete.

## Design boundaries and risks

- User-approved feature design is at `docs/superpowers/specs/2026-10-12-retirement-sim-v1.1.1-design.md`; follow it if this plan's wording is abbreviated.
- The app currently treats annual Savings withdrawals as available; preserve that simplification and disclose it. Don't infer early-break penalties or exact term maturities.
- A bucket top-up is a transfer between modeled accounts, not new income/value. Validate total assets/reconciliation, means-test ownership and ABP minimum interaction.
- The migration intentionally changes old `Preferred > Essential` scenarios: both become old Essential; this must be clearly reviewed and shown once.
- Essential bad-year fallback and deferrable lump behavior need a defined supported trigger path. If no deterministic stress path exists, document the limit; don't add a new unapproved stochastic model or claim those branches are covered.
- Return bands are reference context. Their exact range and any warning threshold for variable Treasury inflation must be verified against issue #46 before implementation.
- Release commit/push, issue edits/closures, publication and merge require separate explicit authorization if not already given for v1.1.1.
# Follow-up implementation note (2026-10-13)

User-approved review changes are being implemented in the deterministic simulator only. Schema 16 adds per-person broad super-risk profiles while preserving existing nominal rates during migration from schema 15. Named profile selection sets both editable nominal return fields to the real objective midpoint plus the person's average model inflation; Custom leaves values as entered. Return cues are compact, link to issue #46, and offer a midpoint action. Cash has no warning; Savings has a distinct RBA-informed context. Calculation logs are hidden unless requested and occupy the final table column; dormant capital-loss carry-forward is disclosed there rather than repeated in the event column.

Source evidence and caveats are recorded in the design addendum. The connected GitHub integration denied issue #46 edits with HTTP 403, so its current page has not received those source details. Do not touch the parked Monte Carlo artifact or tests.

