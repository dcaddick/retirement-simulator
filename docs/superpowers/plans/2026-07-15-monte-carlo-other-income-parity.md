# Monte Carlo Other Income Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full Other income import, editing, validation and projection parity to the experimental Monte Carlo companion while retaining all four unrelated compatibility guards.

**Architecture:** Add one pure `otherIncomeFlows` boundary to the embedded Monte Carlo core and feed its person-level taxable/non-taxable ledgers into the existing tax, Age Pension, household-funding and reporting paths. Keep the current standalone HTML architecture, copy the deterministic editor contract without adding Other assets, and prove behaviour with zero-volatility deterministic parity plus seeded stochastic invariants.

**Tech Stack:** Self-contained HTML/CSS/JavaScript, Node.js ESM regression tests, `node:assert/strict`, `node:vm`, Git.

---

## File map

- `retirement-monte-carlo-v0.7.html` — schema validation, compatibility guard, pure Other income calculation, projection integration, editor controls and assumptions disclosure.
- `tests/retirement-monte-carlo.test.mjs` — validation, import, helper, parity, stochastic, UI and documentation contracts.
- `README.md` — public experimental-scope status.
- `docs/MODEL-METHODOLOGY.md` — Other income formula and remaining guard boundary.
- `docs/TESTING.md` — regression coverage statement.
- `CHANGELOG.md` — unreleased issue #1 slice record.

### Task 1: Add the deterministic Other income data and validation contract

**Files:**
- Modify: `retirement-monte-carlo-v0.7.html:397-399`
- Modify: `retirement-monte-carlo-v0.7.html:729-748`
- Modify: `retirement-monte-carlo-v0.7.html:1680-1760`
- Modify: `retirement-monte-carlo-v0.7.html:1842-1918`
- Test: `tests/retirement-monte-carlo.test.mjs:95-180`

- [ ] **Step 1: Write failing factory and validation tests**

After the schema-5 sample assertions, add:

```js
const newOtherIncome = simulator.makeOtherIncome(2);
assert.deepEqual(
  plain({
    label: newOtherIncome.label,
    currency: newOtherIncome.currency,
    fxToAud: newOtherIncome.fxToAud,
    amount: newOtherIncome.amount,
    taxable: newOtherIncome.taxable,
    owner: newOtherIncome.owner,
    survivorPct: newOtherIncome.survivorPct
  }),
  {
    label: '', currency: 'AUD', fxToAud: 1, amount: 0,
    taxable: true, owner: 'joint', survivorPct: 0
  }
);
assert.match(newOtherIncome.id, /^income-/);

const validOtherIncomeScenario = structuredClone(monteCarloDemo);
validOtherIncomeScenario.otherIncomes = [{
  id: 'rent', label: 'Rent', currency: 'GBP', fxToAud: 1.95,
  amount: 10000, taxable: true, owner: 'p0', survivorPct: 50
}];
assert.ok(!simulator.validateScenario(validOtherIncomeScenario)
  .some(error => error.path.startsWith('otherIncomes')));

for (const [field, value] of [
  ['label', ''],
  ['currency', 'EUR'],
  ['fxToAud', 0],
  ['amount', -1],
  ['taxable', 'yes'],
  ['owner', 'invalid'],
  ['survivorPct', -1],
  ['survivorPct', 101]
]) {
  const invalid = structuredClone(validOtherIncomeScenario);
  invalid.otherIncomes[0][field] = value;
  assert.ok(
    simulator.validateScenario(invalid)
      .some(error => error.path === `otherIncomes.0.${field}`),
    `Other income ${field}=${String(value)} should be rejected`
  );
}

const missingOtherIncomeArray = structuredClone(monteCarloDemo);
delete missingOtherIncomeArray.otherIncomes;
assert.ok(simulator.validateScenario(missingOtherIncomeArray)
  .some(error => error.path === 'otherIncomes'));
```

- [ ] **Step 2: Run the Monte Carlo suite and verify the contract fails**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: non-zero exit because `makeOtherIncome` is not exported or defined.

- [ ] **Step 3: Add constants, factory and FX helper**

Beside `VALID_OWNERS`, add:

```js
const OTHER_CURRENCIES = new Set(['AUD', 'GBP', 'USD']);
```

Immediately after `makeSampleScenario`, add:

```js
function makeOtherIncome(index) {
  return {
    id: `income-${Date.now()}-${index}`,
    label: '',
    currency: 'AUD',
    fxToAud: 1,
    amount: 0,
    taxable: true,
    owner: 'joint',
    survivorPct: 0
  };
}

function otherItemFx(item) {
  return item.currency === 'AUD' ? 1 : item.fxToAud;
}
```

- [ ] **Step 4: Add exact Other income validation**

Before the existing shareholding validation block, add:

```js
if (!Array.isArray(scenario.otherIncomes)) {
  add('otherIncomes', 'Other incomes must be an array.');
} else {
  scenario.otherIncomes.forEach((item, index) => {
    const path = `otherIncomes.${index}`;
    if (!item.label || typeof item.label !== 'string') {
      add(`${path}.label`, 'Label is required.');
    }
    if (!OTHER_CURRENCIES.has(item.currency)) {
      add(`${path}.currency`, 'Currency must be AUD, GBP, or USD.');
    }
    if (item.currency !== 'AUD' &&
        !(Number.isFinite(item.fxToAud) && item.fxToAud > 0)) {
      add(`${path}.fxToAud`, 'FX rate must be greater than zero.');
    }
    if (!finiteNonNegative(item.amount)) {
      add(`${path}.amount`, 'Amount must be zero or greater.');
    }
    if (typeof item.taxable !== 'boolean') {
      add(`${path}.taxable`, 'Taxable must be true or false.');
    }
    if (!['p0', 'p1', 'joint'].includes(item.owner)) {
      add(`${path}.owner`,
        'Tax owner must be Person 1, Person 2, or Joint 50/50.');
    }
    if (!Number.isFinite(item.survivorPct) ||
        item.survivorPct < 0 || item.survivorPct > 100) {
      add(`${path}.survivorPct`,
        'Survivor % must be between 0 and 100.');
    }
  });
}
```

Do not change `assertExperimentalFeatureSupport` yet. Unsupported populated income must remain rejected until the projection path is implemented.

- [ ] **Step 5: Export the new focused helpers**

Add these properties to `RetirementSimulatorCore`:

```js
makeOtherIncome,
otherItemFx,
```

- [ ] **Step 6: Run the Monte Carlo suite and verify validation passes**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: the full suite passes; populated Other income remains protected by the compatibility guard.

- [ ] **Step 7: Commit the data contract**

```powershell
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "feat: validate Monte Carlo other income"
```

### Task 2: Implement Other income flows and deterministic parity

**Files:**
- Modify: `retirement-monte-carlo-v0.7.html:850-878`
- Modify: `retirement-monte-carlo-v0.7.html:1337-1675`
- Modify: `retirement-monte-carlo-v0.7.html:1842-1918`
- Test: `tests/retirement-monte-carlo.test.mjs:190-330`
- Test: `tests/retirement-monte-carlo.test.mjs:520-730`

- [ ] **Step 1: Replace the rejection test with a failing positive import test**

Replace the `unsupportedV1Scenario` Other income rejection test with:

```js
const supportedIncomeV1Scenario = structuredClone(v1Scenario);
supportedIncomeV1Scenario.otherIncomes = [{
  id: 'rental', label: 'Rental', currency: 'AUD', fxToAud: 1,
  amount: 1000, taxable: true, owner: 'p0', survivorPct: 50
}];
const adaptedIncomeV1Scenario = simulator.importScenario(
  JSON.stringify(supportedIncomeV1Scenario));
assert.equal(adaptedIncomeV1Scenario.schemaVersion, 5);
assert.deepEqual(
  plain(adaptedIncomeV1Scenario.otherIncomes),
  plain(supportedIncomeV1Scenario.otherIncomes),
  'Other income should survive deterministic schema adaptation unchanged'
);
```

Change every combined Other income/assets guard test so only populated Other assets reject with `/cannot yet model populated Other assets/`.

- [ ] **Step 2: Add failing pure-flow tests**

After the salary helper tests, add:

```js
const incomeItems = [
  { id: 'taxable', label: 'Rent', currency: 'GBP', fxToAud: 2,
    amount: 1000, taxable: true, owner: 'p0', survivorPct: 25 },
  { id: 'non-taxable', label: 'Support', currency: 'AUD', fxToAud: 1,
    amount: 600, taxable: false, owner: 'joint', survivorPct: 100 }
];
const coupleIncomeFlows = simulator.otherIncomeFlows({
  items: incomeItems,
  inflationFactor: 1.1,
  lifecycle: {
    householdStatus: 'couple', survivorIndex: null, deceasedIndex: null
  }
});
assert.deepEqual(plain(coupleIncomeFlows.taxableByPerson), [2200, 0]);
assert.deepEqual(plain(coupleIncomeFlows.nonTaxableByPerson), [330, 330]);
assert.equal(coupleIncomeFlows.taxableTotal, 2200);
assert.equal(coupleIncomeFlows.nonTaxableTotal, 660);

const survivorIncomeFlows = simulator.otherIncomeFlows({
  items: incomeItems,
  inflationFactor: 1,
  lifecycle: {
    householdStatus: 'survivor', survivorIndex: 1, deceasedIndex: 0
  }
});
assert.deepEqual(plain(survivorIncomeFlows.taxableByPerson), [0, 500]);
assert.deepEqual(plain(survivorIncomeFlows.nonTaxableByPerson), [0, 600]);
```

- [ ] **Step 3: Add a failing zero-volatility parity fixture**

After the existing salary parity block, add this complete fixture:

```js
const parityOtherIncomes = [
  { id: 'rent', label: 'Rent', currency: 'GBP', fxToAud: 2,
    amount: 12000, taxable: true, owner: 'p0', survivorPct: 50 },
  { id: 'support', label: 'Support', currency: 'USD', fxToAud: 1.5,
    amount: 4000, taxable: false, owner: 'joint', survivorPct: 100 }
];
const monteCarloIncomeParity = structuredClone(adaptedSchema12);
Object.assign(monteCarloIncomeParity.assumptions, {
  inflationMode: 'manual', manualInflationPct: 2, ukPensionsEnabled: false
});
Object.assign(monteCarloIncomeParity.household, {
  targetAfterTax: 40000, annualBudget: 30000, modelEndAge: 67,
  includeAgePension: true, applyMinimumDrawdown: false,
  firstDeath: {
    enabled: true, deceasedPerson: 'p0', deathAge: 65,
    survivorPreferredPct: 70, survivorEssentialPct: 70
  }
});
monteCarloIncomeParity.cash = { amount: 0, interestPct: 0, owner: 'joint' };
monteCarloIncomeParity.savings = {
  amount: 200000, interestPct: 0, owner: 'joint'
};
monteCarloIncomeParity.shareholdings = [];
monteCarloIncomeParity.otherIncomes = structuredClone(parityOtherIncomes);
monteCarloIncomeParity.otherAssets = [];
monteCarloIncomeParity.lumpSumWithdrawals = [];
monteCarloIncomeParity.people.forEach((person, index) => Object.assign(person, {
  age: index === 0 ? 64 : 62,
  retireAge: index === 0 ? 64 : 62,
  superAccessAge: 65,
  salary: 0,
  salaryGrowthPct: 0,
  sgPct: 0,
  accumulationReturnPct: 0,
  retirementReturnPct: 0,
  super: 0,
  ukStateAnnualGbp: 0,
  ukStateSurvivorPct: 0
}));
const incomePath = {
  schemaVersion: 1,
  years: Array.from(
    { length: simulator.projectionYearCount(monteCarloIncomeParity) },
    (_, index) => ({
      year: monteCarloIncomeParity.startYear + index,
      superAccumulationReturnPct: [0, 0],
      superRetirementReturnPct: [0, 0]
    })
  )
};
const monteCarloIncomeRows = simulator.projectScenario(
  monteCarloIncomeParity, incomePath).rows;

const deterministicIncomeParity = deterministic.makeSampleScenario();
Object.assign(deterministicIncomeParity.assumptions, {
  inflationMode: 'manual', manualInflationPct: 2, ukPensionsEnabled: false
});
deterministicIncomeParity.household = structuredClone(
  monteCarloIncomeParity.household);
deterministicIncomeParity.cash = structuredClone(monteCarloIncomeParity.cash);
deterministicIncomeParity.savings = structuredClone(
  monteCarloIncomeParity.savings);
deterministicIncomeParity.shareholdings = [];
deterministicIncomeParity.otherIncomes = structuredClone(parityOtherIncomes);
deterministicIncomeParity.otherAssets = [];
deterministicIncomeParity.lumpSumWithdrawals = [];
deterministicIncomeParity.people.forEach((person, index) => Object.assign(person, {
  age: monteCarloIncomeParity.people[index].age,
  retireAge: monteCarloIncomeParity.people[index].retireAge,
  superAccessAge: 65,
  salary: 0,
  salaryGrowthPct: 0,
  sgPct: 0,
  accumulationReturnPct: 0,
  retirementReturnPct: 0,
  super: 0,
  ukStateAnnualGbp: 0,
  ukStateSurvivorPct: 0
}));
const deterministicIncomeRows = deterministic.projectScenario(
  deterministicIncomeParity).rows;
const otherIncomeParityShape = row => ({
  year: row.year,
  otherIncomeByPerson: row.otherIncomeByPerson.map(round6),
  otherIncomeNet: round6(row.components.otherIncomeNet),
  taxByPerson: row.taxByPerson.map(round6),
  agePensionNet: round6(row.components.agePensionNet),
  potDraw: round6(row.components.potDraw),
  totalIncome: round6(row.totalIncome),
  totalAssets: round6(row.totalAssets)
});
assert.deepEqual(
  plain(monteCarloIncomeRows.map(otherIncomeParityShape)),
  plain(deterministicIncomeRows.map(otherIncomeParityShape)),
  'zero-volatility Other income should match deterministic ownership, tax, pension and funding'
);

const incomeStochasticA = core.simulatePaths({
  scenario: monteCarloIncomeParity,
  pathCount: 3,
  seed: 97531,
  profiles: salaryStochasticProfiles,
  projectScenario: simulator.projectScenario
});
const incomeStochasticB = core.simulatePaths({
  scenario: monteCarloIncomeParity,
  pathCount: 3,
  seed: 97531,
  profiles: salaryStochasticProfiles,
  projectScenario: simulator.projectScenario
});
const incomeStochasticShape = results => plain(results.map(result =>
  result.projection.rows.map(row => ({
    otherIncomeNet: row.components.otherIncomeNet,
    totalIncome: row.totalIncome,
    totalAssets: row.totalAssets
  }))));
assert.deepEqual(
  incomeStochasticShape(incomeStochasticA),
  incomeStochasticShape(incomeStochasticB),
  'Other-income stochastic paths should remain seed-reproducible'
);
assert.ok(incomeStochasticA.every(result =>
  result.engineError === null && result.projection.rows.every(row =>
    Number.isFinite(row.totalIncome) && Number.isFinite(row.totalAssets) &&
    row.totalAssets >= 0)),
'Other-income stochastic paths should preserve accounting invariants');
const noIncomeStochastic = structuredClone(monteCarloIncomeParity);
noIncomeStochastic.otherIncomes = [];
const noIncomePaths = core.simulatePaths({
  scenario: noIncomeStochastic,
  pathCount: 3,
  seed: 97531,
  profiles: salaryStochasticProfiles,
  projectScenario: simulator.projectScenario
});
assert.ok(
  incomeStochasticA[0].projection.rows[0].components.otherIncomeNet > 0 &&
  incomeStochasticA[0].projection.rows[0].components.potDraw <
    noIncomePaths[0].projection.rows[0].components.potDraw,
  'Other income must contribute to funding rather than being silently omitted'
);
```

- [ ] **Step 4: Run the Monte Carlo suite and verify calculation tests fail**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: non-zero exit because the compatibility guard still rejects the positive import or `otherIncomeFlows` is not defined.

- [ ] **Step 5: Add the pure Other income helper**

Immediately before `salaryForProjectionYear`, add:

```js
function otherIncomeFlows({ items, inflationFactor, lifecycle }) {
  const taxableByPerson = [0, 0];
  const nonTaxableByPerson = [0, 0];
  (items ?? []).forEach(item => {
    let nominal = item.amount * otherItemFx(item) * inflationFactor;
    let owner = item.owner;
    if (lifecycle.householdStatus === 'survivor') {
      const deceasedOwner = `p${lifecycle.deceasedIndex}`;
      const survivorOwner = `p${lifecycle.survivorIndex}`;
      if (owner === deceasedOwner) nominal *= item.survivorPct / 100;
      owner = survivorOwner;
    }
    const target = item.taxable ? taxableByPerson : nonTaxableByPerson;
    allocateOwnedAmount(nominal, owner).forEach((amount, index) => {
      target[index] += amount;
    });
  });
  return {
    taxableByPerson,
    nonTaxableByPerson,
    taxableTotal: taxableByPerson.reduce((sum, amount) => sum + amount, 0),
    nonTaxableTotal: nonTaxableByPerson.reduce((sum, amount) => sum + amount, 0)
  };
}
```

