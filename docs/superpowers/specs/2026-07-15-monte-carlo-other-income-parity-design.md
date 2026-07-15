# Monte Carlo Other Income Parity Design

**Date:** 2026-07-15  
**Status:** Approved for implementation planning  
**Issue:** [#1](https://github.com/dcaddick/retirement-simulator/issues/1)

## Objective

Add deterministic-parity support for Other income to the experimental Monte Carlo companion. Imported Other income must remain visible, editable and active in every projection path without weakening the explicit guards for unfinished feature groups.

This is the second of five approved issue #1 parity slices. It does not include Other assets because those assets can be named funding sources for lump-sum withdrawals and will be implemented with the later lump-sum slice.

## Scope

The slice supports the deterministic Other income fields without translation:

- label;
- currency (`AUD`, `GBP` or `USD`);
- foreign-currency-to-AUD rate;
- annual amount;
- taxable or non-taxable treatment;
- tax owner (`p0`, `p1` or joint 50/50); and
- percentage paid to the survivor after the owner's death.

Monte Carlo remains experimental. Issue #1 remains open, the companion stays at v0.7 during development, and no v0.8 release is published as part of this slice.

## Architecture

The Monte Carlo core will use a focused Other income helper that accepts the scenario entries, current lifecycle state and inflation factor. It will return person-level taxable and non-taxable nominal amounts. Keeping this calculation separate makes ownership, survivor treatment and indexing directly testable without running an entire stochastic projection.

The helper will follow the deterministic formula and ordering:

1. Convert the entered annual amount to AUD using `1` for AUD or the entry's `fxToAud` rate.
2. Apply the current cumulative inflation factor so the entered amount remains constant in today's dollars.
3. In survivor state, reduce an item owned by the deceased to its configured `survivorPct`, then allocate the continuing amount to the survivor. Other entries also become survivor-owned because the household is now single.
4. Allocate the amount to the taxable or non-taxable person-level ledger according to the entry's `taxable` flag and resolved owner.

The projection consumes those ledgers in the same places as the deterministic engine:

- taxable Other income is included in person-level taxable income;
- non-taxable Other income bypasses income tax;
- both types are included in the Age Pension income test;
- after-tax Other income contributes to household income and reduces required drawdown;
- output rows expose the corresponding Other income component; and
- resulting tax, pension, drawdown and asset balances remain auditable.

The central compatibility guard will stop rejecting populated `otherIncomes` only after this complete path exists. It will continue rejecting populated `otherAssets`, active Defined Benefit/UK Pension income, active lump sums and active share-return assumptions.

## Schema and import behaviour

Native schema 5 already contains an `otherIncomes` array. Deterministic schema versions 6 through 12 will retain their Other income entries through the existing adapter rather than having them removed or rejected.

Schema-4 to schema-5 migration continues to install an empty array for legacy native scenarios. No schema increment is required because schema 5 was established as the envelope for the five issue #1 parity slices.

Import validation runs after adaptation and before projection. A supported populated Other income array must survive JSON import unchanged except for existing schema-normalisation defaults.

## Interface

Add an Other income editor to the Monte Carlo modelling controls using the deterministic field set and interaction pattern. Users can add, edit and remove entries. Imported entries are never hidden.

Each entry exposes:

- label;
- currency;
- FX to AUD when the currency is not AUD;
- annual amount;
- taxable toggle;
- tax owner; and
- paid-to-survivor percentage.

The assumptions panel lists active Other income entries and states briefly that annual amounts are CPI-indexed and included in the Age Pension income assessment. The editor and assumptions copy must not imply that Other assets are supported.

## Validation and errors

Monte Carlo validation will match the deterministic rules and field paths:

- `otherIncomes` must be an array;
- label is required;
- currency must be AUD, GBP or USD;
- non-AUD FX rates must be finite and greater than zero;
- amount must be finite and zero or greater;
- taxable must be boolean;
- owner must be `p0`, `p1` or `joint`; and
- survivor percentage must be finite and between 0 and 100 inclusive.

Invalid imports are rejected with the first exact field path and a short reason through the existing import error flow. Projection code must not coerce malformed values into apparently valid results.

## Testing strategy

Tests will establish the behaviour before implementation and cover four levels.

### Import and validation

- A populated deterministic Other income entry survives schema adaptation and import.
- Every field validation rule reports the expected path.
- Other assets remain explicitly rejected.

### Pure helper behaviour

- AUD and foreign-currency conversion are correct.
- Annual amounts retain their real value through CPI indexation.
- Taxable and non-taxable entries reach separate person-level ledgers.
- `p0`, `p1` and joint ownership allocate correctly.
- First-death survivor continuation applies the configured percentage and moves the result to the survivor ledger.

### Deterministic parity

A zero-volatility fixture will compare Monte Carlo and deterministic rows year by year. It will cover:

- Other income components;
- person-level tax;
- Age Pension;
- household drawdown;
- total income; and
- total assets.

The fixture will include taxable, non-taxable, foreign-currency, jointly owned and survivor-continuing entries so parity is demonstrated across the supported field set.

### Stochastic and interface contracts

- Identical seeds produce identical results with active Other income.
- Every stochastic row retains finite income and non-negative finite asset balances.
- Active Other income materially changes household funding relative to the same scenario without it.
- Static interface tests cover all editor fields and the assumptions disclosure.
- Documentation tests retain the experimental label and record the remaining guards.

## Completion criteria

The slice is complete when:

- supported Other income imports without rejection or field loss;
- the full editor and assumptions disclosure are present;
- validation matches the deterministic contract;
- zero-volatility year-by-year parity passes;
- seeded stochastic tests and accounting invariants pass;
- deterministic and Monte Carlo regression suites pass;
- the Other income rejection is absent;
- the four remaining compatibility guards are present; and
- public documentation records the completed slice without publishing v0.8 or closing issue #1.
