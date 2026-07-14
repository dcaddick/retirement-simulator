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

### Lump-sum withdrawals

Lump-sum withdrawals are one-off spending for items such as a car, holiday or family assistance. Enabled items reduce the selected assets in the nominated year, do not count as retirement income and do not satisfy the annual income target. An explicit liquid source is used first; any remainder follows the household drawdown order. The Event column records the reason, amount and sources actually used. Disabled items remain saved in the scenario but are excluded from validation, calculations, charts and Event entries.

### Illustrative survival ribbon

The chart ribbon uses an illustrative Gompertz curve (`A = 5.55e-6`, `G = 0.11`) to mark the ages at which each entered person's probability crosses 80%, 50%, 20% and 5%. It provides visual planning context only and is not a personalised actuarial estimate.

The application contains a more detailed step-by-step explanation and shows the dated rates used by the active scenario.

## Main modelling areas

### Superannuation

The model separates accumulation and retirement-phase balances, accepts separate estimated net return assumptions after fees and tax, and supports configurable transition timing. A higher retirement-phase assumption can represent pension-phase tax treatment; it does not imply a different underlying investment portfolio. Early access is simplified and is not a complete Transition-to-Retirement compliance model.

The interface displays a simple real-return spread calculated as nominal return minus inflation. Under the Treasury schedule it shows the long-run spread against 2.5% and, when different, the near-term spread against the modelled calendar-year rate. This readout is an assumption aid, not a forecast of purchasing-power returns.

### Salary growth above inflation

Each person's entered salary is indexed by the selected inflation path while they remain employed. The optional salary-growth-above-inflation percentage then compounds independently from the second model year: `salary × inflation factor × (1 + growth rate)^years elapsed`. The default is 0%, and no salary is included from the person's retirement age onward. The projected salary flows through SG contributions, taxable income, Age Pension income assessment and household drawdown requirements.

### Drawdown

Guaranteed income and mandatory minimum payments are counted before discretionary top-ups. Users configure ordered drawdown tiers; a tier can split a draw between two sources.

### Tax and government support

The simulator contains simplified, dated estimates for Australian income tax, Medicare, selected offsets, Age Pension and the Commonwealth Seniors Health Card.

Income-tax brackets and LITO use the legislated fixed nominal schedule: the 2026 rate applies in 2026, the legislated 2027 rate applies from 2027, and no unlegislated later tax cuts are forecast. As nominal income rises with inflation against those fixed nominal thresholds, the model includes bracket creep. Medicare and SAPTO retain the simulator's existing indexed approximation by applying their thresholds in today's-dollar terms. This is a deterministic policy baseline, not a prediction of future government decisions.

The normal Age Pension income test uses a 50-cent combined couple reduction for each dollar above the couple free area (25 cents for each partner). The model still requires both partners to have reached Age Pension age; that separate limitation remains under deferred review.

Medicare low-income thresholds are the legislated 2025–26 amounts checked on 10 July 2026: ordinary individual $28,011 lower/$35,013 upper and SAPTO $44,268 lower/$55,335 upper. Rules and thresholds change and must be reviewed against current authoritative sources before relying on them.

### Assets and other income

Cash, savings, shareholdings, other income and other assets are simplified. Timing is annual. Share prices are manual and remain static: they do not grow and produce no dividend or franking-credit income. Capital losses are discarded rather than offset or carried forward, and disposal tax may be excluded for generic other assets. The optional Stooq integration is explicitly limited to US-listed symbols and always appends Stooq's `.us` market suffix; Australian and other holdings use manual prices.

### Foreign pensions and currency

Australian defined-benefit income is the primary pension-entry path and uses AUD with fixed or CPI-linked indexation. UK State Pension is a secondary path with GBP/AUD conversion, frozen-uprating comparison and a simplified UPP tax deduction. Cross-border tax treatment and indexation can be complex; the model uses approximations rather than jurisdiction-specific advice.

The projection table reports UK State Pension gross. The income chart remains an after-tax chart and allocates estimated household tax proportionally across charted taxable sources. Its UK State Pension tooltip therefore shows both the after-tax household allocation and gross pension value; that allocation is not a source-specific pension tax calculation.

## Today's dollars and nominal dollars

Calculations run using nominal values. Today's-dollar views divide future nominal values by the cumulative inflation factor. A positive nominal balance can therefore grow more slowly—or decline—in today's-dollar terms.

## Experimental Monte Carlo report

The companion report imports a validated scenario and applies synthetic investment-return paths. Seeded runs support reproducibility, while deterministic stress cases are reported separately.

Monte Carlo v0.5 accepts the standard v1.00 fictional sample and scenarios using the fields its experimental engine supports. It rejects, with a visible explanation, v1.00 imports containing populated Other income/Other assets or active Defined Benefit/UK Pension income; it does not silently discard those cash flows.

The reported success rate is conditional on the selected model and assumptions. It is not a personal forecast. The model does not make every material retirement risk stochastic, and deterministic stresses do not alter the Monte Carlo probability denominator.

## Important exclusions

The maintained [Deferred Review Register](DEFERRED-REVIEW.md) records known limitations, their likely impact and the review needed before remediation. Depending on the scenario, material exclusions can include:

- intra-year timing and cash-flow detail;
- future legislative and tax changes;
- complete TTR compliance rules;
- detailed capital-loss carry-forward;
- aged-care and health costs;
- property transactions and maintenance shocks;
- stochastic inflation, foreign exchange, employment and longevity;
- personalised product fees, insurance and adviser recommendations.

Inspect the assumptions shown by the application and obtain qualified advice before making real decisions.
