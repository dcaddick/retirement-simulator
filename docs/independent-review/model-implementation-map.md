# Model and implementation map

> **Status: no independent review has been performed.**
> This page describes how the model works and where each rule lives in the code. It records no review result.

Line numbers refer to the exact release described in [these materials](README.md): `retirement-simulator.html` v1.12, SHA-256 `0E0B790C…`. They are navigation aids. If your copy has a different hash, the line numbers will not match and the file is not the one described here.

## Annual calculation sequence

The deterministic simulator produces one projection row per year. Each year it:

1. applies any scheduled transition from accumulation superannuation to retirement or drawdown phase;
2. adds employment income and after-contributions-tax superannuation contributions for people still working;
3. applies the entered estimated net nominal returns and annual nominal share-price growth;
4. records scheduled or named share sales, dividends and capital results using that year's holding-period exposure;
5. applies account-based pension minimum drawdowns when enabled;
6. adds pensions and other configured income;
7. nets capital losses per person before discounts, then estimates income tax, franking offsets and CGT;
8. funds CGT as an asset expense, then uses the configured drawdown priorities to fill any remaining income target;
9. banks income above the Essential Annual Budget into savings;
10. flags a shortfall when available income and configured drawdown sources cannot cover the Essential Annual Budget;
11. converts nominal results to today's dollars when that display mode is selected.

An optional fixed first-death event, if enabled, is applied at the start of the selected year before any of the above.

## Where each rule is implemented

| Model area | Implementation reference |
|---|---|
| Dated rate and threshold constants | `SCHEMA_VERSION` line 500; `TREASURY_INFLATION` line 504; `TAX_SCHEDULES` line 516; `TAX_SOURCE` line 520; `SAPTO_RULES` line 524; `MEDICARE_BASE` line 544; `SERVICES_AUSTRALIA_2026` line 560 |
| Inflation path and real-return readout | `inflationRateForYear` line 584; `realReturnPct` line 591 |
| Income-tax schedule and gross tax | `taxScheduleForYear` line 595; `incomeTaxResident` line 599 |
| Medicare levy, including family treatment | `medicareIndividualLevy` line 610; `medicareLevy` line 620; `medicareFamilyAssessment` line 626 |
| LITO and SAPTO, including the prescribed spouse transfer | `litoOffset` line 693; `saptoProxyEligibility` line 700; `saptoPreliminary` line 713; `saptoRebateThreshold` line 722; `saptoTransferAvailable` line 739; `saptoAmountForBase` line 751; `allocateCoupleSapto` line 760 |
| Ordered household tax assessment and franking | `householdTaxAssessment` line 835; `netTax` line 949; `projectionNetTax` line 962; `taxAfterFranking` line 982 |
| Pension rule set by household status | `pensionRuleSet` line 998 |
| Deeming and Age Pension estimates | `deemedIncome` line 1020; `agePensionAssetsRate` line 1028; `agePensionIncomeRate` line 1036; `agePensionRate` line 1043; `agePensionCouple` line 1050; `agePensionForAges` line 1054; `agePensionForHousehold` line 1072 |
| CSHC estimate | `cshcEstimate` line 1100 |
| Assessable financial assets | `assessableFinancialAssets` line 1113 |
| Ownership inclusion and household type | `singleHouseholdInclusion` line 1281; `householdInclusion` line 1287; `isSingleHousehold` line 1734; `outputPersonIndexes` line 1738; `householdRuleStatus` line 1742; `solePersonIndex` line 1749 |
| Schema migration, export and import | `migrateScenario` line 1302; `exportScenario` line 1496; `importScenario` line 1502 |
| Shares, dividends and franking credits | `shareValueAud` line 1517; `recordDividendExposure` line 1532; `frankingCreditNominal` line 1547; `shareDividendFlows` line 1553 |
| Capital gains, losses and share sales | `makeShareSaleRecord` line 1579; `capitalLedgerForPeople` line 1594; `discountedCapitalGainByPerson` line 1636; `applyShareSales` line 2074 |
| Other assets and deeming classification | `makeOtherAsset` line 1686; `otherAssetAssessmentBalances` line 1704 |
| UK State Pension | `ukPensionFlows` line 1714 |
| Projection state and lifecycle | `makeProjectionState` line 1756; `lifecycleContext` line 1822; `applyFirstDeathTransition` line 1840 |
| Super access, drawdown and funding | `superAccessSplit` line 1724; `drawFromTiers` line 1944; `fundTaxExpense` line 1972; `drawForLumpSum` line 2000; `liquidateNamedSource` line 2025 |
| Minimum pension drawdown | `minDrawRate` line 2107 |
| Projection orchestration | `projectScenario` line 2117; `projectYear` line 2179 |
| Scenario validation | `validatePerson` line 2700; `validateScenario` line 2750 |
| Illustrative survival context | `survivalProbability` line 3030; `survivalMilestones` line 3036 |
| Destructive-action confirmation control | `confirmDialog` line 3215 |
| Presentation and disclosure | `renderReturnAssumptions` line 3487; `renderKpis` line 4477; `renderProjectionTable` line 4517; `renderDashboard` line 4650; `renderKeyRates` line 4731; `renderSources` line 4792 |

Ordered steps inside `projectYear`: annual returns credited at lines 2224 to 2228; Age Pension assessment at lines 2423 to 2440; minimum pension drawdown at lines 2442 to 2462; tax-input assembly including the UK pension UPP deduction from line 2464; the three household tax assessment stages at lines 2485 to 2503; lump-sum funding shortfall accumulation at lines 2307 to 2320.

## Treatment summaries

### Household type and survivor state

