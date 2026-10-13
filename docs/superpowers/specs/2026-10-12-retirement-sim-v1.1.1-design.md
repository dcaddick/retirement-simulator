# Retirement simulator v1.1.1 design

> **Decision update — 13 October 2026:** Replace the interactive Cash + Savings buffer with static guidance for reviewing two years of spending and planned lump sums. Do not model its target, transfers, top-ups, or chart/table output. Projection and chart behavior follow the pre-buffer v1.1.0 flow. This user decision supersedes the #45 implementation details below.

## Goal

Deliver GitHub issues #44–#47 as a coherent v1.1.1 release. Make lump-sum outcomes easier to understand, give useful context for return assumptions, clarify normal and essential spending, and offer a transparent cash buffer. Keep the first-use experience approachable and retain deeper controls in Advanced.

## Scope and release boundary

Included:

- #44: Convert lump-sum event amounts for the selected display mode and disclose source/fallback funding.
- #46: Show contextual, non-blocking real-return warnings without changing assumptions.
- #47: Adopt Preferred as normal spending and Essential as the bad-year floor, with explicit migration review.
- #45: Add the configurable cash bucket, yearly transaction transparency, and its interaction with planned lump sums.
- Refresh the Age Pension, CSHC and deeming inputs whose published values changed on 20 September 2026, and correct the rate-currency warning so it evaluates each rate group against its own scheduled update dates.
- Update relevant in-app help, README and methodology/documentation, plus deterministic regression coverage.

Release label: **1.1.1**.