Export `otherIncomeFlows` from `RetirementSimulatorCore`.

- [ ] **Step 6: Integrate the ledgers into the projection**

In `projectYear`, after UK survivor income and before cash interest, calculate:

```js
const otherIncome = otherIncomeFlows({
  items: scenario.otherIncomes,
  inflationFactor,
  lifecycle: state.lifecycle
});
```

Then make these exact integrations:

```js
// Age Pension income test
+ (otherIncome.taxableTotal + otherIncome.nonTaxableTotal) / inflationFactor

// Each person's taxable ledger
+ otherIncome.taxableByPerson[index]

// Sources used to allocate estimated tax
+ otherIncome.taxableTotal

// Guaranteed household income after tax
+ otherIncome.nonTaxableTotal
```

Add these row fields:

```js
otherIncomeByPerson: [0, 1].map(index =>
  (otherIncome.taxableByPerson[index] +
    otherIncome.nonTaxableByPerson[index]) / inflationFactor),
```

and inside `components`:

```js
otherIncomeNet:
  (otherIncome.taxableTotal * taxableNetRatio +
    otherIncome.nonTaxableTotal) / inflationFactor,
```

- [ ] **Step 7: Narrow the compatibility guard to Other assets only**

Replace the combined guard with:

```js
if ((scenario.otherAssets ?? []).length) {
  throw new Error(
    'Monte Carlo v0.7 cannot yet model populated Other assets. Remove them from a fictional copy before importing.');
}
```

- [ ] **Step 8: Run the Monte Carlo suite and verify parity passes**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: all import, helper, zero-volatility parity, survivor and stochastic assertions pass; the Other asset and three unrelated feature guards remain active.

- [ ] **Step 9: Commit calculation parity**

```powershell
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "feat: model other income in Monte Carlo paths"
```

### Task 3: Add the full Other income editor and disclosure

**Files:**
- Modify: `retirement-monte-carlo-v0.7.html:260-280`
- Modify: `retirement-monte-carlo-v0.7.html:1980-2180`
- Modify: `retirement-monte-carlo-v0.7.html:2780-3065`
- Modify: `retirement-monte-carlo-v0.7.html:4620-4670`
- Test: `tests/retirement-monte-carlo.test.mjs:35-80`

- [ ] **Step 1: Write failing interface contract tests**

Add static assertions beside the salary editor checks:

```js
for (const contract of [
  'id="addOtherIncome"',
  'id="otherIncomeList"',
  'data-path="${path}.label"',
  'data-path="${path}.currency"',
  'data-path="${path}.fxToAud"',
  'data-path="${path}.amount"',
  'data-path="${path}.taxable"',
  'data-path="${path}.owner"',
  "Paid to survivor %",
  'class="remove-other-income"',
  '<b>Other income:</b>',
  'CPI-indexed and included in the Age Pension income assessment'
]) {
  assert.ok(html.includes(contract), `missing Other income UI contract: ${contract}`);
}
```

- [ ] **Step 2: Run the Monte Carlo suite and verify the UI test fails**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: non-zero exit at the missing `addOtherIncome` control.

- [ ] **Step 3: Add the Other income section**

Between Cash and savings and Shareholdings, add:

```html
<section class="group" aria-labelledby="otherIncomeHeading">
  <div class="section-heading">
    <h3 id="otherIncomeHeading">Other income</h3>
    <button type="button" id="addOtherIncome">Add income</button>
  </div>
  <div id="otherIncomeList"></div>
</section>
```

- [ ] **Step 4: Add deterministic-parity editor renderers**

Near the existing owner helpers, add `otherCurrencyOptions`, then add:

