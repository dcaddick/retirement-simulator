# Testing

## Automated regression suites

Run from the repository root:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

The deterministic suite checks core-engine extraction, script syntax, schema migration, validation and calculation invariants across the supported household model.

The Monte Carlo suite checks imported-scenario handling, risk-mode behaviour, deterministic stress overrides and invariants that keep stress results outside the stochastic probability denominator.

## Browser verification

Automated tests do not replace a real-browser pass. For user-interface changes, verify at least:

- initial load with fictional sample data;
- input editing and recalculation feedback;
- validation errors and recovery;
- today's-dollar and nominal-dollar views;
- chart rendering and inspection;
- responsive layout;
- JSON import and export;
- local-storage reset and new-scenario behaviour;
- transfer of a simulator export into the experimental Monte Carlo report.

## Modelling-change checklist

For a change to tax, pensions, superannuation or another regulated assumption:

1. Record the authoritative source and effective date.
2. Explain the approximation and exclusions.
3. Add a focused regression test.
4. Run both complete suites.
5. Compare at least one result by an independent calculation or worked example.
6. Update the application disclosure, methodology and changelog.

## Privacy check

Before committing or opening a pull request, scan changed files for:

- real names or initials;
- personal balances, salaries or holdings;
- scenario-export filenames;
- local filesystem paths;
- private wiki links or handover notes;
- screenshots containing personal information.

Use fictional examples in all public tests and documentation.
