# Model methodology

## Purpose

The deterministic simulator is an educational planning model for exploring how household income, retirement timing, superannuation, savings, pensions and drawdown choices interact over time.

It is not a regulated calculator and does not produce financial, tax, legal or investment advice.

## Annual calculation sequence

Each projection row represents one year. At a high level the simulator:

1. Applies any scheduled transition from accumulation super to retirement/drawdown phase.
2. Adds employment income and after-contributions-tax superannuation contributions for people still working.
3. Applies the user-entered estimated net nominal investment returns after fees and tax.
4. Applies account-based pension minimum drawdowns when enabled.
5. Adds pensions and other configured income.
6. Estimates household income tax and relevant offsets.
7. Uses the configured drawdown priorities to fill any remaining income target.
8. Banks income above the Essential Annual Budget into savings.
9. Flags a shortfall when available income and configured drawdown sources cannot cover the Essential Annual Budget.
10. Converts nominal results to today's dollars when that display mode is selected.

The application contains a more detailed step-by-step explanation and shows the dated rates used by the active scenario.

## Main modelling areas

### Superannuation

The model separates accumulation and retirement-phase balances, accepts separate estimated net return assumptions after fees and tax, and supports configurable transition timing. A higher retirement-phase assumption can represent pension-phase tax treatment; it does not imply a different underlying investment portfolio. Early access is simplified and is not a complete Transition-to-Retirement compliance model.

### Drawdown

Guaranteed income and mandatory minimum payments are counted before discretionary top-ups. Users configure ordered drawdown tiers; a tier can split a draw between two sources.

### Tax and government support

The simulator contains simplified, dated estimates for Australian income tax, Medicare, selected offsets, Age Pension and the Commonwealth Seniors Health Card. Rules and thresholds change and must be reviewed against current authoritative sources before relying on them.

### Assets and other income

Cash, savings, shareholdings, other income and other assets are simplified. Timing is annual, share-price forecasting is limited, capital-loss carry-forward is not fully modelled, and disposal tax may be excluded for generic other assets.

### Foreign pensions and currency

UK State Pension and currency conversion are supported with explicit assumptions. Cross-border tax treatment and indexation can be complex; the model uses approximations rather than jurisdiction-specific advice.

## Today's dollars and nominal dollars

Calculations run using nominal values. Today's-dollar views divide future nominal values by the cumulative inflation factor. A positive nominal balance can therefore grow more slowly—or decline—in today's-dollar terms.

## Experimental Monte Carlo report

The companion report imports a validated scenario and applies synthetic investment-return paths. Seeded runs support reproducibility, while deterministic stress cases are reported separately.

The reported success rate is conditional on the selected model and assumptions. It is not a personal forecast. The model does not make every material retirement risk stochastic, and deterministic stresses do not alter the Monte Carlo probability denominator.

## Important exclusions

Depending on the scenario, material exclusions can include:

- intra-year timing and cash-flow detail;
- future legislative and tax changes;
- complete TTR compliance rules;
- detailed capital-loss carry-forward;
- aged-care and health costs;
- property transactions and maintenance shocks;
- stochastic inflation, foreign exchange, employment and longevity;
- personalised product fees, insurance and adviser recommendations.

Inspect the assumptions shown by the application and obtain qualified advice before making real decisions.
