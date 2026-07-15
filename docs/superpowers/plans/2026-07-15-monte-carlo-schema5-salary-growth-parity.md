# Monte Carlo Schema 5 and Salary-Growth Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the native schema-5 foundation for Monte Carlo v0.8 and remove only the above-inflation salary-growth import rejection with deterministic parity.

**Architecture:** Migrate native schema 4 to schema 5 with inert defaults for the complete issue #1 programme, centralise compatibility guards so native and deterministic imports cannot bypass unfinished slices, and preserve all deterministic fields without calculating them prematurely. Add salary growth through one pure salary helper used by the existing projection path, leaving the four unrelated feature guards active.

**Tech Stack:** Standalone HTML/CSS/JavaScript, Node.js `vm` regression tests, Markdown documentation.

---

### Task 1: Establish native schema 5 and central compatibility guards

**Files:**
- Modify: `tests/retirement-monte-carlo.test.mjs:73-230`
- Modify: `retirement-monte-carlo-v0.7.html:397-399`
- Modify: `retirement-monte-carlo-v0.7.html:658-728`
- Modify: `retirement-monte-carlo-v0.7.html:764-886`
- Modify: `retirement-monte-carlo-v0.7.html:1311-1373`

- [ ] **Step 1: Write failing schema-5 migration tests**

After `const simulator = context.RetirementSimulatorCore;` in `tests/retirement-monte-carlo.test.mjs`, add:

```js
assert.equal(simulator.SCHEMA_VERSION, 5,
  'the v0.8 parity programme should use native schema 5');
```

After the `monteCarloDemo` sample assertions, add:

```js
assert.equal(monteCarloDemo.schemaVersion, 5);
assert.ok(monteCarloDemo.people.every(person => person.salaryGrowthPct === 0));
assert.deepEqual(plain(monteCarloDemo.otherIncomes), []);
assert.deepEqual(plain(monteCarloDemo.otherAssets), []);
assert.deepEqual(plain(monteCarloDemo.lumpSumWithdrawals), []);

const nativeSchema4 = structuredClone(monteCarloDemo);
nativeSchema4.schemaVersion = 4;
nativeSchema4.people.forEach(person => { delete person.salaryGrowthPct; });
delete nativeSchema4.otherIncomes;
delete nativeSchema4.otherAssets;
delete nativeSchema4.lumpSumWithdrawals;
delete nativeSchema4.assumptions.ukPensionsEnabled;
nativeSchema4.shareholdings = [{
  id: 'legacy-share', symbol: 'BHP', quantity: 10,
  quoteCurrency: 'AUD', price: 40, fxToAud: 1,
  owner: 'joint', costBaseAud: 300, cgtDiscountEligible: true,
  saleYear: 2035, saleMonth: 1
}];
const migratedSchema5 = simulator.migrateScenario(nativeSchema4);
assert.equal(migratedSchema5.schemaVersion, 5);
assert.ok(migratedSchema5.people.every(person => person.salaryGrowthPct === 0));
assert.deepEqual(plain(migratedSchema5.otherIncomes), []);
assert.deepEqual(plain(migratedSchema5.otherAssets), []);
assert.deepEqual(plain(migratedSchema5.lumpSumWithdrawals), []);
assert.equal(migratedSchema5.assumptions.ukPensionsEnabled, true,
  'legacy native pensions should retain their previous enabled behaviour');
assert.deepEqual(
  plain(migratedSchema5.shareholdings[0]),
  {
    ...plain(nativeSchema4.shareholdings[0]),
    priceGrowthPct: 0,
    dividendYieldPct: 0,
    frankedPct: 0,
    companyTaxRatePct: 30,
    frankingEligible: false
  }
);
```

Change every existing adapted-schema assertion from native schema `4` to `5`. Change the inert schema-10 assertion from checking that `salaryGrowthPct` was removed to:

```js
assert.ok(adaptedSchema10.people.every(person => person.salaryGrowthPct === 0),
  'schema 10 zero salary growth should be preserved in native schema 5');
```

- [ ] **Step 2: Write failing central-guard tests for native schema 5**

After the schema-5 migration test, add:

```js
for (const [label, mutate, pattern] of [
  ['Other income', scenario => {
    scenario.otherIncomes = [{ label: 'Rent', amount: 1000 }];
  }, /cannot yet model populated Other income or Other assets/],
  ['lump sum', scenario => {
    scenario.lumpSumWithdrawals = [{ enabled: true }];
  }, /cannot yet model lump-sum withdrawals/],
  ['pension', scenario => {
    scenario.assumptions.ukPensionsEnabled = true;
    scenario.people[0].ukStateAnnualGbp = 1000;
  }, /cannot yet preserve v1\.00 Defined Benefit\/UK Pension treatment/],
  ['share returns', scenario => {
    scenario.shareholdings = [{
      ...migratedSchema5.shareholdings[0], priceGrowthPct: 1
    }];
  }, /cannot yet model v1\.06 share price growth, dividends or franking/]
]) {
  const nativeUnsupported = structuredClone(migratedSchema5);
  mutate(nativeUnsupported);
  assert.throws(
    () => simulator.importScenario(JSON.stringify(nativeUnsupported)),
    pattern,
    `native schema 5 ${label} must remain explicitly guarded`
  );
}
```

- [ ] **Step 3: Run the Monte Carlo suite and verify the schema tests fail**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: non-zero exit because `SCHEMA_VERSION` is still 4.

- [ ] **Step 4: Advance the native schema and sample defaults**

In `retirement-monte-carlo-v0.7.html`, change:

```js
const SCHEMA_VERSION = 5;
```

Add `salaryGrowthPct: 0` after each sample person's `salary` field. Add the three arrays beside `shareholdings`:

```js
otherIncomes: [],
otherAssets: [],
lumpSumWithdrawals: [],
```

Add this to the sample assumptions:

```js
ukPensionsEnabled: true,
```

- [ ] **Step 5: Add the schema-4 to schema-5 migration**

After the existing schema-3 migration block in `migrateScenario`, add:

```js
if (current.schemaVersion === 4) {
  const migrated = structuredClone(current);
  migrated.schemaVersion = 5;
  migrated.people = migrated.people.map(person => ({
    ...person,
    salaryGrowthPct: Number.isFinite(person.salaryGrowthPct)
      ? person.salaryGrowthPct : 0
  }));
  migrated.otherIncomes = Array.isArray(migrated.otherIncomes)
    ? migrated.otherIncomes : [];
  migrated.otherAssets = Array.isArray(migrated.otherAssets)
    ? migrated.otherAssets : [];
  migrated.lumpSumWithdrawals = Array.isArray(migrated.lumpSumWithdrawals)
    ? migrated.lumpSumWithdrawals : [];
  migrated.shareholdings = (migrated.shareholdings ?? []).map(holding => ({
    ...holding,
    priceGrowthPct: Number.isFinite(holding.priceGrowthPct)
      ? holding.priceGrowthPct : 0,
    dividendYieldPct: Number.isFinite(holding.dividendYieldPct)
      ? holding.dividendYieldPct : 0,
    frankedPct: Number.isFinite(holding.frankedPct) ? holding.frankedPct : 0,
    companyTaxRatePct: [25, 30].includes(holding.companyTaxRatePct)
      ? holding.companyTaxRatePct : 30,
    frankingEligible: holding.frankingEligible === true
  }));
  migrated.assumptions = {
    ...migrated.assumptions,
    ukPensionsEnabled:
      typeof migrated.assumptions?.ukPensionsEnabled === 'boolean'
        ? migrated.assumptions.ukPensionsEnabled : true
  };
  current = migrated;
}
```

- [ ] **Step 6: Centralise unfinished-feature guards**

Create this helper immediately before the deterministic adapter:

```js
function assertExperimentalFeatureSupport(scenario) {
  if (scenario.people?.some(person => Number(person.salaryGrowthPct) > 0)) {
    throw new Error('Monte Carlo v0.7 cannot yet model above-inflation salary growth. Set it to 0% in a fictional copy before importing.');
  }
  const activeShareReturns = (scenario.shareholdings ?? []).some(holding =>
    Number(holding.priceGrowthPct) !== 0 ||
    Number(holding.dividendYieldPct) !== 0 ||
    Number(holding.frankedPct) !== 0 ||
    holding.frankingEligible === true);
  if (activeShareReturns) {
    throw new Error('Monte Carlo v0.7 cannot yet model v1.06 share price growth, dividends or franking. Set those fields to zero/off in a fictional copy before importing.');
  }
  if ((scenario.otherIncomes ?? []).length || (scenario.otherAssets ?? []).length) {
    throw new Error('Monte Carlo v0.7 cannot yet model populated Other income or Other assets. Remove them from a fictional copy before importing.');
  }
  if ((scenario.lumpSumWithdrawals ?? []).some(item => item.enabled !== false)) {
    throw new Error('Monte Carlo v0.7 cannot yet model lump-sum withdrawals. Remove them from a fictional copy before importing.');
  }
  const hasPensionIncome = scenario.people?.some(person =>
    Number(person.ukStateAnnualGbp) > 0);
  if (scenario.assumptions?.ukPensionsEnabled !== false && hasPensionIncome) {
    throw new Error('Monte Carlo v0.7 cannot yet preserve v1.00 Defined Benefit/UK Pension treatment. Use a fictional copy with those pensions excluded.');
  }
}
```

