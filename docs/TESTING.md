# Testing

## Automated regression suites

Run from the repository root:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

The deterministic suite checks core-engine extraction, script syntax, schema migration, validation and calculation invariants across the supported household model. Household tax coverage includes single/couple SAPTO schedules, combined-income eligibility, individual taper golden values, prescribed spouse transfer, actual-entitlement Medicare categories, individual thresholds, childless-couple family reduction and spouse allocation, non-refundable offset ordering, refundable franking and complete audit fields. Projection integration covers the base, ordinary and total tax stages, uneven-income couples, the immediate couple-to-single transition after fixed first death, and an explicit Single household from year zero. Single-household coverage verifies Person 2 exclusion without data loss, Joint 50/50 half inclusion, full entered spending targets, single rules, active drawdown sources, Person 1-only outputs and restoration when returning to Couple. It also covers the archived-release baseline, safe CSV serialisation, projection-critical numeric validation, the Age Pension couple taper, zero/half/full age-gap boundaries, survivor ownership and inherited super, single-person Age Pension, reversed partner order, eligible-person tax allocation, younger-partner super assessment, bracket creep, share growth, holding-period dividends, capital-loss carry-forward and CGT expense funding. Other Asset coverage includes flagged and unflagged classifications, mixed balances, scheduled disposal, partial and full named liquidation, survivor deeming thresholds and unchanged CSHC assessed income. The suite also verifies that age 59 is rejected with the approved explanation and age 60 is accepted.

These tests are regression evidence for this personal prototype, not professional tax verification. SAPTO eligibility is an age-and-income proxy, adjusted rebate income is approximated by taxable income, and Medicare family tests cover a childless couple only; dependent children and their threshold increments are not modelled. Current legislation, source effective dates and personal eligibility still require independent review before relying on a result.

The Monte Carlo v0.7 suite checks imported-scenario handling, matching age-gap and survivor Age Pension treatment, person-level tax allocation, the same fixed first-death event in every Monte Carlo path, deterministic parity under zero volatility, reproducibility, risk-mode behaviour, deterministic stress overrides and invariants that keep stress results outside the stochastic probability denominator. The suite also verifies that age 59 is rejected with the approved explanation and age 60 is accepted. It also covers schema-4 to schema-5 migration and zero-volatility salary-growth parity while confirming the remaining import guards stay active. It also covers Other-income ownership, tax, Age Pension, household-funding and survivor parity under zero volatility, plus seeded stochastic invariants. Defined Benefit and UK State Pension parity tests cover UPP tax treatment, indexation, start-age boundaries and survivor continuation.

The repository workflow at `.github/workflows/test.yml` runs both commands with Node 20 for pull requests and pushes to `main`.

## Archived release comparison

The stable production entry point is `retirement-simulator.html`. Exact sanitized public snapshots are retained under `archive/`. To compare earlier interactions, open:

```text
archive/retirement-simulator-v1.0.1.html
archive/retirement-simulator-v1.0.2.html
archive/retirement-simulator-v1.0.5.html
archive/retirement-simulator-v1.0.6.html
archive/retirement-simulator-v1.0.9.html
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
- fully funded, partially and completely unfunded lump sums, including multiple-shortfall aggregation and disabled-item exclusion;
- separate green/red annual-budget and amber lump-sum status, including both warnings appearing together;
- requested, funded and unfunded Event and tooltip reconciliation, including Event inspection when a zero-funded withdrawal has no chart block;
- preservation of active tab, open sections, focus and panel/table scroll positions after recalculation.
- per-person salary growth at 0% and a positive percentage, including retirement cutoff;
- super access validation in both tools, confirming age 59 is rejected with the concise tax explanation and age 60 is accepted;
- UK State Pension tooltips in today's and nominal dollars, showing after-tax allocation and gross value;
- disabling the Age Pension estimate and then adding a lump-sum withdrawal without a script error.
- Age Pension results for neither, one and both eligible partners, including reversed partner order and the transition when the younger partner reaches 67;
- share growth/dividend/franking controls inside the existing holding chevron, including disabled eligibility and both company-tax rates;
- Other income Tax owner allocation and the disabled selector for non-taxable income;
- flagged and unflagged Other Assets, mixed classifications and the assumptions count, confirming all assets remain in the assets test while only flagged balances enter Age Pension deeming;
- scheduled disposal plus partial and full named liquidation of a flagged Other Asset, confirming the value is not lost or counted twice;
- a flagged Other Asset across the fixed first-death transition, confirming the survivor uses single-person deeming thresholds;
- toggling the Other Asset deeming classification, confirming CSHC assessed income remains unchanged and actual returns remain separate Other Income;
- conditional Share dividends, Franking credits and CGT output, capital-loss/CGT Event details, and the Lump sum withdrawal legend item;
- a large scheduled sale and a named partial sale, confirming CGT draws are not charted as retirement income and unfunded tax is explicit;
- fixed first-death scenarios for each possible deceased person, confirming the start-of-year marker, stepped Preferred/Essential amounts, deceased em dashes and zero tax, inherited super, survivor horizon and immediate single Age Pension treatment;
- switching a fictional scenario from Couple to Single, confirming Person 2 controls, owned records, funding options, table columns, chart series, tooltips and assumptions disappear without changing the stored JSON;
- Single-mode Joint 50/50 cash, savings, shares, Other income and Other assets, confirming only Person 1's half is included, while Person 2-owned records contribute zero;
- switching the same scenario back to Couple, confirming Person 2 values, original array indexes, drawdown tiers and owner selections are restored;
- adding new shares, Other income and Other assets in Single mode, confirming ownership defaults to Person 1;
- the same fixed first-death scenario in the Monte Carlo report, confirming the assumptions disclosure and the same transition year in every Monte Carlo path;
- Model assumptions and sources in light and dark themes at desktop and mobile widths, confirming the tax-status estimate wraps without overflow and remains readable;

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
