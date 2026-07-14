# Age-Gap Age Pension Design

**Date:** 2026-07-15  
**Release targets:** deterministic simulator v1.0.7 (`v1.07` in-app), experimental Monte Carlo v0.6  
**Issue:** [#6 — model Age Pension when only one partner is eligible](https://github.com/dcaddick/retirement-simulator/issues/6)

## Goal

Correct both projection engines so an age-gapped couple can receive an estimated Age Pension when exactly one partner has reached Age Pension age. Preserve the existing combined couple means tests, allocate the payment to the eligible person for tax, and leave same-age scenarios unchanged.

## Scope

### Included

- Deterministic simulator v1.0.7.
- Experimental Monte Carlo companion v0.6.
- Annual eligibility based on each projected age and the existing Age Pension age of 67.
- The existing combined homeowner-couple income and assets tests.
- Person-specific allocation of taxable Age Pension income.
- Existing treatment of superannuation under the Age Pension means tests.
- Regression tests, release documentation, archive handling, and browser verification.

### Excluded

- Residency, claim history, portability, transitional-rate, illness-separated, or special-circumstance eligibility.
- A manual eligibility override or new interface control.
- Work Bonus modelling or fortnight-level income timing.
- Changes to Age Pension thresholds, indexation policy, or the scenario schema.
- Other payments that the younger partner might receive.

## Policy Basis

The model continues to treat the household as a partnered couple. Services Australia publishes combined couple income and asset thresholds that also cover couples where only one partner is eligible. The eligible partner receives one partnered share of the means-tested combined couple rate rather than the single rate.

The younger partner's superannuation remains excluded while that person is below Age Pension age and the balance remains in the modelled super environment. When the younger partner reaches 67, their balance becomes assessable under the existing implementation.

Authoritative references checked for this design:

- [Services Australia, A guide to Australian Government payments, 1 July–19 September 2026](https://www.servicesaustralia.gov.au/sites/default/files/2026-06/co029-2607.pdf)
- [Department of Social Services, treatment of a non-income-support recipient partner's superannuation](https://guides.dss.gov.au/social-security-guide/4/8/2/40)
- [Department of Social Services, member-of-a-couple treatment](https://guides.dss.gov.au/social-security-guide/2/2/5/30)

The simulator remains an educational estimate, not a determination of entitlement or professional financial advice.

## Calculation Design

For each projection year, count how many people have reached age 67:

| Eligible people | Household Age Pension estimate |
|---:|---|
| 0 | `0` |
| 1 | `agePensionCouple({ assets, assessableIncome }) × 0.5` |
| 2 | `agePensionCouple({ assets, assessableIncome })` |

The calculation order is:

1. Build the existing combined assessable-income amount.
2. Build the existing combined assessable-assets amount.
3. Exclude a person's super balance while that person is under 67, as the current helper already does.
4. Calculate the full combined couple rate under both tests and take the lower result.
5. Multiply that result by `eligibleCount / 2`.
6. Convert the real estimate to the year's nominal amount using the existing inflation factor.

Applying the eligibility multiplier after the combined assessment preserves the published combined thresholds and cut-offs. It avoids duplicating the income and assets tests as separate per-person calculators.

## Person Allocation and Tax

Create a two-person allocation for the nominal household payment:

- No eligible people: `[0, 0]`.
- Only Person 1 eligible: `[householdPayment, 0]`.
- Only Person 2 eligible: `[0, householdPayment]`.
- Both eligible: `[householdPayment / 2, householdPayment / 2]`.

Each person's allocated amount enters only that person's taxable and rebate income. The existing age-based SAPTO and Medicare treatment continues to run per person. In a one-eligible year, none of the Age Pension is assigned to the younger person.

Household cash flow, target-income funding, charts, tables, visible-table CSV output, and Monte Carlo trial aggregation continue to use the household total. No new user-facing output column is required.

## Components and File Changes

### Deterministic simulator

`retirement-simulator.html` will:

- replace the `bothAgePensionAge` gate with an eligibility count and multiplier;
- create the per-person Age Pension allocation before tax calculation;
- use that allocation instead of splitting the household payment unconditionally;
- update the displayed version to v1.07; and
- update in-app assumptions text so it describes one-eligible treatment.

### Monte Carlo companion

The canonical `retirement-monte-carlo-v0.5.html` will be Git-renamed to `retirement-monte-carlo-v0.6.html` and receive the same eligibility and person-allocation logic. There will be no unversioned or duplicate Monte Carlo entry point.

### Tests and documentation

- `tests/retirement-simulator.test.mjs` will add deterministic unit and projection regressions.
- `tests/retirement-monte-carlo.test.mjs` will point to v0.6 and add equivalent companion regressions.
- `README.md`, `CHANGELOG.md`, `docs/MODEL-METHODOLOGY.md`, and `docs/TESTING.md` will describe the new releases and corrected boundary.
- `docs/DEFERRED-REVIEW.md` will retain issue #6 and mark it resolved in v1.0.7/v0.6.
- `archive/retirement-simulator-v1.0.6.html` will preserve the exact outgoing deterministic executable, and `archive/README.md` will record its provenance and hash.

## Compatibility

The scenario schema does not change. Existing saved deterministic scenarios and Monte Carlo-compatible imports remain valid.

For years where both partners are the same age relative to 67, results remain unchanged apart from release metadata and documentation. Age-gapped scenarios change only from the first year one partner reaches 67 until the second partner reaches 67, subject to indirect effects from the additional cash flow and corrected person-level tax.

## Error Handling and Boundaries

- The existing `includeAgePension` switch remains authoritative; when false, all Age Pension amounts and allocations are zero.
- Eligibility is evaluated annually from projected integer ages using `age >= 67`.
- The calculation supports either person being older and must not assume Person 1 reaches 67 first.
- The means-tested result remains clamped at zero by the existing rate helpers.
- No new validation errors or persisted fields are introduced.

## Testing

Both automated suites will cover:

1. Ages 66/66 produce zero.
2. Ages 67/66 produce half of the assessed combined couple payment.
3. Ages 66/67 produce the same household payment with reversed person allocation.
4. Ages 67/67 produce the full assessed combined couple payment.
5. The one-eligible payment appears only in the eligible person's taxable-income path.
6. Income above the couple free area continues to reduce the assessed combined rate before the eligibility multiplier.
7. Assets above the couple free area continue to reduce the assessed combined rate before the eligibility multiplier.
8. The younger partner's super is excluded at 66 and becomes assessable at 67.
9. Disabling the Age Pension produces zero for every age combination.
10. A multi-year age-gap projection transitions from zero to half to full treatment at the correct boundaries.
11. Existing same-age projection fixtures remain unchanged.
12. Deterministic and Monte Carlo engines agree on equivalent non-stochastic Age Pension inputs.

The full deterministic and Monte Carlo regression suites must pass. Browser verification will cover dark and light themes at desktop and narrow widths, confirm the v1.07 and v0.6 identities, exercise an age-gap scenario, and report no console errors or warnings.

## Release and Acceptance

Before editing the deterministic executable, copy the exact outgoing v1.0.6 file into the deterministic archive and record its hash. Publish only sanitized fictional sample data.

The release is accepted when:

1. both engines implement the approved zero/half/full eligibility behaviour;
2. Age Pension taxable income is allocated only to eligible people;
3. the existing combined means-test rules and younger-partner super exemption remain intact;
4. all automated and browser checks pass;
5. public and in-app documentation accurately describe the model boundary;
6. the deterministic executable, archive register, Monte Carlo filename, tests, and documentation identify the correct versions consistently; and
7. issue #6 and the deferred-review register are marked resolved only after the preceding checks pass.
