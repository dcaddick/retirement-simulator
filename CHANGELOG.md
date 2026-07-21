# Changelog

This changelog summarizes public, non-personal milestones. Early development used many private prototype snapshots; those files are intentionally not reproduced in the public repository.

## Unreleased

- Replaced the native `window.confirm()` prompts on the deterministic simulator's destructive actions (Reset sample, New, Remove income/asset, Remove shareholding) with a self-contained in-app confirmation modal, because iOS/iPadOS Safari can silently suppress the native dialog and leave those buttons dead ([#34](https://github.com/dcaddick/retirement-simulator/issues/34)).
- Reject experimental Monte Carlo super access ages below 60 because pre-60 withdrawal taxation is outside the simplified model ([#8](https://github.com/dcaddick/retirement-simulator/issues/8)).
- Established Monte Carlo schema 5 and salary-growth parity as the first issue #1 import-support slice; the companion remains experimental and the other compatibility guards remain active ([#1](https://github.com/dcaddick/retirement-simulator/issues/1)).
- Added Other-income parity as the second issue #1 Monte Carlo import-support slice, including currency conversion, CPI indexation, ownership, tax treatment and survivor continuation; four compatibility guards remain active ([#1](https://github.com/dcaddick/retirement-simulator/issues/1)).
- Added Defined Benefit/UK Pension parity as the third issue #1 Monte Carlo slice, replacing obsolete private-pension controls and preserving legacy values through migration; three compatibility guards remain active ([#1](https://github.com/dcaddick/retirement-simulator/issues/1)).

## 1.10 - 2026-07-19

- Added a per-asset option to include selected Other Assets as financial investments in Age Pension deeming while preserving assets-test treatment and leaving CSHC unchanged ([#18](https://github.com/dcaddick/retirement-simulator/issues/18)).
- Added schema 13 migration with existing Other Assets defaulted outside deeming.
- Archived the exact outgoing deterministic v1.0.9 executable.

## 1.09 - 2026-07-19

- Reject deterministic simulator super access ages below 60 because pre-60 withdrawal taxation is outside the simplified model ([#8](https://github.com/dcaddick/retirement-simulator/issues/8)).
- Report requested, funded and unfunded planned lump-sum withdrawals, with a separate amber funding warning that does not change annual-budget status ([#4](https://github.com/dcaddick/retirement-simulator/issues/4)).
- Archived the exact outgoing deterministic v1.0.8 executable.

## 1.08 - 2026-07-15

- Added an optional fixed first-death event at the start of the selected projection year, with immediate survivor spending targets, ownership transfer, deceased-income cessation and configurable continuing-income percentages ([#7](https://github.com/dcaddick/retirement-simulator/issues/7)).
- Preserved inherited super separately by phase and source return assumption, moved single-person Age Pension and CSHC rules into the transition year, and exposed the event in charts, tables and audit output.
- Released the experimental Monte Carlo companion as v0.7; every seeded path applies the same selected first-death event, while probabilistic mortality remains explicitly outside scope.
- Archived the exact outgoing deterministic v1.0.7 executable.

## 1.07 - 2026-07-15

- Corrected Age Pension projections for age-gapped couples: the existing combined couple means tests now pay one partnered share when exactly one person has reached age 67, with taxable pension income allocated only to that eligible person ([#6](https://github.com/dcaddick/retirement-simulator/issues/6)).
- Released the experimental Monte Carlo companion as v0.6 with the same Age Pension eligibility boundary and person-level tax allocation.
- Archived the exact outgoing deterministic v1.0.6 executable.

## 1.06 - 2026-07-14

- Added nominal share-price growth, holding-period cash dividends and optional ownership-aware franking credits, completing the approved share-return scope ([#5](https://github.com/dcaddick/retirement-simulator/issues/5)).
- Added per-person capital-loss ordering, same-year netting and carry-forward before the 50% CGT discount ([#9](https://github.com/dcaddick/retirement-simulator/issues/9)).
- Added a persisted Tax owner for Other taxable income; schema-10 scenarios migrate to Joint 50/50 ([#10](https://github.com/dcaddick/retirement-simulator/issues/10)).
- Separated CGT payment from retirement income, funding it from savings first and then the household drawdown tiers with an explicit unfunded amount ([#11](https://github.com/dcaddick/retirement-simulator/issues/11)).
- Added conditional share-dividend, franking-credit and CGT output plus capital-loss/CGT audit events; lump-sum withdrawals now also appear in the chart legend.
- Archived the exact outgoing v1.0.5 executable and added explicit Monte Carlo rejection for active v1.06 share-return assumptions.

## 1.05 - 2026-07-14

- Added an Excel-compatible CSV export of the currently visible projection table ([#12](https://github.com/dcaddick/retirement-simulator/issues/12)).
- Tidied Treasury real-return readouts and grouped the display/export table controls ([#13](https://github.com/dcaddick/retirement-simulator/issues/13)).
- Rejected malformed salary, SG, return and manual-inflation values before projection ([#14](https://github.com/dcaddick/retirement-simulator/issues/14)).
- Corrected the Age Pension couple income taper to 50 cents combined above the free area ([#15](https://github.com/dcaddick/retirement-simulator/issues/15)).
- Restored bracket creep for fixed nominal income-tax brackets and LITO, with the policy basis documented ([#16](https://github.com/dcaddick/retirement-simulator/issues/16)).
- Added a [deferred-review register](docs/DEFERRED-REVIEW.md) for material modelling limitations outside this release ([#17](https://github.com/dcaddick/retirement-simulator/issues/17)).

## 1.04 - 2026-07-13

- Fixed the v1.03 lump-sum summary renderer so adding a withdrawal after changing the Age Pension setting no longer raises `formatMoney is not defined` ([#2](https://github.com/dcaddick/retirement-simulator/issues/2)).
- Added optional compounded salary growth above inflation for each person, defaulting to 0%, with schema 10 migration and explicit Monte Carlo compatibility handling ([#3](https://github.com/dcaddick/retirement-simulator/issues/3)).
- Clarified UK State Pension chart tooltips with both the after-tax household allocation and gross pension value; the projection table remains gross.
- Added exact sanitized v1.0.1, v1.0.2 and v1.0.3 executable snapshots under `archive/` for public regression testing and comparison.

## 1.03 - 2026-07-12

- Collapsed completed lump sums into aligned modelling rows showing chevron, abbreviated amount, reason, intended month/year and an include checkbox.
- Kept the modelling checkbox available in the collapsed row; disabled plans remain visible with subdued styling.
- Added chevron expansion for editing funding details or removing an entry, while new incomplete entries open automatically.
- Added intended month planning and schema 9 migration. Existing year-only lump sums migrate to January; financial calculations remain annual.
- Extended Monte Carlo v0.5 compatibility handling to schema 9 while continuing to reject active unsupported lump sums explicitly.

## 1.02 - 2026-07-12

- Reduced chart tooltips to the selected year, household ages, source and essential amount context.
- Compacted each lump-sum editor into a 2x2 layout, ordered entries from latest year backwards, and added an **Include & calculate on chart** toggle so plans can be retained without affecting the model.
- Added an independently resizable, locally remembered projection-table height while keeping the chart height unchanged.
- Preserved the active view, open sections, focus and panel/table scroll positions during live modelling changes.
- Fixed the desktop controls panel height and widened its responsive layout for iPad portrait and landscape use.
- Refined the single Person 1 survival ribbon and kept its probability labels inside the chart horizon.
- Added schema 8 migration; the Monte Carlo adapter accepts disabled lump sums but continues to reject active unsupported cash flows explicitly.
- Made dark theme the fresh-install default and refreshed the public screenshot in that theme.

## 1.01 - 2026-07-12

- Added repeatable lump-sum withdrawals with amount, reason, year and funding-source priority.
- Kept lump sums outside annual income while reducing assets and recording actual funding in the Event column and chart tooltip.
- Added schema 7 migration so v1.00 scenarios continue to import.
- Defaulted the combined pension editor to Australian Defined Benefit mode.
- Renamed **Cash and savings** to **Cash & Savings** and made every control section independently collapsible.
- Compacted the header, widened the default desktop controls panel and added a locally remembered chart/table splitter.
- Added theme-aware chart colours, floating lump-sum blocks and shared one- or two-person illustrative survival ribbons.
- Monte Carlo v0.5 continues to reject unsupported populated cash flows explicitly rather than silently omit them; follow progress in [issue #1](https://github.com/dcaddick/retirement-simulator/issues/1).

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
