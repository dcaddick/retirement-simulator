# Monte Carlo Defined Benefit and UK Pension Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the obsolete Monte Carlo private-pension model with full parity for the current deterministic Australian Defined Benefit and UK State Pension contract.

**Architecture:** Normalize legacy private pensions during schema-4 migration, then calculate supported pensions through one pure helper returning gross and taxable nominal flows. Feed those flows into the existing tax, Age Pension, survivor, household-funding and reporting paths; replace the obsolete editor with the deterministic controls and prove both modes through zero-volatility parity.

**Tech Stack:** Self-contained HTML/CSS/JavaScript, Node.js ESM tests, `node:assert/strict`, `node:vm`, Git.

---

## File map

- `retirement-monte-carlo-v0.7.html` — migration, validation, compatibility guard, pension helper, projection integration, editor and assumptions disclosure.
- `tests/retirement-monte-carlo.test.mjs` — migration, validation, pure-flow, parity, stochastic, UI and documentation contracts.
- `README.md` — public parity and remaining-guard status.
- `docs/MODEL-METHODOLOGY.md` — pension formulas and survivor treatment.
- `docs/TESTING.md` — regression coverage.
- `CHANGELOG.md` — unreleased third issue #1 slice.

### Task 1: Normalize legacy pensions and validate the current contract

**Files:**
- Modify: `retirement-monte-carlo-v0.7.html:658-760`
- Modify: `retirement-monte-carlo-v0.7.html:805-950`
- Modify: `retirement-monte-carlo-v0.7.html:1760-1870`
- Test: `tests/retirement-monte-carlo.test.mjs:90-380`

- [ ] **Step 1: Write failing sample and migration tests**

Add beside the schema-5 sample assertions:

```js
assert.ok(monteCarloDemo.people.every(person =>
  !('ukPrivateAmountGbp' in person) &&
  !('ukPrivateTakeAge' in person) &&
  !('ukPrivateType' in person)),
'native schema 5 should not expose obsolete private-pension fields');
assert.ok(monteCarloDemo.people.every(person =>
  ['frozen', 'cpi'].includes(person.ukStateIndexation)));
```

Extend the existing native schema-4 migration fixture before migration:

```js
nativeSchema4.people[0].ukPrivateAmountGbp = 5000;
nativeSchema4.people[0].ukPrivateTakeAge = 67;
nativeSchema4.people[0].ukPrivateType = 'annuity';
nativeSchema4.people[1].ukPrivateAmountGbp = 20000;
nativeSchema4.people[1].ukPrivateTakeAge = 66;
nativeSchema4.people[1].ukPrivateType = 'lump';
```

After migration, assert:

```js
assert.ok(migratedSchema5.people.every(person =>
  !('ukPrivateAmountGbp' in person) &&
  !('ukPrivateTakeAge' in person) &&
  !('ukPrivateType' in person)));
assert.deepEqual(plain(migratedSchema5.otherIncomes.at(-1)), {
  id: 'income-migrated-0',
  label: `${nativeSchema4.people[0].name} private pension annuity`,
  currency: 'GBP',
  fxToAud: nativeSchema4.assumptions.gbpAud,
  amount: 5000,
  taxable: true,
  owner: 'joint',
  survivorPct: 0
});
assert.deepEqual(plain(migratedSchema5.otherAssets.at(-1)), {
  id: 'asset-migrated-1',
  label: `${nativeSchema4.people[1].name} private pension lump sum`,
  currency: 'GBP',
  fxToAud: nativeSchema4.assumptions.gbpAud,
  amount: 20000,
  growthPct: 2.5,
  disposalYear: nativeSchema4.startYear +
    (66 - nativeSchema4.people[1].age)
});
```

The existing native compatibility-guard loop currently clones `migratedSchema5`. Before that loop, create a clean guard base so the migrated legacy lump does not mask each intended guard:

```js
const guardedSchema5 = structuredClone(migratedSchema5);
guardedSchema5.otherIncomes = [];
guardedSchema5.otherAssets = [];
```

