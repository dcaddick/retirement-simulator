# Model methodology

## Purpose

The deterministic simulator is an educational planning model for exploring how household income, retirement timing, superannuation, savings, pensions and drawdown choices interact over time.

It is not a regulated calculator and does not produce financial, tax, legal or investment advice.

## Annual calculation sequence

Each row is an annual approximation. Transactions occur in this order:

1. Apply the fixed first-death transition, if enabled, and capture opening Cash and Savings balances.
2. Grow shares and process scheduled share sales; retain the existing sale-month interest approximation.
3. Transition accessible super, apply annual super growth and salary/SG contributions, and grow or dispose of Other Assets.
4. Fund due lump sums. Explicit sources go first, followed by the configured fallback tiers; automatic withdrawals use the configured drawdown order.
5. Add dividends, other income and interest. Savings interest follows the opening balance and existing sale-year approximation. Cash retains its existing annual timing.
6. Assess Age Pension using the balances at this checkpoint. Compute household taxes and fund CGT using the existing rules.
7. Apply required ABP minimum draws after pension assessment, then fund normal Preferred spending, or the Essential floor for a supported stressed caller.
8. Bank income above actual planned spending and report any shortfall. Record closing balances. The suggested Cash + Savings strategy is not modeled.
9. Return engine output in today's dollars. Charts, event labels, table and CSV apply the selected display factor at presentation time.

### Spending and schema 16

Preferred means normal spending. Essential is a bad-year floor, constrained not to exceed Preferred. The ordinary deterministic projection always follows Preferred and never generates a bad year. Schema-14 migration maps both budgets to the previous Essential amount and retains the previous values in a review notice until dismissed. Schema-15 scenarios migrate to schema 16 with their entered returns unchanged, a broad return profile added for reference, and the retired `cashBufferYears` setting removed. Migration is idempotent; unrelated inputs remain saved.

An engine-only stress caller can supply bad-year status to use the Essential floor and defer marked lump sums. The ordinary deterministic user interface has no bad-year generator or threshold control.

### Suggested Cash + Savings strategy

The Advanced panel suggests reviewing spending for the next two years and anticipated lump sums every six or twelve months, then topping up the Savings Pot from super to hold as a term deposit or cash. This is guidance only: the simulator does not calculate a target, schedule or transfer, and it does not affect projection calculations, table values or charts. Cash and Savings remain separate user-entered accounts and retain their existing balance, interest and funding behavior. The explicit modeled bucket proposed in issue #45 is not part of this release.

### Lump-sum withdrawals

Lump sums are separate from annual spending. Requested, funded, unfunded and per-source engine amounts are all in today's dollars; labels multiply by the display factor once. The selected source remains visible beside actual source amounts and any shortfall. Amber markers identify event years, including events with zero funding. CSV uses the displayed table. Disabled items remain saved but are excluded.

### Return-reference context

Warnings never change assumptions or calculation results. They use the existing nominal-minus-inflation real-return convention. The Growth super reference is 2.5–4.5% real: Chant West's 18 December 2025 publication describes a typical CPI+3.5% Growth objective; the +/-1 percentage-point band is this project's choice. Cash/Savings uses the project-selected 0–2% real band from issue #46. These are context, not universal suitability or regulatory limits. Treasury mode evaluates horizon-average inflation and separately flags years more than two percentage points outside the band. Sources were checked 12 October 2026.

### Illustrative survival ribbon

The chart ribbon uses an illustrative Gompertz curve (`A = 5.55e-6`, `G = 0.11`) to mark the ages at which each entered person's probability crosses 80%, 50%, 20% and 5%. It provides visual planning context only and is not a personalised actuarial estimate.

The application contains a more detailed step-by-step explanation and shows the dated rates used by the active scenario.

### Explicit single household

