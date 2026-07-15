# Monte Carlo Defined Benefit and UK Pension Parity Design

**Date:** 2026-07-15  
**Status:** Approved for implementation planning  
**Issue:** [#1](https://github.com/dcaddick/retirement-simulator/issues/1)

## Objective

Replace the obsolete Monte Carlo private-pension model with the current deterministic Defined Benefit/UK State Pension contract. Supported pensions must import without loss, remain visible and editable, and produce the same year-by-year results under zero volatility.

This is the third of five approved issue #1 parity slices. Monte Carlo remains experimental, stays at v0.7 during development and is not released as v0.8 in this slice.

## Current deterministic contract

The deterministic simulator uses one shared person-level field set for two modes:

- Australian Defined Benefit, where entered annual amounts are already AUD; or
- UK State Pension, where entered annual amounts are GBP and use the scenario GBP/AUD rate.

The scenario carries:

- `assumptions.ukPensionsEnabled`;
- `assumptions.gbpAud`;
- `assumptions.uppPct`;
- each person's `ukStateAnnualGbp`;
- each person's `ukStateStartAge`;
- each person's `ukStateIndexation` (`frozen` or `cpi`); and
- each person's `ukStateSurvivorPct`.

The current deterministic interface treats `gbpAud === 1` as Australian Defined Benefit mode and any other positive rate as UK State Pension mode. This slice preserves that exported-data contract rather than introducing a new schema field.

## Scope

The slice supports:

- the global include/exclude toggle;
- Australian Defined Benefit amounts in AUD;
- UK State Pension amounts in GBP with GBP/AUD conversion;
- configured start age;
- fixed nominal or CPI-linked indexation;
- the UK UPP deduction for taxable income;
- person-level tax allocation;
- Age Pension income assessment;
- first-death survivor continuation; and
- reporting and assumptions disclosure.

It removes the obsolete Monte Carlo private-pension lump-sum/annuity controls and calculations from the active model.

## Legacy private-pension migration

Legacy native Monte Carlo scenarios may contain `ukPrivateAmountGbp`, `ukPrivateTakeAge` and `ukPrivateType`. Schema-4 to schema-5 migration will preserve those values using the same conceptual conversion as the deterministic migration:

- a non-zero lifetime annuity becomes a taxable GBP Other income entry;
- a non-zero lump sum becomes a GBP Other asset with disposal year derived from take age; and
- the obsolete private-pension fields are removed from each person.

Converted annuities receive joint ownership and zero survivor continuation, matching the deterministic migration defaults applied later in its schema chain. Converted lump sums remain protected by the existing populated Other assets compatibility guard until the Other assets/lump-sum slice is complete.

Current deterministic schemas 6 through 12 already omit private-pension fields and adapt directly into the supported schema-5 pension contract.

## Architecture and data flow

A focused pension-flow helper will calculate each person's annual pension from the current contract. It accepts the person, current age, inflation factor and scenario assumptions and returns the gross nominal pension plus its taxable nominal amount.

The calculation sequence is:

1. Return zero when pensions are disabled or the person has not reached the configured start age.
2. Apply an indexation factor of `1` for fixed/frozen pensions or the cumulative inflation factor for CPI-indexed pensions.
3. Multiply the entered annual amount by `1` in Defined Benefit mode or by `gbpAud` in UK State Pension mode.
4. In UK mode, reduce the gross pension by the configured UPP percentage for taxable-income purposes. Defined Benefit mode uses the full gross amount as taxable under the simulator's existing simplified treatment.
5. Allocate each living person's pension to their tax ledger.
6. After first death, calculate the deceased person's otherwise-payable pension and multiply it by `ukStateSurvivorPct`; allocate that continuing amount and its taxable amount to the survivor.

Gross pension income enters the Age Pension income test and household funding. Taxable pension income enters the person-level tax ledger. Estimated tax is allocated consistently across taxable sources, and the resulting net pension reduces required drawdown.

Disabled pensions remain stored but contribute zero to every calculation and do not appear as an active income source.

## Interface

Replace the obsolete Monte Carlo pension controls with the current deterministic editor:

- Include these pensions in the projection;
- Pension type: Australian Defined Benefit or UK State Pension;
- GBP to AUD rate in UK mode only;
- UPP deduction percentage in UK mode only;
- annual pension amount for each person;
- start age for each person;
- paid-to-survivor percentage for each person; and
- fixed/frozen or CPI-linked indexation for each person.

Defined Benefit mode labels amounts in AUD and uses Defined Benefit wording. UK mode labels amounts in GBP and uses UK State Pension wording. Turning the include toggle off dims and disables the pension fields without deleting entered values.

The assumptions panel identifies the selected mode, enabled state, each active pension's amount/start age/indexation/survivor continuation and, where applicable, GBP/AUD and UPP assumptions.

Obsolete private-pension amount, take-age and treatment controls must not remain visible.

## Validation and errors

Validation will reject:

- a non-boolean `ukPensionsEnabled` value;
- non-finite or negative annual pension amounts;
- start ages outside 55 through 80;
- indexation values other than `frozen` or `cpi`;
- survivor percentages outside 0 through 100;
- non-finite or non-positive GBP/AUD rates in UK mode; and
- UPP percentages outside 0 through 100.

Invalid imports report the first exact field path and a short reason through the existing import flow. Disabled pensions must still contain structurally valid stored values so later re-enabling cannot activate malformed data.

## Testing strategy

### Migration and import

- A current populated deterministic pension survives schema adaptation unchanged.
- A legacy lifetime annuity becomes Other income and loses obsolete private fields.
- A legacy lump sum becomes Other assets and is then rejected by the still-active Other assets guard.
- Disabled populated pensions import but remain inactive.

### Pure pension behaviour

- Pension income is zero before start age and active at start age.
- Fixed/frozen amounts remain nominally fixed.
- CPI-indexed amounts follow cumulative inflation.
- Defined Benefit mode uses entered AUD amounts.
- UK mode performs GBP/AUD conversion and applies UPP only to taxable income.
- Disabled state returns zero.
- Survivor continuation uses the deceased person's configured percentage and pays the survivor.

### Deterministic parity

A zero-volatility fixture will compare Monte Carlo and deterministic rows year by year across:

- gross and net pension income;
- person-level pension allocation;
- person-level tax;
- Age Pension;
- household drawdown;
- total income; and
- total assets.

Parity coverage will include both Defined Benefit and UK modes, fixed and CPI indexation, start-age boundaries, UPP treatment and a fixed first-death survivor transition.

### Stochastic and interface contracts

- Identical seeds produce identical results with active pensions.
- All rows retain finite income and non-negative finite assets.
- Active pensions materially change household funding relative to the same disabled scenario.
- Static interface tests cover all current controls and confirm obsolete private controls are absent.
- Assumptions and public documentation retain the experimental label and list the remaining compatibility guards.

## Completion criteria

The slice is complete when:

- current Defined Benefit and UK State Pension scenarios import without loss;
- legacy private pensions migrate according to the approved rules;
- the current full editor replaces obsolete controls;
- validation matches the deterministic contract;
- zero-volatility year-by-year parity passes;
- seeded stochastic tests and accounting invariants pass;
- the pension compatibility rejection is absent;
- the Other assets, lump-sum and share-return guards remain active;
- both regression suites pass;
- public documentation records the third issue #1 slice; and
- v0.8 is not published, nothing is pushed and issue #1 remains open.