Change the loop's clone source from `migratedSchema5` to `guardedSchema5`. Update the existing deterministic-adapter assertion from expecting inert `ukPrivateAmountGbp` fields to asserting that all three obsolete private keys are absent.

- [ ] **Step 2: Write failing validation tests**

Create a populated valid native pension scenario:

```js
const validPensionScenario = structuredClone(monteCarloDemo);
validPensionScenario.assumptions.ukPensionsEnabled = true;
validPensionScenario.assumptions.gbpAud = 1.95;
validPensionScenario.assumptions.uppPct = 8;
Object.assign(validPensionScenario.people[0], {
  ukStateAnnualGbp: 12000,
  ukStateStartAge: 67,
  ukStateIndexation: 'frozen',
  ukStateSurvivorPct: 50
});
assert.ok(!simulator.validateScenario(validPensionScenario).some(error =>
  error.path.includes('ukState') || error.path.startsWith('assumptions.gbpAud') ||
  error.path.startsWith('assumptions.uppPct') ||
  error.path.startsWith('assumptions.ukPensionsEnabled')));
```

Add field-path checks:

```js
for (const [path, value] of [
  ['assumptions.ukPensionsEnabled', 'yes'],
  ['assumptions.gbpAud', 0],
  ['assumptions.uppPct', -1],
  ['assumptions.uppPct', 101],
  ['people.0.ukStateAnnualGbp', -1],
  ['people.0.ukStateStartAge', 54],
  ['people.0.ukStateStartAge', 81],
  ['people.0.ukStateIndexation', 'invalid'],
  ['people.0.ukStateSurvivorPct', -1],
  ['people.0.ukStateSurvivorPct', 101]
]) {
  const invalid = structuredClone(validPensionScenario);
  const parts = path.split('.');
  let target = invalid;
  for (const part of parts.slice(0, -1)) target = target[part];
  target[parts.at(-1)] = value;
  assert.ok(simulator.validateScenario(invalid)
    .some(error => error.path === path), `${path} should reject ${String(value)}`);
}
```

- [ ] **Step 3: Run the Monte Carlo suite and verify failure**

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: non-zero exit because the sample still contains private-pension fields or validation is absent.

- [ ] **Step 4: Remove obsolete fields from native defaults and adaptation**

Delete `ukPrivateAmountGbp`, `ukPrivateTakeAge` and `ukPrivateType` from both sample people. Add this default if absent:

```js
ukStateIndexation: 'frozen',
```

In the deterministic adapter, map people through:

```js
adapted.people = adapted.people.map(person => {
  const { ukPrivateAmountGbp, ukPrivateTakeAge, ukPrivateType, ...current } = person;
  return {
    ...current,
    salaryGrowthPct: person.salaryGrowthPct ?? 0,
    ukStateAnnualGbp: person.ukStateAnnualGbp ?? 0,
    ukStateStartAge: person.ukStateStartAge ?? 67,
    ukStateIndexation: person.ukStateIndexation === 'cpi' ? 'cpi' : 'frozen',
    ukStateSurvivorPct: person.ukStateSurvivorPct ?? 0
  };
});
```

- [ ] **Step 5: Convert private pensions in schema-4 migration**

Inside the schema-4 to schema-5 migration, initialize Other income/assets before mapping people, then replace the people map with:

```js
const startYear = migrated.startYear ?? new Date().getFullYear();
migrated.otherIncomes = Array.isArray(migrated.otherIncomes)
  ? migrated.otherIncomes : [];
migrated.otherAssets = Array.isArray(migrated.otherAssets)
  ? migrated.otherAssets : [];
migrated.people = migrated.people.map((person, index) => {
  const { ukPrivateAmountGbp, ukPrivateTakeAge, ukPrivateType, ...current } = person;
  if (ukPrivateAmountGbp > 0) {
    if (ukPrivateType === 'annuity') {
      migrated.otherIncomes.push({
        id: `income-migrated-${index}`,
        label: `${person.name} private pension annuity`,
        currency: 'GBP',
        fxToAud: migrated.assumptions.gbpAud,
        amount: ukPrivateAmountGbp,
        taxable: true,
        owner: 'joint',
        survivorPct: 0
      });
    } else {
      migrated.otherAssets.push({
        id: `asset-migrated-${index}`,
        label: `${person.name} private pension lump sum`,
        currency: 'GBP',
        fxToAud: migrated.assumptions.gbpAud,
        amount: ukPrivateAmountGbp,
        growthPct: 2.5,
        disposalYear: startYear +
          Math.max(0, (ukPrivateTakeAge ?? person.age) - person.age)
      });
    }
  }
  return {
    ...current,
    salaryGrowthPct: Number.isFinite(person.salaryGrowthPct)
      ? person.salaryGrowthPct : 0,
    ukStateIndexation: person.ukStateIndexation === 'cpi' ? 'cpi' : 'frozen'
  };
});
```

