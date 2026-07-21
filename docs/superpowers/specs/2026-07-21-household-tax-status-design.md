# Household Tax Status and Medicare Family Reduction Design

**Date:** 2026-07-21

**Issues:** [#21 — survivor SAPTO rates](https://github.com/dcaddick/retirement-simulator/issues/21), [#22 — couple SAPTO eligibility and transfer](https://github.com/dcaddick/retirement-simulator/issues/22), [#23 — Medicare family reduction](https://github.com/dcaddick/retirement-simulator/issues/23), and [#30 — SAPTO Medicare eligibility](https://github.com/dcaddick/retirement-simulator/issues/30)

**Additional correction:** non-refundable LITO and SAPTO ordering relative to Medicare levy

## Goal

Correct the deterministic simulator's household-dependent SAPTO and Medicare calculations while retaining an architecture proportionate to a transparent personal prototype. The change must distinguish eligibility, offset calculation, spousal transfer and Medicare treatment instead of compressing those decisions into the current `seniorEligible` boolean.

## Why This Design

The current tax helpers treat age 67 as sufficient for both SAPTO and the higher SAPTO Medicare thresholds. They also apply the member-of-couple SAPTO schedule in survivor years, omit combined-income eligibility and unused-offset transfer for couples, omit the Medicare family reduction, and subtract non-refundable offsets from income tax plus Medicare levy rather than from income tax alone.

A small household-tax context is the selected response because these defects share household status and person-level tax data. It gives the rules one auditable coordination point without replacing the existing projection engine or introducing a new scenario schema.

This choice is deliberately proportionate. The simulator is a prototype and personal hobby project, not a production tax platform intended for thousands of users. A scaled public service would likely need a separately versioned tax-rules module or service, jurisdiction and income-year configuration, richer household and dependant data, professional rule maintenance, effective-date governance, calculation-explanation screens, accessibility-tested user flows, privacy and security controls, audit trails, monitoring and stronger release processes. Those would be appropriate responses to a different operating context; they are not required to correct the supported prototype paths in this run.

## Scope

### Included

- Replace the overloaded age-only tax eligibility path with an explicit household-tax context.
- Use the single SAPTO schedule for survivor/single households and the member-of-couple schedule for partnered households.
- Separate SAPTO eligibility from the amount calculated from each person's rebate income.
- Apply the combined rebate-income eligibility limit for couples without using combined income to taper each person's offset.
- Apply the prescribed transfer of unused SAPTO when both partners qualify.
- Grant the higher SAPTO Medicare threshold only when the person has at least $1 of calculated SAPTO entitlement.
- Apply the childless-couple Medicare family-income reduction and statutory allocation between partners.
- Correct the ordering of non-refundable LITO and SAPTO so they reduce income tax but not Medicare levy.
- Preserve the later refundable-franking step and its existing reporting contract.
- Add source-backed unit, golden-master and integrated projection tests.
- Update public methodology, testing guidance and concise in-app assumptions.

### Excluded

- Monte Carlo issue #1 or any Monte Carlo schema, interface, model or release change.
- Dependent-child fields, threshold increases or user-interface controls.
- Full legal SAPTO eligibility inputs, including detailed residence, qualifying-payment, veteran, illness-separated, nursing-home, imprisonment and international-agreement conditions.
- Issue #31 projection-year to income-year redesign.
- Issue #32 long-range indexation-policy redesign.
- A new release version, tag, GitHub issue-state change or public verification claim unless separately approved.
- A general-purpose or multi-jurisdiction tax engine.

## Alternatives Considered

### Structured household-tax context — selected

Build one explicit context for household status, alive state, ages, individual and combined incomes, SAPTO eligibility, offset schedules, transfers and Medicare family treatment. Retain the existing person-level ledger as the consumer of the resulting amounts.

This makes the household dependencies visible, testable and reusable without expanding the persisted scenario format.

### Patch the existing functions

Additional booleans could be threaded through `saptoOffset`, `medicareLevy`, `netTax` and `projectionNetTax`. This would produce a smaller initial diff but keep eligibility, status and transfer decisions scattered. The existing `seniorEligible` defect demonstrates the risk of that design.

### Comprehensive tax engine

A separate rules engine could represent dependants, complete rebate income, residence, multiple jurisdictions and effective income years. That would be more suitable for a scaled service but is unnecessary complexity for the current prototype and would obscure the bounded corrections.

## Prototype Eligibility Contract

The current scenario cannot establish every legal condition for SAPTO. The approved prototype proxy is:

- the person is alive;
- the person is at least Age Pension age, represented as age 67 in the current model; and
- the applicable individual or combined rebate-income limit is satisfied.

For a survivor/single household, the single income limit and single offset schedule apply. For a couple, combined rebate income determines eligibility while each person's own rebate income determines their preliminary offset amount. A person below age 67 is not eligible under the proxy.

The methodology and in-app assumptions must state that age and modelled income do not prove legal SAPTO eligibility. Residence, qualifying-payment and exceptional conditions remain the user's responsibility and require professional confirmation for reliance.

The simulator continues to use taxable income as its available approximation of rebate income where it does not collect all statutory rebate-income components. Reportable employer contributions, deductible personal contributions, investment and rental losses, adjusted fringe benefits and other uncollected components remain an explicit limitation.

## Household Tax Context

Introduce a pure context builder receiving the data already available during a projection year:

- household status (`couple` or `single`/`survivor`);
- per-person alive state and age;
- per-person taxable income;
- per-person rebate income;
- projection year and inflation factor.

The context derives:

- individual and combined taxable income;
- individual and combined rebate income;
- the SAPTO eligibility result for each person;
- the applicable single or member-of-couple schedule;
- preliminary, transferred and final SAPTO for each person;
- each person's ordinary or SAPTO Medicare category;
- the applicable childless family threshold when partnered.

No context field is persisted. It is recalculated for each projected year from the live projection state.

## SAPTO Calculation

The calculation sequence is:

1. Determine prototype eligibility for each alive person.
2. For a couple, test the combined rebate-income eligibility limit.
3. Calculate the preliminary offset from each eligible person's own rebate income using the appropriate base amount, cut-in and 12.5% taper.
4. When both partners qualify, apply the transfer rules in the Income Tax Assessment (1936 Act) Regulations 2025. Do not implement transfer as a combined-income taper or informal swap of unused final offsets.
5. Record preliminary, transferred and final offsets separately.

The transfer calculation must use income tax payable before credits, rebates and Medicare levy, follow the prescribed base-rebate adjustment, and never create a negative donor amount. No transfer applies in a survivor year or when only one partner satisfies the approved eligibility proxy.

Reference authorities:

- ATO, Seniors and pensioners tax offset: https://www.ato.gov.au/myTax25OffsetsSAPTO
- Income Tax Assessment (1936 Act) Regulations 2025, sections 9–12: https://www.legislation.gov.au/F2025L01060/latest/text

## Medicare Levy Calculation

Calculate each person's individual levy first from their taxable income. Select the higher SAPTO individual threshold only when that person has at least $1 of final calculated SAPTO entitlement; age alone is insufficient.

For a partnered household, calculate childless family taxable income from the two non-negative taxable-income amounts and apply section 8 of the Medicare Levy Act 1986:

1. If family income does not exceed the applicable childless family threshold, no levy is payable by either partner.
2. Above that threshold, calculate the statutory family reduction from the levy otherwise payable.
3. Allocate the reduction between partners in proportion to taxable income, including the statutory excess-transfer treatment when one partner's reduction exceeds their levy.
4. Cap each person's final levy at zero or above.

For the statutory calculation performed for each partner, selection of the ordinary or SAPTO family threshold follows that partner's calculated SAPTO entitlement, not age alone. The household must not be assigned one global SAPTO family category when only one partner is entitled. Dependent-child increases are not approximated as zero without disclosure: the interface and methodology must expressly say the estimate supports a childless couple only.

Use the enacted 2025–26 annual-assessment thresholds and formulas already identified by the project's source register. Do not substitute PAYG withholding parameters for annual-assessment authority.

Reference authorities:

- ATO, Medicare levy reduction or exemption: https://www.ato.gov.au/myTax25MedicareLevy
- Medicare Levy Act 1986, section 8: https://www.legislation.gov.au/C2004A03351/latest/text

## Tax Ordering and Data Flow

For each person, compute:

```text
income tax after non-refundable offsets
  = max(0, resident income tax - LITO - final SAPTO)

net tax before refundable franking
  = income tax after non-refundable offsets + final Medicare levy
```

LITO and SAPTO must not reduce Medicare levy. Refundable franking remains a later step in the existing tax ledger and retains its current ability to produce an estimated refund.

The projection flow becomes:

1. Build person-level taxable and rebate-income ledgers.
2. Build the household-tax context once.
3. Calculate SAPTO eligibility, preliminary offsets and transfer.
4. Calculate individual Medicare amounts and the couple-family reduction.
5. Return a per-person breakdown to the existing ledger.
6. Apply refundable franking and existing household reporting.

The helper returns, for each person, gross resident income tax, LITO, preliminary SAPTO, SAPTO transferred in or out, final SAPTO, Medicare before family reduction, Medicare family reduction, final Medicare and net tax before franking. This breakdown is part of the internal audit contract, not a promise to expose a new production-scale calculation UI.

## Projection and Compatibility Boundaries

- Couple calculations use the household context while both people are alive.
- From the configured first-death transition year, the survivor uses the single eligibility limit, single offset schedule and individual Medicare calculation. Couple transfer and family reduction cease immediately.
- The deterministic projection's current annual timing is unchanged.
- The existing nominal income-tax/LITO and today-dollar Medicare/SAPTO convention is unchanged; issues #31 and #32 remain separate decisions.
- The scenario schema, import/export format, storage key and saved user data are unchanged.
- Existing callers of low-level exported helpers may be retained through narrow compatibility wrappers where that does not preserve incorrect behaviour. New integrated code must use the household calculation path.

## Interface and Documentation

No new data-entry control is required. Add concise assumptions text explaining:

- SAPTO is estimated using an age-and-income proxy;
- complete legal eligibility is not determined;
- couples use combined rebate income only for eligibility and individual rebate income for the offset amount;
- the Medicare family reduction assumes no dependent children;
- rates and limits are dated estimates that require revalidation.

Update `docs/MODEL-METHODOLOGY.md` and `docs/TESTING.md`. Record the architectural rationale: the household context is intentionally auditable and proportionate to a personal prototype, while a scaled service would need separated rules, richer inputs, maintained effective dates and a dedicated explanation interface.

## Validation and Test Design

Add source-backed tests for:

1. Single/survivor SAPTO below the cut-in, within the taper and at or above cut-out.
2. Member-of-couple preliminary SAPTO below the cut-in, within the taper and at or above cut-out.
3. Couple combined rebate income below and at the eligibility boundary.
4. Confirmation that individual rebate income, not combined income, determines each preliminary offset amount.
5. One age-eligible partner and two age-eligible partners.
6. Unused SAPTO transfer for an uneven-income couple, including donor, recipient and total reconciliation.
7. No transfer when only one partner qualifies or after first death.
8. Ordinary and SAPTO individual Medicare thresholds immediately below, at and above their boundaries.
9. Confirmation that age 67 alone does not grant the SAPTO Medicare threshold.
10. Childless family income below, at and above the applicable family threshold.
11. Proportional family-reduction allocation and excess transfer between spouses.
12. LITO and SAPTO reduce income tax to no less than zero but never reduce Medicare levy.
13. Refundable franking remains a later calculation and existing refund behaviour is preserved.
14. An integrated couple projection with uneven income.
15. An integrated couple-to-survivor transition using the single schedule immediately in the transition year.
16. Existing deterministic projections remain finite and reconciled.
17. The complete deterministic suite and unchanged Monte Carlo compatibility suite remain green.

Golden values must be hand-calculated from the cited rules and stored with enough intermediate values to identify whether a failure arose from eligibility, taper, transfer, family reduction or ordering. Repository tests remain internal regression evidence and must not be represented as professional verification.

## Acceptance Criteria

- Survivor/single years use the single SAPTO schedule.
- Partnered years use combined rebate income for eligibility and individual rebate income for each person's preliminary offset.
- Unused SAPTO transfers only when both partners qualify and follows the prescribed transfer calculation.
- A person uses SAPTO Medicare thresholds only when entitled to at least $1 of calculated SAPTO.
- Childless couples receive the applicable Medicare family reduction with reconciled allocation between partners.
- Dependent-child adjustments remain explicitly unsupported and no schema field is added.
- LITO and SAPTO cannot reduce Medicare levy.
- Refundable franking behaviour remains separately auditable.
- Couple-to-survivor transition changes the tax status in the configured transition year.
- The age-and-income proxy and missing legal eligibility inputs are clearly disclosed.
- The architectural rationale and production-scale boundary are documented.
- Deterministic and Monte Carlo compatibility suites pass.
- No Monte Carlo scope, tax-year mapping, indexation-policy or release work is introduced.
