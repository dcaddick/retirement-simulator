# Technical overview

This page is for people who want to run, inspect, test or change the simulator. If you just want to use it, start with the [README](../README.md).

Related documents:

- [Model methodology](MODEL-METHODOLOGY.md): the annual calculation sequence and model boundaries.
- [Deferred Review Register](DEFERRED-REVIEW.md): known limitations awaiting professional review, product decisions or separately designed remediation.
- [Testing](TESTING.md): regression suites, CI and manual browser checks.
- [Independent Review Materials](independent-review/README.md): release identity, rule-to-code map, sources and reference scenarios for a professional reviewer.
- [Contributing](../CONTRIBUTING.md) and [Security and privacy reporting](../SECURITY.md).

## Run it

No server, account or build step is required.

1. Clone or download the repository.
2. Open `retirement-simulator.html` in a modern browser.
3. Start with the fictional sample, create a new scenario or import your own JSON file.

The stable live filename is always `retirement-simulator.html`. Exact sanitized public releases are also retained under [`archive/`](../archive/) for regression testing and comparison.

The header carries a "Get the latest version" link to the GitHub releases page. It is an ordinary link: the file never contacts GitHub or checks for updates on its own.

## Storage and scenario files

Scenario data stays in the browser's local storage unless you explicitly import or export a file. Both pages include a locally remembered light/dark theme control.

The hosted GitHub Pages version keeps scenario data in that browser's local storage. Scenarios created from a locally opened file do not automatically appear there, but you can move them with JSON export/import.

## Settings views

The settings panel starts in **Simple**, with three short sections: **About you**, **What you have**, and **Your retirement lifestyle**. Enter ages, retirement ages, super, cash and savings, and one household spending goal. Salary appears only while someone is still working. Spending can be entered per year, month or week (12 months or 52 weeks per year).

Choose **Advanced** or **Explore more options** for the full editor, including names, ownership, planned spending, pensions, investments, returns, inflation and survivor settings. Both views use the same scenario and calculations; switching views preserves every value. The chosen view and spending period are remembered locally, separately from exported scenario data.

Fresh starts and **New** use labelled fictional example amounts with no planned expenses and equal preferred-income and essential-budget targets. Editing that single spending goal updates both while they remain equal. Imported or saved scenarios with different targets keep their separate essential budget, with a link to review it in Advanced. **Reset sample** still restores the original, more detailed sample. Single-household joint balances retain the existing 50% inclusion rule, which Simple explains beside the affected account.

## Model coverage

The deterministic simulator models either a couple or a single-person household and includes:

- salaries, retirement ages and superannuation contributions;
- accumulation and retirement-phase super balances;
- super access from age 60 and ordered drawdown tiers;
- planned lump-sum withdrawals with requested, funded and unfunded audit output plus a separate affordability warning;
- cash, savings, shareholdings, other income and other assets;
- individual Other Asset selection as a financial investment for Age Pension deeming, while every Other Asset remains in the assets test;
- nominal share-price growth, holding-period dividends and optional franking credits by owner;
- per-person capital-loss netting and carry-forward, with CGT funded from assets rather than counted as retirement income;
- Australian income-tax estimates, Medicare, LITO/SAPTO, Age Pension and CSHC estimates, including one partnered share when only one partner has reached Age Pension age;
- Australian defined-benefit and UK State Pension support;
- an optional fixed first-death scenario with immediate survivor spending, ownership, inherited-super, continuing-income, tax and single Age Pension transitions;
- optional per-person salary growth above inflation, defaulting to 0%;
- account-based pension minimum drawdowns;
- Preferred Retirement Income, Essential Annual Budget and surplus banking;
- today's-dollar and nominal-dollar views;
- year-by-year projection tables, visible-table CSV export and inspectable charts;
- local autosave plus JSON import and export.