Out of scope: Monte Carlo parity (tracked separately by issue #1), return-to-inflation linking, Stress labeling, new stress controls, or changes to investment/tax/means-test rules. The bad-year trigger applies to Monte Carlo/stress projections; the deterministic projection does not independently invent bad-year returns.

## User experience

Use compact, contextual information rather than persistent warning cards. Place return guidance beside the relevant assumption. Add a small amber chart marker only for years with a relevant lump-sum funding event. In the event row, show requested, funded, and unfunded amounts, the requested source, and actual source breakdown. The table and visible CSV export must agree with the selected display mode.

The cash bucket is an optional model feature, not a new account or transfer of legal ownership. Explain its target and show annual starting balance, contributions/top-ups, spending, closing balance, and any skipped/limited top-up reason in the projection.

## #44: Lump-sum values and source disclosure

Keep engine event values in today’s dollars. Apply the selected display factor at presentation time to requested, funded, and unfunded values, matching the chart’s existing conversion. Avoid converting values both in the engine and renderer.

Retain the requested source and record the amounts actually drawn from each source. When the requested source cannot fully fund the event, state the amount it supplied, the fallback sources and amounts, and any remaining shortfall. Use the compact amber marker to make the year discoverable; provide equivalent accessible text in the event row/table. Ensure display-mode changes re-render labels as well as chart values. CSV export is based on the visible table and must retain the same converted values and funding detail.

## #46: Return assumption context

Calculate real return with the simulator’s existing `realReturnPct` convention and show a non-blocking warning when an assumption falls outside the chosen documented reference context. Apply consistently to the relevant super return assumptions and savings interest, and support manual inflation and Treasury-path inflation inputs.

Do not change or constrain user-entered values, prevent simulation, or silently classify a scenario as invalid. State that a reference range is context, not a universal “sensible” boundary. Show the source and effective date in accessible help. Keep return linking and Stress labels deferred. Before implementation, verify the reference source, dates, and numerical thresholds; do not encode an uncited or supposedly universal band.

For the approved first slice, use the issue's Growth super reference of 3.5% real with a ±1 percentage-point band (2.5%–4.5%), and Cash/Savings reference of 1.0% real with a ±1 percentage-point band (0.0%–2.0%). If no option selector is in scope, use the single super band and label it clearly as a Growth reference. Evaluate Treasury mode against horizon-average inflation and separately flag a single-year departure exceeding 2 percentage points from the accepted band. Issue-proposed link-to-inflation, adjustable-default action and Stress override remain outside this warning-only slice unless separately approved.

## #47: Spending semantics and migration

Preferred means normal planned spending. Essential means the minimum spending floor used when the bad-year condition applies. Apply the new meanings consistently to draw needs, survivor percentages, and explanations. In a bad year, reduce spending to Essential; avoid treating the difference as ordinary discretionary spending or as a newly banked surplus. Preserve the issue’s rule for deferrable lump sums and report any inability to meet Essential as a shortfall.

For the prior model’s `Preferred > Essential` data, migrate both new Preferred and Essential to the old Essential amount, and turn the cash bucket off. For equal values, preserve both values and turn the bucket off. Every scenario migrated from the previous schema receives a one-time review notice naming its prior Preferred and Essential amounts and explaining the new meanings. Do not silently retain the old Preferred amount as the new normal budget. Users can edit the new values after reviewing the notice. Keep migration idempotent and preserve unrelated scenario data.

The bad-year trigger is based on assets falling more than 10% below the planned path, as defined in issue #47. Keep trigger evaluation in the stochastic/stress context covered by the issue. Do not claim the deterministic path can exercise the bad-year floor unless a separately approved deterministic stress mechanism is added.

The issue defines the comparison at 1 July, uses the deterministic projection as the planned path, and makes the trigger percentage configurable with a 10% default. New lump-sum items are deferrable by default; in a bad year deferrable events move one year and non-deferrable events remain due. Recovery to Preferred occurs once assets return within the configured threshold. Keep the regular deterministic projection unchanged by this trigger. Because this release does not add a deterministic stress-path editor or Monte Carlo parity, document that the trigger/defer branch can only run when a supported stressed actual-asset path is supplied; do not imply the ordinary deterministic interface exercises it.

## #45: Cash bucket

Add `cashBufferYears`, defaulting to 2 and accepting 0 to disable. The target is `cashBufferYears` years of indexed Preferred spending plus planned lump sums due within the same upcoming horizon. Recompute the target yearly from the scenario’s indexed plan. The bucket balance is the combined value of the existing Cash and Savings accounts. Cash represents funds available on demand. Savings represents funds held for a higher return, typically in term deposits locked for 3–12 months. Keep both as their existing accounts with their own ownership, interest, and assessment treatment; the bucket is a virtual funding target, not a new asset or means-test exemption.

Do not imply that Savings is as immediately accessible as Cash. Preserve the simulator’s existing Savings access and annual transaction assumptions. Do not invent early-break penalties, deposit maturity schedules, or fractional-year interest adjustments unless the current model already represents them; if it does not, disclose that the annual projection treats Savings according to its existing yearly funding rules.

At each year boundary, apply the issue’s funding sequence: honor required pension/ABP minimums into the available bucket, use Cash before Savings when liquid-account draw order is needed, then draw eligible Cash and Savings before drawing more super, and top up toward the target from super following the current assessment/withdrawal tier order from issue #28. Never top up above target. A top-up is an internal funding movement, not income. Preserve existing tax and means-test calculations and expose all movements for reconciliation.

For planned lump sums, automatic funding uses the bucket first. A user-selected explicit source remains first; use the bucket for any remaining amount, then use the existing fallback tiers. Record all sources actually used. If the bucket is short and the event is deferrable in a bad year, defer according to issue #47; otherwise attempt the configured fallback and show any unfunded remainder. When the issue’s bad-year rule says to skip a top-up, keep the bucket below target and disclose why.

When disabled (`cashBufferYears = 0`), the projection must retain pre-bucket deterministic funding behavior, apart from the new spending semantics and #44 presentation fixes. Ensure bucket transactions cannot create or destroy value: reconcile opening liquid balances, top-ups, spending, interest and closing balances each year.

The setting is an integer number of years, defaults to 2, and 0 disables the feature. Its modeled horizon cannot extend past the remaining projection. In a bad year the user-selected rule may skip or halve the top-up; disclose the applied choice and resulting below-target balance. Show the target against the Savings series and mark years ending below target, with equivalent text/table data for accessibility and export.

## Rate refresh and currency warning

The currently published 20 September 2026 values have been verified against the official Services Australia and DSS Social Security Guide sources. Update the model constants and source register to the applicable effective date and checked date. The current values are: standard maximum Age Pension $1,237.70 per fortnight single and $1,866 combined couple; CSHC limits $105,048 single and $168,076 couple combined; deeming rates 1.75% and 3.75%, with thresholds unchanged at $66,800 single and $110,600 pensioner couple. The homeowner asset free areas remain $333,000 single and $499,000 couple; income free areas remain $226 single and $396 combined per fortnight. Verify all values and any annualisation in code against the cited official sources during implementation.

Replace the global-oldest-date test with source-specific scheduled-date checks: Age Pension amounts and thresholds use 20 March and 20 September; CSHC limits use 20 September; tax, SAPTO and Medicare use 1 July; deeming thresholds use 1 July while deeming rates have no regular indexation schedule; Work Bonus has no scheduled indexation. Each source retains an explicit checked date. A due date passed for one group must not make unrelated groups look stale. The summary notice names an out-of-date group and its due date, or states the next applicable scheduled review when none has passed. Unscheduled policy changes remain possible; readers can follow the dated source links.

Update the relevant entries in `docs/independent-review/source-register.csv`, the methodology and rate-currency tests to match the verified values. Keep the approximation and scope limits explicit; a current source check is not an independent validation of the model’s full entitlement calculations.

## Validation and acceptance

- Focused checks verify display-mode conversion for chart, event row, table, and CSV without double conversion; source fallback and shortfall totals reconcile.
- Return-warning tests cover values inside and outside the documented reference context, both inflation input modes, and confirm values and simulation results are not mutated by the warning.
- Rate-source tests cover current 20 September inputs, exact effective and checked dates, and per-source indexation schedules; a passed Age Pension round does not mark tax, SAPTO, Medicare, or unscheduled deeming-rate data stale by implication.
- Migration tests cover legacy Preferred greater than Essential, already-equal values, idempotent reload/import, prior-value review text, and unrelated scenario data preservation.
- Spending tests cover normal spending, bad-year Essential floor, trigger threshold, deferrable lump behavior, and Essential shortfall reporting within the supported deterministic/stress paths.
- Cash-bucket tests cover default target, disabled baseline, target calculation/indexing, top-up limits, withdrawal-tier order, pension minimum interaction, skip-top-up behavior, explicit versus automatic lump source order, exhausted sources, and annual balance reconciliation.
- Run the full deterministic test/check suite and focused browser flows. Confirm the release version and README remain consistent with v1.1.1.
- Do not claim Monte Carlo parity; retain it as a follow-up under issue #1.

## Implementation decisions to verify against the current code

Before coding, map the above flow onto current account types and transaction order. In particular, verify the existing Savings access and annual timing assumptions and ensure that using an explicit cash/savings source does not deduct the same balance twice. If current account semantics make the proposed sequence impossible without changing ownership, assessment, or taxation, stop and revise the design rather than silently altering those rules.

## Implementation clarifications approved 12 October 2026

Monte Carlo is permanently parked. Refresh its shared government constants only; no feature expansion or schema-15 import parity. Preserve its existing regression contract against the archived deterministic baseline.

Cash-buffer top-ups preserve the super owner in an internal Savings ownership ledger. Interest follows those balances; withdrawals reduce them proportionally. The lower-taxed partner may be a deliberate ownership choice, but the simulator does not automatically change beneficial ownership. Initial Savings and legacy non-buffer credits retain their configured owner. First death consolidates ownership to the survivor.

The ordinary deterministic path follows Preferred. `projectStressYear` is an engine entry point requiring the caller to supply the comparable deterministic opening Cash + Savings balance in today’s dollars; it applies Essential, deferral and skip/halve only after the threshold is exceeded. Callers remain responsible for annual lifecycle/preprocessing, as documented in the methodology. No stress UI or Monte Carlo integration is implied.
# Approved follow-up: return profiles and compact table audit (2026-10-13)

This addendum supersedes the narrower first-slice return-warning wording below where the two conflict. It records the user's approved UI behavior after reviewing the mockup.

Follow-up UI polish (2026-10-13): display direct links for Chant West, APRA, SuperRatings, Morningstar Australia, and RBA paid deposit data inside the table's Model assumptions and sources disclosure. Style those links with the same theme-aware accent used by Profile details. Every dashboard status banner gets an accessible dismiss button; dismissal lasts for the current page session and the same message, while changed content is shown again.

- Each person can select Conservative, Balanced, Growth, All Growth, or Custom. There is no provider/fund picker or lookup.
- Implemented super real-reference bands are Conservative 0.5–2.5% (midpoint 1.5%), Balanced 1.5–3.5% (2.5%), Growth 2.5–4.5% (3.5%), and All Growth 3.25–5.25% (4.25%). Savings Pot uses a separate 0–2% real band (midpoint 1%). These are project guidance bands, not a statistical confidence interval.
- Selecting a named profile sets that person's accumulation and retirement expected **nominal** returns to the profile's objective midpoint plus that person's average model inflation. Both values remain editable. Selecting Custom leaves both values unchanged. The nominal label must stay explicit.
- Compact out-of-band cue only: real-return percentage and `OUT OF BAND`, an (i) link to issue #46 for sources/methodology, and a per-field action to use the selected midpoint. Do not render persistent warning paragraphs.
- Cash on Hand has no historical-return warning; it is expected to earn a low rate. Savings Pot uses a separate 0–2% real contextual band, informed by RBA deposit-rate history and not presented as a super objective.
- The projection table keeps its primary columns uncluttered. Calculation logs are off by default and, when enabled by the checkbox below the table, appear in one final column containing cash-buffer reconciliation and capital-loss tax carry-forward detail.
- Capital losses originate when a realised disposal has allowable tax cost base above proceeds. They carry forward to offset eligible future capital gains under the existing tax model. Do not repeat a dormant balance as a yearly event; show it in the opt-in audit log, and show an event only in years a loss is realized or applied.

The broad profile ranges are contextual historical/objective evidence, not forecasts, guaranteed returns, advice, or a ranking of actual funds. The proposed objective midpoints are deliberately separate from category performance history. Three credible references for a source review are:

1. Chant West, *Super investment options: 10-year returns to 30 June 2025* (17 July 2025): annualised figures after investment fees and tax, before administration/advice fees; reports All Growth 9.0%, Growth 7.2%, Balanced 5.9%, Conservative 4.5%, and typical objectives spanning CPI+1.5% to CPI+4.25%. [Release and methodology](https://www.chantwest.com.au/media/lyvfjyzw/chant-west-media-release-17-july-2025-final.pdf).
2. SuperRatings, *Super delivers strong May return* (10 June 2026; returns to 31 May 2026): 10-year accumulation category returns including Balanced 7.4%, Growth 8.7%, and Capital Stable 4.4%, after investment fees and tax. Category definitions and source estimates differ from Chant West. [Release](https://www.superratings.com.au/2026/06/10/media-release-super-delivers-strong-may-return/).
3. APRA, *Superannuation product performance* (product-level performance and strategic-allocation data): use to inspect actual products and methodologies, not as a single comparable category median. [Dataset and methodology](https://www.apra.gov.au/superannuation/performance-and-transparency/superannuation-product-performance).

Additional context: Shane Oliver's October 2025 review reproduces historical balanced-option returns over two periods and cites Mercer, Morningstar, Chant West and AMP; it is useful secondary context rather than an independent raw category series. [Morningstar Australia](https://www.morningstar.com.au/retirement/why-super-returns-may-be-heading-lower). RBA's [F4 statistical tables](https://www.rba.gov.au/statistics/tables/) and [May 2026 bank funding/rate bulletin](https://www.rba.gov.au/publications/bulletin/2026/may/developments-in-banks-funding-costs-and-lending-rates.html) provide deposit-rate context for savings, not a super-profile calibration.

GitHub issue #46 could not be updated through the connected integration (HTTP 403, resource not accessible); this source register is kept locally until that integration permits an issue edit. The app's information link currently points to the existing issue URL.

