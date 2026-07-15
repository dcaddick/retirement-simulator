# Monte Carlo Schema 5 and Salary-Growth Parity Design

**Date:** 2026-07-15
**Issue:** [#1 Support deterministic cash flows in Monte Carlo imports](https://github.com/dcaddick/retirement-simulator/issues/1)
**Status:** Approved for implementation planning

## Purpose

Create the native scenario foundation for Monte Carlo v0.8 and deliver the first of five deterministic-parity slices: above-inflation salary growth.

Monte Carlo remains explicitly experimental. This work improves cash-flow fidelity for imported scenarios; it does not turn stochastic output into a personal forecast or recommendation.

## Approved delivery sequence

Issue #1 will be completed through five tested vertical slices:

1. schema foundation and salary growth;
2. Other income and ownership;
3. Defined Benefit/UK pensions;
4. Other assets and lump-sum funding;
5. share growth, dividends, franking, capital losses and CGT.

All slices will be published together as Monte Carlo v0.8. Issue #1 remains open until every active-feature import guard is removed and the full parity suite passes.

## Architecture

Preserve the existing standalone Monte Carlo application and stochastic engine. Port deterministic features into its embedded scenario core one slice at a time rather than replacing the whole core or introducing a build pipeline.

Each feature guard remains active until that feature's schema, validation, state, calculations, output and tests are complete. Removing a guard is therefore the final step of its slice, not the first.

## Native schema 5 foundation

Advance the experimental native scenario schema from 4 to 5 once for the complete v0.8 parity programme.

Schema 5 retains the deterministic fields required by all five slices:

- `people[].salaryGrowthPct`;
- `otherIncomes`;
- `otherAssets`;
- `lumpSumWithdrawals`;
- deterministic pension fields `people[].ukStateAnnualGbp`, `people[].ukStateStartAge`, `people[].ukStateIndexation` and `people[].ukStateSurvivorPct`, plus `assumptions.ukPensionsEnabled`, `assumptions.gbpAud` and `assumptions.uppPct`; Defined Benefit mode continues to be represented by `gbpAud === 1`;
- share-return, dividend and franking fields on `shareholdings`.

Active unsupported values continue to trigger their existing explicit compatibility errors. Preserving a field in schema 5 does not imply that its calculation slice is complete.

Native schema-4 scenarios migrate to schema 5 with inert defaults:

- `salaryGrowthPct: 0` for each person;
- empty Other income, Other asset and lump-sum arrays;
- zero share growth, dividend yield and franked percentage, with franking disabled;
- existing pension values retained unchanged.

The deterministic schema-12 adapter preserves these fields instead of deleting them. It still evaluates active-feature guards before returning the adapted scenario.

## Salary-growth behaviour

Remove only the above-inflation salary-growth rejection after its implementation and tests pass.

For each living person who has not reached retirement age:

```text
nominal salary = entered salary
               x cumulative inflation factor
               x (1 + salary growth percentage)^years elapsed
```

`years elapsed` is zero in the first projection year, so salary growth begins in the second model year. Salary remains zero from the person's retirement age onward.

The resulting salary flows through the existing Monte Carlo calculation in the same places as deterministic salary:

- SG contributions;
- taxable income and person-level tax;
- Age Pension income assessment;
- guaranteed household income;
- budget top-up requirements;
- reported work-income components.

Salary growth is deterministic within a Monte Carlo run. Market-path randomness does not alter the configured growth rate.

## Validation and compatibility

- `salaryGrowthPct` must be finite and zero or greater.
- Missing schema-4 values migrate to 0.
- A schema-12 deterministic import with positive salary growth is accepted once this slice is complete.
- Zero salary growth preserves existing Monte Carlo v0.7 behaviour.
- The Other income/assets, pension, lump-sum and share-return guards remain unchanged.
- Imported values are preserved exactly; the adapter does not clamp or rewrite valid growth.

## Output and interface

Add the existing deterministic `Salary growth above inflation %` field to each Monte Carlo person editor, defaulting to 0.

No new chart series or projection-table column is required. Existing work-income, tax, SG-supported balances, total-income and ending-balance output reflects the grown salary.

The assumptions summary reports each non-zero salary-growth percentage. Zero values may remain omitted to keep the summary concise.

## Parity and testing

The cross-slice acceptance rule is:

- with volatility disabled and matching assumptions, Monte Carlo reproduces deterministic year-by-year cash flows and ending balances within normal floating-point rounding;
- under stochastic returns, tests verify seed reproducibility, accounting invariants and that no cash flow is silently omitted;
- unsupported active fields continue producing an explicit rejection until their own slice passes.

The salary slice adds regression coverage for:

- native schema-4 to schema-5 migration with a 0% default;
- deterministic schema-12 import preserving a positive value;
- negative, malformed and non-finite validation failures;
- 0% preserving the existing salary path;
- positive growth beginning in the second model year;
- growth stopping at retirement;
- higher SG contributions and super balances from higher salary;
- year-by-year zero-volatility parity with the deterministic simulator;
- the remaining four import guards staying active.

## Documentation

Update the README, model methodology, testing guide and changelog to say that v0.8 work has begun with salary-growth parity while Monte Carlo remains experimental. Do not claim full issue #1 support until all five slices are complete.

## Out of scope for this slice

- Other income or Other assets.
- Defined Benefit or UK pension parity changes.
- Lump-sum withdrawals or named-source funding.
- Share growth, dividends, franking, capital-loss or CGT parity.
- Release publication, file renaming or issue closure.
- Removing the experimental label or existing stochastic-model limitations.

## Completion criteria

This slice is complete when native schema 5 migrates existing scenarios safely, positive salary growth imports without a compatibility error, salary and SG follow the deterministic formula, zero-volatility parity passes, stochastic invariants remain green, all unrelated guards remain active and the change is documented as unreleased v0.8 work.
