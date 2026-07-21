# Household Tax Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct deterministic SAPTO status, eligibility, transfer, Medicare family reduction, and non-refundable-offset ordering for the supported single, survivor, and childless-couple paths.

**Architecture:** Add a pure, non-persisted household tax assessment layer inside the existing single-file deterministic engine. It will calculate both people together and return person-level audit breakdowns; the projection will invoke it separately for base, ordinary-dividend, and total-CGT income so marginal ledger amounts remain valid. This is intentionally proportionate to a personal prototype: it does not add a general tax service, dependent schema, or new UI inputs.

**Tech Stack:** Vanilla JavaScript in `retirement-simulator.html`, Node.js assertion-style regression tests in `tests/retirement-simulator.test.mjs`, Markdown documentation, existing deterministic and Monte Carlo compatibility suites.

---

## Source and scope guardrails

Implement against these annual-assessment sources, not PAYG withholding tables:

- SAPTO eligibility and individual-versus-combined rebate income: https://www.ato.gov.au/myTax25OffsetsSAPTO
- SAPTO base amounts, taper, and transfer: https://www.legislation.gov.au/F2025L01060/latest/text, sections 9–12
- Medicare family reduction formula and allocation: https://www.legislation.gov.au/C2004A03351/latest/text, section 8
- Enacted 2025–26 Medicare thresholds: https://www.legislation.gov.au/C2026A00058/asmade/2026-06-30/text/original/pdf, Schedule 5
- Non-refundable offsets do not reduce Medicare levy: https://www.ato.gov.au/api/public/content/0-d300e446-ea4e-4046-a021-0dd9072e26ab

The enacted Medicare values for this implementation are:

```js
ordinary individual: { lower: 28011, upper: 35013 }
SAPTO individual:    { lower: 44268, upper: 55335 }
ordinary family:     47238
SAPTO family:        61623
dependent increment: 4338 // recorded for audit, deliberately unsupported
```

The supported SAPTO schedules are:

```js
single/survivor: { base: 2230, cutIn: 34919, cutOut: 52759 }
member/couple:   { base: 1602, cutIn: 30994, cutOut: 43810 }
couple combined eligibility limit: 87620 // strict upper boundary
taper: 0.125
```

Do not change the scenario schema, storage key, Monte Carlo implementation, tax-year mapping, long-range indexation policy, issue state, version, tag, or release artifacts in this plan.

## Task 1: Lock the rule constants and SAPTO schedule selection

**Files:**

- Modify: `tests/retirement-simulator.test.mjs:712-717` (current Medicare constant checks)
- Modify: `retirement-simulator.html:487-501` (tax and Medicare constants)
- Modify: `retirement-simulator.html:2532-2604` (core exports)

- [ ] Add failing source-constant and schedule tests immediately after the current Medicare checks.

```js
console.log('\nSAPTO and Medicare household rules');
check('SAPTO rule source and current schedules are exported',
  core.SAPTO_RULES.checkedDate === '2026-07-21' &&
  core.SAPTO_RULES.single.base === 2230 &&
  core.SAPTO_RULES.single.cutIn === 34919 &&
  core.SAPTO_RULES.single.cutOut === 52759 &&
  core.SAPTO_RULES.couple.base === 1602 &&
  core.SAPTO_RULES.couple.cutIn === 30994 &&
  core.SAPTO_RULES.couple.cutOut === 43810 &&
  core.SAPTO_RULES.coupleCombinedLimit === 87620);
check('Medicare family thresholds are enacted annual values',
  core.MEDICARE_BASE.family.ordinary === 47238 &&
  core.MEDICARE_BASE.family.sapto === 61623 &&
  core.MEDICARE_BASE.family.dependentIncrement === 4338);
check('single and couple schedules are selected explicitly',
  core.saptoScheduleForStatus('single').base === 2230 &&
  core.saptoScheduleForStatus('survivor').base === 2230 &&
  core.saptoScheduleForStatus('couple').base === 1602);
```

- [ ] Run the deterministic suite and verify the new assertions fail because the constants/helper are absent.

Run: `node tests/retirement-simulator.test.mjs`