Keep the existing empty-array and shareholding migrations, but do not overwrite the populated arrays after this conversion.

- [ ] **Step 6: Add exact pension validation**

Inside each-person validation, add:

```js
if (!finiteNonNegative(person.ukStateAnnualGbp)) {
  add(`people.${index}.ukStateAnnualGbp`,
    'Annual pension must be zero or greater.');
}
if (!Number.isFinite(person.ukStateStartAge) ||
    person.ukStateStartAge < 55 || person.ukStateStartAge > 80) {
  add(`people.${index}.ukStateStartAge`,
    'Pension start age must be between 55 and 80.');
}
if (!['frozen', 'cpi'].includes(person.ukStateIndexation)) {
  add(`people.${index}.ukStateIndexation`,
    'Pension indexation must be fixed/frozen or CPI-indexed.');
}
```

After people validation, add:

```js
if (typeof scenario.assumptions?.ukPensionsEnabled !== 'boolean') {
  add('assumptions.ukPensionsEnabled',
    'Include pensions must be true or false.');
}
if (!(Number.isFinite(scenario.assumptions?.gbpAud) &&
    scenario.assumptions.gbpAud > 0)) {
  add('assumptions.gbpAud', 'GBP to AUD rate must be greater than zero.');
}
if (!Number.isFinite(scenario.assumptions?.uppPct) ||
    scenario.assumptions.uppPct < 0 || scenario.assumptions.uppPct > 100) {
  add('assumptions.uppPct', 'UPP deduction must be between 0 and 100.');
}
```

Retain the existing survivor-percentage validation.

- [ ] **Step 7: Run the suite and commit migration/validation**

```powershell
node tests/retirement-monte-carlo.test.mjs
git diff --check
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "feat: normalize Monte Carlo pension data"
```

Expected: suite passes while active current pensions remain guarded.

### Task 2: Implement pension flows and deterministic parity

**Files:**
- Modify: `retirement-monte-carlo-v0.7.html:900-1030`
- Modify: `retirement-monte-carlo-v0.7.html:1035-1100`
- Modify: `retirement-monte-carlo-v0.7.html:1400-1760`
- Test: `tests/retirement-monte-carlo.test.mjs:250-380`
- Test: `tests/retirement-monte-carlo.test.mjs:620-980`

- [ ] **Step 1: Replace pension rejection with positive import tests**

Create current Defined Benefit and UK fixtures from `supportedSchema12`, with all other guarded arrays empty. Import them and assert that annual amount, start age, indexation, survivor percentage, enabled state, FX and UPP survive unchanged.

Use these exact mode inputs:

```js
const definedBenefitInput = structuredClone(supportedSchema12);
definedBenefitInput.assumptions.ukPensionsEnabled = true;
definedBenefitInput.assumptions.gbpAud = 1;
definedBenefitInput.assumptions.uppPct = 0;
Object.assign(definedBenefitInput.people[0], {
  ukStateAnnualGbp: 24000, ukStateStartAge: 65,
  ukStateIndexation: 'cpi', ukStateSurvivorPct: 60
});

const ukPensionInput = structuredClone(supportedSchema12);
ukPensionInput.assumptions.ukPensionsEnabled = true;
ukPensionInput.assumptions.gbpAud = 1.95;
ukPensionInput.assumptions.uppPct = 8;
Object.assign(ukPensionInput.people[0], {
  ukStateAnnualGbp: 12000, ukStateStartAge: 67,
  ukStateIndexation: 'frozen', ukStateSurvivorPct: 50
});
```

