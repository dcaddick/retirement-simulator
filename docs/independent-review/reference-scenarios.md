# Reference scenarios

> **Status: no independent review has been performed.**
> These are scenario designs only. No independent workpaper has been prepared, no simulator comparison has been made, and no case has passed or failed.

**Data restriction:** fictional inputs only.

## Purpose

This bundle defines reproducible cases for independent accounting, tax, retirement-planning and technical examination of the release described in [these materials](README.md). The catalogue in [`scenario-register.csv`](scenario-register.csv) identifies the cases and links them to [`evidence-register.csv`](evidence-register.csv). It deliberately contains no expected numerical results: a reviewer must derive those independently, from the law and the documented criteria, before looking at what the simulator produces.

## Independent-calculation protocol

For each scenario, the reviewer should:

1. Use the stable `RS-nnn` identifier from `scenario-register.csv` in every input, workpaper, result and finding artifact.
2. Use fictional people, households, assets and transactions only. Do not adapt a real client file or include information from which a real person could be identified.
3. Save either a complete input artifact or a complete, version-controlled input table. Record its filename, preparation date and hash in the workpaper so the case can be reproduced against the frozen simulator release.
4. Prepare the independent calculation from the cited authoritative sources and documented criteria without copying simulator outputs, regression expectations or implementation logic.
5. Record and lock the expected results before running or inspecting the comparable simulator output. Preserve the originally prepared expectation if a later correction is required; document the correction and reason separately.
6. State the source identifiers, effective dates, evidence identifiers and applicable reviewer procedure identifiers used for each expected result.
7. Define calculation precision, display precision and a result-specific tolerance before comparison. A tolerance must reflect only authorised or display rounding and must not conceal a systematic difference.
8. Capture the simulator artifact hash, runtime details, actual result, signed variance (`simulator result - independent expected result`) and factual outcome after the expected result is locked.
9. Raise any exception as an issue in the [public issue tracker](https://github.com/dcaddick/retirement-simulator/issues), or report it to whoever commissioned the work. Do not overwrite the original expected result, actual result or variance after a fix; record the retest separately so the history stays visible.
10. Record the reviewer's name, relevant capacity and preparation and review dates in their own workpaper.

Regression-suite values are not independent expected results. A scenario is complete only when another competent reviewer can reproduce both the independent workpaper and the simulator comparison from the recorded artifacts.

## Stable child-case identification and manifests

`scenario-register.csv` is the parent-scenario catalogue. Each parent that contains more than one comparison case must have a separate child-case manifest in its independent workpaper; the parent register is not expanded and its 13-column schema remains authoritative.

Every child case must use an immutable identifier in this form:

```text
RS-nnn-CASE-CODE
```

`RS-nnn` must match the parent scenario identifier. `CASE-CODE` must use uppercase ASCII letters, digits and hyphens only and must identify one reproducible input/expected-result comparison. Once a child identifier has been used, it must not be renamed or reused for a different case. A superseded child remains in the manifest with its status and replacement identifier recorded.

The exact child `case_id` must appear in:

- every input filename;
- the independent-workpaper filename and heading;
- the expected-result lock record;
- the simulator-output capture;
- the tolerance and variance record; and
- every linked finding record.

For example, artifacts for `RS-007-LITO-B01-LOW` begin with `RS-007-LITO-B01-LOW-`. Each parent workpaper must contain a child-case manifest with, at minimum: `case_id`, case title, input artifact and hash, independent workpaper, expected-result lock and timestamp, simulator output, tolerance, variance, evidence identifiers, procedure identifiers, finding identifiers, reviewer and status.

### Mandatory child-case catalogue

The following cases are the minimum required catalogue. Reviewers may add cases, but must not remove or silently combine these identifiers.

#### RS-004 - salary growth

- `RS-004-SALARY-ZERO` - zero salary-growth assumption.
- `RS-004-SALARY-POSITIVE` - positive salary-growth assumption with all other controlled inputs held constant.

#### RS-005 - minimum account-based pension drawdown

- `RS-005-AGE-B01-LOW`, `RS-005-AGE-B01-AT`, `RS-005-AGE-B01-HIGH` through `RS-005-AGE-B06-LOW`, `RS-005-AGE-B06-AT`, `RS-005-AGE-B06-HIGH` - below, at and above every implemented minimum-drawdown age-band transition, in ascending order. The manifest must map `B01`–`B06` to the authoritative age boundaries and factors effective for the test date.
- `RS-005-COMMENCEMENT-FIRST-YEAR` - first pension year and any commencement-year treatment.
- `RS-005-POST-GROWTH-BALANCE` - independently compare the legally or methodologically accepted balance basis with the simulator's post-growth retirement-phase balance timing.
- `RS-005-PAYMENT-ROUNDING` - calculation precision, prescribed rounding and displayed amount.

#### RS-006 - Age Pension, deeming and CSHC

- `RS-006-AP-NONE`, `RS-006-AP-PARTIAL-INCOME`, `RS-006-AP-PARTIAL-ASSET` - no entitlement and partial entitlement under each taper.
- `RS-006-AP-AGE-LOW`, `RS-006-AP-AGE-AT`, `RS-006-AP-AGE-HIGH` - Age Pension age gate.
- `RS-006-AP-INCOME-FREEAREA-LOW`, `RS-006-AP-INCOME-FREEAREA-AT`, `RS-006-AP-INCOME-FREEAREA-HIGH` and `RS-006-AP-INCOME-CUTOFF-LOW`, `RS-006-AP-INCOME-CUTOFF-AT`, `RS-006-AP-INCOME-CUTOFF-HIGH` - income-test full-rate and nil-rate boundaries.
- `RS-006-AP-ASSET-FREEAREA-LOW`, `RS-006-AP-ASSET-FREEAREA-AT`, `RS-006-AP-ASSET-FREEAREA-HIGH` and `RS-006-AP-ASSET-CUTOFF-LOW`, `RS-006-AP-ASSET-CUTOFF-AT`, `RS-006-AP-ASSET-CUTOFF-HIGH` - assets-test full-rate and nil-rate boundaries for the supported household class.
- `RS-006-DEEM-B01-LOW`, `RS-006-DEEM-B01-AT`, `RS-006-DEEM-B01-HIGH` - each supported deeming-rate threshold; add the next sequential `Bnn` triad if more than one is implemented.
- `RS-006-CSHC-INCOME-LOW`, `RS-006-CSHC-INCOME-AT`, `RS-006-CSHC-INCOME-HIGH` - CSHC income limit including the accepted deemed-income treatment.

#### RS-007 - tax, 2025–26 Medicare, LITO and SAPTO

- `RS-007-TAX-B01-LOW`, `RS-007-TAX-B01-AT`, `RS-007-TAX-B01-HIGH` through `RS-007-TAX-B04-LOW`, `RS-007-TAX-B04-AT`, `RS-007-TAX-B04-HIGH` - every resident tax-bracket boundary represented for the tested income year, in ascending order.
- `RS-007-MED-LOW-INCOME-LOW`, `RS-007-MED-LOW-INCOME-AT`, `RS-007-MED-LOW-INCOME-HIGH` - the applicable 2025–26 Medicare levy low-income threshold.
- `RS-007-MED-PHASEIN-END-LOW`, `RS-007-MED-PHASEIN-END-AT`, `RS-007-MED-PHASEIN-END-HIGH` - the applicable 2025–26 Medicare levy phase-in endpoint. Add distinct child triads for every supported taxpayer or family class.
- `RS-007-LITO-B01-LOW`, `RS-007-LITO-B01-AT`, `RS-007-LITO-B01-HIGH` through `RS-007-LITO-B03-LOW`, `RS-007-LITO-B03-AT`, `RS-007-LITO-B03-HIGH` - maximum-offset, taper-change and cut-out boundaries, including non-refundability.
- `RS-007-SAPTO-SHADEOUT-LOW`, `RS-007-SAPTO-SHADEOUT-AT`, `RS-007-SAPTO-SHADEOUT-HIGH` and `RS-007-SAPTO-CUTOUT-LOW`, `RS-007-SAPTO-CUTOUT-AT`, `RS-007-SAPTO-CUTOUT-HIGH` - the supported SAPTO taper and cut-out boundaries. Add distinct triads for each supported relationship or eligibility class.

Each `Bnn` code must be mapped in the child manifest to the exact source-backed threshold and effective income year. Medicare assessment cases must not use PAYG withholding parameters as their authority.

#### RS-011 - UK State Pension, currency and UPP

- `RS-011-FROZEN-UPRATING` - fictional pension held at the accepted frozen rate.
- `RS-011-INDEXED-UPRATING` - fictional pension using the supported indexed assumption.
- `RS-011-CURRENCY-CONVERSION` - independently sourced amount and exchange-rate treatment.
- `RS-011-UPP-ZERO` - no UPP deduction.
- `RS-011-UPP-POSITIVE` - a separately supported fictional UPP assumption, without treating the simulator as determining eligibility.
- `RS-011-COMMENCEMENT-YEAR` - first projected year of UK State Pension cash flow and taxable-income treatment.

#### RS-012 - shares and the 1 July 2027 CGT transition

- `RS-012-CGT-PRE-2027-07-01` - CGT event immediately before the transition.
- `RS-012-CGT-ON-2027-07-01` - CGT event on the transition date.
- `RS-012-CGT-POST-2027-07-01` - CGT event immediately after the transition.
- `RS-012-CGT-LOSS-ORDERING` - capital-loss ordering before application of any discount.
- `RS-012-CGT-TRANSITION-EXCEPTION` - any source-backed exception or transitional treatment applicable to the fictional facts.

#### RS-014 - invalid and unsupported inputs

- `RS-014-MISSING-REQUIRED` - required field absent.
- `RS-014-MALFORMED-NUMERIC` - non-numeric or non-finite content in a numeric field.
- `RS-014-OUT-OF-RANGE` - numeric, age or date value outside the supported range.
- `RS-014-CONTRADICTORY-DATES` - mutually inconsistent birth, retirement, commencement or projection dates.
- `RS-014-UNSUPPORTED-COMBINATION` - internally valid fields forming a deliberately unsupported scenario.
- `RS-014-MALFORMED-IMPORT` - syntactically invalid import content.
- `RS-014-LEGACY-MISSING-FIELD` - older supported schema with an absent later field.
- `RS-014-UNKNOWN-FIELD` - unrecognised imported field and the documented ignore-or-reject behaviour.

#### RS-015 - explicit Single household

- `RS-015-SINGLE-YEAR-ZERO` - single-status tax, Age Pension, deeming and CSHC rules applied from the first projection year.
- `RS-015-OWNERSHIP-P2-ZERO` - a Person 2 owned cash, savings, share, Other income and Other asset record, each contributing zero.
- `RS-015-OWNERSHIP-JOINT-HALF` - a Joint 50/50 record of each type contributing exactly half.
- `RS-015-DRAWDOWN-INACTIVE-SOURCE` - a configured tier naming a Person 2 source, which must be omitted.
- `RS-015-REPORT-PERSON1-ONLY` - tables, CSV export, chart, tooltips, headline assets and assumptions showing Person 1 only.
- `RS-015-ROUNDTRIP-PRESERVATION` - Couple to Single to Couple, confirming every preserved Person 2 input is unchanged.

#### RS-016 - fixed first death and survivor state

- `RS-016-ORDER-START-OF-YEAR` - the transition applied before that year's income, tax, returns and drawdown.
- `RS-016-ASSET-TRANSFER` - cash, savings, shares and Other assets transferred once, with characteristics preserved.
- `RS-016-INHERITED-SUPER-PHASE` - inherited super held separately by phase and source return assumption until a later phase transition.
- `RS-016-CONTINUATION-PERCENT` - configured UK State Pension and Other income continuation percentages paid to the survivor.
- `RS-016-SPENDING-STEP` - Preferred Retirement Income and Essential Annual Budget stepping to their survivor percentages.
- `RS-016-SINGLE-RULES-FROM-TRANSITION` - single Age Pension, CSHC and tax rules from the transition year, with the horizon following the survivor.
- `RS-016-LOSS-LAPSE` - the deceased person's unused capital losses lapsing.

#### RS-017 - household tax assessment order

- `RS-017-ORDER-OFFSETS-BEFORE-MEDICARE` - a case where an offset would otherwise reduce the Medicare levy, confirming that it does not.
- `RS-017-OFFSET-FLOOR-ZERO` - non-refundable offsets exceeding gross income tax, floored at zero.
- `RS-017-FRANKING-LAST` - a refundable franking credit applied after all non-refundable offsets.
- `RS-017-STAGE-DIVERGENCE` - a case where the base-income, ordinary-income and total-income assessments differ.

#### RS-018 - SAPTO couple eligibility, taper and transfer

- `RS-018-COMBINED-LIMIT-LOW`, `RS-018-COMBINED-LIMIT-AT`, `RS-018-COMBINED-LIMIT-HIGH` - the couple combined income limit that decides eligibility.
- `RS-018-INDIVIDUAL-TAPER` - each person tapered on their own rebate income while eligibility is combined.
- `RS-018-TRANSFER-FLOOR-LOW`, `RS-018-TRANSFER-FLOOR-AT`, `RS-018-TRANSFER-FLOOR-HIGH` - the transfer income floor.
- `RS-018-TRANSFER-DONOR-RECIPIENT` - donor and recipient base amounts before and after the prescribed transfer.
- `RS-018-REBATE-INCOME-PROXY` - a case where taxable income and true rebate income would differ, recording the approximation.

#### RS-019 - Medicare individual and family thresholds

- `RS-019-IND-ORDINARY-LOW`, `RS-019-IND-ORDINARY-AT`, `RS-019-IND-ORDINARY-HIGH` and the matching phase-in endpoint triad.
- `RS-019-IND-SAPTO-LOW`, `RS-019-IND-SAPTO-AT`, `RS-019-IND-SAPTO-HIGH` and the matching phase-in endpoint triad.
- `RS-019-FAMILY-THRESHOLD-LOW`, `RS-019-FAMILY-THRESHOLD-AT`, `RS-019-FAMILY-THRESHOLD-HIGH` - the childless-couple family threshold.
- `RS-019-FAMILY-SPOUSE-NIL-LEVY` - the spouse would otherwise owe no levy, so the liable partner receives the full reduction.
- `RS-019-FAMILY-SPOUSE-LIABLE` - proportional allocation and transfer of excess reduction where the spouse would otherwise owe levy.
- `RS-019-CATEGORY-BY-ENTITLEMENT` - a person of qualifying age with nil final SAPTO entitlement, confirming the ordinary category applies.
- `RS-019-DEPENDENT-INCREMENT-DISCLOSURE` - confirmation that the unapplied per-child increment is disclosed rather than silently ignored.

#### RS-020 - dividends, franking and capital losses

- `RS-020-DIV-FULL-YEAR`, `RS-020-DIV-PART-YEAR`, `RS-020-DIV-SOLD-MID-YEAR` - holding-period dividend exposure.
- `RS-020-DIV-OWNERSHIP` - dividends and credits following the holding owner, including a Joint holding.
- `RS-020-FRANKING-REFUND` - a refundable credit in a zero-tax year and the same credit in a positive-tax year.
- `RS-020-LOSS-ORDER-NON-DISCOUNT-FIRST` - losses applied to non-discount gains before discount-eligible gains.
- `RS-020-LOSS-CARRY-FORWARD` - unused losses carried to a later year from a zero opening balance.
- `RS-020-CGT-FUNDING-PATH` - CGT funded from savings then tiers, with no amount counted as retirement income.

#### RS-021 - Other Asset deeming and unfunded lump sums

- `RS-021-DEEM-INCLUDED` - an Other Asset marked as a financial investment, in both the assets test and the deemed balance.
- `RS-021-DEEM-EXCLUDED` - the same asset unmarked, in the assets test only.
- `RS-021-DEEM-DISPOSAL` - scheduled disposal moving value to savings before assessment, without double counting.
- `RS-021-DEEM-LIQUIDATION` - named liquidation funding a lump sum, without double counting.
- `RS-021-DEEM-CSHC-UNCHANGED` - confirmation that CSHC deeming is unaffected.
- `RS-021-LUMP-PARTIALLY-FUNDED` - a plan larger than every available source, reconciling requested, funded and unfunded amounts.
- `RS-021-LUMP-WARNING-SEPARATION` - the funding warning raised without changing the essential-budget shortfall.

Any other parent scenario implemented with multiple input comparisons must define stable child identifiers in its manifest before expected results are prepared.

## Boundary-case rules

Every regulated numeric threshold that the annual model can represent must be tested at three points:

- **Immediately below:** the closest valid model input below the threshold. Use one dollar for whole-dollar income or asset inputs, one day for date-based rules, one year for whole-year age inputs, or the smallest supported unit for other fields.
- **At boundary:** the exact legal or documented threshold using the same units and effective period as the authoritative source.
- **Immediately above:** the closest valid model input above the threshold using the same unit selected for the below case.

The workpaper must explain any coarser model input that prevents use of the legal rule's smallest unit. It must distinguish legal calculation precision from display rounding and must not infer correctness from continuity alone.

Date-dependent rules must use the applicable effective period. Required cases include:

- resident income-tax brackets, LITO and SAPTO thresholds and tapers for the modelled income year;
- 2025–26 Medicare levy assessment thresholds and phase-in limits, kept distinct from parameters used for PAYG withholding from 1 July 2026;
- Age Pension age, income-test, assets-test and deeming thresholds, including no-entitlement, partial-entitlement and threshold cases;
- Commonwealth Seniors Health Card income and deemed-income thresholds for the tested effective date;
- superannuation access ages and account-based pension minimum-drawdown age bands;
- CGT events immediately before, on and after the 1 July 2027 transition, including applicable loss ordering, discount and exception treatment;
- the SAPTO couple combined income limit and the transfer income floor, tested separately from the individual taper; and
- Medicare individual and childless-couple family thresholds and phase-in endpoints, tested separately for the ordinary and SAPTO categories.

Where the annual model cannot express an intra-year boundary, the reviewer must use the nearest representable annual cases, identify the omitted intra-year distinction and assess the annual-timing simplification rather than treating it as an exact test.

## Transition-year rules

The scenario workpapers must identify the first and last affected projection years and test calculation ordering for:

- each person's retirement year, including two people retiring in different years;
- the accumulation-to-retirement-phase transition and first pension payment;
- the first year superannuation becomes accessible under the accepted simplified access model;
- account-based pension commencement, including commencement-year treatment, age-band changes, rounding, and the simulator's use of the post-growth retirement-phase balance for its minimum-payment calculation;
- the year employment or other income ends and its effect on household cash flow, taxable income and benefit eligibility;
- commencement of Age Pension, defined-benefit income or UK State Pension;
- indexed Age Pension, deeming and CSHC settings where their effective dates do not align with a projection-year boundary;
- pre-transition, transition-date and post-transition CGT events around 1 July 2027;
- the year of a fixed first death, tested against the preceding and following years, including the ordering of the transition within the annual sequence; and
- a change of household type between Couple and Single, confirming that the change takes effect from the first projection year rather than part way through the model.

Each transition case must record whether the expected outcome follows an exact rule or an explicitly accepted annual-model approximation.

## Catalogue field rules

- `input_file` and `independent_workpaper` remain `Not yet prepared` until controlled artifacts exist.
- `expected_output` remains unset as a numerical result until the independent workpaper is prepared and locked.
- `simulator_output`, `tolerance` and `variance` remain unrecorded until the independent expectation is complete.
- `status` remains `Designed - independent workpaper not yet prepared` during this design stage.
- `evidence_ids` must exist in `docs/independent-review/evidence-register.csv`; scenario workpapers must also record the applicable procedure identifiers from those evidence records.
- `finding_ids` remains `Not assigned` unless a factual exception is entered in the findings register.
- Parent rows do not replace child-case traceability; every multi-case parent must maintain the child manifest defined above.
