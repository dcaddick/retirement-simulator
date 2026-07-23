# Issue #36 Single-Household Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add correct year-zero single-person household modelling to the deterministic simulator while preserving inactive Person 2 and couple data.

**Architecture:** Advance the deterministic schema to version 14 with `household.type`, retain the fixed two-person storage shape, and derive an active runtime view through pure household-status, ownership-inclusion and drawdown helpers. A distinct `single` lifecycle state reuses existing single tax and entitlement rules without invoking first-death spending, inheritance or continuation behaviour.

**Tech Stack:** Standalone HTML/CSS/JavaScript, Node.js regression harness, browser verification in Chromium/WebKit-compatible layouts.

---

## File Map

- Modify `retirement-simulator.html`: schema, migration, validation, projection state, ownership inclusion, drawdown filtering, interface controls, charts, tables, tooltips, CSV and assumptions.
- Modify `tests/retirement-simulator.test.mjs`: schema, lifecycle, ownership, rule-routing, validation and static interface regression tests.
- Modify `README.md`: deterministic single-household capability and Monte Carlo boundary.
- Modify `docs/MODEL-METHODOLOGY.md`: year-zero single status, ownership inclusion and rule selection.
- Modify `docs/TESTING.md`: automated and browser acceptance checks.
- Modify `CHANGELOG.md`: unreleased issue #36 entry without claiming a release.

No new runtime file is created. The application intentionally keeps its current portable single-file structure.

### Task 1: Add the schema-14 household-type contract

**Files:**
- Modify: `retirement-simulator.html:472,1121-1197,1245-1423,2558-2620,2885-2968`
- Test: `tests/retirement-simulator.test.mjs:70-110,208-266,1860-1922`

- [ ] **Step 1: Write failing schema and migration tests**

Insert after the existing sample/schema assertions:

```js
check('schema version is 14', core.SCHEMA_VERSION === 14);
check('sample defaults to a couple household',
  sample.schemaVersion === 14 && sample.household.type === 'couple');

const schema13Household = structuredClone(sample);
schema13Household.schemaVersion = 13;
delete schema13Household.household.type;
schema13Household.otherAssets = [{
  ...core.makeOtherAsset(0),
  id: 'schema-13-asset',
  label: 'Legacy household asset'
}];
delete schema13Household.otherAssets[0].owner;
const migrated14 = core.migrateScenario(schema13Household);
check('schema 13 migrates to an explicit couple household',
  migrated14.schemaVersion === 14 &&
  migrated14.household.type === 'couple' &&
  migrated14.otherAssets[0].owner === 'joint' &&
  core.validateScenario(migrated14).length === 0);

const invalidHouseholdType = structuredClone(sample);
invalidHouseholdType.household.type = 'widowed';
check('invalid household type is rejected',
  core.validateScenario(invalidHouseholdType).some(error =>
    error.path === 'household.type'));
```

Update existing assertions that expect schema 13 so they expect schema 14, while retaining explicit schema-13 migration coverage.

- [ ] **Step 2: Run the deterministic suite and confirm the new tests fail**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: failures for schema version 14, missing `household.type`, and schema-13 migration.

- [ ] **Step 3: Implement schema 14 and migration**

Change the constant and sample household:

```js
const SCHEMA_VERSION = 14;
```

```js
household: {
  type: 'couple',
  targetAfterTax: 80000,
  annualBudget: 70000,
  modelEndAge: 95,
  drawdownPriority: [
    [
      { source: 'p0Super', weight: 0.5 },
      { source: 'p1Super', weight: 0.5 }
    ],
    [{ source: 'savings', weight: 0.5 }]
  ],
  applyMinimumDrawdown: true,
  includeAgePension: true,
  showSurvival: true,
  firstDeath: defaultFirstDeath()
}
```

Add this final migration block after the schema-12-to-13 migration:

```js
if (current.schemaVersion === 13) {
  const migrated = structuredClone(current);
  migrated.schemaVersion = 14;
  migrated.household = {
    ...migrated.household,
    type: 'couple'
  };
  migrated.otherAssets = (migrated.otherAssets ?? []).map(asset => ({
    ...asset,
    owner: asset.owner ?? 'joint'
  }));
  current = migrated;
}
```

Add `owner: 'joint'` to `makeOtherAsset`. Existing schema-13 assets migrate
to Joint 50/50 because they were previously household-level; this preserves
their complete value in Couple mode and makes their Single-mode share explicit
and editable.

Add household-type validation before person validation:

```js
const householdType = scenario.household?.type;
if (!['couple', 'single'].includes(householdType)) {
  add('household.type', 'Household type must be Couple or Single.');
}
```

- [ ] **Step 4: Run the schema tests**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: the new schema tests pass; later existing assertions may still require their schema-version text to be updated.

