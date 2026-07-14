# Testing

## Automated regression suites

Run from the repository root:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

The deterministic suite checks core-engine extraction, script syntax, schema migration, validation and calculation invariants across the supported household model. It also covers the archived-release baseline, safe CSV serialisation, projection-critical numeric validation, the Age Pension couple taper and mixed-basis tax calculations that produce bracket creep against fixed nominal thresholds.

The Monte Carlo suite checks imported-scenario handling, risk-mode behaviour, deterministic stress overrides and invariants that keep stress results outside the stochastic probability denominator.

The repository workflow at `.github/workflows/test.yml` runs both commands with Node 20 for pull requests and pushes to `main`.

## Archived release comparison

The stable production entry point is `retirement-simulator.html`. Exact sanitized public snapshots are retained under `archive/`. To compare earlier interactions, open:

```text
archive/retirement-simulator-v1.0.1.html
archive/retirement-simulator-v1.0.2.html
```

For the lump-sum regression, use fictional demo values, disable **Include Aged Pension estimate**, add a withdrawal and confirm no script-error banner appears. CI verifies each archived file against its release-tag Git blob.

## Browser verification

Automated tests do not replace a real-browser pass. For user-interface changes, verify at least:

- initial load with fictional sample data;
- input editing and recalculation feedback;
- validation errors and recovery;
- today's-dollar and nominal-dollar views;
- chart rendering and inspection;
- responsive layout;
- JSON import and export;
- visible-table CSV export in both today's-dollar and nominal display modes;
- local-storage reset and new-scenario behaviour;
- transfer of a simulator export into the experimental Monte Carlo report.
- light and dark themes, including persistence after reload;
- Treasury/manual inflation changes and both real-return readouts;
- manual share pricing and explicitly selected US Stooq lookup;
- collapse/expand behavior for every left-panel section after People.
- both chart/table and table-height splitters, including persistence after reload;
- lump-sum include/exclude toggles, concise tooltips and Event-column updates;
- preservation of active tab, open sections, focus and panel/table scroll positions after recalculation.
- per-person salary growth at 0% and a positive percentage, including retirement cutoff;
- UK State Pension tooltips in today's and nominal dollars, showing after-tax allocation and gross value;
- disabling the Age Pension estimate and then adding a lump-sum withdrawal without a script error.

### iPad Safari release check

Before release, open the local HTML file in current iPadOS Safari (not only the Files preview) and check portrait and landscape at the common 820x1180, 1024x1366, 1180x820 and 1366x1024 CSS viewports. Confirm touch targets, independent panel scrolling, both splitters, chart inspection, form fields, safe-area banners and horizontal table scrolling. Desktop emulation is useful for regression coverage but does not replace one real-device pass.

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