The deterministic simulator stores two people so a scenario can switch between **Couple** and **Single** without deleting data. In Single mode, Person 1 is the sole active person from the first projection year. Person 2's personal inputs and Person 2-owned cash, savings, shares, Other income and Other assets are not read into the runtime calculation and contribute zero. A Joint 50/50 record contributes only Person 1's 50% share. New owned records default to Person 1, inactive drawdown sources are omitted, and switching back to Couple restores the preserved values.

Single mode is a starting household state, not a survivor state. The entered Preferred Retirement Income and Essential Annual Budget remain at 100%; no first-death event, asset inheritance, continuing-income percentage or survivor spending percentage is applied. The horizon follows Person 1. Tables, CSV output, charts, tooltips, headline assets and scenario assumptions omit Person 2.

### Fixed first-death and survivor state

When enabled, the selected person's death is applied at the start of the selected projection year, before that year's income, tax, returns and drawdown calculations. It is a user-selected scenario boundary, not a mortality forecast. The deceased person's employment income and super contributions stop immediately; configured UK State Pension and Other income continuation percentages are paid to the survivor. No bereavement payment or temporary concession is modelled.

Cash, savings, shares and Other assets transfer immediately to the survivor while preserving their modelled characteristics. The deceased person's super is reported separately as inherited super, preserving accumulation or retirement phase and the deceased source return assumption until any later phase transition. The deceased person's unused capital losses lapse.

Preferred Retirement Income and Essential Annual Budget step to their configured survivor percentages in the transition year. Single Age Pension rules apply immediately from that year, as do single-person CSHC thresholds and survivor-only tax allocation. The projection horizon follows the survivor's age. The model does not represent probate timing, binding nominations, estate disputes, tax on death benefits or detailed super death-benefit law.

## Main modelling areas

### Capital losses

When a share disposal's tax cost base (including allowable sale costs) exceeds its proceeds, the realised loss is recorded for its owner. It is carried forward and applied against that person's eligible capital gains under the model's existing discount-gain ordering. Unused amounts remain in the tax ledger; the main projection event column reports only a loss realized or applied in that year. Enable **Show calculation logs** below the table to inspect opening, current-year realized, applied and closing carry-forward amounts. Opening losses that predate the projection are not currently an input.

### Superannuation

The model separates accumulation and retirement-phase balances, accepts separate estimated net return assumptions after fees and tax, and supports configurable transition timing. A higher retirement-phase assumption can represent pension-phase tax treatment; it does not imply a different underlying investment portfolio. Super access age is limited to 60 or older because the simulator treats withdrawals as tax-free and does not model the additional tax rules that may apply before age 60. It remains a simplified model and does not implement complete Transition-to-Retirement compliance rules.

The interface displays a simple real-return spread calculated as nominal return minus inflation. Under the Treasury schedule it shows the long-run spread against 2.5% and, when different, the near-term spread against the modelled calendar-year rate. This readout is an assumption aid, not a forecast of purchasing-power returns.

### Salary growth above inflation

Each person's entered salary is indexed by the selected inflation path while they remain employed. The optional salary-growth-above-inflation percentage then compounds independently from the second model year: `salary × inflation factor × (1 + growth rate)^years elapsed`. The default is 0%, and no salary is included from the person's retirement age onward. The projected salary flows through SG contributions, taxable income, Age Pension income assessment and household drawdown requirements.

### Drawdown

Guaranteed income and mandatory minimum payments are counted before discretionary top-ups. Users configure ordered drawdown tiers; a tier can split a draw between two sources.

### Tax and government support

The simulator contains simplified, dated estimates for Australian income tax, Medicare, selected offsets, Age Pension and the Commonwealth Seniors Health Card. Its household tax context uses single status from year zero for an explicit Single household. A Couple household treats both living partners as a couple and switches to single status immediately in the fixed first-death transition year.