```js
function otherIncomeFields(item, index) {
  const path = `otherIncomes.${index}`;
  return `<div class="other-item" data-other-id="${escapeHtml(item.id)}">
    <label><span class="k">Label</span>
      <input data-path="${path}.label" value="${escapeHtml(item.label)}"
        placeholder="e.g. Rental income">
    </label>
    <label><span class="k">Currency</span>
      <select data-path="${path}.currency" class="other-currency"
        data-index="${index}">${otherCurrencyOptions(item.currency)}</select>
    </label>
    <label${item.currency === 'AUD' ? ' hidden' : ''}>
      <span class="k">FX to AUD</span>
      <input type="number" min="0" step="0.0001" data-value-type="number"
        data-path="${path}.fxToAud" value="${item.fxToAud}">
    </label>
    ${moneyField('Amount per year', `${path}.amount`, item.amount, item.currency)}
    <label><span class="k">Taxable income</span>
      <input type="checkbox" data-path="${path}.taxable"${item.taxable ? ' checked' : ''}>
    </label>
    <label><span class="k">Income owner</span>
      <select data-path="${path}.owner">
        ${ownerOptions(item.owner, currentScenario.people)}
      </select>
    </label>
    ${numberField('Paid to survivor %', `${path}.survivorPct`,
      item.survivorPct, 'min="0" max="100" step="5"')}
    <button type="button" class="remove-other-income" data-index="${index}">
      Remove income
    </button>
  </div>`;
}

function renderOtherIncomes(items) {
  $('#otherIncomeList').innerHTML = items.length
    ? items.map(otherIncomeFields).join('')
    : '<p class="sub">No other income added.</p>';
}
```

Call `renderOtherIncomes(currentScenario.otherIncomes)` from `renderScenario` before binding money inputs.

- [ ] **Step 5: Add editor lifecycle handlers**

Beside the shareholding lifecycle helpers, add:

```js
function addOtherIncome(scenario) {
  return {
    ...scenario,
    otherIncomes: [
      ...(scenario.otherIncomes ?? []),
      core.makeOtherIncome((scenario.otherIncomes ?? []).length)
    ]
  };
}

function removeOtherIncome(scenario, index) {
  return {
    ...scenario,
    otherIncomes: (scenario.otherIncomes ?? []).filter(
      (_, itemIndex) => itemIndex !== index)
  };
}
```

Bind the add button:

```js
$('#addOtherIncome').addEventListener('click', () => {
  currentScenario = addOtherIncome(currentScenario);
  renderOtherIncomes(currentScenario.otherIncomes);
  bindMoneyInputs();
  showValidation(core.validateScenario(currentScenario));
  scheduleSave(currentScenario);
});
```

Bind removal on the list:

```js
$('#otherIncomeList').addEventListener('click', event => {
  const removeButton = event.target.closest('.remove-other-income');
  if (!removeButton) return;
  if (!confirm('Remove this Other income?')) return;
  currentScenario = removeOtherIncome(
    currentScenario, Number(removeButton.dataset.index));
  renderScenario(currentScenario);
  scheduleSave(currentScenario);
});
```

The existing delegated `#controls` change handler already calls `renderScenario` after updating a `data-path`, so currency changes will update the conditional FX field and amount prefix without another handler.

- [ ] **Step 6: Add the assumptions disclosure**

In `renderAssumptions`, build:

```js
const otherIncomeItems = (activeScenario.otherIncomes ?? []).map(item =>
  `${item.label}: ${simulator.formatMoney(
    item.amount * simulator.otherItemFx(item))} per year`);
const otherIncomeSentence = otherIncomeItems.length
  ? `<p><b>Other income:</b> ${escapeHtml(otherIncomeItems.join('; '))}. ` +
    'Amounts are CPI-indexed and included in the Age Pension income assessment.</p>'
  : '';
```

Insert `${otherIncomeSentence}` immediately after the salary-growth disclosure.

- [ ] **Step 7: Run the Monte Carlo suite and verify the interface passes**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: the complete suite passes with editor and assumptions contracts present.

- [ ] **Step 8: Commit the editor**

```powershell
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "feat: add Monte Carlo other income editor"
```

### Task 4: Document the second issue #1 parity slice

**Files:**
- Modify: `README.md:78-90`
- Modify: `docs/MODEL-METHODOLOGY.md:87-97`
- Modify: `docs/TESTING.md:12-16`
- Modify: `CHANGELOG.md:5-10`
- Test: `tests/retirement-monte-carlo.test.mjs:5-60`