- [ ] **Step 2: Write failing pure pension-flow tests**

Add:

```js
const pensionPerson = {
  ...definedBenefitInput.people[0], age: 64,
  ukStateAnnualGbp: 24000, ukStateStartAge: 65,
  ukStateIndexation: 'cpi', ukStateSurvivorPct: 60
};
assert.deepEqual(plain(simulator.pensionFlows({
  person: pensionPerson, age: 64, inflationFactor: 1.1,
  assumptions: definedBenefitInput.assumptions
})), { grossNominal: 0, taxableNominal: 0 });
assert.deepEqual(plain(simulator.pensionFlows({
  person: pensionPerson, age: 65, inflationFactor: 1.1,
  assumptions: definedBenefitInput.assumptions
})), { grossNominal: 26400, taxableNominal: 26400 });

const fixedUkPerson = {
  ...pensionPerson, ukStateAnnualGbp: 12000,
  ukStateStartAge: 65, ukStateIndexation: 'frozen'
};
assert.deepEqual(plain(simulator.pensionFlows({
  person: fixedUkPerson, age: 65, inflationFactor: 1.1,
  assumptions: ukPensionInput.assumptions
})), { grossNominal: 23400, taxableNominal: 21528 });

const disabledPension = structuredClone(ukPensionInput.assumptions);
disabledPension.ukPensionsEnabled = false;
assert.deepEqual(plain(simulator.pensionFlows({
  person: fixedUkPerson, age: 67, inflationFactor: 1.2,
  assumptions: disabledPension
})), { grossNominal: 0, taxableNominal: 0 });
```

- [ ] **Step 3: Write failing DB and UK zero-volatility parity fixtures**

Add this shared fixture builder and execute it for both imported modes:

```js
function configurePensionParityScenario(scenario, pensionInput) {
  const configured = structuredClone(scenario);
  Object.assign(configured.assumptions, {
    inflationMode: 'manual',
    manualInflationPct: 2,
    ukPensionsEnabled: true,
    gbpAud: pensionInput.assumptions.gbpAud,
    uppPct: pensionInput.assumptions.uppPct
  });
  Object.assign(configured.household, {
    targetAfterTax: 30000,
    annualBudget: 30000,
    modelEndAge: 68,
    includeAgePension: true,
    applyMinimumDrawdown: false,
    firstDeath: {
      enabled: true, deceasedPerson: 'p0', deathAge: 66,
      survivorPreferredPct: 70, survivorEssentialPct: 70
    }
  });
  configured.cash = { amount: 0, interestPct: 0, owner: 'joint' };
  configured.savings = { amount: 200000, interestPct: 0, owner: 'joint' };
  configured.shareholdings = [];
  configured.otherIncomes = [];
  configured.otherAssets = [];
  configured.lumpSumWithdrawals = [];
  configured.people.forEach((person, index) => Object.assign(person, {
    age: index === 0 ? 64 : 62,
    retireAge: index === 0 ? 64 : 62,
    superAccessAge: 65,
    salary: 0,
    salaryGrowthPct: 0,
    sgPct: 0,
    accumulationReturnPct: 0,
    retirementReturnPct: 0,
    super: 0,
    ukStateAnnualGbp: index === 0
      ? pensionInput.people[0].ukStateAnnualGbp
      : pensionInput.people[0].ukStateAnnualGbp / 2,
    ukStateStartAge: index === 0 ? 65 : 67,
    ukStateIndexation: index === 0
      ? pensionInput.people[0].ukStateIndexation : 'cpi',
    ukStateSurvivorPct: index === 0 ? 60 : 0
  }));
  return configured;
}

function zeroPensionPath(scenario) {
  return {
    schemaVersion: 1,
    years: Array.from(
      { length: simulator.projectionYearCount(scenario) },
      (_, index) => ({
        year: scenario.startYear + index,
        superAccumulationReturnPct: [0, 0],
        superRetirementReturnPct: [0, 0]
      })
    )
  };
}
```