Each projection row is labelled with a calendar year, and that year is read as the Australian financial year beginning in it. A row labelled 2026 is therefore taxed at FY2026–27 rates. Tax schedules are keyed on the same convention: 2025 is FY2025–26 with the 16% first bracket, 2026 is FY2026–27 at 15%, and 2027 is FY2027–28 at 14%. The 15% and 14% steps are the cuts legislated by the Treasury Laws Amendment (More Cost of Living Relief) Act 2025, effective 1 July 2026 and 1 July 2027. A year outside that range clamps to the nearest known schedule, so a backdated scenario is priced at FY2025–26 rates rather than silently receiving a later, lower-rate schedule.

Income-tax brackets and LITO use the legislated fixed nominal schedule, and no unlegislated later tax cuts are forecast. As nominal income rises with inflation against those fixed nominal thresholds, the model includes bracket creep. Medicare and SAPTO apply their thresholds in today's-dollar terms. This is a deterministic policy baseline, not a prediction of future government decisions.

That split between the two offsets is deliberate, and it tracks which parameters Australian law actually indexes rather than being an arbitrary modelling choice. Income tax brackets and LITO carry no statutory indexation: they change only when Parliament legislates a change, so holding them fixed in nominal terms is what produces the bracket creep the model is meant to show. SAPTO amounts and the Medicare levy low-income thresholds are indexed annually, so applying them to real income keeps them at their intended real value instead of eroding them by an indexation the law does not omit. The consequence is that over a long projection LITO phases out through bracket creep while SAPTO and Medicare hold their real value, and the two offsets diverge. That divergence is the modelled policy, not a defect. Regression tests lock both halves of the split in nominal and real views.

SAPTO uses an **age-and-income proxy**: a living person must be at least 67 and below the applicable income limit. This does not establish legal SAPTO eligibility; the simulator does not test residency, qualifying pension status or every statutory condition. For a couple, combined rebate income determines whether each person is eligible, while each person's own rebate income determines their preliminary taper. The prescribed spouse-transfer calculation then adjusts donor and recipient base amounts before the final offset is calculated. The individual uses the higher SAPTO Medicare thresholds only when their final SAPTO entitlement is greater than zero. Projection inputs do not separately collect adjusted rebate income, so taxable income is used as a rebate-income approximation.

The calculation order is auditable per person: gross resident income tax; then non-refundable LITO and final SAPTO applied only against that income tax, floored at zero; then Medicare after the individual low-income threshold and any family reduction; then refundable franking credits last. Offsets therefore cannot reduce Medicare. Each base-income, ordinary-income and total-income tax stage receives a complete household assessment.

For a **childless couple**, the Medicare calculation applies the enacted family threshold and statutory reduction. If the spouse would otherwise owe no levy, the liable partner receives the full reduction; proportional spouse allocation and transfer of any excess reduction apply only when the spouse would otherwise owe levy. The model states that dependent children are not modelled, so the legislated per-child threshold increment is not applied. The threshold category is selected for each person from that person's actual final SAPTO entitlement rather than age alone.

SAPTO schedules and transfer rules were checked on 21 July 2026 against the ATO 2024-25 SAPTO guidance and the *Income Tax Assessment (1936 Act) Regulations 2025*. Medicare individual and family thresholds were checked on 21 July 2026 against Schedule 5 of the enacted *Treasury Laws Amendment (Delivering an Efficient and Trusted Tax System) Act 2026*: ordinary individual $28,011 lower/$35,013 upper, SAPTO individual $44,268 lower/$55,335 upper, ordinary family $47,238 and SAPTO family $61,623. Rules and thresholds change and must be reviewed against current authoritative sources before relying on them.

This bounded, auditable household context is proportionate for a personal prototype and hobby use. A service intended for thousands of users would need separately versioned tax rules, richer household and dependent inputs, professional effective-date maintenance, a calculation-explanation interface, accessibility work, privacy and security controls, audit logs, monitoring and stronger release controls.

The normal Couple Age Pension estimate applies the combined homeowner-couple income and assets tests. If one partner has reached Age Pension age, the household receives half of the means-tested combined couple rate and the taxable payment is allocated to that eligible person; once both partners are 67, the household receives the full combined rate. Superannuation held by a partner under Age Pension age remains excluded while it stays in the modelled super environment. The income test uses a 50-cent combined couple reduction for each dollar above the couple free area. An explicit Single household applies the single-person rate, assets test, income test and deeming threshold to Person 1 from the first year.