In **Single** mode, Person 1 is the sole modelled person from the first year. Saved Person 2 details and Person 2-owned records are hidden, preserved for a later switch back to **Couple**, and contribute nothing to calculations or output. Joint 50/50 records contribute only Person 1's 50% share. Single mode uses the entered Preferred Retirement Income and Essential Annual Budget in full, applies single-person tax and government-support rules immediately, and does not trigger first-death, inheritance or survivor-percentage logic.

Return assumptions and inflation are shown together. The interface calculates the nominal-minus-inflation spread live, showing both the long-run 2.5% view and the near-term Treasury rate when they differ.

An amber dashboard warning makes any unfunded lump-sum amount visible without changing the separate annual-budget status.

The simulator requires a super access age of 60 or older. It treats super withdrawals as tax-free and does not model the additional tax rules that may apply before age 60.

The app favours transparent approximations over hidden precision. See [Model methodology](MODEL-METHODOLOGY.md) for the calculation sequence and boundaries.

## Network boundaries

Core calculations run locally in the browser. The only network requests are optional and user-triggered: a US share-price lookup through Stooq and a currency-rate lookup through Frankfurter. The simulator works without either service, and the interface tells you before those requests are used.

- Share prices are manual by default. Choosing **US market (Stooq)** and pressing fetch sends the requested US ticker to Stooq and requests USD/AUD from Frankfurter.
- Those optional requests expose ordinary network metadata, including the browser's IP address, to the relevant third party. Manual pricing makes no market-data request.
- The optional GitHub Pages version is served by GitHub. GitHub receives ordinary web-request metadata, including the visitor IP address, but the simulator does not send scenario contents to GitHub.

The application CSP limits browser connections to `stooq.com` and `api.frankfurter.app`. It cannot control how those independent services process their request logs.

## Testing

The repository includes Node-based regression suites for the deterministic simulator:

```powershell
node tests/retirement-simulator.test.mjs
node tests/v1.1.1.test.mjs
```

The suites exercise core calculations, schema migration, validation, CSP/market boundaries and model invariants. GitHub Actions runs these suites on every pull request and push to `main`. Browser behaviour and visual output still require a real-browser review. See [Testing](TESTING.md).

## Experimental Monte Carlo companion

**Development is permanently parked.** `retirement-monte-carlo-v0.7.html` is kept as a frozen, unmaintained reference. It receives no feature, import, parity or rate updates, is not tested in CI and is not deployed to GitHub Pages. It cannot import scenarios exported by v1.1.0 or later, and the deterministic simulator's Single household mode does not apply to it.

The Monte Carlo report is deliberately labelled **experimental**. It can help compare how an imported scenario behaves under different synthetic return sequences, risk modes, glide paths and deterministic stress cases. It does **not** calculate a dependable personal probability of retirement success. Its output depends on user-selected assumptions and a simplified stochastic model. Inflation, tax law, policy, employment, health, aged care, property, foreign exchange and longevity are not all stochastic.

Monte Carlo v0.7 can import the standard deterministic sample, uses the same zero/half/full Age Pension eligibility boundary, and applies an enabled fixed first-death event in the same selected year in every path. It does not model probabilistic mortality. Because its experimental engine does not yet reproduce every deterministic cash flow, it explicitly rejects imports containing active lump-sum withdrawals, populated Other income/Other assets, active Defined Benefit/UK Pension income, or active v1.06 share growth/dividend/franking assumptions instead of silently omitting them. That broader import support ([issue #1](https://github.com/dcaddick/retirement-simulator/issues/1)) was closed as not planned.

The last, unreleased v0.8 work uses native schema 5 and adds salary-growth parity, Other-income parity and Defined Benefit/UK Pension parity. The Other assets, lump-sum and share-return guards remain permanently in place.

## Project history

The original work evolved through many private prototypes. The public repository keeps the current tools, a sanitized [changelog](../CHANGELOG.md), and exact sanitized production snapshots under [`archive/`](../archive/) so technically capable users can compare and test older public iterations. Personal scenarios and private development artifacts are never archived here.
