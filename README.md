# Retirement Simulator

A transparent, local-first retirement-income modelling tool built primarily for personal use and shared openly in case others find it useful.

The repository contains two self-contained browser tools:

- **Retirement Simulator** — the primary deterministic annual projection.
- **Retirement Monte Carlo Report** — an experimental companion for exploring sequence-of-returns sensitivity.

> **Estimate only. Not financial, tax, legal or investment advice.** The models are simplified, assumptions become stale, and results are not predictions.

## Why this exists

This started as a tool for understanding one household's retirement choices. It is not a commercial product, a regulated calculator or a promise of universal suitability. It is published under an open-source licence so people can inspect it, adapt it, raise issues and propose improvements.

There are no guarantees about support, response times, future maintenance or acceptance of contributions.

## Run it

No server, account or build step is required.

1. Clone or download the repository.
2. Open `retirement-simulator.html` in a modern browser.
3. Start with the fictional sample, create a new scenario or import your own JSON file.
4. Optionally export the scenario and import it into `retirement-monte-carlo.html`.

Scenario data stays in the browser's local storage unless you explicitly import or export a file.

## Retirement Simulator

The deterministic simulator models a reusable two-person household and includes:

- salaries, retirement ages and superannuation contributions;
- accumulation and retirement-phase super balances;
- flexible super-access timing and ordered drawdown tiers;
- cash, savings, shareholdings, other income and other assets;
- Australian income-tax estimates, Medicare, LITO/SAPTO, Age Pension and CSHC estimates;
- UK State Pension support and currency conversion;
- account-based pension minimum drawdowns;
- requested income, household spending and surplus banking;
- today's-dollar and nominal-dollar views;
- year-by-year projection tables and inspectable charts;
- local autosave plus JSON import and export.

The app favours transparent approximations over hidden precision. See [Model methodology](docs/MODEL-METHODOLOGY.md) for the calculation sequence and boundaries.

## Experimental Monte Carlo companion

The Monte Carlo report is deliberately labelled **experimental**. It can help compare how an imported scenario behaves under different synthetic return sequences, risk modes, glide paths and deterministic stress cases.

It does **not** calculate a dependable personal probability of retirement success. Its output depends on user-selected assumptions and a simplified stochastic model. Inflation, tax law, policy, employment, health, aged care, property, foreign exchange and longevity are not all stochastic.

Use it as a sensitivity and comparison tool, not a forecast or recommendation.

## Privacy

- Core calculations run locally in the browser.
- No account is required.
- Scenario data is not uploaded by the core tools.
- Browser local storage is convenient but not encrypted.
- Exported JSON files may contain highly sensitive financial information.

Never commit a personal scenario to a public repository or attach one to a public issue. Reproduce bugs with fictional values. See [Security and privacy reporting](SECURITY.md).

## Testing

The repository includes Node-based regression suites for both tools:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

The suites exercise core calculations, schema migration, validation and model invariants. Browser behaviour and visual output still require a real-browser review. See [Testing](docs/TESTING.md).

## Project history

The original work evolved through many private prototypes. The public repository keeps the current tools and a sanitized [changelog](CHANGELOG.md), rather than publishing personal scenarios, internal handovers or duplicated historical source files.

## Contributing

Issues, feature requests, forks and pull requests are welcome. Modelling changes should include dated authoritative sources, explicit assumptions and regression tests. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## Licence

Licensed under the [Apache License 2.0](LICENSE). The software is provided on an "AS IS" basis, without warranties or conditions of any kind.