Remove the five guard blocks from `adaptV1ScenarioForExperimentalMonteCarlo`. Change its person mapping to preserve deterministic fields:

```js
adapted.people = adapted.people.map(person => ({
  ...person,
  salaryGrowthPct: person.salaryGrowthPct ?? 0,
  ukStateAnnualGbp: person.ukStateAnnualGbp ?? 0,
  ukStateSurvivorPct: person.ukStateSurvivorPct ?? 0,
  ukPrivateAmountGbp: 0,
  ukPrivateTakeAge: person.ukStateStartAge ?? 67,
  ukPrivateType: 'lump'
}));
```

Delete the three `delete adapted...` statements. Replace the shareholding stripping map with:

```js
adapted.shareholdings = (adapted.shareholdings ?? []).map(holding => ({
  ...holding,
  priceGrowthPct: holding.priceGrowthPct ?? 0,
  dividendYieldPct: holding.dividendYieldPct ?? 0,
  frankedPct: holding.frankedPct ?? 0,
  companyTaxRatePct: holding.companyTaxRatePct ?? 30,
  frankingEligible: holding.frankingEligible === true
}));
```

In `importScenario`, run the central guard after migration and before validation:

```js
const scenario = migrateScenario(adaptV1ScenarioForExperimentalMonteCarlo(parsed));
assertExperimentalFeatureSupport(scenario);
const errors = validateScenario(scenario);
```

- [ ] **Step 7: Keep preserved disabled pensions inert**

Wrap the existing native `ukPensionFlows` calculation in `projectYear` with the same toggle used by the deterministic engine:

```js
if (scenario.assumptions.ukPensionsEnabled !== false) {
  const uk = ukPensionFlows(
    person,
    ages[index],
    scenario.assumptions.gbpAud,
    inflationFactor
  );
  ukState[index] = uk.stateAnnuity;
  ukPrivateAnnuity[index] = uk.privateAnnuity;
  ukPrivateLump[index] = uk.privateLump;

  if (uk.privateLump > 0 && state.ukPrivateBalances[index] > 0) {
    state.savings += uk.privateLump;
    state.ukPrivateBalances[index] = 0;
    events.push({
      type: 'uk-private-lump',
      label: `${person.name} UK private pension lump sum`,
      amount: uk.privateLump / inflationFactor
    });
  }
}
```

Also require `scenario.assumptions.ukPensionsEnabled !== false` in the inherited-UK survivor block.

- [ ] **Step 8: Run the Monte Carlo suite and verify schema 5 passes**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: the full suite passes while positive salary growth and the four unrelated feature groups still reject explicitly.

- [ ] **Step 9: Commit the schema foundation**

```powershell
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "feat: establish Monte Carlo schema 5"
```

### Task 2: Implement salary-growth validation, import and interface

**Files:**
- Modify: `tests/retirement-monte-carlo.test.mjs:125-180`
- Modify: `retirement-monte-carlo-v0.7.html:817-872`
- Modify: `retirement-monte-carlo-v0.7.html:1640-1668`
- Modify: `retirement-monte-carlo-v0.7.html:1997-2009`
- Modify: `retirement-monte-carlo-v0.7.html:4542-4595`

- [ ] **Step 1: Replace the salary rejection test with acceptance and validation tests**

Replace the current `activeSchema10` rejection block in `tests/retirement-monte-carlo.test.mjs` with:

```js
const activeSchema10 = structuredClone(disabledSchema9);
activeSchema10.schemaVersion = 10;
activeSchema10.people[0].salaryGrowthPct = 1;
activeSchema10.people[1].salaryGrowthPct = 0;
const adaptedSchema10 = simulator.importScenario(JSON.stringify(activeSchema10));
assert.equal(adaptedSchema10.schemaVersion, 5);
assert.deepEqual(
  adaptedSchema10.people.map(person => person.salaryGrowthPct),
  [1, 0],
  'schema 10 salary growth should survive deterministic adaptation'
);

for (const invalidGrowth of [-1, NaN, Infinity, 'abc']) {
  const invalidSalaryGrowth = structuredClone(adaptedSchema10);
  invalidSalaryGrowth.people[0].salaryGrowthPct = invalidGrowth;
  assert.ok(
    simulator.validateScenario(invalidSalaryGrowth)
      .some(error => error.path === 'people.0.salaryGrowthPct'),
    `salary growth ${String(invalidGrowth)} should be rejected`
  );
}
```

Add these interface assertions beside the existing person-field assertions:

```js
assert.ok(html.includes("numberField('Salary growth above inflation %'"));
assert.ok(html.includes('salaryGrowthPct ?? 0'));
assert.ok(html.includes('<b>Salary growth above inflation:</b>'));
```

- [ ] **Step 2: Run the Monte Carlo suite and verify salary acceptance fails**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: non-zero exit because the central salary-growth guard still rejects the schema-10 scenario.

- [ ] **Step 3: Remove only the salary-growth compatibility guard**

Delete this block from `assertExperimentalFeatureSupport`:

```js
if (scenario.people?.some(person => Number(person.salaryGrowthPct) > 0)) {
  throw new Error('Monte Carlo v0.7 cannot yet model above-inflation salary growth. Set it to 0% in a fictional copy before importing.');
}
```

Leave the share-return, Other income/assets, lump-sum and pension blocks unchanged.

- [ ] **Step 4: Add native salary and salary-growth validation**

Inside each-person validation, immediately after the existing `person.super` check, add:

```js
if (!finiteNonNegative(person.salary)) {
  add(`people.${index}.salary`, 'Salary must be zero or greater.');
}
if (!Number.isFinite(person.salaryGrowthPct) || person.salaryGrowthPct < 0) {
  add(`people.${index}.salaryGrowthPct`,
    'Salary growth above inflation must be zero or greater.');
}
```

- [ ] **Step 5: Add the person-editor field**

Immediately after the existing Salary field in `personFields`, add:

```js
${numberField('Salary growth above inflation %', `${path}.salaryGrowthPct`,
  person.salaryGrowthPct ?? 0, 'min="0" step="0.1"')}
```

- [ ] **Step 6: Add concise assumptions disclosure**

In `renderAssumptions`, build the non-zero summary before assigning `innerHTML`:

```js
const salaryGrowthItems = activeScenario.people
  .filter(person => Number(person.salaryGrowthPct) > 0)
  .map(person => `${person.name} ${person.salaryGrowthPct}%`);
const salaryGrowthSentence = salaryGrowthItems.length
  ? `<p><b>Salary growth above inflation:</b> ${escapeHtml(salaryGrowthItems.join('; '))}.</p>`
  : '';
```

Insert `${salaryGrowthSentence}` immediately after the Survivor state paragraph.

- [ ] **Step 7: Run the Monte Carlo suite and verify salary import/UI tests pass**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: all tests pass, including positive import, invalid values, editor field and assumptions disclosure.

- [ ] **Step 8: Commit salary import and interface support**

```powershell
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "feat: accept Monte Carlo salary growth"
```

### Task 3: Apply salary growth and prove deterministic parity

**Files:**
- Modify: `tests/retirement-monte-carlo.test.mjs:374-495`
- Modify: `retirement-monte-carlo-v0.7.html:1298-1346`
- Modify: `retirement-monte-carlo-v0.7.html:1792-1847`

- [ ] **Step 1: Write failing pure salary-behaviour tests**

After the deterministic core is loaded in `tests/retirement-monte-carlo.test.mjs`, add:

```js
const salaryPerson = {
  ...adaptedSchema10.people[0],
  age: 63,
  retireAge: 65,
  salary: 100000,
  salaryGrowthPct: 5
};
assert.equal(simulator.salaryForProjectionYear({
  person: salaryPerson, age: 63, year: 2026, startYear: 2026,
  inflationFactor: 1, alive: true
}), 100000);
assert.equal(simulator.salaryForProjectionYear({
  person: salaryPerson, age: 64, year: 2027, startYear: 2026,
  inflationFactor: 1, alive: true
}), 105000);
assert.equal(simulator.salaryForProjectionYear({
  person: salaryPerson, age: 65, year: 2028, startYear: 2026,
  inflationFactor: 1, alive: true
}), 0);
```

- [ ] **Step 2: Write a failing zero-volatility parity fixture**

Add this after the pure helper checks:

```js
const monteCarloSalaryParity = structuredClone(adaptedSchema10);
monteCarloSalaryParity.assumptions.inflationMode = 'manual';
monteCarloSalaryParity.assumptions.manualInflationPct = 0;
monteCarloSalaryParity.assumptions.ukPensionsEnabled = false;
monteCarloSalaryParity.household.includeAgePension = false;
monteCarloSalaryParity.household.applyMinimumDrawdown = false;
monteCarloSalaryParity.household.targetAfterTax = 0;
monteCarloSalaryParity.household.annualBudget = 0;
monteCarloSalaryParity.household.modelEndAge = 67;
monteCarloSalaryParity.household.firstDeath.enabled = false;
monteCarloSalaryParity.cash.amount = 0;
monteCarloSalaryParity.savings.amount = 0;
monteCarloSalaryParity.shareholdings = [];
monteCarloSalaryParity.people.forEach((person, index) => Object.assign(person, {
  age: index === 0 ? 63 : 61,
  retireAge: 65,
  superAccessAge: 65,
  salary: index === 0 ? 100000 : 50000,
  salaryGrowthPct: index === 0 ? 5 : 0,
  sgPct: 12,
  accumulationReturnPct: 0,
  retirementReturnPct: 0,
  super: index === 0 ? 100000 : 50000,
  ukStateAnnualGbp: 0
}));
const salaryPath = {
  schemaVersion: 1,
  years: Array.from(
    { length: simulator.projectionYearCount(monteCarloSalaryParity) },
    (_, index) => ({
      year: monteCarloSalaryParity.startYear + index,
      superAccumulationReturnPct: [0, 0],
      superRetirementReturnPct: [0, 0]
    })
  )
};
const monteCarloSalaryRows = simulator.projectScenario(
  monteCarloSalaryParity, salaryPath).rows;

const deterministicSalaryParity = deterministic.makeSampleScenario();
deterministicSalaryParity.assumptions.inflationMode = 'manual';
deterministicSalaryParity.assumptions.manualInflationPct = 0;
deterministicSalaryParity.assumptions.ukPensionsEnabled = false;
deterministicSalaryParity.household = structuredClone(
  monteCarloSalaryParity.household);
deterministicSalaryParity.cash.amount = 0;
deterministicSalaryParity.savings.amount = 0;
deterministicSalaryParity.shareholdings = [];
deterministicSalaryParity.otherIncomes = [];
deterministicSalaryParity.otherAssets = [];
deterministicSalaryParity.lumpSumWithdrawals = [];
deterministicSalaryParity.people.forEach((person, index) => Object.assign(person, {
  age: monteCarloSalaryParity.people[index].age,
  retireAge: 65,
  superAccessAge: 65,
  salary: monteCarloSalaryParity.people[index].salary,
  salaryGrowthPct: monteCarloSalaryParity.people[index].salaryGrowthPct,
  sgPct: 12,
  accumulationReturnPct: 0,
  retirementReturnPct: 0,
  super: monteCarloSalaryParity.people[index].super,
  ukStateAnnualGbp: 0
}));
const deterministicSalaryRows = deterministic.projectScenario(
  deterministicSalaryParity).rows;
const round6 = value => Math.round(value * 1e6) / 1e6;
const salaryParityShape = row => ({
  year: row.year,
  workNet: round6(row.components.workNet),
  totalIncome: round6(row.totalIncome),
  totalAssets: round6(row.totalAssets),
  superBalances: row.superBalances.map(round6)
});
assert.deepEqual(
  plain(monteCarloSalaryRows.map(salaryParityShape)),
  plain(deterministicSalaryRows.map(salaryParityShape)),
  'zero-volatility salary growth should match deterministic cash flows and balances'
);

const salaryStochasticProfiles = {
  p0Accum: { expectedReturnPct: 4, volatilityPct: 8 },
  p0Retire: { expectedReturnPct: 4, volatilityPct: 8 },
  p1Accum: { expectedReturnPct: 4, volatilityPct: 8 },
  p1Retire: { expectedReturnPct: 4, volatilityPct: 8 }
};
const salaryStochasticA = core.simulatePaths({
  scenario: monteCarloSalaryParity,
  pathCount: 3,
  seed: 24680,
  profiles: salaryStochasticProfiles,
  projectScenario: simulator.projectScenario
});
const salaryStochasticB = core.simulatePaths({
  scenario: monteCarloSalaryParity,
  pathCount: 3,
  seed: 24680,
  profiles: salaryStochasticProfiles,
  projectScenario: simulator.projectScenario
});
assert.deepEqual(
  plain(salaryStochasticA.map(result => result.projection.rows.map(row => ({
    year: row.year,
    workNet: row.components.workNet,
    totalAssets: row.totalAssets
  })))),
  plain(salaryStochasticB.map(result => result.projection.rows.map(row => ({
    year: row.year,
    workNet: row.components.workNet,
    totalAssets: row.totalAssets
  })))),
  'salary-growth paths should remain seed-reproducible'
);
assert.ok(salaryStochasticA.every(result =>
  result.engineError === null && result.projection.rows.every(row =>
    Number.isFinite(row.totalIncome) && Number.isFinite(row.totalAssets) &&
    row.totalAssets >= 0)),
'salary-growth stochastic paths should preserve accounting invariants');

const noGrowthStochastic = structuredClone(monteCarloSalaryParity);
noGrowthStochastic.people[0].salaryGrowthPct = 0;
const noGrowthPaths = core.simulatePaths({
  scenario: noGrowthStochastic,
  pathCount: 3,
  seed: 24680,
  profiles: salaryStochasticProfiles,
  projectScenario: simulator.projectScenario
});
assert.ok(
  salaryStochasticA[0].projection.rows[1].components.workNet >
    noGrowthPaths[0].projection.rows[1].components.workNet,
  'positive salary growth must not be silently omitted from stochastic paths'
);
```