Expected: existing tests remain green up to the new section; the new SAPTO/Medicare household assertions fail.

- [ ] Add immutable rule objects and explicit status selection next to `MEDICARE_BASE`.

```js
const SAPTO_RULES = Object.freeze({
  checkedDate: '2026-07-21',
  sourceUrl: 'https://www.ato.gov.au/myTax25OffsetsSAPTO',
  regulationsUrl: 'https://www.legislation.gov.au/F2025L01060/latest/text',
  taper: 0.125,
  transferTaxRate: 0.15,
  transferIncomeFloor: 6000,
  coupleCombinedLimit: 87620,
  threshold: Object.freeze({
    taxFreeThreshold: 18200,
    rebateMaximumAmount: 445,
    rebateReductionThreshold: 37000,
    rebateReductionRate: 0.015,
    lowestMarginalRate: 0.16,
    secondLowestMarginalRate: 0.30
  }),
  single: Object.freeze({ base: 2230, cutIn: 34919, cutOut: 52759 }),
  couple: Object.freeze({ base: 1602, cutIn: 30994, cutOut: 43810 })
});

const MEDICARE_BASE = Object.freeze({
  effectiveYear: 2025,
  checkedDate: '2026-07-21',
  sourceUrl: 'https://www.legislation.gov.au/C2026A00058/asmade/2026-06-30/text/original/pdf',
  ordinary: Object.freeze({ lower: 28011, upper: 35013 }),
  sapto: Object.freeze({ lower: 44268, upper: 55335 }),
  family: Object.freeze({
    ordinary: 47238,
    sapto: 61623,
    dependentIncrement: 4338
  })
});

function saptoScheduleForStatus(status) {
  return status === 'couple' ? SAPTO_RULES.couple : SAPTO_RULES.single;
}
```

- [ ] Export `SAPTO_RULES` and `saptoScheduleForStatus`, rerun the suite, and confirm the new section passes.

Run: `node tests/retirement-simulator.test.mjs`

Expected: all deterministic tests pass.

- [ ] Commit the constants slice.

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: define household tax rule sources"
```

## Task 2: Separate SAPTO proxy eligibility from the person-level amount

**Files:**

- Modify: `tests/retirement-simulator.test.mjs` after the Task 1 rule tests
- Modify: `retirement-simulator.html:566-570` (replace the hard-coded couple helper)
- Modify: `retirement-simulator.html:2532-2604` (exports)

- [ ] Add table-driven failing tests for status, age, combined eligibility, and individual tapering.

```js
const saptoCases = [
  ['single below cut-in', { rebateIncome: 30000, status: 'single', eligible: true }, 2230],
  ['single in taper', { rebateIncome: 40000, status: 'single', eligible: true }, 1594.875],
  ['single at cut-out', { rebateIncome: 52759, status: 'single', eligible: true }, 0],
  ['couple below cut-in', { rebateIncome: 8000, status: 'couple', eligible: true }, 1602],
  ['couple in taper', { rebateIncome: 35000, status: 'couple', eligible: true }, 1101.25],
  ['couple at cut-out', { rebateIncome: 43810, status: 'couple', eligible: true }, 0],
  ['ineligible returns zero', { rebateIncome: 8000, status: 'couple', eligible: false }, 0]
];
for (const [label, input, expected] of saptoCases) {
  check(label, Math.abs(core.saptoPreliminary(input) - expected) < 0.001);
}

const eligibleCouple = core.saptoProxyEligibility({
  status: 'couple', alive: [true, true], ages: [67, 67],
  rebateIncomes: [43809, 43810]
});
const boundaryCouple = core.saptoProxyEligibility({
  status: 'couple', alive: [true, true], ages: [67, 67],
  rebateIncomes: [43810, 43810]
});
check('combined income below the couple boundary remains eligible',
  eligibleCouple.every(Boolean));
check('combined income at the strict couple boundary is ineligible',
  boundaryCouple.every(value => !value));
check('single income at the individual cut-out is ineligible',
  core.saptoProxyEligibility({
    status: 'single', alive: [true, false], ages: [67, 0],
    rebateIncomes: [52759, 0]
  })[0] === false);