- [ ] **Step 5: Commit the schema slice**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: add explicit household type schema"
```

### Task 2: Introduce a genuine single lifecycle

**Files:**
- Modify: `retirement-simulator.html:1663-1777,1986-2055,2106-2129,2427-2471,2754-2792`
- Test: `tests/retirement-simulator.test.mjs:1090-1329`

- [ ] **Step 1: Write failing lifecycle tests**

Add a new section immediately before `deterministic survivor projection`:

```js
console.log('\ndeterministic single household');
const singleLifecycleScenario = structuredClone(sample);
singleLifecycleScenario.household.type = 'single';
singleLifecycleScenario.household.targetAfterTax = 80000;
singleLifecycleScenario.household.annualBudget = 70000;
singleLifecycleScenario.household.modelEndAge =
  singleLifecycleScenario.people[0].age + 1;
singleLifecycleScenario.household.firstDeath = {
  enabled: true,
  deceasedPerson: 'p0',
  deathAge: singleLifecycleScenario.people[0].age + 1,
  survivorPreferredPct: 70,
  survivorEssentialPct: 70
};
singleLifecycleScenario.people[1].salary = 999999;
singleLifecycleScenario.people[1].super = 999999;

const singleInitialState = core.makeProjectionState(singleLifecycleScenario);
check('single state starts with only Person 1 alive',
  singleInitialState.lifecycle.householdStatus === 'single' &&
  JSON.stringify(singleInitialState.lifecycle.alive) ===
    JSON.stringify([true, false]) &&
  singleInitialState.lifecycle.survivorIndex === null);

const singleLifecycleRows =
  core.projectScenario(singleLifecycleScenario).rows;
check('single household keeps entered targets at 100 percent',
  singleLifecycleRows.every(row =>
    row.target === 80000 && row.budget === 70000));
check('single household never emits a first-death event',
  singleLifecycleRows.every(row =>
    !row.events.some(event => event.type === 'first-death')));
check('Person 2 personal flows remain inactive',
  singleLifecycleRows.every(row =>
    row.salaryByPerson[1] === 0 &&
    row.superBalances[1] === 0 &&
    row.taxByPerson[1] === 0));
```

- [ ] **Step 2: Run the suite and verify lifecycle failures**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: single initial state is still `couple`, Person 2 remains alive, and first-death settings affect the projection.

- [ ] **Step 3: Add household-status helpers and single state**

Add pure helpers near `makeProjectionState`:

```js
function isSingleHousehold(scenario) {
  return scenario.household?.type === 'single';
}

function householdRuleStatus(scenario, lifecycle) {
  return isSingleHousehold(scenario) ||
    lifecycle.householdStatus === 'survivor'
    ? 'single'
    : 'couple';
}

function solePersonIndex(scenario, lifecycle) {
  if (isSingleHousehold(scenario)) return 0;
  return lifecycle.householdStatus === 'survivor'
    ? lifecycle.survivorIndex
    : null;
}
```

Seed lifecycle state without reading Person 2 numeric fields:

```js
function makeProjectionState(scenario) {
  const single = isSingleHousehold(scenario);
  const splits = scenario.people.map((person, index) =>
    single && index === 1
      ? { accum: 0, retire: 0, transitioned: true }
      : superAccessSplit(person));
  return {
    // retain existing balances and collections
    lifecycle: single
      ? {
          householdStatus: 'single',
          alive: [true, false],
          survivorIndex: null,
          deceasedIndex: null,
          transitionYear: null
        }
      : {
          householdStatus: 'couple',
          alive: [true, true],
          survivorIndex: null,
          deceasedIndex: null,
          transitionYear: null
        }
  };
}
```

Update `lifecycleContext` so only an actual survivor uses configured reductions:

```js
preferredTargetPct: state.lifecycle.householdStatus === 'survivor'
  ? firstDeath.survivorPreferredPct
  : 100,
essentialTargetPct: state.lifecycle.householdStatus === 'survivor'
  ? firstDeath.survivorEssentialPct
  : 100,
```

Short-circuit first death for a single household:

```js
if (isSingleHousehold(scenario) ||
    !firstDeath.enabled ||
    state.lifecycle.householdStatus === 'survivor') {
  return lifecycleContext(scenario, state, false);
}
```

Use Person 1 for the horizon in single mode:

```js
const horizonIndex = isSingleHousehold(scenario)
  ? 0
  : scenario.household.firstDeath.enabled
    ? 1 - configuredDeceasedIndex
    : 0;
```

- [ ] **Step 4: Gate first-death validation in single mode**

Place the existing validation statements from lines 2762-2792 inside an
`if (!isSingleHousehold(scenario))` block without changing their field checks
or messages. This makes the entire saved first-death object inert while single
and restores the same validation when the household returns to couple.

Use Person 1 as the validation horizon when single.

- [ ] **Step 5: Run the lifecycle and survivor regressions**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: new single lifecycle tests pass and all existing first-death/survivor tests remain green.

- [ ] **Step 6: Commit the lifecycle slice**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: model single lifecycle from year zero"
```

### Task 3: Derive active ownership without mutating stored data

**Files:**
- Modify: `retirement-simulator.html:1121-1233,1525-1690,1863-1973,2140-2365,2467-2528,2558-2750,2885-2968`
- Test: `tests/retirement-simulator.test.mjs:470-760,1388-1570`

- [ ] **Step 1: Write failing ownership helper tests**

Add near the existing ownership tests:

```js
check('single ownership fractions are explicit',
  core.singleHouseholdInclusion('p0') === 1 &&
  core.singleHouseholdInclusion('p1') === 0 &&
  core.singleHouseholdInclusion('joint') === 0.5);

const ownershipSingle = structuredClone(sample);
ownershipSingle.household.type = 'single';
ownershipSingle.household.modelEndAge = ownershipSingle.people[0].age;
ownershipSingle.people[0].super = 0;
ownershipSingle.people[0].salary = 0;
ownershipSingle.cash = { amount: 10000, interestPct: 0, owner: 'p0' };
ownershipSingle.savings = { amount: 20000, interestPct: 0, owner: 'p1' };
ownershipSingle.shareholdings = [{
  ...core.makeShareholding(0),
  id: 'joint-share',
  symbol: 'JOINT',
  owner: 'joint',
  quantity: 10,
  price: 1000,
  costBaseAud: 8000,
  saleYear: ownershipSingle.startYear + 20
}];
ownershipSingle.otherIncomes = [{
  ...core.makeOtherIncome(0),
  id: 'joint-income',
  label: 'Joint income',
  owner: 'joint',
  amount: 12000,
  taxable: false
}];
ownershipSingle.otherAssets = [{
  ...core.makeOtherAsset(0),
  id: 'p1-asset',
  label: 'Person 2 asset',
  owner: 'p1',
  amount: 500000,
  disposalYear: ownershipSingle.startYear + 20
}];
ownershipSingle.lumpSumWithdrawals = [];
ownershipSingle.household.includeAgePension = false;
ownershipSingle.household.targetAfterTax = 0;
ownershipSingle.household.annualBudget = 0;

const ownershipSingleRow = core.projectScenario(ownershipSingle).rows[0];
check('single projection applies p0, p1 and joint inclusion',
  ownershipSingleRow.cash === 10000 &&
  ownershipSingleRow.savings === 0 &&
  ownershipSingleRow.shares === 5000 &&
  ownershipSingleRow.otherAssets === 0 &&
  ownershipSingleRow.otherIncomeByPerson[0] === 6000);
```

- [ ] **Step 2: Run the suite and verify ownership failures**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: helper is absent and Person 2/joint values use couple treatment.

- [ ] **Step 3: Add pure inclusion and scaling helpers**

Add near `ownerWeights`:

```js
function singleHouseholdInclusion(owner) {
  if (owner === 'p0') return 1;
  if (owner === 'joint') return 0.5;
  return 0;
}

function householdInclusion(scenario, owner) {
  return isSingleHousehold(scenario)
    ? singleHouseholdInclusion(owner)
    : 1;
}

```

Export both `singleHouseholdInclusion` and `householdInclusion` for direct
tests and UI KPI calculations.

- [ ] **Step 4: Apply inclusion at runtime state boundaries**

In `makeProjectionState`, derive active cash, savings, holdings and Other Assets:

```js
const cashFraction = householdInclusion(scenario, scenario.cash.owner);
const savingsFraction =
  householdInclusion(scenario, scenario.savings.owner);
const activeHoldings = scenario.shareholdings
  .flatMap(holding => {
    const fraction = householdInclusion(scenario, holding.owner);
    return fraction === 0 ? [] : [{
      ...holding,
      owner: isSingleHousehold(scenario) ? 'p0' : holding.owner,
      quantity: holding.quantity * fraction,
      costBaseAud: holding.costBaseAud * fraction,
      sold: false
    }];
  });
const activeOtherAssets = (scenario.otherAssets ?? [])
  .flatMap(asset => {
    const fraction = householdInclusion(scenario, asset.owner);
    return fraction === 0 ? [] : [{
      ...asset,
      owner: isSingleHousehold(scenario) ? 'p0' : asset.owner,
      value: asset.amount * otherItemFx(asset) * fraction,
      sold: false
    }];
  });
```

Use `cashFraction === 0 ? 0 : scenario.cash.amount * cashFraction` and
`savingsFraction === 0 ? 0 : scenario.savings.amount * savingsFraction` in
state. The conditional must precede numeric multiplication so malformed
inactive Person 2 values cannot produce `NaN`.

For a single household, set the runtime cash and savings owners to `p0` after
applying the inclusion fraction:

```js
ownership: {
  cash: isSingleHousehold(scenario) ? 'p0' : scenario.cash.owner,
  savings: isSingleHousehold(scenario) ? 'p0' : scenario.savings.owner
}
```

This ensures the included half of a Joint item is taxed only to Person 1.
Runtime joint shareholdings also use owner `p0`, as shown above, so dividends,
franking and later CGT are not split a second time.

In Other Income flow calculation, determine inclusion before reading numeric
fields. Return without calculating the record when the fraction is zero.
Single joint income then allocates its included 50% entirely to Person 1:

```js
const inclusion = householdInclusion(scenario, item.owner);
if (inclusion === 0) return;
const nominal = item.amount * otherItemFx(item) * inflationFactor;
const includedNominal = nominal * inclusion;
const effectiveOwner = isSingleHousehold(scenario) ? 'p0' : item.owner;
const allocated = allocateOwnedAmount(includedNominal, effectiveOwner);
```

- [ ] **Step 5: Make validation ignore inactive values safely**