Compare Monte Carlo with an equivalently configured deterministic scenario through:

```js
const pensionParityShape = row => ({
  year: row.year,
  ukStateByPerson: row.ukStateByPerson.map(round6),
  ukStateGross: round6(row.components.ukStateGross),
  ukStateNet: round6(row.components.ukStateNet),
  taxByPerson: row.taxByPerson.map(round6),
  agePensionNet: round6(row.components.agePensionNet),
  potDraw: round6(row.components.potDraw),
  totalIncome: round6(row.totalIncome),
  totalAssets: round6(row.totalAssets)
});
```

Assert both DB and UK row arrays deep-equal. Add seeded three-path reproducibility for the UK fixture with seed `86420`, finite/non-negative invariants and a comparison against `ukPensionsEnabled = false` showing positive pension income and lower drawdown.

Use this loop for exact parity execution:

```js
for (const [label, pensionInput] of [
  ['Defined Benefit', definedBenefitInput],
  ['UK State Pension', ukPensionInput]
]) {
  const monteCarloPensionParity = configurePensionParityScenario(
    pensionInput, pensionInput);
  const deterministicPensionParity = configurePensionParityScenario(
    deterministic.makeSampleScenario(), pensionInput);
  const monteCarloRows = simulator.projectScenario(
    monteCarloPensionParity, zeroPensionPath(monteCarloPensionParity)).rows;
  const deterministicRows = deterministic.projectScenario(
    deterministicPensionParity).rows;
  assert.deepEqual(
    plain(monteCarloRows.map(pensionParityShape)),
    plain(deterministicRows.map(pensionParityShape)),
    `zero-volatility ${label} should match deterministic pension flows`
  );
}
```

- [ ] **Step 4: Run the suite and verify failure**

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: non-zero exit because `pensionFlows` is absent or the compatibility guard rejects active pensions.

- [ ] **Step 5: Replace the obsolete helper with current pension flows**

Replace `ukPensionFlows` with:

```js
function pensionMode(assumptions) {
  return assumptions.gbpAud === 1 ? 'defined-benefit' : 'uk-state';
}

function pensionFlows({ person, age, inflationFactor, assumptions }) {
  if (assumptions.ukPensionsEnabled === false ||
      age < person.ukStateStartAge) {
    return { grossNominal: 0, taxableNominal: 0 };
  }
  const indexed = person.ukStateIndexation === 'cpi'
    ? inflationFactor : 1;
  const mode = pensionMode(assumptions);
  const fx = mode === 'defined-benefit' ? 1 : assumptions.gbpAud;
  const grossNominal = person.ukStateAnnualGbp * fx * indexed;
  const taxableNominal = mode === 'uk-state'
    ? grossNominal * (1 - assumptions.uppPct / 100)
    : grossNominal;
  return { grossNominal, taxableNominal };
}
```

Export `pensionMode` and `pensionFlows`; remove the obsolete `ukPensionFlows` export.

- [ ] **Step 6: Remove obsolete private balances from projection state**

Delete `ukPrivateBalances` from `makeProjectionState`, its death-transfer logic, Age Pension asset inputs, total assets and all private lump/annuity calculations. No current schema-5 person retains private fields after Task 1.

- [ ] **Step 7: Integrate gross and taxable pension ledgers**

At the start of `projectYear`, use:

```js
const pensionGross = [0, 0];
const pensionTaxable = [0, 0];
```

For each living person:

```js
const pension = pensionFlows({
  person,
  age: ages[index],
  inflationFactor,
  assumptions: scenario.assumptions
});
pensionGross[index] = pension.grossNominal;
pensionTaxable[index] = pension.taxableNominal;
```

In survivor state:

```js
const inheritedPension = pensionFlows({
  person: deceased,
  age: ages[deceasedIndex],
  inflationFactor,
  assumptions: scenario.assumptions
});
const continuation = deceased.ukStateSurvivorPct / 100;
pensionGross[survivorIndex] += inheritedPension.grossNominal * continuation;
pensionTaxable[survivorIndex] +=
  inheritedPension.taxableNominal * continuation;
```