check('age proxy is required for each person',
  JSON.stringify(core.saptoProxyEligibility({
    status: 'couple', alive: [true, true], ages: [67, 66],
    rebateIncomes: [20000, 20000]
  })) === JSON.stringify([true, false]));
```

- [ ] Run the suite and confirm the missing functions cause only the new tests to fail.

Run: `node tests/retirement-simulator.test.mjs`

Expected: failures naming `saptoPreliminary` and `saptoProxyEligibility`.

- [ ] Replace `saptoOffset` internals with status-aware primitives while retaining a narrow couple-schedule wrapper for compatibility.

```js
function saptoProxyEligibility({ status, alive, ages, rebateIncomes }) {
  const isCouple = status === 'couple';
  const combined = rebateIncomes.reduce((sum, value) =>
    sum + Math.max(0, Number(value) || 0), 0);
  return [0, 1].map(index => {
    const income = Math.max(0, Number(rebateIncomes[index]) || 0);
    const incomeEligible = isCouple
      ? combined < SAPTO_RULES.coupleCombinedLimit
      : income < SAPTO_RULES.single.cutOut;
    return Boolean(alive[index] && ages[index] >= 67 && incomeEligible);
  });
}

function saptoPreliminary({ rebateIncome, status, eligible }) {
  if (!eligible) return 0;
  const schedule = saptoScheduleForStatus(status);
  const income = Math.max(0, Number(rebateIncome) || 0);
  if (income <= schedule.cutIn) return schedule.base;
  return Math.max(0, schedule.base -
    (income - schedule.cutIn) * SAPTO_RULES.taper);
}

function saptoOffset(rebateIncome) {
  return saptoPreliminary({ rebateIncome, status: 'couple', eligible: true });
}
```

Use the single schedule's `$52,759` cut-out as the proxy's strict individual income boundary so eligibility and the zero-offset boundary cannot drift apart.

- [ ] Export the two new helpers, run the deterministic suite, and commit.

Run: `node tests/retirement-simulator.test.mjs`

Expected: all deterministic tests pass.

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: separate SAPTO eligibility and schedules"
```

## Task 3: Implement prescribed unused-SAPTO transfer with an audit trail

**Files:**

- Modify: `tests/retirement-simulator.test.mjs` after the SAPTO amount tests
- Modify: `retirement-simulator.html` immediately after `saptoPreliminary`
- Modify: `retirement-simulator.html:2532-2604` (exports)

- [ ] Add failing golden tests for the statutory transfer formula and exclusions.

Use the couple base amount of `$1,602`. A donor with `$8,000` taxable income has `$1,302` available under `1,602 - (8,000 - 6,000) × 0.15`; a donor at or below `$6,000` has the full `$1,602` available.

```js
check('unused SAPTO transfer follows the prescribed income formula',
  core.saptoTransferAvailable({
    baseAmount: 1602, taxableIncome: 8000, grossIncomeTax: 0
  }) === 1302);
check('donor at the income floor can transfer the full base',
  core.saptoTransferAvailable({
    baseAmount: 1602, taxableIncome: 6000, grossIncomeTax: 0
  }) === 1602);
check('donor with enough pre-rebate tax transfers nothing',
  core.saptoTransferAvailable({
    baseAmount: 1602, taxableIncome: 30000, grossIncomeTax: 1602
  }) === 0);

const transferredSapto = core.allocateCoupleSapto({
  eligible: [true, true],
  rebateIncomes: [8000, 35000],
  taxableIncomes: [8000, 35000],
  grossIncomeTaxes: [0, core.incomeTaxResident(35000, 2026)]
});
check('couple transfer records asymmetric statutory adjustments',
  transferredSapto[0].baseReduction === 1602 &&
  transferredSapto[1].baseIncrease === 1302 &&
  transferredSapto[0].final >= 0 &&
  transferredSapto[1].final >= transferredSapto[1].preliminary);
check('no transfer occurs when only one partner qualifies',
  core.allocateCoupleSapto({
    eligible: [true, false], rebateIncomes: [8000, 35000],
    taxableIncomes: [8000, 35000], grossIncomeTaxes: [0, 3138]
  }).every(value => value.baseIncrease === 0 && value.baseReduction === 0));
```

