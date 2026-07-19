# Issue #18 Age Pension Other-Asset Deeming and v1.0.10 Release Design

**Date:** 2026-07-19

**Release target:** deterministic simulator v1.0.10 (`v1.10` in-app)

**Issue:** [#18 — Age Pension deeming excludes financial investments entered as Other Assets](https://github.com/dcaddick/retirement-simulator/issues/18)

## Goal

Allow the deterministic simulator to distinguish financial investments from non-financial items within Other Assets, include only the selected financial investments in Age Pension deeming, and publish the change as deterministic v1.0.10 without changing Monte Carlo.

## Problem

The deterministic simulator currently counts every Other Asset in the Age Pension assets test but excludes every Other Asset from deeming. That is appropriate for non-financial assets such as boats, vehicles and property, but not for assets that Services Australia treats as financial investments.

Services Australia lists public and private loans among financial investments and applies deeming to their gross value for the Age Pension income test. A zero-interest private loan can therefore be correctly included in the assets test while still being incorrectly omitted from deemed income in the current model.

This distinction does not extend to the Commonwealth Seniors Health Card. The CSHC test uses adjusted taxable income plus deemed income from account-based income streams. Ordinary Other Assets must not be added to the CSHC deeming balance. Actual interest, rent or other returns remain separate Other Income entries.

References:

- https://www.servicesaustralia.gov.au/financial-investments?context=22526
- https://www.servicesaustralia.gov.au/how-we-use-adjusted-taxable-income?context=41186

## Scope

### Included

- Add a persisted per-asset option to treat an Other Asset as a financial investment for Age Pension deeming.
- Default new and migrated assets to the existing non-deemed behaviour.
- Include selected, remaining asset value in the Age Pension financial-assets balance.
- Preserve the existing assets-test, growth, disposal, named-liquidation, survivor-transfer and reporting behaviour.
- Prevent double counting when an asset becomes savings through disposal or liquidation.
- Add deterministic migration, validation, projection, import/export, UI, reporting and documentation coverage.
- Prepare, publish and verify deterministic v1.0.10.

### Excluded

- Monte Carlo schema, adapters, compatibility logic, modelling, interface, documentation, tests, version identity or release assets.
- CSHC calculation changes.
- Automatic classification based on an asset label, currency, growth rate or any other entered value.
- CGT for Other Assets.
- Interest accrual, amortisation schedules or detailed loan-repayment modelling.
- New Other Asset ownership rules.

## Alternatives Considered

### Per-asset boolean — selected

Add `agePensionDeemed` to the existing Other Asset record. This directly represents the one user decision required, reuses the complete existing asset lifecycle and keeps old scenarios unchanged.

### Assessment-type enum

An enum such as `nonFinancial` or `financial` would leave room for more assessment categories, but no third category is currently required. It would add terminology and migration complexity without changing the immediate behaviour.

### Separate Financial Assets collection

A separate collection would make classification visually explicit but would duplicate growth, currency conversion, disposal, survivor transfer and named-liquidation behaviour. Maintaining two asset engines would create unnecessary reconciliation risk.

## Data Contract and Migration

Advance the deterministic schema from 12 to 13. Each Other Asset gains one required boolean:

```js
agePensionDeemed: false
```

`makeOtherAsset` sets the field to `false`. The schema-12-to-13 migration maps every existing Other Asset to an otherwise unchanged record with `agePensionDeemed: false`. This preserves the results of every existing saved or exported scenario.

Validation requires `agePensionDeemed` to be a boolean and reports the asset-specific path when it is not. The existing object-spread paths preserve the field through projection state, autosave and JSON export. Import continues to pass through migration before validation.

Other Assets remain household assets. First-death transition behaviour preserves the classification along with value, growth and disposal timing; no owner or survivor percentage is added.

## Interface Design

Each Other Asset editor adds a checkbox after Current value:

> Treat as financial investment for Age Pension deeming

The option is off by default. Nearby explanatory text states that:

- all Other Assets count in the Age Pension assets test;
- selected financial investments also contribute to Age Pension deemed income;
- the option does not change CSHC treatment; and
- actual interest, rent or other returns must be entered separately under Other Income.

The wording describes an assessment choice rather than suggesting the simulator can determine an asset's legal classification. No extra table column or chart series is introduced because the option changes assessment treatment, not asset value.

## Projection Design

Retain the existing annual timing:

1. Grow each unsold Other Asset at its configured nominal rate.
2. Process scheduled disposal into savings.
3. Process any named lump-sum liquidation and reduce the source asset.
4. Derive remaining Other Asset assessment balances.
5. Perform Age Pension assessment.

Introduce one pure helper that derives two nominal balances from the live, post-transaction Other Asset state:

- `totalOtherAssets`: the value of every unsold Other Asset;
- `deemableOtherAssets`: the value of unsold Other Assets whose `agePensionDeemed` value is `true`.

Convert both balances to today's dollars at the same boundary as the existing assessment. The Age Pension inputs become conceptually:

```js
financialAssets = assessableFinancialAssets + deemableOtherAssets;
assessableAssets = assessableFinancialAssets + totalOtherAssets;
assessableIncome = otherAssessableIncome +
  deemedIncome(financialAssets, householdStatus);
```

The assets-test balance is identical whether an Other Asset is flagged or unflagged. Only the financial-assets base passed to `deemedIncome` changes.

Deriving both balances after scheduled disposal and named liquidation makes transaction ordering explicit:

- disposed value is absent from Other Assets and present in savings;
- named-liquidation proceeds fund the requested lump sum immediately and are no longer part of year-end assessable assets;
- partial named liquidation leaves only the residual asset value in the Other Asset balances;
- full named liquidation leaves no residual asset value;
- remaining cash and savings continue to be included by `assessableFinancialAssets`;
- no asset value is counted twice.

The existing couple or single household status continues to select the matching deeming threshold. CSHC continues to receive only adjusted taxable income and account-based pension balance and is not passed either Other Asset balance.

## Reporting and Documentation

The projection table, chart and total-assets display retain the single combined Other Assets balance. Assessment classification is disclosed in the assumptions/audit output, including total asset count and count selected for Age Pension deeming.

Update:

- in-app Other Asset and methodology copy;
- README feature and release descriptions;
- `docs/MODEL-METHODOLOGY.md` with the financial/non-financial distinction and CSHC boundary;
- `docs/TESTING.md` with the deterministic coverage;
- CHANGELOG with the Issue #18 feature and v1.10 release;
- archive documentation and deterministic release screenshot.

Documentation must consistently state that classification affects Age Pension deeming only, does not change CSHC treatment, does not infer legal classification and does not replace separate modelling of actual returns.

## Validation and Test Design

Add deterministic automated coverage for:

1. `makeOtherAsset` defaults `agePensionDeemed` to `false`.
2. Schema-12 scenarios migrate to schema 13 with every existing asset set to `false` and unchanged projection results.
3. Non-boolean imported values fail validation at the correct asset path.
4. An unflagged asset preserves current Age Pension results.
5. A flagged $500,000 private loan enters the deemed financial-assets balance.
6. Flagged and unflagged forms produce identical assets-test and total-assets values while only Age Pension assessable income and the resulting pension may differ.
7. A mixed set of assets deems only flagged balances.
8. Couple and survivor projections apply their existing respective deeming thresholds.
9. Scheduled disposal transfers value to savings without losing or double counting assessable value.
10. Partial and full named liquidation assess only the post-funding balances.
11. Toggling the option does not change CSHC assessed income.
12. JSON export and import preserve the field.
13. Existing deterministic calculations remain green.

Browser acceptance covers checkbox editing, recalculation, autosave restoration, schema-12 import, assumptions output, desktop and narrow layouts, light and dark themes and the explicit CSHC explanatory boundary.

No Monte Carlo-specific tests are added or changed. Repository CI may continue to execute its existing unchanged checks.

## Release Design

Publish the feature as tag `v1.0.10`, displayed in the deterministic application as `v1.10`.

- Archive the exact tagged v1.0.9 deterministic executable as `archive/retirement-simulator-v1.0.9.html`.
- Record the v1.0.9 release-tag Git blob in `archive/README.md` and enforce provenance in the deterministic suite.
- Advance deterministic title, heading, explanatory copy and current storage key from v1.09 to v1.10.
- Retain the v1.09 storage key in the fallback list so local scenarios migrate automatically.
- Move the Issue #18 change from `Unreleased` into a dated v1.10 changelog section while leaving unrelated unreleased work in place.
- Update README, methodology, testing and archive documentation for the deterministic release.
- Produce a sanitized `docs/assets/retirement-simulator-v1.10.png` screenshot using fictional data.
- Publish `retirement-simulator.html` as the v1.0.10 release asset.
- Verify the clean release tree, deterministic suite, unchanged repository-wide CI, browser acceptance, tag and downloadable asset.
- Download the published asset and verify it before closing Issue #18.

Monte Carlo retains its current executable, schema, in-app version, documentation and release state. It is not included in the v1.0.10 release assets.

## Acceptance Criteria

- Every Other Asset has an explicit persisted Age Pension deeming choice.
- New and schema-12-migrated assets default to `false`.
- Flagged remaining value enters both the Age Pension assets test and deeming balance.
- Unflagged remaining value enters only the Age Pension assets test.
- Disposal and named liquidation do not lose or double count assessable value.
- Couple and survivor thresholds continue to operate correctly.
- CSHC assessed income is unaffected by the classification.
- Actual returns remain separate Other Income entries.
- Import, export, validation, assumptions, methodology and deterministic tests cover the field.
- Existing scenarios remain behaviourally unchanged until the option is enabled.
- Deterministic v1.0.10 identity, archive provenance, documentation and screenshot are consistent.
- The downloadable v1.0.10 asset is verified before Issue #18 is closed.
- No Monte Carlo artefact or behaviour is changed or published.