A scenario is explicitly either a Couple or a Single household, and both people are always stored so the choice can be reversed without data loss. In Single mode, Person 1 is the sole active person from the first projection year: Person 2 personal inputs and Person 2 owned records contribute zero, a Joint 50/50 record contributes only Person 1's half, inactive drawdown sources are omitted, and reports show Person 1 only. Single is a starting household state rather than a survivor state, so spending targets remain at 100% and no inheritance or continuation percentage applies.

An optional fixed first death may be applied at the start of a selected projection year, before that year's income, tax, returns and drawdown. Assets transfer to the survivor, the deceased person's income stops, configured continuation percentages are paid, spending steps to the configured survivor percentages, single-status government-support and tax rules apply from that year, inherited super is preserved separately by phase and source return assumption, and the deceased person's unused capital losses lapse. It is a user-selected scenario boundary, not a mortality forecast, and it excludes probate, estate, death-benefit and bereavement matters.

### Superannuation and drawdown

The model separates accumulation and retirement-phase balances, accepts separate estimated net-return assumptions after fees and tax, and supports configurable transition timing. Super access age is limited to 60 or older because the model treats withdrawals as tax-free and does not represent the additional rules that can apply before 60. Guaranteed income and mandatory minimum payments are counted before discretionary top-ups. Ordered drawdown tiers can divide a draw between two sources. Transition-to-Retirement compliance is not fully modelled.

### Tax and government support

The per-person calculation order is explicit: gross resident income tax; then non-refundable LITO and final SAPTO applied only against that income tax and floored at zero; then Medicare after the individual low-income threshold and any family reduction; then refundable franking credits last. Offsets therefore cannot reduce Medicare. Each of the base-income, ordinary-income and total-income stages receives a complete household assessment.

SAPTO uses an age-and-income proxy for eligibility and taxable income as a rebate-income approximation, neither of which establishes legal eligibility. For a couple, combined rebate income determines whether each person is eligible while each person's own rebate income determines their preliminary taper, and the prescribed spouse-transfer calculation then adjusts donor and recipient base amounts before the final offset. A person uses the higher SAPTO Medicare thresholds only where their final SAPTO entitlement is greater than zero.

For a childless couple the Medicare calculation applies the enacted family threshold and statutory reduction, giving the full reduction to the liable partner where the spouse would otherwise owe no levy, and applying proportional allocation and transfer of excess reduction only where the spouse would otherwise owe levy. Dependent children are not modelled, so the legislated per-child increment is stored but not applied.

Income-tax brackets and LITO use the legislated fixed nominal schedule, so bracket creep is included as nominal income rises. Medicare and SAPTO thresholds are applied in today's-dollar terms. That inconsistency is a known open item.

Single-status Age Pension, deeming, CSHC and tax rules apply both to an explicit Single household from year zero and to the survivor from a modelled first-death year. For an age-gapped couple, one partner at Age Pension age produces half of the means-tested combined couple rate, with the taxable payment allocated to that person.

### Shares, other assets and capital gains

Each holding's nominal price growth is applied at the start of the projected year, before dividends and sales, and the cost base does not grow with market price. Cash dividends use the number of months held during the year and follow the holding owner, as do any franking credits. Franking eligibility is an explicit user assumption: holding-period, related-payment and other integrity rules are not automated, and a refundable franking offset can produce an estimated refund in a low-tax year.

Capital gains and losses are tracked per person. Current-year and carried losses are applied to non-discount gains first and discount-eligible gains second, and the 50% discount applies only to the remaining eligible gain. Opening losses always begin at zero because the interface does not collect pre-existing tax losses. CGT is funded from savings first and then the configured tiers as an asset expense, and neither sale proceeds nor CGT-funding draws count as retirement income.

An Other Asset may be marked as a financial investment for Age Pension deeming. Its included remaining value then contributes to the deemed financial-assets balance while it remains in the assets test. Scheduled disposal moves the included value to savings before assessment and named liquidation funds a lump sum immediately, so value is not counted twice. The selection does not extend to CSHC deeming.

Share prices are manual by default. The optional Stooq integration is limited to US-listed symbols. Generic Other assets stay outside the CGT model.

### Lump-sum withdrawals

Enabled lump sums reduce selected assets in the nominated year. They do not count as retirement income and do not satisfy the annual income target. An explicit liquid source is used first, and any remainder follows the household drawdown order. The projection retains requested, funded and unfunded amounts. Only the funded amount reduces assets or appears on the chart. An unfunded remainder produces a separate planning warning and deliberately does not change the essential-budget shortfall calculation. Disabled items remain saved but are excluded from validation, calculations, charts and event entries.

### Foreign and defined-benefit pensions

Australian defined-benefit income uses AUD with fixed or CPI-linked indexation. UK State Pension uses GBP to AUD conversion, a frozen-uprating comparison and a simplified undeducted purchase price deduction entered by the user. These are approximations, not jurisdiction-specific advice, and the model does not determine any individual's entitlement or UPP eligibility. The projection table shows gross UK State Pension, while the after-tax income chart allocates estimated household tax proportionally across charted taxable sources; that allocation is not a source-specific pension tax calculation.

### Nominal and today's dollars

Calculations run in nominal values. Today's-dollar views divide future nominal values by the cumulative inflation factor. The displayed real-return spread is nominal return minus inflation: an assumption aid, not a forecast of purchasing-power returns.

### Illustrative survival context

The chart ribbon uses an illustrative Gompertz curve (`A = 5.55e-6`, `G = 0.11`) to mark where entered persons cross selected survival-probability milestones. The parameters are a project selection and have not been actuarially validated. It is planning context, not a personalised estimate.