- [ ] Run the suite and verify the new transfer tests fail.

Run: `node tests/retirement-simulator.test.mjs`

Expected: failures naming the two new transfer helpers.

- [ ] Implement transfer as a base-rebate adjustment, not an after-the-fact subtraction from final tax.

```js
function saptoTransferAvailable({ baseAmount, taxableIncome, grossIncomeTax }) {
  const donorExcess = Math.max(0, baseAmount - grossIncomeTax);
  if (donorExcess === 0) return 0;
  if (taxableIncome <= SAPTO_RULES.transferIncomeFloor) return donorExcess;
  return Math.max(0, baseAmount -
    (taxableIncome - SAPTO_RULES.transferIncomeFloor) *
      SAPTO_RULES.transferTaxRate);
}
```

`allocateCoupleSapto` must:

1. calculate both original preliminary offsets;
2. require both eligibility entries to be true;
3. identify each donor whose base amount exceeds gross income tax before any credits, rebates, or Medicare;
4. calculate the donor base reduction as `max(0, baseAmount - grossIncomeTax)` under regulation 12(1)(b) and 12(3)(a);
5. calculate the recipient base increase separately with `saptoTransferAvailable` under regulation 12(3)(b): use the donor excess when taxable income is at or below `$6,000`, otherwise use `max(0, baseAmount - (taxableIncome - 6000) * 0.15)`;
6. reduce the donor base by the donor reduction and increase the recipient base by the recipient increase; do not force the two statutory adjustments to be equal;
7. recalculate each affected rebate under regulation 11 using the adjusted base amount and rebate threshold derived under regulation 9;
8. return `{ preliminary, adjustedBase, baseIncrease, baseReduction, final }` for both people;
9. clamp monetary results to zero and assert the `$8,000` golden case records a `$1,602` donor reduction and `$1,302` recipient increase.

Implement `saptoRebateThreshold(baseAmount)` from regulation 9 using the fixed current-rule inputs `taxFreeThreshold: 18200`, `rebateMaximumAmount: 445`, `rebateReductionThreshold: 37000`, `rebateReductionRate: 0.015`, `lowestMarginalRate: 0.16`, and `secondLowestMarginalRate: 0.30`. Keep these inputs inside `SAPTO_RULES` so the calculation is auditable.

```js
function saptoRebateThreshold(baseAmount) {
  const rules = SAPTO_RULES.threshold;
  const firstBand = rules.taxFreeThreshold +
    (rules.rebateMaximumAmount + baseAmount) / rules.lowestMarginalRate;
  if (firstBand <= rules.rebateReductionThreshold) {
    return Math.ceil(firstBand);
  }
  const reductionBand = rules.rebateReductionThreshold *
    (rules.rebateReductionRate + rules.secondLowestMarginalRate -
      rules.lowestMarginalRate);
  const baseBand = rules.taxFreeThreshold * rules.lowestMarginalRate +
    rules.rebateMaximumAmount + baseAmount;
  return Math.ceil((reductionBand + baseBand) /
    (rules.rebateReductionRate + rules.secondLowestMarginalRate));
}
```

Add assertions that `saptoRebateThreshold(1602) === 30994`, `saptoRebateThreshold(2230) === 34919`, and `saptoRebateThreshold(2904) === 38083`. The last value is the member-of-couple recipient base after receiving the `$1,302` transfer in the golden case.

- [ ] Export the transfer helpers, run tests, and inspect the returned golden breakdown.

Run: `node tests/retirement-simulator.test.mjs`

Expected: all deterministic tests pass and the asymmetric donor/recipient golden audit values are exact to one cent.

- [ ] Commit the transfer slice.

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: model prescribed SAPTO spouse transfer"
```

## Task 4: Add individual and childless-family Medicare calculations

**Files:**

- Modify: `tests/retirement-simulator.test.mjs` after the SAPTO transfer tests
- Modify: `retirement-simulator.html:552-557` (Medicare helper area)
- Modify: `retirement-simulator.html:2532-2604` (exports)

- [ ] Add failing individual-threshold tests that distinguish age from actual SAPTO entitlement.

```js
check('ordinary individual Medicare lower boundary is inclusive',
  core.medicareIndividualLevy({ taxableIncome: 28011, saptoEntitled: false }) === 0);
