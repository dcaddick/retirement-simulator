# Changelog

This changelog summarizes public, non-personal milestones. Early development used many private prototype snapshots; those files are intentionally not reproduced in the public repository.

## 1.00 - 2026-07-10

- Consolidated the project into one canonical public repository.
- Replaced duplicated version snapshots with stable entry-point filenames.
- Added public contribution, testing, methodology, privacy and security guidance.
- Retained the deterministic simulator as the primary tool and labelled Monte Carlo analysis experimental.
- Replaced the high-balance generic defaults with a fictional Australian couple approaching retirement.
- Renamed the two household planning anchors to **Preferred Retirement Income** and **Essential Annual Budget**.
- Clarified that accumulation and retirement-phase inputs are estimated net returns after fees and tax.
- Moved model assumptions, sources and the step-by-step calculation method beneath the projection table.
- Grouped returns and inflation in the upper controls and added live long-run/near-term real-return spreads.
- Added a locally persisted light/dark theme switch to both tools.
- Made every left-panel section after People independently collapsible.
- Reframed pension inputs as **Defined Benefit/UK Pensions**, with Australian defined benefits first and UK State Pension second.
- Made share-price entry manual by default and labelled optional Stooq lookup as US-only.
- Disclosed the network and privacy effects of optional Stooq and Frankfurter requests.
- Updated Medicare low-income thresholds for 2025–26, checked 10 July 2026.
- Added CSP coverage to the experimental Monte Carlo page.
- Added GitHub Actions enforcement for both regression suites.
- Renamed the experimental companion entry point to `retirement-monte-carlo-v0.5.html` so its maturity cannot be confused with the deterministic v1.00 simulator.

## Deterministic simulator 0.99

- Added repeatable other-income and other-asset inputs.
- Added consistent today's-dollar and nominal-dollar display across tables, charts and headline figures.
- Expanded scenario migration and regression coverage.

## Deterministic simulator 0.98 series

- Improved live recalculation, validation visibility and recalculation status.
- Added clearer assumptions, rate disclosure and calculation explanations.
- Improved today's-dollar versus nominal-dollar presentation.

## Deterministic simulator 0.91–0.97

- Reframed the prototype as a reusable two-person simulator with fictional sample data.
- Added JSON import/export, schema migration and local autosave.
- Added flexible super-access timing and weighted drawdown priorities.
- Expanded tax, Age Pension, CSHC, asset, pension and chart behaviour.
- Added durable Node-based regression suites.

## Deterministic simulator 0.1–0.9

- Explored annual projections, income-by-source charts, minimum drawdowns, tax estimates and asset liquidation.
- Established the local-first, self-contained HTML architecture.

## Experimental Monte Carlo report 0.5

- Added selectable risk modes and terminal-reserve expectations.
- Added explicit deterministic stress overrides alongside stochastic runs.
- Kept stress results separate from the Monte Carlo probability denominator.
- Expanded risk-mode and stress regression coverage.

## Experimental Monte Carlo report 0.1–0.4

- Added seeded return-path simulation, budget sweeps, glide-path comparisons and deterministic stresses.
- Added progress, chart inspection, scenario explanations and validation.