Use gross pension totals in the Age Pension income test, tax-source allocation, household guaranteed income and `ukStateGross`; use `pensionTaxable[index]` in each person's taxable ledger. Preserve output names for compatibility:

```js
ukStateByPerson: pensionGross.map(value => value / inflationFactor),
ukStateNet:
  pensionGross.reduce((sum, value) => sum + value, 0) *
  taxableNetRatio / inflationFactor,
```

- [ ] **Step 8: Remove only the pension compatibility guard**

Delete the `hasPensionIncome` block from `assertExperimentalFeatureSupport`. Keep Other assets, lump-sum and share-return guards unchanged.

- [ ] **Step 9: Run tests and commit calculation parity**

```powershell
node tests/retirement-monte-carlo.test.mjs
git diff --check
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "feat: model pensions in Monte Carlo paths"
```

Expected: import, pure, DB/UK parity, survivor and stochastic tests pass.

### Task 3: Replace the obsolete pension editor

**Files:**
- Modify: `retirement-monte-carlo-v0.7.html:275-305`
- Modify: `retirement-monte-carlo-v0.7.html:2100-2370`
- Modify: `retirement-monte-carlo-v0.7.html:3060-3220`
- Modify: `retirement-monte-carlo-v0.7.html:4680-4740`
- Test: `tests/retirement-monte-carlo.test.mjs:220-275`

- [ ] **Step 1: Write failing interface contracts**

Add static assertions for:

```js
for (const contract of [
  'id="ukPensionsEnabled"',
  'id="pensionType"',
  'value="defined-benefit"',
  'value="uk-state"',
  'id="gbpAudRow"',
  'id="uppRow"',
  'Include these pensions in the projection',
  'Paid to survivor %',
  'ukStateIndexation',
  'Fixed nominal amount',
  'Frozen (AU resident, no uprating)',
  '<b>Pension mode:</b>'
]) assert.ok(html.includes(contract), `missing pension UI contract: ${contract}`);

for (const obsolete of [
  'Private pension take age',
  'Private pension treatment',
  'Lump sum into savings pot',
  'Annual lifetime annuity'
]) assert.ok(!html.includes(obsolete), `obsolete pension UI remains: ${obsolete}`);
```

- [ ] **Step 2: Run the suite and verify failure**

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: failure because the current toggle/type/indexation controls are missing and obsolete controls remain.

- [ ] **Step 3: Replace the pension section markup**

Use the deterministic section controls:

```html
<section class="group uk" aria-labelledby="ukPensionsHeading">
  <h3 id="ukPensionsHeading">Defined Benefit/UK Pensions</h3>
  <label><span class="k">Include these pensions in the projection</span>
    <input type="checkbox" id="ukPensionsEnabled"
      data-path="assumptions.ukPensionsEnabled">
  </label>
  <label><span class="k">Pension type</span>
    <select id="pensionType">
      <option value="defined-benefit">Australian defined benefit</option>
      <option value="uk-state">UK State Pension</option>
    </select>
  </label>
  <label id="gbpAudRow"><span class="k">GBP&rarr;AUD rate</span>
    <input type="number" id="gbpAud" min="0" step="0.0001"
      data-value-type="number" data-path="assumptions.gbpAud">
  </label>
  <label id="uppRow"><span class="k">UK pension UPP deduction %</span>
    <input type="number" min="0" max="100" step="0.1"
      data-value-type="number" data-path="assumptions.uppPct">
  </label>
  <div id="ukPensionFields" class="people-split">
    <fieldset id="ukPerson0"></fieldset>
    <fieldset id="ukPerson1"></fieldset>
  </div>
</section>
```

- [ ] **Step 4: Replace person-field and render helpers**

Replace the helpers with:

```js
function ukPersonFields(person, index, assumptions) {
  const path = `people.${index}`;
  const dbMode = assumptions.gbpAud === 1;
  const currency = dbMode ? 'AUD' : 'GBP';
  const stateLabel = dbMode ? 'Defined Benefit' : 'State Pension';
  return `<legend>${escapeHtml(person.name)}</legend>
    ${moneyField(`${stateLabel} annual`, `${path}.ukStateAnnualGbp`,
      person.ukStateAnnualGbp, currency)}
    ${numberField(`${stateLabel} start age`, `${path}.ukStateStartAge`,
      person.ukStateStartAge, 'min="55" max="80"')}
    ${numberField('Paid to survivor %', `${path}.ukStateSurvivorPct`,
      person.ukStateSurvivorPct, 'min="0" max="100" step="5"')}
    <label><span class="k">${escapeHtml(stateLabel)} indexation</span>
      <select data-path="${path}.ukStateIndexation">
        <option value="frozen"${person.ukStateIndexation !== 'cpi' ? ' selected' : ''}>${dbMode ? 'Fixed nominal amount' : 'Frozen (AU resident, no uprating)'}</option>
        <option value="cpi"${person.ukStateIndexation === 'cpi' ? ' selected' : ''}>${dbMode ? 'CPI-indexed' : 'CPI-indexed (comparison only)'}</option>
      </select>
    </label>`;
}

function renderUkPensions(people, assumptions) {
  const enabled = assumptions.ukPensionsEnabled !== false;
  $('#ukPensionsEnabled').checked = enabled;
  const dbMode = assumptions.gbpAud === 1;
  $('#pensionType').value = dbMode ? 'defined-benefit' : 'uk-state';
  $('#gbpAud').value = assumptions.gbpAud;
  $('#gbpAudRow').hidden = dbMode;
  $('#uppRow').hidden = dbMode;
  $('#ukPerson0').innerHTML = ukPersonFields(people[0], 0, assumptions);
  $('#ukPerson1').innerHTML = ukPersonFields(people[1], 1, assumptions);
  $('#ukPensionFields').style.opacity = enabled ? '' : '0.45';
  $('#ukPensionFields').style.pointerEvents = enabled ? '' : 'none';
}
```

Delete `privatePensionAmountLabel` and every reference to private amount/take-age/type.

- [ ] **Step 5: Add the pension-type change handler**

At the start of the delegated controls change handler, add:

```js
if (event.target.matches('#pensionType')) {
  const dbMode = event.target.value === 'defined-benefit';
  currentScenario = setPathImmutable(
    currentScenario,
    'assumptions.gbpAud',
    dbMode ? 1 :
      (currentScenario.assumptions.gbpAud === 1
        ? 1.95 : currentScenario.assumptions.gbpAud)
  );
  if (dbMode) {
    currentScenario = setPathImmutable(
      currentScenario, 'assumptions.uppPct', 0);
  }
  currentScenario = {
    ...currentScenario,
    people: currentScenario.people.map(person => ({
      ...person,
      ukStateIndexation: dbMode ? 'cpi' : 'frozen'
    }))
  };
  scheduleSave(currentScenario);
  renderScenario(currentScenario);
  return;
}
```

- [ ] **Step 6: Add assumptions disclosure**

Build and render:

```js
const pensionIsDb = activeScenario.assumptions.gbpAud === 1;
const pensionModeLabel = pensionIsDb
  ? 'Australian Defined Benefit' : 'UK State Pension';
const pensionItems = activeScenario.people
  .filter(person => Number(person.ukStateAnnualGbp) > 0)
  .map(person => `${person.name}: ${pensionIsDb ? '$' : '£'}${person.ukStateAnnualGbp}` +
    ` from age ${person.ukStateStartAge}, ` +
    `${person.ukStateIndexation === 'cpi' ? 'CPI-indexed' : 'fixed/frozen'}, ` +
    `${person.ukStateSurvivorPct}% to survivor`);
const pensionDetails = activeScenario.assumptions.ukPensionsEnabled === false
  ? 'Disabled; stored values do not feed the projection.'
  : `${pensionItems.join('; ') || 'No positive pension amounts.'}` +
    (pensionIsDb ? '' : ` GBP/AUD ${activeScenario.assumptions.gbpAud}; ` +
      `UPP deduction ${activeScenario.assumptions.uppPct}%.`);
const pensionSentence = `<p><b>Pension mode:</b> ` +
  `${escapeHtml(pensionModeLabel)}. ${escapeHtml(pensionDetails)}</p>`;
```