check('ordinary individual Medicare phase-in starts above the boundary',
  core.medicareIndividualLevy({ taxableIncome: 28012, saptoEntitled: false }) === 0.10);
check('SAPTO Medicare lower boundary requires actual entitlement',
  core.medicareIndividualLevy({ taxableIncome: 44268, saptoEntitled: true }) === 0 &&
  core.medicareIndividualLevy({ taxableIncome: 44268, saptoEntitled: false }) > 0);
```

- [ ] Add failing family golden tests around the enacted thresholds and proportional allocation.

```js
const belowFamily = core.medicareFamilyAssessment({
  taxableIncomes: [24000, 23238],
  individualLevies: [0, 0],
  saptoEntitled: [false, false]
});
check('ordinary childless family threshold is inclusive',
  belowFamily.every(value => value.final === 0));

const familyAbove = core.medicareFamilyAssessment({
  taxableIncomes: [30000, 20000],
  individualLevies: [199, 0],
  saptoEntitled: [false, false]
});
check('family reduction cannot make either levy negative',
  familyAbove.every(value => value.final >= 0));
check('family reduction and excess transfer reconcile',
  Math.abs(familyAbove.reduce((sum, value) => sum + value.final, 0) -
    familyAbove.reduce((sum, value) =>
      sum + value.beforeFamily - value.familyReduction, 0)) < 0.01);

const mixedEntitlement = core.medicareFamilyAssessment({
  taxableIncomes: [45000, 18000],
  individualLevies: [900, 0],
  saptoEntitled: [true, false]
});
check('family threshold category is selected per person',
  mixedEntitlement[0].familyThreshold === 61623 &&
  mixedEntitlement[1].familyThreshold === 47238);
```

- [ ] Run the suite and verify only the new Medicare helper tests fail.

Run: `node tests/retirement-simulator.test.mjs`

Expected: failures naming `medicareIndividualLevy` and `medicareFamilyAssessment`.

- [ ] Implement `medicareIndividualLevy({ taxableIncome, saptoEntitled })` and retain `medicareLevy(taxableIncome, seniorEligible)` only as a compatibility wrapper.

```js
function medicareIndividualLevy({ taxableIncome, saptoEntitled }) {
  const income = Math.max(0, Number(taxableIncome) || 0);
  const { lower, upper } = saptoEntitled
    ? MEDICARE_BASE.sapto
    : MEDICARE_BASE.ordinary;
  if (income <= lower) return 0;
  if (income <= upper) return (income - lower) * 0.10;
  return income * 0.02;
}
```

- [ ] Implement `medicareFamilyAssessment` directly from Medicare Levy Act section 8.

For each partner, use that partner's category threshold and:

```text
familyReduction = max(0,
  2% × familyThreshold - 8% × (familyIncome - familyThreshold))
```

Allocate the reduction by the statutory taxable-income proportion. Apply any amount exceeding one spouse's pre-family levy against the other spouse's levy. Return, per person, `{ beforeFamily, familyThreshold, allocatedReduction, excessTransferred, familyReduction, final }`. Enforce `final >= 0`, `familyReduction <= beforeFamily` after excess transfer, and household reconciliation to one cent. There is no dependent increment because the supported path is explicitly childless.

- [ ] Export the new helpers, rerun all deterministic tests, and commit.

Run: `node tests/retirement-simulator.test.mjs`

Expected: all deterministic tests pass.

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: apply childless couple Medicare reduction"
```

## Task 5: Build the household assessment and correct offset ordering

**Files:**

- Modify: `tests/retirement-simulator.test.mjs:1109-1136` (projection tax basis section)
- Modify: `retirement-simulator.html:572-612` (net tax and franking helpers)
- Modify: `retirement-simulator.html:2532-2604` (exports)

- [ ] Add failing ordering and audit-contract tests.