- [ ] **Step 3: Run the Monte Carlo suite and verify calculation tests fail**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: non-zero exit because `salaryForProjectionYear` is not exported or defined.

- [ ] **Step 4: Add and use the pure salary helper**

Immediately before `projectYear`, add:

```js
function salaryForProjectionYear({
  person, age, year, startYear, inflationFactor, alive = true
}) {
  if (!alive || age >= person.retireAge) return 0;
  const yearsElapsed = year - startYear;
  const salaryGrowthFactor = Math.pow(
    1 + (person.salaryGrowthPct ?? 0) / 100,
    yearsElapsed
  );
  return person.salary * inflationFactor * salaryGrowthFactor;
}
```

Replace the existing salary calculation in `projectYear` with:

```js
const salary = salaryForProjectionYear({
  person,
  age: ages[index],
  year,
  startYear: scenario.startYear,
  inflationFactor,
  alive: state.lifecycle.alive[index]
});
salaries[index] = salary;
```

Add `salaryForProjectionYear` to the exported `RetirementSimulatorCore` object.

- [ ] **Step 5: Run the Monte Carlo suite and verify parity passes**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: the full suite passes, including year-0 salary, second-year compounding, retirement cutoff, SG-supported balances, zero-volatility deterministic parity, seed reproducibility and stochastic accounting invariants.

- [ ] **Step 6: Commit calculation parity**

```powershell
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "feat: apply salary growth across Monte Carlo paths"
```

### Task 4: Document the first v0.8 parity slice

**Files:**
- Modify: `tests/retirement-monte-carlo.test.mjs:1-45`
- Modify: `README.md:76-86`
- Modify: `docs/MODEL-METHODOLOGY.md:87-93`
- Modify: `docs/TESTING.md:10-16`
- Modify: `CHANGELOG.md:5-10`

- [ ] **Step 1: Write failing documentation-contract tests**

At the top of `tests/retirement-monte-carlo.test.mjs`, load the public documentation:

```js
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const methodology = await readFile(
  new URL('../docs/MODEL-METHODOLOGY.md', import.meta.url), 'utf8');
const testingGuide = await readFile(
  new URL('../docs/TESTING.md', import.meta.url), 'utf8');
const changelog = await readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
```

Add these assertions beside the existing version checks:

```js
assert.ok(readme.includes('schema 5') && readme.includes('salary-growth parity'));
assert.ok(methodology.includes('above-inflation salary growth') &&
  methodology.includes('remaining import guards'));
assert.ok(testingGuide.includes('schema-4 to schema-5 migration') &&
  testingGuide.includes('salary-growth parity'));
assert.ok(changelog.includes('Monte Carlo schema 5') &&
  changelog.includes('salary-growth parity'));
assert.ok(readme.includes('experimental') && html.includes('experimental'),
  'salary parity must not remove the experimental label');
```

- [ ] **Step 2: Run the Monte Carlo suite and verify documentation checks fail**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: non-zero exit at the first schema-5 public-documentation assertion.

- [ ] **Step 3: Update public scope documentation**

After the main Monte Carlo limitations paragraph in `README.md`, add:

```markdown
Unreleased v0.8 work uses native schema 5 and adds salary-growth parity: imported above-inflation salary growth now feeds salary, SG, tax, Age Pension assessment and household funding in every path. Monte Carlo remains experimental, and issue #1 stays open while the Other income/assets, pension, lump-sum and share-return guards remain.
```

Append this paragraph to the Experimental Monte Carlo section in `docs/MODEL-METHODOLOGY.md`:

```markdown
The unreleased schema-5 core supports above-inflation salary growth using the deterministic year-by-year formula. The remaining import guards stay explicit until their separate parity slices are complete.
```

Append this sentence to the Monte Carlo suite description in `docs/TESTING.md`:

```markdown
It also covers schema-4 to schema-5 migration and zero-volatility salary-growth parity while confirming the remaining import guards stay active.
```

- [ ] **Step 4: Update the unreleased changelog**

Add this bullet under the existing `## Unreleased` heading:

```markdown
- Established Monte Carlo schema 5 and salary-growth parity as the first issue #1 import-support slice; the companion remains experimental and the other compatibility guards remain active ([#1](https://github.com/dcaddick/retirement-simulator/issues/1)).
```

- [ ] **Step 5: Run both regression suites**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

Expected: deterministic suite reports zero failures; Monte Carlo reports its survivor-boundary, risk-mode, age-gap and stress-override success line.

- [ ] **Step 6: Commit the unreleased documentation**

```powershell
git add README.md CHANGELOG.md docs/MODEL-METHODOLOGY.md docs/TESTING.md tests/retirement-monte-carlo.test.mjs
git commit -m "docs: record Monte Carlo salary parity slice"
```

### Task 5: Verify the slice and preserve the release boundary

**Files:**
- Verify: `retirement-monte-carlo-v0.7.html`
- Verify: `tests/retirement-monte-carlo.test.mjs`
- Verify: `README.md`
- Verify: `CHANGELOG.md`
- Verify: `docs/MODEL-METHODOLOGY.md`
- Verify: `docs/TESTING.md`

- [ ] **Step 1: Run both complete suites one final time**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

Expected: both suites pass with no failures.

- [ ] **Step 2: Confirm salary growth is no longer guarded**

```powershell
rg -n "cannot yet model above-inflation salary growth" retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
```

Expected: no matches.

- [ ] **Step 3: Confirm the remaining guards are still present**

```powershell
rg -n "cannot yet model populated Other income or Other assets|cannot yet model lump-sum withdrawals|cannot yet preserve v1.00 Defined Benefit/UK Pension treatment|cannot yet model v1.06 share price growth" retirement-monte-carlo-v0.7.html
```

Expected: four compatibility messages remain in the central guard.

- [ ] **Step 4: Confirm schema and parity contracts**

```powershell
rg -n "SCHEMA_VERSION = 5|salaryGrowthPct|salaryForProjectionYear|zero-volatility salary growth" retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
```

Expected: schema 5, migration/defaults, validation, helper, projection use and parity tests are all present.

- [ ] **Step 5: Check patch integrity and repository state**

```powershell
git diff --check
git status --short --branch
git log -8 --oneline
```

Expected: no whitespace errors, no uncommitted slice files and four focused implementation commits above the approved design and plan commits.

- [ ] **Step 6: Preserve issue and release state**

Do not rename `retirement-monte-carlo-v0.7.html`, publish v0.8, push, or close issue #1. Continue to the Other-income slice through its own design, plan and implementation cycle; release and issue closure occur only after all five approved slices pass together.