Currency is assessed separately for each dated source group. Age Pension rates use 20 March and 20 September; threshold reviews also include 1 July. CSHC uses 20 September; tax, SAPTO, Medicare and deeming thresholds use 1 July. Deeming rates and Work Bonus have no fixed review schedule. A passed date means a review is due, not proof that a value changed. Missing or invalid source dates produce an unknown status. The advisory identifies an overdue group and date, or the next scheduled review. Unscheduled policy changes remain possible; the app does not fetch or update rates automatically.

On 12 October 2026, Services Australia and the DSS deeming history confirmed the September inputs: standard maximum pension $1,237.70 single / $1,866 couple combined per fortnight, CSHC limits $105,048 / $168,076, and deeming rates 1.75% / 3.75%. Pension free areas and deeming thresholds retain their July values. The annual model multiplies fortnightly pension rates and income free areas by 26. See the source register for dates, links and limitations.

Superannuation held by a partner below Age Pension age is exempt from the means test, while savings are always assessed. Tier order is the user's stated drawdown intent and is never rearranged: a tier containing only the younger partner's super is treated as an explicit instruction to spend it first. The suggested Cash + Savings strategy is text only; it does not move balances or alter the means test.

The Work Bonus offsets employment income before the Age Pension income test for a living person of Age Pension age, once the household is being assessed for the pension. It credits $300 a fortnight, carries a maximum balance of $11,800, and gives a $4,000 starting credit in the first year a person becomes eligible. The balance accrues in years without salary, so a later return to work draws on it. Three simplifications apply. The scheme is approximated annually rather than fortnightly: the carried balance plus the whole year's accrual is available against that year's salary, and the cap is applied to what carries forward, so uneven earnings within a year are not distinguished. Only salary is treated as eligible income; Other income is never offset, so self-employment income entered there is not covered. The amounts are held in nominal terms and deflated into the real-terms income test, because the Work Bonus carries no statutory indexation, which means the offset erodes in real terms over a long projection unless Parliament legislates an increase.

Deeming applies 1.75% to the first $66,800 of financial assets for a single person, or the first $110,600 combined for a couple, and 3.75% above that. These four values carry their own dated provenance in the code rather than sitting under a general page-checked date, because deeming is the highest-sensitivity means-test input in the model and its values move by ministerial decision rather than routine indexation. They were verified against the Services Australia Age Pension deeming page on 12 October 2026, with rates effective 20 September 2026 and thresholds effective 1 July 2026. The model always uses the pensioner-couple threshold for a couple; Services Australia applies a separate $55,300 per-person threshold where neither member of a couple receives a pension, and that case is not modelled.

Taxable Other income follows its selected owner (`Person 1`, `Person 2` or `Joint 50/50`). Non-taxable Other income remains a household cash flow. Share dividends and franking credits follow the holding owner on the same basis. Franking eligibility is an explicit user assumption: the simulator does not automate holding-period, related-payment or other integrity rules. Refundable franking offsets can therefore produce an estimated tax refund in a low-tax year.

Capital gains and losses are tracked per person. Current-year and carried losses are applied to non-discount gains first and discount-eligible gains second; the 50% discount is applied only to the remaining eligible gain. Opening losses begin at zero because the interface does not collect pre-existing tax losses. CGT is funded from savings first and then the configured household tiers. Share-sale proceeds and CGT-funding draws remain asset movements and never count as retirement income.

### Assets and other income

Cash, savings, shareholdings, other income and other assets are simplified. Timing is annual. Each holding's nominal share-price growth is applied at the start of the projected year, before dividends and share sales; cost base does not grow with market price. The cash dividend yield excludes price growth, so their simple derived sum is the expected total-return assumption before tax effects. Dividends use the number of months held during the year. Generic Other assets remain outside the CGT model. The optional Stooq integration is explicitly limited to US-listed symbols and always appends Stooq's `.us` market suffix; Australian and other holdings use manual prices.