```js
const orderingAssessment = core.householdTaxAssessment({
  status: 'single', alive: [true, false], ages: [67, 0],
  taxableNominal: [45000, 0], rebateNominal: [45000, 0],
  frankingNominal: [0, 0], inflationFactor: 1, year: 2026
});
const orderingPerson = orderingAssessment.people[0];
check('non-refundable offsets do not reduce Medicare levy',
  orderingPerson.medicareFinalNominal > 0 &&
  orderingPerson.netBeforeFrankingNominal ===
    orderingPerson.incomeTaxAfterOffsetsNominal +
      orderingPerson.medicareFinalNominal);
check('household assessment exposes the complete audit contract',
  ['grossIncomeTaxNominal', 'litoNominal', 'saptoPreliminaryNominal',
   'saptoBaseIncreaseNominal', 'saptoBaseReductionNominal',
   'saptoFinalNominal', 'medicareBeforeFamilyNominal',
   'medicareFamilyReductionNominal', 'medicareFinalNominal',
   'netBeforeFrankingNominal', 'frankingNominal', 'netNominal',
   'taxNominal', 'refundNominal']
    .every(key => Number.isFinite(orderingPerson[key])));

const frankedAssessment = core.householdTaxAssessment({
  status: 'single', alive: [true, false], ages: [67, 0],
  taxableNominal: [20000, 0], rebateNominal: [20000, 0],
  frankingNominal: [500, 0], inflationFactor: 1, year: 2026
});
check('refundable franking remains after tax and Medicare',
  frankedAssessment.people[0].refundNominal === 500);
```

- [ ] Run the suite and confirm the missing household helper fails the new tests.

Run: `node tests/retirement-simulator.test.mjs`

Expected: a failure naming `householdTaxAssessment`.

- [ ] Implement `householdTaxAssessment` as the sole integrated tax path.

The function must:

1. normalize both-person arrays and derive `status` from the caller, never from age;
2. calculate nominal resident income tax and LITO, then convert them to today-dollar values using `inflationFactor`;
3. calculate today-dollar rebate/taxable incomes for the existing indexed SAPTO and Medicare convention;
4. apply proxy eligibility, preliminary SAPTO, prescribed transfer, and actual-entitlement Medicare category;
5. apply family Medicare only when `status === 'couple'` and both people are alive;
6. calculate `max(0, grossIncomeTax - LITO - SAPTO) + Medicare` in today dollars;
7. convert all reported amounts back to nominal dollars;
8. subtract refundable franking last;
9. return `{ status, combinedTaxableNominal, combinedRebateNominal, people }`.

Add a local `zeroHouseholdTaxPerson()` factory so deceased entries expose the same finite audit keys as living entries.

The integrated person object uses the detailed audit names above. When it is placed into the legacy projection ledger, also retain `beforeFrankingNominal` as an alias of `netBeforeFrankingNominal`, plus the existing `frankingNominal`, `netNominal`, `taxNominal`, and `refundNominal` keys. Existing tests and downstream reporting must not lose their established field names.

- [ ] Rewrite `netTax`, `projectionNetTax`, and `taxAfterFranking` as narrow one-person adapters over `householdTaxAssessment` where possible. Preserve their argument and return shapes, but do not preserve the old incorrect offset ordering.

- [ ] Export the household helper, run the deterministic suite, and update existing expected values only where the corrected ordering demonstrably changes them.

Run: `node tests/retirement-simulator.test.mjs`

Expected: all deterministic tests pass; any changed golden value is accompanied by an assertion that separately checks income tax after offsets and Medicare.

- [ ] Commit the household-assessment slice.

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: order household offsets before Medicare"
```

## Task 6: Integrate household assessment into all three projection tax stages

**Files:**

- Modify: `tests/retirement-simulator.test.mjs:849-867` (age-gap tax test)
- Modify: `tests/retirement-simulator.test.mjs` near the survivor projection tests
- Modify: `retirement-simulator.html:1964-2031` (projection tax ledger)

- [ ] Add an uneven-income couple projection test that proves the ledger uses one shared household context.

Build a deterministic scenario with both people age 67+, a first-person taxable other income of `$35,000`, and a second-person taxable other income of `$8,000`. Assert:

```js
check('uneven-income couple records SAPTO transfer in the projection ledger',
  unevenRow.taxLedger[0].totalTax.saptoBaseIncreaseNominal === 1302 &&
  unevenRow.taxLedger[1].totalTax.saptoBaseReductionNominal === 1602);
