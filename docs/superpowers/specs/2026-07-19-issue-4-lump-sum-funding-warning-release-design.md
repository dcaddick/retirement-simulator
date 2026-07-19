# Issue #4 Lump-Sum Funding Warning and v1.0.9 Release Design

**Date:** 2026-07-19

**Release target:** deterministic simulator v1.0.9 (`v1.09` in-app)

**Issue:** [#4 — Warn when a lump-sum withdrawal is only partially funded](https://github.com/dcaddick/retirement-simulator/issues/4)

## Goal

Make unaffordable planned lump-sum withdrawals visible and auditable without changing the simulator's annual-budget success status, then prepare the deterministic simulator for a standalone v1.0.9 release.

The release includes the deterministic changes already recorded under `Unreleased`, including the age-60 access boundary, but does not publish Monte Carlo v0.8. Issue #1 remains open and issue #18 remains deferred.

## Problem

The engine already caps a withdrawal at available funds, but the projection currently records only the funded amount. A user can therefore request more than the model can provide without seeing the unfunded remainder. Completely unfunded withdrawals are especially opaque because there is no chart block to inspect.

This is a planning warning, not an annual-income failure. The existing red annual-budget shortfall status must remain authoritative and independent.

## Scope

### Included

- Preserve requested, funded and unfunded amounts for every enabled withdrawal due in a projection year.
- Preserve actual funding sources.
- Emit a lump-sum event even when the funded amount is zero.
- Show requested, funded and unfunded amounts in event and tooltip text.
- Add an aggregate amber warning for projected lump-sum funding shortfalls.
- Keep the chart limited to money actually withdrawn.
- Add deterministic regression and documentation coverage.
- Prepare and verify deterministic v1.0.9 release metadata, archive provenance and public documentation.
- Correct stale `Current behaviour` text in `docs/DEFERRED-REVIEW.md` while preserving its resolved statuses and historical rationale.

### Excluded

- Monte Carlo support for lump sums or any other remaining issue #1 parity work.
- Monte Carlo v0.8 publication or version-identity changes.
- Issue #18 financial-asset deeming changes.
- Changes to withdrawal priority, asset liquidation or annual-budget funding rules.
- Treating unfunded planned money as income, spending, debt or a negative asset balance.

## Behaviour Design

### Projection data

Each enabled withdrawal due in the current year produces one structured `lump-sum` event containing:

- the requested real-dollar amount;
- the funded real-dollar amount;
- the unfunded real-dollar amount;
- the requested source;
- the actual source-level draws;
- the reason and intended timing already available on the withdrawal.

Amounts use the same display basis as the existing event data. The funded and unfunded amounts must reconcile to the request within normal currency rounding.

Each projection row exposes the aggregate unfunded lump-sum amount for that year. The complete projection result exposes enough information to calculate total unfunded value and affected-withdrawal count without re-running funding logic in the UI.

Disabled withdrawals remain saved but produce no event, chart segment or warning.

### Event and tooltip output

Event text reports the request and outcome, for example:

> European holiday — requested $450,000; funded $119,108 from Savings; $330,892 unfunded.

Fully funded events may omit a redundant zero-unfunded clause, but the structured event retains `unfunded: 0`.

The chart continues to plot only the funded amount. A funded chart segment's tooltip includes requested, funded and unfunded context. A completely unfunded withdrawal has no chart segment but remains visible in the Event column and aggregate warning.

### Warning semantics

The existing annual-budget status is unchanged:

- green means no projected annual-budget shortfall;
- red means at least one projected annual-budget shortfall.

Lump-sum affordability is displayed separately:

- no amber warning when every enabled withdrawal is fully funded;
- an amber warning when any enabled withdrawal has more than the normal currency-rounding tolerance unfunded;
- the warning reports total unfunded value and affected-withdrawal count;
- red annual-budget and amber lump-sum warnings can appear together.

The warning is informational and must not alter `firstShortfall`, annual-budget KPI colours or retirement-income success calculations.

## Technical Approach

Extend the existing lump-sum projection event rather than introducing a parallel ledger. The engine is the authoritative place to calculate requested, funded and unfunded values. Presentation code derives event text, tooltip context and the aggregate warning from that structured result.

This avoids duplicating funding calculations in the UI and keeps CSV, event-table and chart consumers aligned. Existing drawdown and named-asset liquidation helpers remain unchanged except where their returned values must be reconciled into the event.

## Test Design

Add deterministic coverage for:

1. A fully funded withdrawal: requested equals funded, unfunded is zero, and no amber warning is produced.
2. A partially funded withdrawal: all three values reconcile, sources are retained, and event/tooltip text exposes the remainder.
3. A completely unfunded withdrawal: an event and amber warning exist while the charted lump-sum amount remains zero.
4. Multiple shortfalls: total unfunded value and affected count aggregate correctly while events remain individually auditable.
5. Disabled withdrawals: no event, chart amount or warning contribution.
6. Named-source and fallback funding: funded sources remain accurate and the shortfall is calculated after both paths.
7. Status independence: green annual-budget status can coexist with amber, and red can coexist with amber without either overwriting the other.
8. No negative balances or invented cash flow when a request exceeds available assets.
9. Documentation and version contracts for deterministic v1.09 while Monte Carlo remains v0.7 in-app and unreleased v0.8 work stays unpublished.

The existing deterministic and Monte Carlo suites must both remain green. Browser acceptance covers desktop and narrow layouts, dark and light themes, tooltip inspection, the zero-funded Event path, and simultaneous red/amber warnings. The documented real-iPad check remains a manual release gate.

## Release Design

### Deterministic v1.0.9 only

- Archive the exact tagged v1.0.8 deterministic executable as `archive/retirement-simulator-v1.0.8.html` and add provenance enforcement.
- Advance deterministic title, heading, explanatory copy and storage identity from v1.08 to v1.09 without changing schema solely for the release.
- Move deterministic entries from `Unreleased` into a dated v1.09 section, including issue #8 and issue #4.
- Keep the three Monte Carlo parity entries under `Unreleased` and retain Monte Carlo v0.7 identity in the repository until a separate v0.8 release.
- Update README, methodology/testing guidance, archive documentation and sanitized release screenshot where their active deterministic version or warning behaviour changes.
- Publish `retirement-simulator.html` as the deterministic release asset. Do not publish a Monte Carlo v0.8 asset.
- Require clean local state, passing automated suites, browser acceptance, successful CI and verified downloadable asset before closing issue #4.

## Issue State

Issue #4 is currently closed despite the acceptance criteria being unmet. Reopen it before implementation so GitHub reflects reality. Close it only after the v1.0.9 release asset is downloadable and verified.

Issue #1 remains open. Issue #18 remains open and explicitly outside this release.

## Alternatives Considered

### Presentation-only comparison

Rejected because it would force the UI to reconstruct funding outcomes and would not provide durable audit data for events, tables or exports.

### Separate top-level shortfall ledger

Rejected because it duplicates information naturally owned by the per-withdrawal event and creates reconciliation risk.

### Delay v1.0.9 until Monte Carlo v0.8

Rejected because the selected release boundary is deterministic-only. The Monte Carlo companion remains experimental and its unfinished parity work is already represented by issue #1.

## Acceptance Criteria

- Every enabled due withdrawal is individually auditable as requested, funded and unfunded.
- Fully, partially and completely unfunded paths behave as specified.
- Aggregate amber warning totals and counts are correct.
- Annual-budget red/green semantics remain unchanged and independent.
- Only funded money appears in chart values and asset movements.
- Disabled withdrawals remain inert.
- Both automated suites and browser acceptance pass.
- Outgoing v1.0.8 provenance is enforced.
- Deterministic v1.0.9 documentation and identity are consistent.
- Monte Carlo is not published as v0.8 in this release.
- The v1.0.9 asset is verified before issue #4 is closed.