Keep owner validation active for every owned record. After a valid owner is established, skip the rest of that record when it is inactive:

```js
const inactiveForSingle = owner =>
  isSingleHousehold(scenario) && owner === 'p1';
```

For Person 2:

```js
scenario.people.forEach((person, index) => {
  if (isSingleHousehold(scenario) && index === 1) return;
  validatePerson(person, index, add);
});
```

Extract the existing per-person checks at lines 2573-2618 into
`validatePerson(person, index, add)` without changing their paths or messages.

For shares, Other Income and Other Assets:

```js
if (!VALID_OWNERS.has(item.owner)) {
  add(`${path}.owner`,
    'Owner must be Person 1, Person 2, or Joint 50/50.');
  return;
}
if (inactiveForSingle(item.owner)) return;
```

Add an Owner selector to Other Assets because schema 13 treated them only as
household-level values. The schema-14 migration supplies `joint`, and the same
owner validation used by Other Income applies to Other Assets.

For cash and savings, validate `owner` first and skip amount/rate validation when owner is `p1` in single mode.

- [ ] **Step 6: Add inactive-validation regression tests**

```js
const inactiveInvalid = structuredClone(sample);
inactiveInvalid.household.type = 'single';
inactiveInvalid.people[1].name = '';
inactiveInvalid.people[1].superAccessAge = NaN;
inactiveInvalid.otherIncomes = [{
  ...core.makeOtherIncome(0),
  id: 'hidden-invalid-income',
  label: '',
  owner: 'p1',
  amount: NaN
}];
check('inactive Person 2 values do not block single projection',
  core.validateScenario(inactiveInvalid).length === 0);
inactiveInvalid.household.type = 'couple';
check('restored Person 2 values validate in couple mode',
  core.validateScenario(inactiveInvalid).some(error =>
    error.path.startsWith('people.1.') ||
    error.path.startsWith('otherIncomes.0.')));
```

- [ ] **Step 7: Run the ownership and full deterministic suite**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: all ownership, validation and existing projection tests pass.

- [ ] **Step 8: Commit the ownership slice**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: exclude inactive household ownership"
```

### Task 4: Route single tax, pension, deeming and CSHC rules

**Files:**
- Modify: `retirement-simulator.html:1015-1082,1990-2528`
- Test: `tests/retirement-simulator.test.mjs:760-1132,1194-1386`

- [ ] **Step 1: Write failing integrated rule tests**

Create a one-year age-67 scenario:

```js
const singleRules = structuredClone(sample);
singleRules.household.type = 'single';
singleRules.people[0].age = 67;
singleRules.people[0].retireAge = 67;
singleRules.people[0].salary = 0;
singleRules.people[0].super = 0;
singleRules.people[1].age = 67;
singleRules.people[1].salary = 999999;
singleRules.people[1].super = 999999;
singleRules.cash = { amount: 0, interestPct: 0, owner: 'p0' };
singleRules.savings = { amount: 0, interestPct: 0, owner: 'p0' };
singleRules.shareholdings = [];
singleRules.otherIncomes = [];
singleRules.otherAssets = [];
singleRules.lumpSumWithdrawals = [];
singleRules.household.modelEndAge = 67;
singleRules.household.targetAfterTax = 0;
singleRules.household.annualBudget = 0;
singleRules.household.applyMinimumDrawdown = false;
singleRules.household.includeAgePension = true;
singleRules.assumptions.ukPensionsEnabled = false;

const singleRulesRow = core.projectScenario(singleRules).rows[0];
check('single rules apply from year zero',
  singleRulesRow.agePensionStatus === 'single' &&
  singleRulesRow.components.agePensionNet ===
    core.SERVICES_AUSTRALIA_2026.agePensionMaxSingleAnnual &&
  singleRulesRow.cshc.threshold ===
    core.SERVICES_AUSTRALIA_2026.cshcSingleThreshold &&
  singleRulesRow.taxLedger[0].totalTax.saptoSchedule === 'single' &&
  singleRulesRow.taxLedger[0].totalTax
    .medicareFamilyReductionNominal === 0);
check('single pension and tax allocate only to Person 1',
  singleRulesRow.agePensionByPerson[1] === 0 &&
  singleRulesRow.taxByPerson[1] === 0);
```

- [ ] **Step 2: Run the suite and verify couple-rule failures**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: year-zero row reports couple Age Pension/CSHC/tax status.

- [ ] **Step 3: Route rule status through the explicit helper**

Replace survivor-only ternaries with:

```js
const ruleStatus = householdRuleStatus(scenario, state.lifecycle);
const singleIndex = solePersonIndex(scenario, state.lifecycle);
```

Call Age Pension with `singleIndex`:

```js
const agePension = agePensionForHousehold({
  ages,
  alive: state.lifecycle.alive,
  survivorIndex: singleIndex,
  assets: assessableAssetsReal + otherAssetsReal,
  assessableIncome: agePensionIncomeReal,
  included: scenario.household.includeAgePension
});
```

Call household tax with `status: ruleStatus` and the existing alive array. Call CSHC with `status: ruleStatus`.

Replace every branch that means “one living person” with an explicit non-couple predicate:

```js
const onePersonHousehold =
  state.lifecycle.householdStatus !== 'couple';