```

The approved golden calculation confirms person 1 (the `$8,000` earner) is the donor and person 0 (the `$35,000` earner) is the recipient, matching the assertions above.

- [ ] Add a couple-to-survivor test using an existing first-death scenario. At the transition row assert:

```js
check('first-death transition immediately uses single SAPTO status',
  transitionRow.taxLedger[survivorIndex].totalTax.saptoSchedule === 'single' &&
  transitionRow.taxLedger[survivorIndex].totalTax.saptoBaseIncreaseNominal === 0 &&
  transitionRow.taxLedger[survivorIndex].totalTax.medicareFamilyReductionNominal === 0);
```

- [ ] Run the suite and verify the new integration tests fail against the per-person tax loop.

Run: `node tests/retirement-simulator.test.mjs`

Expected: the new ledger audit assertions fail; earlier unit tests remain green.

- [ ] Replace the `[0, 1].map` tax calculation with three household calls.

Create arrays before calculation:

```js
const ordinaryTaxableNominal = [0, 1].map(index =>
  baseTaxableNominal[index] + dividendFlows.cashByPerson[index] +
    dividendFlows.frankingByPerson[index]);
const totalTaxableNominalByPerson = [0, 1].map(index =>
  ordinaryTaxableNominal[index] + netCapitalGainByPerson[index]);
const frankingNominal = dividendFlows.frankingByPerson;
const householdTaxStatus = state.lifecycle.alive.every(Boolean)
  ? 'couple'
  : 'survivor';
```

Invoke `householdTaxAssessment` for:

- base taxable/rebate income with zero franking;
- ordinary taxable/rebate income with dividend franking;
- total taxable/rebate income with dividend franking.

Then reshape each returned `people[index]` into the existing `taxLedger[index]` structure. Preserve:

```js
cgtTaxNominal = Math.max(0, totalTax.netNominal - ordinaryTax.netNominal);
refundNominal = totalTax.refundNominal;
dividendNetNominal = dividendCash -
  (ordinaryTax.netNominal - baseTax.netNominal);
```

Each reshaped `baseTax`, `ordinaryTax`, and `totalTax` object must contain both the new audit fields and the legacy keys described in Task 5. Add `saptoSchedule: 'couple' | 'single'` to each audit object so the transition assertion is based on calculated status, not inferred from the dollar amount.

Do not build the household context only once and reuse its offset results across the three stages; taxable and rebate incomes differ at each stage.

- [ ] Update the existing age-gap expected-tax test to call `householdTaxAssessment` with `[eligiblePersonIncome, 0]` rather than the legacy `seniorEligible` adapter.

- [ ] Run deterministic tests twice to rule out hidden state and confirm all rows remain finite.

Run: `node tests/retirement-simulator.test.mjs`

Expected on both runs: `275+ passed, 0 failed`; the precise pass count increases with the added assertions.

- [ ] Commit the projection integration.

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: integrate household tax into projections"
```

## Task 7: Add concise prototype limitations and architectural rationale

**Files:**

- Modify: `retirement-simulator.html` in the existing assumptions/help copy; locate with `rg -n "assumption|SAPTO|Medicare" retirement-simulator.html`
- Modify: `docs/MODEL-METHODOLOGY.md:61-71`
- Modify: `docs/TESTING.md` in deterministic tax coverage and limitations
- Modify: `tests/retirement-simulator.test.mjs:30` and the documentation assertion section

- [ ] Add failing documentation-presence checks using exact durable phrases.

```js
check('methodology discloses the SAPTO proxy',
  methodology.includes('age-and-income proxy') &&
  methodology.includes('does not establish legal SAPTO eligibility'));
check('methodology discloses childless Medicare family scope',
  methodology.includes('childless couple') &&
  methodology.includes('dependent children are not modelled'));
check('methodology records prototype architecture rationale',
  methodology.includes('personal prototype') &&
  methodology.includes('thousands of users'));
```

- [ ] Run the deterministic suite and verify the new documentation checks fail.