Every included Other Asset counts in the Age Pension assets test. An asset selected as a financial investment for Age Pension deeming also contributes its included remaining value to the financial-assets balance used for Age Pension deeming. In Single mode a Person 2-owned asset is excluded and a Joint 50/50 asset contributes half. Scheduled disposal moves the included value to savings before assessment, while named liquidation immediately funds the nominated lump sum, so disposed value is not counted twice. The selection does not add ordinary Other Assets to CSHC deeming, which remains limited here to account-based income streams. Actual interest, rent and other returns are separate Other Income entries. The user is responsible for choosing the appropriate classification.

### Foreign pensions and currency

Australian defined-benefit income is the primary pension-entry path and uses AUD with fixed or CPI-linked indexation. UK State Pension is a secondary path with GBP/AUD conversion, frozen-uprating comparison and a simplified UPP tax deduction. Cross-border tax treatment and indexation can be complex; the model uses approximations rather than jurisdiction-specific advice.

The projection table reports UK State Pension gross. The income chart remains an after-tax chart and allocates estimated household tax proportionally across charted taxable sources. Its UK State Pension tooltip therefore shows both the after-tax household allocation and gross pension value; that allocation is not a source-specific pension tax calculation.

## Today's dollars and nominal dollars

Calculations run using nominal values. Today's-dollar views divide future nominal values by the cumulative inflation factor. A positive nominal balance can therefore grow more slowly—or decline—in today's-dollar terms.

## Experimental Monte Carlo report

The companion report imports a validated scenario and applies synthetic investment-return paths. Seeded runs support reproducibility, while deterministic stress cases are reported separately.

The explicit Single household type described above is currently deterministic-only. The experimental Monte Carlo companion has not been changed for issue #36.

Monte Carlo v0.7 accepts the standard fictional sample and scenarios using the fields its experimental engine supports. It uses the same Age Pension eligibility boundary, survivor-state transition and person-level tax allocation as the deterministic simulator. An enabled first-death event is fixed at the selected age and start-of-year boundary in every Monte Carlo path; mortality itself is not stochastic. It rejects, with a visible explanation, imports containing populated Other income/Other assets, active Defined Benefit/UK Pension income, active lump sums, or active v1.06 share growth, dividend or franking assumptions; it does not silently discard those cash flows.

The unreleased schema-5 core supports above-inflation salary growth using the deterministic year-by-year formula. The remaining import guards stay explicit until their separate parity slices are complete.

Other income is converted to AUD, CPI-indexed, allocated to person-level taxable or non-taxable ledgers, included in the Age Pension income test and continued after first death using the configured survivor continuation percentage. Zero-volatility tests compare the resulting tax, pension, drawdown and assets with the deterministic engine.

Defined Benefit/UK Pension parity separates each gross pension flow from its UPP-adjusted taxable flow. Start age, fixed or CPI indexation, currency conversion, the include toggle and first-death survivor continuation follow the deterministic contract in every path.

The reported success rate is conditional on the selected model and assumptions. It is not a personal forecast. The model does not make every material retirement risk stochastic, and deterministic stresses do not alter the Monte Carlo probability denominator.

## Important exclusions

The maintained [Deferred Review Register](DEFERRED-REVIEW.md) records known limitations, their likely impact and the review needed before remediation. Depending on the scenario, material exclusions can include:

- intra-year timing and cash-flow detail;
- future legislative and tax changes;
- complete TTR compliance rules;
- opening capital losses from before the projection;
- aged-care and health costs;
- property transactions and maintenance shocks;
- stochastic inflation, foreign exchange, employment and longevity;
- personalised product fees, insurance and adviser recommendations.

Inspect the assumptions shown by the application and obtain qualified advice before making real decisions.

Lump-sum audits retain requested, funded and unfunded amounts separately; an unfunded event is never charted as money received.