```

Keep actual survivor-only branches, including inherited super and continuation percentages, restricted to:

```js
state.lifecycle.householdStatus === 'survivor'
```

- [ ] **Step 4: Add a survivor-equivalence test without survivor spending**

```js
const equivalentSingleRate = core.agePensionForHousehold({
  enabled: true,
  status: 'single',
  ages: [67, 0],
  alive: [true, false],
  survivorIndex: 0,
  assets: 0,
  assessableIncome: 0
});
check('year-zero single uses the established survivor rule result',
  singleRulesRow.components.agePensionNet ===
    equivalentSingleRate.household &&
  singleRulesRow.target === singleRules.household.targetAfterTax &&
  singleRulesRow.budget === singleRules.household.annualBudget);
```

- [ ] **Step 5: Run rule and survivor regressions**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: single integrated rules pass; existing age-gap, SAPTO, Medicare and survivor tests remain green.

- [ ] **Step 6: Commit the rule-routing slice**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: apply single household rules from year zero"
```

### Task 5: Filter drawdown and named Person 2 sources

**Files:**
- Modify: `retirement-simulator.html:1783-1889,1990-2055,2420-2460,2793-2830`
- Test: `tests/retirement-simulator.test.mjs:1570-1858`

- [ ] **Step 1: Write failing drawdown tests**

```js
check('single drawdown removes Person 2 super and empty tiers',
  JSON.stringify(core.effectiveDrawdownPriority({
    household: {
      type: 'single',
      drawdownPriority: [
        [{ source: 'p1Super', weight: 1 }],
        [
          { source: 'p0Super', weight: 0.5 },
          { source: 'p1Super', weight: 0.5 }
        ],
        [{ source: 'savings', weight: 1 }]
      ]
    }
  })) === JSON.stringify([
    [{ source: 'p0Super', weight: 1 }],
    [{ source: 'savings', weight: 1 }]
  ]));

const unusableSinglePriority = structuredClone(sample);
unusableSinglePriority.household.type = 'single';
unusableSinglePriority.household.drawdownPriority = [
  [{ source: 'p1Super', weight: 1 }]
];
check('single household requires an active drawdown source',
  core.validateScenario(unusableSinglePriority).some(error =>
    error.path === 'household.drawdownPriority'));
```

- [ ] **Step 2: Run the suite and verify failures**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: `effectiveDrawdownPriority` is missing and unusable Person 2-only priority validates.

- [ ] **Step 3: Implement effective priority normalisation**

```js
function effectiveDrawdownPriority(scenario) {
  if (!isSingleHousehold(scenario)) {
    return scenario.household.drawdownPriority.map(tier =>
      tier.map(entry => ({ ...entry })));
  }
  return scenario.household.drawdownPriority
    .map(tier => tier.filter(entry => entry.source !== 'p1Super'))
    .filter(tier => tier.length)
    .map(tier => {
      const total = tier.reduce((sum, entry) => sum + entry.weight, 0);
      return tier.map(entry => ({
        ...entry,
        weight: entry.weight / total
      }));
    });
}
```

Export the helper. Calculate it once per projection year before normal drawdown and pass it to existing draw functions.

Use the same effective priority in lump-sum fallback. If a stored lump source is `p1Super` in single mode, pass `automatic` as the requested source:

```js
const requestedSource =
  isSingleHousehold(scenario) && item.source === 'p1Super'
    ? 'automatic'
    : item.source;
```

Validation calls `effectiveDrawdownPriority(scenario)` after structural validation and reports:

```js
add('household.drawdownPriority',
  'A single household needs at least one Person 1, cash, or savings drawdown source.');
```

- [ ] **Step 4: Run drawdown and lump-sum regressions**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: new priority tests and all existing lump-sum funding tests pass.

- [ ] **Step 5: Commit the drawdown slice**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: filter inactive single drawdown sources"
```

### Task 6: Add the single-household interface and hidden-data disclosure

**Files:**
- Modify: `retirement-simulator.html:250-420,3043-3609,4392-4469,4612-4787`
- Test: `tests/retirement-simulator.test.mjs:140-210,320-430`

- [ ] **Step 1: Write failing static interface tests**

```js
check('household type control is explicit',
  html.includes('Household type') &&
  html.includes('data-path="household.type"') &&
  html.includes('<option value="couple"') &&
  html.includes('<option value="single"'));
check('single interface uses active-person helpers',
  html.includes('activePeople(scenario)') &&
  html.includes('activeOwnedEntries(scenario'));
check('single interface discloses hidden Person 2 data',
  html.includes('Person 2 data retained but excluded') &&
  html.includes('50% included'));
check('new single-owned records default to Person 1',
  html.includes("isSingleScenario(currentScenario) ? 'p0'"));
```

- [ ] **Step 2: Run the suite and verify interface failures**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: the new control and active-rendering helpers are absent.

- [ ] **Step 3: Add UI filtering helpers**

In the UI script:

```js
function isSingleScenario(scenario) {
  return scenario.household.type === 'single';
}