Run: `node tests/retirement-simulator.test.mjs`

Expected: only the three new documentation checks fail.

- [ ] Update methodology with the exact calculation order, current sources/dates, status transition, combined eligibility versus individual taper, prescribed transfer, actual-entitlement Medicare category, childless family reduction, and rebate-income approximation.

- [ ] Explain why the architecture is bounded: this is an auditable household context suitable for a personal hobby prototype. State that a service for thousands of users would need separately versioned rules, richer household/dependent inputs, professional effective-date maintenance, calculation-explanation UI, accessibility, privacy/security, audit logs, monitoring, and stronger release controls.

- [ ] Add concise in-app copy without a new input control:

```text
Tax status estimate: SAPTO uses an age-and-income proxy and does not establish legal eligibility. Couple Medicare estimates assume no dependent children. Confirm current rules and personal eligibility before relying on the result.
```

- [ ] Update `docs/TESTING.md` to name the household tax unit/golden/integration tests and reiterate that repository tests are regression evidence, not professional tax verification.

- [ ] Run the deterministic suite, visually inspect the assumptions copy in both themes at desktop and mobile widths using the existing browser workflow, and commit.

Run: `node tests/retirement-simulator.test.mjs`

Expected: all deterministic tests pass; assumptions copy is readable, wraps without overflow, and introduces no console error.

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs docs/MODEL-METHODOLOGY.md docs/TESTING.md
git commit -m "docs: explain household tax prototype limits"
```

## Task 8: Full compatibility and scope verification

**Files:**

- Verify only; modify tests/code only for defects found within the approved design

- [ ] Run deterministic tests.

Run: `node tests/retirement-simulator.test.mjs`

Expected: all tests pass, with a count greater than the pre-change 275 and zero failures.

- [ ] Run the unchanged Monte Carlo compatibility suite.

Run: `node tests/retirement-monte-carlo.test.mjs`

Expected: all Monte Carlo tests pass. This demonstrates compatibility only; it does not close issue #1 or claim household-tax parity in Monte Carlo.

- [ ] Run whitespace and conflict checks.

```powershell
git diff --check 79e12d0..HEAD
rg -n "^(<<<<<<<|=======|>>>>>>>)" retirement-simulator.html tests docs
```

Expected: both commands produce no findings.

- [ ] Confirm no persisted schema or Monte Carlo source changed.

```powershell
git diff --name-only 79e12d0..HEAD
git diff 79e12d0..HEAD -- retirement-monte-carlo.html
rg -n "schemaVersion|STORAGE_KEY" retirement-simulator.html
```

Expected: `retirement-monte-carlo.html` has no diff; schema/storage constants are unchanged; the name list is limited to the deterministic HTML, deterministic test, methodology, and testing guide.

- [ ] Inspect the combined change and confirm every acceptance criterion maps to at least one named test.

Run: `git diff --stat 79e12d0..HEAD`

Expected: a bounded deterministic implementation and documentation diff with no release artifact.

- [ ] Do not close GitHub issues #21, #22, #23, or #30 and do not create a release in this plan. Report the verified commit range, exact test counts, and remaining limitations for the user's separate approval.

## Completion checklist

- [ ] Single/survivor years select the single SAPTO schedule.
- [ ] Couple eligibility uses combined rebate income while each preliminary amount uses individual rebate income.
- [ ] Transfer follows regulation 12 and records the asymmetric donor reduction and recipient increase without false conservation.
- [ ] SAPTO Medicare thresholds require at least `$1` final entitlement.
- [ ] Childless-couple Medicare reduction and spouse allocation reconcile.
- [ ] LITO and SAPTO reduce income tax only; Medicare remains separate.
- [ ] Refundable franking remains last and preserves refund behavior.
- [ ] Base, ordinary, and total projection tax stages each receive a household assessment.
- [ ] First-death transition switches to single status immediately.
- [ ] Prototype eligibility, rebate-income, dependent-child, and scale limitations are explicit.
- [ ] Deterministic and unchanged Monte Carlo compatibility suites pass.
- [ ] No issue #1, schema, tax-year, indexation, issue-state, version, tag, or release work is included.