Insert `${pensionSentence}` after the survivor-state paragraph.
```

- [ ] **Step 7: Run tests and commit the editor**

```powershell
node tests/retirement-monte-carlo.test.mjs
git diff --check
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "feat: align Monte Carlo pension editor"
```

### Task 4: Document the third issue #1 slice

**Files:**
- Modify: `README.md:78-90`
- Modify: `docs/MODEL-METHODOLOGY.md:87-105`
- Modify: `docs/TESTING.md:12-16`
- Modify: `CHANGELOG.md:5-12`
- Test: `tests/retirement-monte-carlo.test.mjs:40-75`

- [ ] **Step 1: Add failing documentation contracts**

```js
assert.ok(readme.includes('Defined Benefit/UK Pension parity') &&
  readme.includes('Other assets, lump-sum and share-return guards'));
assert.ok(methodology.includes('gross pension flow') &&
  methodology.includes('UPP-adjusted taxable flow'));
assert.ok(testingGuide.includes('Defined Benefit and UK State Pension parity') &&
  testingGuide.includes('survivor continuation'));
assert.ok(changelog.includes('third issue #1') &&
  changelog.includes('Defined Benefit/UK Pension parity'));
```

- [ ] **Step 2: Run the suite and verify documentation failure**

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: failure at the first new public-documentation assertion.

- [ ] **Step 3: Update public documentation**

Update README's unreleased paragraph to list salary-growth, Other-income and Defined Benefit/UK Pension parity. State that the Other assets, lump-sum and share-return guards remain.

Append to methodology:

```markdown
Defined Benefit/UK Pension parity separates each gross pension flow from its UPP-adjusted taxable flow. Start age, fixed or CPI indexation, currency conversion, the include toggle and first-death survivor continuation follow the deterministic contract in every path.
```

Append to testing:

```markdown
The Monte Carlo suite also covers Australian Defined Benefit and UK State Pension parity, UPP tax treatment, indexation, start-age boundaries and survivor continuation.
```

Add under `## Unreleased`:

```markdown
- Added Defined Benefit/UK Pension parity as the third issue #1 Monte Carlo slice, replacing obsolete private-pension controls and preserving legacy values through migration; three compatibility guards remain active ([#1](https://github.com/dcaddick/retirement-simulator/issues/1)).
```

- [ ] **Step 4: Run both suites and commit**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
git diff --check
git add README.md CHANGELOG.md docs/MODEL-METHODOLOGY.md docs/TESTING.md tests/retirement-monte-carlo.test.mjs
git commit -m "docs: record Monte Carlo pension parity"
```

Expected: deterministic reports `243 passed, 0 failed`; Monte Carlo passes.

### Task 5: Verify and preserve the release boundary

**Files:**
- Verify: `retirement-monte-carlo-v0.7.html`
- Verify: `tests/retirement-monte-carlo.test.mjs`
- Verify: public documentation files

- [ ] **Step 1: Run both complete suites**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

- [ ] **Step 2: Confirm pension rejection and obsolete controls are gone**

```powershell
rg -n "cannot yet preserve v1.00 Defined Benefit/UK Pension treatment|Private pension take age|Private pension treatment" retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
```

Expected: no matches.

- [ ] **Step 3: Confirm the three remaining guards**

```powershell
rg -n "cannot yet model populated Other assets|cannot yet model lump-sum withdrawals|cannot yet model v1.06 share price growth" retirement-monte-carlo-v0.7.html
```

Expected: three guard messages.

- [ ] **Step 4: Confirm implementation contracts**

```powershell
rg -n "pensionFlows|pensionMode|ukStateIndexation|ukStateSurvivorPct|Pension mode|zero-volatility.*pension" retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
```

- [ ] **Step 5: Check integrity and state**

```powershell
git diff --check
git status --short --branch
git log -8 --oneline
```

Expected: clean working tree and four focused implementation commits above the design and plan.

- [ ] **Step 6: Preserve release state**

Do not rename `retirement-monte-carlo-v0.7.html`, publish v0.8, push or close issue #1. The next slice is Other assets/lump sums and starts with a separate design cycle.