function activePeople(scenario) {
  return isSingleScenario(scenario)
    ? [scenario.people[0]]
    : scenario.people;
}

function activeOwnedEntries(scenario, items) {
  return items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) =>
      !isSingleScenario(scenario) || item.owner !== 'p1');
}

function hiddenPerson2Count(scenario) {
  if (!isSingleScenario(scenario)) return 0;
  return [
    scenario.cash,
    scenario.savings,
    ...(scenario.shareholdings ?? []),
    ...(scenario.otherIncomes ?? []),
    ...(scenario.otherAssets ?? [])
  ].filter(item => item?.owner === 'p1').length;
}
```

Render the household type selector before household money fields:

```js
<label><span class="k">Household type</span>
  <select data-path="household.type">
    <option value="couple"${household.type === 'couple' ? ' selected' : ''}>Couple</option>
    <option value="single"${household.type === 'single' ? ' selected' : ''}>Single</option>
  </select>
</label>
<p id="singleExcludedNotice" class="sub" hidden></p>
```

- [ ] **Step 4: Filter personal sections and first-death controls**

Call personal renderers with the scenario rather than a bare people array:

```js
function renderPeople(scenario) {
  $('#peopleFields').innerHTML =
    activePeople(scenario).map(personFields).join('');
}
```

Apply the same active-person list to return assumptions and UK/defined-benefit
pensions. Extract the current first-death markup into:

```js
function firstDeathFields(household, people) {
  const firstDeath = household.firstDeath;
  const deathPersonIndex =
    firstDeath.deceasedPerson === 'p1' ? 1 : 0;
  return `<h4>First-death scenario</h4>
    <label><span class="k">Model first death</span>
      <input type="checkbox"
        data-path="household.firstDeath.enabled"
        ${firstDeath.enabled ? 'checked' : ''}>
    </label>
    <div class="survivor-fields"${firstDeath.enabled ? '' : ' hidden'}>
      <label><span class="k">Person who dies first</span>
        <select data-path="household.firstDeath.deceasedPerson">
          <option value="p0"${firstDeath.deceasedPerson === 'p0' ? ' selected' : ''}>${escapeHtml(people[0].name)}</option>
          <option value="p1"${firstDeath.deceasedPerson === 'p1' ? ' selected' : ''}>${escapeHtml(people[1].name)}</option>
        </select>
      </label>
      ${numberField('Death age',
        'household.firstDeath.deathAge',
        firstDeath.deathAge,
        `min="${people[deathPersonIndex].age + 1}" max="${household.modelEndAge}" step="1"`)}
      ${numberField('Survivor Preferred Income %',
        'household.firstDeath.survivorPreferredPct',
        firstDeath.survivorPreferredPct,
        'min="0" max="100" step="5"')}
      ${numberField('Survivor Essential Budget %',
        'household.firstDeath.survivorEssentialPct',
        firstDeath.survivorEssentialPct,
        'min="0" max="100" step="5"')}
      <p class="sub">The transition occurs at the start of the selected
        year. Assets transfer immediately and survivor income rules apply
        from that row.</p>
    </div>`;
}
```

Render it with
`${household.type === 'single' ? '' : firstDeathFields(household, people)}`.
Do not delete or overwrite `household.firstDeath`.

- [ ] **Step 5: Filter owned editors and constrain new defaults**

Use active owned lists for shares, Other Income and Other Assets. Add
`${ownerField('Owner', `${path}.owner`, item.owner, scenario.people)}` to the
Other Asset editor beside its currency/value controls. Joint items remain
rendered and add:

```js
${isSingleScenario(scenario) && item.owner === 'joint'
  ? '<p class="sub">50% included for Person 1 in Single mode.</p>'
  : ''}
```

Preserve original array indexes when filtering:

```js
activeOwnedEntries(scenario, scenario.otherIncomes ?? [])
  .map(({ item, index }) => otherIncomeFields(item, index, scenario))
  .join('');
```

Apply the same `{ item, index }` pattern to shares and Other Assets so every
`data-path` and remove button still addresses the stored record.

For fixed cash and savings, render an owned fieldset only when its stored owner
is active:

```js
function fixedOwnedFields(label, key, item, scenario) {
  if (isSingleScenario(scenario) && item.owner === 'p1') return '';
  const jointNote =
    isSingleScenario(scenario) && item.owner === 'joint'
      ? '<p class="sub">50% included for Person 1 in Single mode.</p>'
      : '';
  return `<fieldset>
    <legend>${escapeHtml(label)}</legend>
    ${moneyField('Amount', `${key}.amount`, item.amount)}
    ${numberField('Interest rate %', `${key}.interestPct`,
      item.interestPct, 'min="0" max="30" step="0.1"')}
    ${ownerField('Owner', `${key}.owner`, item.owner,
      scenario.people, scenario)}
    ${jointNote}
  </fieldset>`;
}
```

`renderCashAndSavings` joins the Cash and Savings fieldsets returned by this
helper. Excluded fixed items remain counted by `hiddenPerson2Count`.

Render an excluded-data notice:

```js
const hiddenCount = hiddenPerson2Count(scenario);
$('#singleExcludedNotice').hidden = hiddenCount === 0;
$('#singleExcludedNotice').textContent = hiddenCount
  ? `Person 2 data retained but excluded: ${hiddenCount} owned item${hiddenCount === 1 ? '' : 's'}.`
  : '';
