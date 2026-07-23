# Issue #36 Single-Household Design

**Date:** 2026-07-23

**Issue:** [#36 — Household: single-person modelling unsupported; removing Person 2 blocks recalculation](https://github.com/dcaddick/retirement-simulator/issues/36)

## Goal

Add correct single-person household modelling to the deterministic retirement simulator without deleting or silently repurposing Person 2 data. Single mode must use single-person entitlement and tax rules from the first projection year, exclude Person 2 completely, and preserve the existing couple model when the household switches back.

## Scope

### Included

- Deterministic `retirement-simulator.html` only.
- A persisted household type with explicit `couple` and `single` values.
- Schema migration and JSON round-trip support.
- Single-person projection state, validation, ownership, drawdown, interface and reporting.
- Single Age Pension, deeming, SAPTO, Medicare and CSHC treatment from year zero.
- Regression tests and public methodology/testing documentation.

### Excluded

- Monte Carlo model, interface, schema or parity work.
- Treating single mode as an actual first-death event.
- Transferring Person 2 assets to Person 1.
- Deleting Person 2 data when household type changes.
- Changing the fixed annual timing or the existing survivor-transition model.
- Release creation, tagging or closing the GitHub issue unless separately approved.

The experimental Monte Carlo tool does not promise support for deterministic schema-14 files. Its existing zero-volatility parity failure is a pre-existing baseline and is not part of issue #36.

## Alternatives Considered

### Explicit schema type with two retained person slots — selected

Add `household.type: 'couple' | 'single'`, retain the two-slot `people` array, and introduce a genuine single lifecycle state. This preserves existing data and limits the blast radius while making the household status auditable.

### Allow a one-person `people` array

Allowing `people.length === 1` is conceptually clean but requires widespread replacement of two-person arrays, ownership logic, chart and table contracts, CSV output, migration code and tests. The larger migration risk is not justified for this issue.

### Seed the existing survivor state from year zero

This is rejected even though it is a smaller change. The survivor state applies configured survivor income and budget percentages, continuation rules and inheritance semantics. A single household's entered targets are already single-person targets and must remain at 100%.

## Persisted Schema and Migration

The deterministic schema advances from version 13 to version 14. The household object gains:

```js
household: {
  type: 'couple',
  // existing household fields
}
```

The schema-13-to-14 migration sets `household.type` to `couple`. Older schemas continue through the existing migration chain and then receive the same default. Import rejects any household type other than `couple` or `single`.

The `people` array remains exactly two slots internally. Switching to single does not modify Person 2 fields, ownership selections, first-death settings or couple drawdown configuration. Export and import preserve those inactive values so switching back to couple restores them.

## Lifecycle and Projection State

Couple mode retains the current initial lifecycle:

```js
{
  householdStatus: 'couple',
  alive: [true, true],
  survivorIndex: null
}
```

Single mode begins with an explicit `single` status and Person 1 as the only active person:

```js
{
  householdStatus: 'single',
  alive: [true, false],
  survivorIndex: null
}
```

The implementation must not infer single mode from a death event. It must route household-dependent rules through an explicit couple-versus-single decision. Where an existing helper needs the sole eligible person index, the caller supplies Person 1 directly rather than mislabelling Person 1 as a survivor.

Single mode:

- applies 100% of `targetAfterTax` and `annualBudget`;
- never calls the first-death transition;
- creates no death, inheritance, lapsed-loss or survivor-continuation event;
- gives Person 2 no salary, SG, super return, super draw, pension, tax or Age Pension allocation;
- follows Person 1's age for the projection horizon.

Actual couple-to-survivor projections remain unchanged and continue to use the configured survivor percentages.

## Ownership and Inclusion Contract

Single mode distinguishes the stored ownership label from the fraction included in the active household:

| Stored owner | Single-household inclusion |
|---|---:|
| Person 1 (`p0`) | 100% |
| Person 2 (`p1`) | 0% |
| Joint 50/50 (`joint`) | 50% |

Couple mode continues to include the complete household item and uses the existing person-level allocation rules.

A shared pure helper must determine the single-household inclusion fraction. It must be applied consistently to:

- cash and savings balances and interest;
- share quantity, value, cost base, dividends, franking credits, gains, losses and sale proceeds;
- Other Income cash flow and tax allocation;
- Other Asset value, growth, deemable value and disposal proceeds;
- Age Pension assets and financial assets;
- CSHC assessed income;
- current-assets KPIs and all other reported totals.

Scaling must occur in runtime projection state or derived flows. It must not mutate the stored scenario. For a joint shareholding, both market value and cost base are scaled to 50%, so later CGT remains internally consistent.

Person 2-owned records are filtered before numeric processing. Their inactive values therefore cannot leak into totals or cause projection arithmetic errors. Joint records remain active and must be valid.

Drawdown logic constructs an effective single-person priority from the stored couple priority:

- remove `p1Super`;
- retain `p0Super`, cash and savings;
- remove empty tiers;
- preserve the stored priority unchanged for later couple restoration.

An existing lump sum that names `p1Super` treats that source as unavailable and uses the normal active-source fallback. New single-mode lump sums cannot select Person 2 super. Validation requires at least one usable funding source after filtering.

## Interface

Add a clearly labelled `Household type` control at the top of the left panel with `Couple` and `Single` choices. Changing it rerenders and recalculates immediately.

Single mode:

- renders only Person 1 personal and return fields;
- renders only Person 1 UK State Pension or defined-benefit fields;
- hides all first-death controls;
- hides Person 2-only income, share and Other Asset records;
- shows a compact count of hidden Person 2 records so inactive data is not mistaken for deleted data;
- shows joint records with a `50% included` indication;
- shows Person 2-owned fixed cash or savings only in the excluded-data summary;
- defaults new owned records to Person 1;
- removes Person 2 from available ownership and drawdown-source choices.

If a user changes an active record's stored ownership, that is an intentional scenario edit. Otherwise changing household type alone preserves all stored values.

Returning to couple mode restores the Person 2 fields, records, ownership choices, first-death settings and unfiltered drawdown order.

## Validation

Validation always requires a supported schema version, a valid household type and the internal two-slot structure.

In couple mode, the existing validation contract continues for both people and all records.

In single mode:

- validate Person 1 normally;
- do not validate inactive Person 2 field values;
- validate the ownership discriminator of owned records so inclusion can be determined;
- skip the remaining fields of a record owned solely by Person 2;
- validate joint and Person 1 records normally;
- ignore inactive first-death settings;
- validate the effective drawdown order and require at least one usable source;
- report errors only against controls that are active or meaningfully actionable in single mode.

If the household returns to couple mode, all restored Person 2 and first-death values are validated again. Invalid restored data may then pause recalculation under the existing last-valid-result behaviour.

## Rule Selection

From the first projection year, single mode must use:

- single Age Pension maximum rate, income test and assets test;
- the single deeming threshold;
- the single SAPTO eligibility limit and schedule;
- individual Medicare treatment with no couple-family reduction;
- the single CSHC threshold.

The implementation should reuse the already tested pure single/survivor rule helpers but must not reuse survivor spending, continuation, transfer or event semantics.

An integrated golden test will compare a single household's rule outputs with the equivalent established survivor-rule fixture while separately confirming the single household keeps 100% of its entered income and budget targets.

## Reporting and Export

Internal projection rows may retain fixed two-slot arrays to minimise engine churn, with inactive Person 2 values fixed at zero or `null` as appropriate. User-facing output must adapt to household type.

In single mode:

- omit the Person 2 age and super columns from the projection table and exported CSV;
- omit Person 2 chart series and legend entries;
- omit Person 2 tooltip rows;
- omit first-death markers and survivor-transition status cards;
- calculate KPIs from active balances only;
- describe the household as single in assumptions and exported scenario summaries.

Switching back to couple mode restores the existing output shape.

## Test Design

Add deterministic regression coverage for:

1. Schema 13 migration to schema 14 with `household.type === 'couple'`.
2. Rejection of an invalid household type.
3. Single JSON export/import preserving inactive Person 2 data, ownership and first-death configuration.
4. Couple-to-single-to-couple restoration without data loss.
5. Single validation ignoring malformed inactive Person 2 fields.
6. Couple validation detecting those same malformed restored fields.
7. Single lifecycle initial state, 100% targets and absence of death/inheritance events.
8. Person 2 salary, SG, super, pension and tax remaining zero.
9. Person 1, Person 2 and Joint inclusion at 100%, 0% and 50% for cash, savings, shares, Other Income and Other Assets.
10. Joint share value and cost-base scaling producing reconciled CGT.
11. Person 2 drawdown sources being unavailable and normal active-source fallback remaining functional.
12. A specific validation error when no usable single-person drawdown source remains.
13. Single Age Pension, deeming, SAPTO, Medicare and CSHC rules from year zero.
14. Equality with the relevant existing single/survivor rule fixtures without survivor target reductions.
15. Conditional rendering of Person 2 controls, records, chart series, table columns, tooltips and CSV columns.
16. Immediate recalculation after changing household type.
17. Existing two-person projection golden results remaining unchanged.

The complete deterministic suite must pass, along with JavaScript parsing and `git diff --check`. The Monte Carlo suite may be rerun as a non-regression observation, but its pre-existing zero-volatility parity failure is not an acceptance gate for this deterministic-only issue.

Browser verification must cover dark and light themes, desktop and iPad-width layouts, household switching, hidden-record disclosure, focus preservation, chart/table rendering and CSV output.

## Documentation

Update the in-app assumptions, `README.md`, `docs/MODEL-METHODOLOGY.md` and `docs/TESTING.md` to explain:

- single mode is a year-zero household status, not a simulated death;
- Person 2 data is retained but inactive;
- Person 2-owned items are excluded;
- Joint 50/50 items contribute only Person 1's half;
- changing ownership in couple mode changes what single mode includes;
- Monte Carlo does not support this deterministic schema contract.

## Acceptance Criteria

- A user can select Single and receive a recalculated deterministic projection.
- No Person 2 input is required or validated while single.
- Person 2 contributes nothing to balances, income, tax, pensions or output.
- Joint 50/50 items contribute exactly Person 1's half.
- Single Age Pension, deeming, SAPTO, Medicare and CSHC rules apply from year zero.
- Entered preferred income and essential budget remain at 100%.
- No death, inheritance or survivor-continuation behaviour is triggered.
- Person 2 output columns, series and tooltip rows are absent.
- Single scenarios round-trip without losing inactive couple data.
- Returning to couple restores the preserved data and existing calculations.
- Existing schema-13 couple scenarios migrate unchanged in behaviour.
- The deterministic regression suite passes completely.
