# First-Death and Survivor-State Design

**Date:** 2026-07-15  
**Issue:** [#7 — Model first-death and survivor-state transitions](https://github.com/dcaddick/retirement-simulator/issues/7)  
**Target releases:** deterministic v1.08 / tag v1.0.8; Monte Carlo v0.7

## Purpose

Add an optional, explicit first-death scenario to both projection engines. The user selects which person dies first and their age at death. The event is fixed and reproducible; this release does not sample mortality or infer a death year from the illustrative survival ribbon.

The feature converts the household from a couple state to a survivor state at the start of the selected projection year. It transfers assets, changes spending targets, stops or continues income according to explicit settings, applies survivor tax and Age Pension treatment, and exposes the transition in projection output.

## Scope

### Included

- Optional user-selected first-death person and age.
- Start-of-year transition in deterministic and Monte Carlo projections.
- Independent survivor percentages for Preferred Retirement Income and Essential Annual Budget.
- Immediate asset transfer to the survivor without modelled probate, fees, delays, estate tax or transfer CGT.
- A separate survivor-owned inherited-super balance that retains its modelled accumulation or drawdown phase.
- Explicit deterministic survivor continuation percentages for UK State Pension and Other income, including Australian defined-benefit-style entries.
- Immediate Age Pension reassessment under single-person rules.
- Person-level survivor taxation and capital-loss treatment.
- Survivor-based projection horizon when the feature is enabled.
- Auditable chart, table, CSV, JSON and Monte Carlo assumption output.
- Migration that leaves all existing projections unchanged by default.

### Excluded

- Probabilistic mortality or longevity-path sampling.
- Second-death modelling.
- Dependants, wills, estate administration, probate, testamentary trusts or inheritance disputes.
- Estate expenses, delays or taxes.
- Detailed super death-benefit eligibility, tax components, transfer-balance-cap treatment or reversionary-pension rules.
- Exact provider-specific defined-benefit or UK survivor-pension rules.
- Age Pension bereavement lump sums or fortnightly bereavement calculations.
- Funeral costs unless the user separately models them as a lump-sum withdrawal.
- Monte Carlo support for deterministic Other income/assets, active DB/UK pensions or lump sums; those remain tracked by issue #1.

## Policy basis and explicit simplifications

Services Australia states that after a partner dies, Age Pension income and assets are reassessed using single-person thresholds. Some survivors may also qualify for a bereavement payment calculated over a 14-week period. The annual model will apply the single assessment immediately and will not estimate a bereavement payment because entitlement depends on circumstances that the scenario does not capture.

The Department of Social Services notes that a survivor review considers whether assets remain in an estate or transfer to the partner, and that jointly owned income and assets pass automatically to the survivor. This design deliberately assumes that every modelled asset transfers immediately to the survivor so the annual engine remains deterministic and auditable.

ATO guidance provides that the transfer of eligible CGT assets on death may be disregarded and that inherited assets retain relevant cost-base history, but the deceased person's unused net capital losses do not pass to the estate or beneficiary. Accordingly, the model preserves share cost bases, records no transfer CGT, retains the survivor's own loss balance and lapses the deceased person's unused capital losses.

The separate inherited-super balance is a planning abstraction, not a representation of a particular complying death-benefit structure. It preserves the existing model phase solely to avoid silently converting super into ordinary cash or merging away its audit trail.

### Sources

- [Services Australia — Your Age Pension after your partner dies](https://www.servicesaustralia.gov.au/your-age-pension-after-your-partner-dies?context=22526)
- [Services Australia — What help there is when an adult dies](https://www.servicesaustralia.gov.au/what-help-there-when-adult-dies?context=60101)
- [DSS Social Security Guide — Reviews: death of a recipient](https://guides.dss.gov.au/social-security-guide/6/1/3)
- [ATO — When and how to lodge returns for a deceased estate](https://www.ato.gov.au/individuals-and-families/deceased-estates/doing-trust-tax-returns-for-the-deceased-estate/when-and-how-to-lodge-returns-for-the-deceased-estate)

## Scenario schema

Advance the shared deterministic schema from v11 to v12.

Add an optional `household.firstDeath` object:

```js
firstDeath: {
  enabled: false,
  deceasedPerson: 'p0',
  deathAge: 80,
  survivorPreferredPct: 70,
  survivorEssentialPct: 70
}
```

Rules:

- `deceasedPerson` is `p0` or `p1`.
- `deathAge` is the selected person's age at the start of the transition year.
- Spending percentages are independently configurable from 0 to 100.
- New and sample scenarios keep the feature disabled.
- Migration from v11 adds the object with `enabled: false`, so no existing result changes.

Add `survivorPct` to each person-level UK State Pension configuration and each Other income entry. Migration sets it to zero. The value is stored even when first-death modelling is disabled and affects projections only after the configured owner dies.

Joint Other income continues at 100% after the transition and becomes survivor-owned. A continuation percentage applies only to income owned by the deceased person. Income already owned by the survivor continues unchanged.

## Shared lifecycle layer

Add a pure lifecycle transition unit shared by both engines. It receives the scenario, current projection year and ages, and the mutable financial state. It returns lifecycle context plus an updated state without performing ordinary annual growth, income, drawdown or tax calculations.

The lifecycle context exposes at least:

```js
{
  householdStatus: 'couple' | 'survivor',
  alive: [boolean, boolean],
  survivorIndex: null | 0 | 1,
  transitionedThisYear: boolean,
  preferredTargetPct: number,
  essentialTargetPct: number
}
```

The transition is idempotent. Once the state records that it has occurred, later annual calls return the existing survivor context without transferring balances or reducing targets again.

Both deterministic and Monte Carlo projection loops call this unit after deriving the year's ages and inflation factor but before any growth, income, sale, lump-sum, pension, drawdown or tax operation. Monte Carlo applies the same selected event on every path.

## Monte Carlo compatibility boundary

Monte Carlo v0.7 applies the fixed first-death transition only to the scenario subset it already models correctly: people, super, cash, savings, shareholdings, household targets, Age Pension and supported assumptions. It continues to reject imports containing deterministic Other income/assets, active DB/UK pensions or lump-sum withdrawals with an explicit compatibility message.

This release does not absorb issue #1. Survivor continuation percentages for DB/UK and Other income are implemented and tested in the deterministic engine. Monte Carlo preserves those fields through deterministic JSON, but does not accept a scenario that would require using them. For every scenario accepted by both engines, the selected deceased person, transition year, spending reduction, asset ownership, inherited-super treatment, single Age Pension boundary and survivor tax allocation must match.

## Transition order and accounting

At the start of the selected year:

1. Mark the configured person deceased and the other person survivor.
2. Stop the deceased person's salary and SG from that year.
3. Transfer owned cash, savings and shares to the survivor. Joint ownership becomes survivor ownership.
4. Preserve each inherited shareholding's quantity, price, cost base, discount eligibility, sale plan and return assumptions. Do not create a sale or transfer CGT event.
5. Treat household Other assets as survivor assets without changing their value, growth or disposal schedule.
6. Move the deceased person's accumulation- and retirement-phase super balances into a separately reported inherited-super balance owned by the survivor. Preserve the source phase.
7. Retain the survivor's capital-loss carry-forward and set the deceased person's unused carry-forward to zero. Record any lapsed amount in the transition audit event.
8. Reduce Preferred Retirement Income and Essential Annual Budget by their independent configured percentages.
9. Convert deceased-owned recurring income to the configured survivor continuation amount and allocate taxable income to the survivor. Keep joint and survivor-owned income at 100%.
10. Reassess Age Pension using the survivor's age and the current single-person maximum rate, assets-test free area and taper, income free area and taper, deeming thresholds and CSHC threshold where applicable.
11. Use the survivor's tax ledger only. The deceased person has zero taxable income and tax from the transition year onward.

The surviving person's age controls the Age Pension inclusion of survivor-owned super and the inherited-super drawdown minimum. This is an explicit simplification of provider and death-benefit rules.

## Spending and drawdown

Before death, the existing couple Preferred Income and Essential Annual Budget remain authoritative. From the transition year onward:

```text
survivor preferred target = couple preferred target × survivorPreferredPct / 100
survivor essential budget = couple essential budget × survivorEssentialPct / 100
```

Both defaults are 70%. The values are separate controls because a household may reduce discretionary and essential spending differently.

The existing household drawdown priority remains in effect. A source that referred to the deceased person's super resolves to the inherited-super balance after transfer. This preserves the user's ordering without silently deleting a funding tier. The inherited balance remains separately identifiable in balances and events.

## Projection horizon

When first-death modelling is disabled, the current Person-1-based horizon remains unchanged.

When enabled, the projection continues until the survivor reaches `household.modelEndAge`. The selected death age must map to a transition year before the survivor reaches that age. The horizon is derived deterministically from current ages, selected deceased person and survivor.

After the transition, the deceased person's table age displays as an em dash rather than continuing to rise. Internally, the engine may retain the calendar offset needed for indexing, but it must not present the person as continuing to age.

## Age Pension treatment

Add household-status-aware Age Pension and deeming functions rather than overloading couple constants implicitly. The functions accept `couple` or `single` assessment status and select explicit rate and threshold constants.

Before death, the existing age-gap couple behavior remains unchanged:

- no eligible partner: zero;
- one eligible partner: one partnered share after combined couple means tests;
- both eligible: assessed combined couple rate.

After death:

- only the survivor's age controls eligibility;
- single-person income and asset tests apply;
- the assessed pension is allocated entirely to the survivor's taxable-income ledger;
- any bereavement lump sum is omitted and disclosed as out of scope.

Policy constants remain dated and source-linked. Tests pin the selected release values so a future rate update is explicit.

## Income continuation

The transition applies these rules:

- Salary and SG for the deceased stop completely.
- Survivor-owned UK State Pension and Other income continue unchanged.
- Joint Other income continues in full and becomes survivor-owned.
- Deceased-owned UK State Pension and Other income continue at `survivorPct` and become survivor-owned.
- A zero continuation percentage stops the income.
- No continuation percentage is inferred from provider type or label.

This makes provider-specific survivor entitlements a visible user assumption rather than a hidden rule.

## Controls

Add a compact First-death scenario block to the Household section with:

- enable checkbox;
- person-who-dies-first selector;
- age-at-death number field;
- Survivor Preferred Income percentage;
- Survivor Essential Budget percentage.

Add `Paid to survivor %` to each UK State Pension and Other income editor. Keep touch targets, labels, focus preservation and live recalculation consistent with existing controls.

The first-death block is optional and disabled in new and fictional sample scenarios. Enabling it reveals or activates the dependent controls without changing unrelated section open/closed state.

## Outputs and auditability

- Draw a vertical `First death` marker on both deterministic charts.
- Step Preferred and Essential target lines down in the transition year.
- Add a transition event to the projection row identifying the deceased and survivor.
- Include transferred balances, stopped income, continued income, lapsed capital losses and new spending targets in structured event details.
- Display the deceased person's age as `—` from the transition year onward.
- Keep inherited super separately identifiable in balance output and event details.
- Include transition information in CSV export.
- Preserve all scenario controls in JSON export/import.
- State in the Monte Carlo assumptions that the death event is fixed across all paths.
- Ensure accessible chart summaries and non-colour-only transition labelling.

## Validation and error handling

Projection is blocked when:

- first-death modelling is enabled but the person selector is invalid;
- the selected age is at or below the person's current age;
- the transition occurs when or after the survivor would reach the model end age;
- either survivor spending percentage is outside 0 to 100;
- an income continuation percentage is outside 0 to 100.

Validation reports the exact scenario path and marks the corresponding control. Disabled first-death data remains persisted but does not affect projection. The lifecycle helper rejects a second transition attempt only in development/tests; production projection treats repeated calls as an idempotent no-op.

## Testing

### Deterministic engine

- v11 migration adds inert defaults and preserves baseline output.
- Disabled first-death scenarios match v1.07 results.
- Either person can die first; reversing person order produces equivalent household results.
- The event occurs before all transition-year financial activity.
- The transition runs exactly once.
- The horizon ends when the survivor reaches Model End Age.
- Default and custom spending percentages reduce the correct targets.
- Cash, savings, shares and Other assets transfer without balance loss.
- Share cost bases and planned sales remain unchanged.
- Deceased losses lapse; survivor losses persist.
- Inherited super remains separate and retains accumulation/drawdown phase.
- Salary and SG stop in the transition year.
- Survivor-owned and joint income continue correctly.
- Deceased-owned income handles 0%, partial and 100% continuation.
- Single Age Pension boundaries, means tests and survivor allocation are correct.
- Bereavement payments remain zero and are disclosed.
- Deceased taxable income and tax remain zero.
- JSON round-trip and CSV transition audit output are complete.

### Monte Carlo engine

- Imports schema v12 and rejects invalid lifecycle settings explicitly.
- Continues explicitly rejecting deterministic Other income/assets, active DB/UK pensions and lump sums under issue #1.
- Applies the same fixed event year and survivor identity to every path.
- Matches deterministic transition accounting for a zero-volatility fixture.
- Preserves seed reproducibility.
- Carries the inherited-super and survivor-target state through stress, risk-mode and break-point runs.

### Browser acceptance

- Verify first-death controls and conditional fields in dark and light themes.
- Test desktop and mobile layouts.
- Confirm live recalculation preserves focus and scroll context.
- Confirm both charts expose the transition marker and target step.
- Inspect the transition row, inherited-super output and CSV export.
- Verify deterministic v1.08 and Monte Carlo v0.7 show no console errors or warnings.

## Documentation and release

- Archive the exact outgoing `retirement-simulator.html` as `archive/retirement-simulator-v1.0.7.html` before modifying the canonical file.
- Update README, changelog, methodology, testing guide, archive register and deferred-review register.
- Mark issue #7 resolved only after both engines and release assets are verified.
- Publish deterministic display version v1.08 under the stable canonical filename.
- Rename the sole canonical Monte Carlo file to `retirement-monte-carlo-v0.7.html`.
- Tag the verified main commit as v1.0.8.
- Upload both standalone HTML files to the GitHub release.
- Verify CI, local/remote synchronization and release-asset SHA-256 digests before closing issue #7.

## Success criteria

The release succeeds when a user can opt into a fixed first-death scenario and both engines reproducibly show the same start-of-year survivor transition for their shared supported scenario subset; deterministic transferred balances reconcile; spending, income, tax and Age Pension use explicit survivor rules; Monte Carlo continues to reject issue #1 inputs rather than omit them; existing scenarios remain unchanged by default; output explains the transition; all automated and browser checks pass; and v1.0.8/v0.7 is published with verified assets.