```

Update the owner helpers and every caller to pass the scenario:

```js
function ownerOptions(selected, people, scenario) {
  const options = [
    ['p0', people[0].name],
    ['p1', people[1].name],
    ['joint', 'Joint 50/50']
  ].filter(([value]) =>
    !isSingleScenario(scenario) || value !== 'p1');
  return options.map(([value, label]) =>
    `<option value="${value}"${value === selected ? ' selected' : ''}>${escapeHtml(label)}</option>`
  ).join('');
}

function ownerField(label, path, selected, people, scenario) {
  return `<label><span class="k">${escapeHtml(label)}</span>
    <select data-path="${path}">
      ${ownerOptions(selected, people, scenario)}
    </select>
  </label>`;
}
```

In single mode, drawdown and lump source option helpers omit `p1Super`.
Render drawdown tiers with their original stored indexes so filtering never
redirects an edit to another tier:

```js
function activeTierEntries(scenario, tier) {
  return tier
    .map((entry, entryIndex) => ({ entry, entryIndex }))
    .filter(({ entry }) =>
      !isSingleScenario(scenario) || entry.source !== 'p1Super');
}
```

Omit Person 2-only tiers from the displayed list, but pass the original
`tierIndex` and `entryIndex` into every `data-path` and move/remove button.
When a single-mode split toggle is enabled on a tier whose hidden second entry
is `p1Super`, replace that inactive entry with the first unused source from
`p0Super`, `savings`, and `cash`. When disabled, retain only the first active
entry. These are intentional edits; merely changing household type does not
touch the stored tier array.

After creating a new share, income or asset:

```js
const owner = isSingleScenario(currentScenario) ? 'p0' : 'joint';
```

Assign that owner to the new record before rendering.

- [ ] **Step 6: Make household-type changes rerender immediately**

The existing delegated change handler already applies `data-path` updates. Add a targeted branch after updating the scenario:

```js
if (path === 'household.type') {
  scheduleSave(currentScenario);
  renderScenario(currentScenario);
  return;
}
```

This preserves the stored scenario, rerenders all dependent sections and recalculates through the existing `renderScenario` flow.

Set the household horizon label with the active status:

```js
const horizonLabel = household.type === 'single'
  ? 'Model to Person 1 age'
  : firstDeath.enabled
    ? 'Model to survivor age'
    : 'Model to Person 1 age';
```

- [ ] **Step 7: Run deterministic tests**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: all static interface assertions and engine tests pass.

- [ ] **Step 8: Commit the interface slice**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: add single household controls"
```

### Task 7: Remove Person 2 from single reports and exports

**Files:**
- Modify: `retirement-simulator.html:2863-3070,3718-3755,3950-4258,4311-4440`
- Test: `tests/retirement-simulator.test.mjs:432-468,1194-1395`

- [ ] **Step 1: Write failing report-shape helper tests**

Expose a pure helper and test its contract:

```js
check('single output columns contain only Person 1',
  JSON.stringify(core.outputPersonIndexes({
    household: { type: 'single' }
  })) === JSON.stringify([0]));
check('couple output columns retain both people',
  JSON.stringify(core.outputPersonIndexes({
    household: { type: 'couple' }
  })) === JSON.stringify([0, 1]));
check('renderers use conditional output indexes',
  html.includes('outputPersonIndexes(scenario)') &&
  html.includes('const personIndexes ='));
```

- [ ] **Step 2: Run the suite and verify report failures**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: `outputPersonIndexes` is absent.

- [ ] **Step 3: Add and export the output-index helper**

In the core:

```js
function outputPersonIndexes(scenario) {
  return isSingleHousehold(scenario) ? [0] : [0, 1];
}
```

Export it for tests.

- [ ] **Step 4: Apply conditional indexes to every report**

At the start of the projection table, balance chart, balance tooltip and assumptions rendering:

```js
const personIndexes = core.outputPersonIndexes(scenario);
```

Build age/super headings and cells with `flatMap` or `map` over those indexes rather than unconditional `[0]` and `[1]` references. Build balance-chart super series as:

```js
const personSeries = personIndexes.map((index, colourIndex) => [
  'superBalances',
  index,
  colourIndex === 0 ? '#67D4C0' : '#6DB7FF',
  `${scenario.people[index].name} super`
]);
```

Filter income segments so `p1Super` is absent when single. In tooltips, render only active person rows. In assumptions, map only active indexes and omit the first-death sentence when single.

Because CSV is generated from the rendered table through `visibleTableMatrix`, conditional table headings and cells automatically produce the required single-person CSV shape. Add no separate CSV schema.

- [ ] **Step 5: Correct active-assets KPIs**

Replace the raw sum of both people and all stored assets with active runtime-compatible calculations:

```js
const assetsNow =
  personIndexes.reduce((sum, index) =>
    sum + (scenario.people[index].super || 0), 0) +
  includedOwnedValue(scenario.cash.owner,
    () => scenario.cash.amount) +
  includedOwnedValue(scenario.savings.owner,
    () => scenario.savings.amount) +
  scenario.shareholdings.reduce((sum, holding) =>
    sum + includedOwnedValue(holding.owner,
      () => core.shareValueAud(holding)), 0) +
  scenario.otherAssets.reduce((sum, asset) =>
    sum + includedOwnedValue(asset.owner,
      () => asset.amount * core.otherItemFx(asset)), 0);
```

Use the `householdInclusion` helper exported in Task 3 consistently in
implementation and tests. Define the UI-local lazy evaluator before
`assetsNow` so excluded values are not read:

```js
const includedOwnedValue = (owner, calculate) => {
  const fraction = core.householdInclusion(scenario, owner);
  return fraction === 0 ? 0 : calculate() * fraction;
};
```

- [ ] **Step 6: Add source-level output assertions**

```js
check('single table headings are conditional',
  html.includes('personIndexes.map(index => people[index].name)') &&
  html.includes('personIndexes.map(index => `${people[index].name} super`)'));
check('single balance tooltip is conditional',
  html.includes('personIndexes.map(index =>') &&
  html.includes('superBalances[index]'));
check('CSV remains derived from the visible conditional table',
  html.includes('visibleTableMatrix(table)'));
```

- [ ] **Step 7: Run the deterministic suite**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: all reporting, chart, tooltip, CSV and existing output tests pass.

- [ ] **Step 8: Commit the reporting slice**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: tailor single household reporting"
```

### Task 8: Document, verify in-browser and close implementation hygiene

**Files:**
- Modify: `README.md`
- Modify: `docs/MODEL-METHODOLOGY.md`
- Modify: `docs/TESTING.md`
- Modify: `CHANGELOG.md`
- Modify: `retirement-simulator.html:340-420,417-430,4392-4449`
- Test: `tests/retirement-simulator.test.mjs:35-140,267-320`

- [ ] **Step 1: Write failing documentation assertions**

```js
check('methodology documents year-zero single status',
  methodology.includes('year-zero single household') &&
  methodology.includes('Person 2-owned items are excluded') &&
  methodology.includes('Joint 50/50 items contribute only Person 1'));
check('testing guide covers single-household browser checks',
  testingGuide.includes('Couple to Single to Couple') &&
  testingGuide.includes('Person 2 data retained but excluded'));
check('README states the deterministic-only boundary',
  readme.includes('single-person household') &&
  readme.includes('Monte Carlo') &&
  readme.includes('does not import deterministic schema 14'));
check('changelog records issue 36 without a release claim',
  changelog.includes('Issue #36') &&
  changelog.includes('single-household'));
```

- [ ] **Step 2: Run the suite and verify documentation failures**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: the new documentation assertions fail.

- [ ] **Step 3: Update public documentation and in-app assumptions**

Add concise text covering:

```text
Single is a year-zero household status, not a simulated death. Person 2
details remain stored but inactive. Person 2-owned items are excluded;
Joint 50/50 items contribute only Person 1's half. Returning to Couple
restores the retained inputs and ownership settings.
```

State explicitly that the experimental Monte Carlo tool does not import deterministic schema 14 and is outside issue #36.

Add an Unreleased changelog entry:

```markdown
### Unreleased

- Issue #36: add deterministic single-household modelling with retained
  Person 2 data, excluded Person 2 ownership, and 50% inclusion of Joint
  50/50 items.
```

- [ ] **Step 4: Run automated verification**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
```

Expected: all deterministic tests pass and `git diff --check` produces no output.

Run the Monte Carlo suite only as a baseline observation:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: no new schema or single-household work is present in Monte Carlo. If the existing zero-volatility 2031 parity assertion still fails with the same tax/Age Pension difference, record it as pre-existing and do not change Monte Carlo under this issue.

- [ ] **Step 5: Perform browser verification**

Open `retirement-simulator.html` and verify:

1. Couple mode loads the existing sample and recalculates.
2. Changing to Single immediately removes Person 2 personal, return, pension and first-death controls.
3. The excluded-data notice appears for Person 2-owned sample data.
4. Joint records show `50% included`.
5. Single charts, table, tooltips and exported CSV contain no Person 2 columns or series.
6. Single Age Pension/CSHC status uses single thresholds from the first row.
7. Changing back to Couple restores every Person 2 value and the prior first-death/drawdown settings.
8. Dark and light themes remain legible.
9. Desktop and iPad-width layouts do not overflow or hide the household selector.
10. The browser console remains free of errors.

- [ ] **Step 6: Commit documentation and verification coverage**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs README.md docs/MODEL-METHODOLOGY.md docs/TESTING.md CHANGELOG.md
git commit -m "docs: explain deterministic single households"
```

- [ ] **Step 7: Final branch audit**

Run:

```powershell
git status --short --branch
git log --oneline --decorate main..HEAD
git diff --stat main...HEAD
git diff --check main...HEAD
```

Expected:

- working tree clean;
- the design, plan and implementation commits are present;
- only issue #36 deterministic files are changed;
- no whitespace errors.

Do not close issue #36, push, create a pull request, tag or release without separate user approval.