- [ ] **Step 1: Write failing documentation contracts**

Add:

```js
assert.ok(readme.includes('Other-income parity') &&
  readme.includes('Other assets, pension, lump-sum and share-return guards'));
assert.ok(methodology.includes('person-level taxable or non-taxable ledgers') &&
  methodology.includes('survivor continuation percentage'));
assert.ok(testingGuide.includes('Other-income ownership, tax, Age Pension') &&
  testingGuide.includes('survivor parity'));
assert.ok(changelog.includes('Other-income parity') &&
  changelog.includes('second issue #1'));
```

- [ ] **Step 2: Run the Monte Carlo suite and verify documentation fails**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: non-zero exit at the first new documentation assertion.

- [ ] **Step 3: Update public documentation**

Update the unreleased v0.8 README paragraph to state that schema 5 now has salary-growth and Other-income parity, including ownership, taxation and survivor continuation, while the Other assets, pension, lump-sum and share-return guards remain.

Append to the Experimental Monte Carlo methodology section:

```markdown
Other income is converted to AUD, CPI-indexed, allocated to person-level taxable or non-taxable ledgers, included in the Age Pension income test and continued after first death using the configured survivor continuation percentage. Zero-volatility tests compare the resulting tax, pension, drawdown and assets with the deterministic engine.
```

Append to the Monte Carlo testing paragraph:

```markdown
It also covers Other-income ownership, tax, Age Pension, household-funding and survivor parity under zero volatility, plus seeded stochastic invariants.
```

Add under `## Unreleased`:

```markdown
- Added Other-income parity as the second issue #1 Monte Carlo import-support slice, including currency conversion, CPI indexation, ownership, tax treatment and survivor continuation; four compatibility guards remain active ([#1](https://github.com/dcaddick/retirement-simulator/issues/1)).
```

- [ ] **Step 4: Run both regression suites**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

Expected: deterministic reports `243 passed, 0 failed`; Monte Carlo prints its survivor-boundary, risk-mode, age-gap and stress-override success line.

- [ ] **Step 5: Commit documentation**

```powershell
git add README.md CHANGELOG.md docs/MODEL-METHODOLOGY.md docs/TESTING.md tests/retirement-monte-carlo.test.mjs
git commit -m "docs: record Monte Carlo other income parity"
```

### Task 5: Verify the slice and preserve the release boundary

**Files:**
- Verify: `retirement-monte-carlo-v0.7.html`
- Verify: `tests/retirement-monte-carlo.test.mjs`
- Verify: `README.md`
- Verify: `CHANGELOG.md`
- Verify: `docs/MODEL-METHODOLOGY.md`
- Verify: `docs/TESTING.md`

- [ ] **Step 1: Run both complete suites**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

Expected: both suites pass with no failures.

- [ ] **Step 2: Confirm Other income is no longer guarded**

```powershell
rg -n "cannot yet model populated Other income" retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
```

Expected: no matches.

- [ ] **Step 3: Confirm the four remaining guards**

```powershell
rg -n "cannot yet model populated Other assets|cannot yet model lump-sum withdrawals|cannot yet preserve v1.00 Defined Benefit/UK Pension treatment|cannot yet model v1.06 share price growth" retirement-monte-carlo-v0.7.html
```

Expected: four messages in `assertExperimentalFeatureSupport`.

- [ ] **Step 4: Confirm implementation and parity contracts**

```powershell
rg -n "makeOtherIncome|otherIncomeFlows|otherIncomeByPerson|otherIncomeNet|zero-volatility Other income|addOtherIncome|Paid to survivor" retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
```

Expected: factory, validation, helper, projection integration, parity coverage and editor controls are present.

- [ ] **Step 5: Check patch integrity and repository state**

```powershell
git diff --check
git status --short --branch
git log -8 --oneline
```

Expected: no whitespace errors, a clean working tree and four focused slice commits above the design and plan commits.

- [ ] **Step 6: Preserve issue and release state**

Do not rename `retirement-monte-carlo-v0.7.html`, publish v0.8, push, or close issue #1. The next slice is Defined Benefit/UK Pensions and must begin with its own design cycle.
