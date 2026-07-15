import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(
  new URL('../retirement-monte-carlo-v0.7.html', import.meta.url),
  'utf8'
);
const deterministicHtml = await readFile(
  new URL('../retirement-simulator.html', import.meta.url),
  'utf8'
);
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const methodology = await readFile(
  new URL('../docs/MODEL-METHODOLOGY.md', import.meta.url), 'utf8');
const testingGuide = await readFile(
  new URL('../docs/TESTING.md', import.meta.url), 'utf8');
const changelog = await readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8');

assert.match(
  html,
  /Content-Security-Policy[^>]+default-src 'none'/,
  'Monte Carlo should declare a CSP'
);
assert.match(
  html,
  /connect-src https:\/\/api\.frankfurter\.app https:\/\/stooq\.com/,
  'Monte Carlo CSP should allow only its declared quote and FX services'
);
assert.ok(
  html.includes('Defined Benefit/UK Pensions'),
  'Australian defined-benefit wording should lead the combined pension section'
);
assert.match(
  html,
  /id="exportScenario"[^>]*>Export JSON<\/button>\s*<button[^>]+id="themeToggle"/,
  'Monte Carlo theme toggle should sit immediately after Export JSON'
);
assert.ok(
  html.includes('retirement-simulator-theme'),
  'Monte Carlo should share the locally persisted theme preference'
);
assert.match(html, /Family Retirement Monte Carlo Report v0\.7/,
  'Monte Carlo title should identify v0.7');
assert.match(html, /<span class="version">v0\.7<\/span>/,
  'Monte Carlo heading should identify v0.7');
assert.ok(readme.includes('schema 5') && readme.includes('salary-growth parity'));
assert.ok(methodology.includes('above-inflation salary growth') &&
  methodology.includes('remaining import guards'));
assert.ok(testingGuide.includes('schema-4 to schema-5 migration') &&
  testingGuide.includes('salary-growth parity'));
assert.ok(changelog.includes('Monte Carlo schema 5') &&
  changelog.includes('salary-growth parity'));
assert.ok(readme.includes('Other-income parity') &&
  readme.includes('Other assets, pension, lump-sum and share-return guards'));
assert.ok(methodology.includes('person-level taxable or non-taxable ledgers') &&
  methodology.includes('survivor continuation percentage'));
assert.ok(testingGuide.includes('Other-income ownership, tax, Age Pension') &&
  testingGuide.includes('survivor parity'));
assert.ok(changelog.includes('Other-income parity') &&
  changelog.includes('second issue #1'));
assert.ok(readme.includes('experimental') && html.includes('experimental'),
  'salary parity must not remove the experimental label');
assert.ok(
  html.includes("const STORAGE_KEY = 'family-retirement-simulator:v0.7:scenario'") &&
  html.includes("'family-retirement-simulator:v0.6:scenario'"),
  'Monte Carlo v0.7 should retain the v0.6 saved-scenario fallback'
);
assert.ok(
  html.includes('applied at the start of the same projection') &&
  html.includes('year in every Monte Carlo path. Probabilistic mortality is not modelled.') &&
  html.includes('single Age Pension') &&
  html.includes('rules apply immediately from the transition year.'),
  'Monte Carlo assumptions should disclose the fixed survivor-state boundary'
);

const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(
  match => match[1]
);

const context = {
  console,
  structuredClone,
  Math,
  Date,
  globalThis: {}
};
context.globalThis = context;

vm.createContext(context);
const simulatorCoreScript = scripts.find(script =>
  script.includes('globalThis.RetirementSimulatorCore =')
);
assert.ok(simulatorCoreScript, 'embedded deterministic core should exist');
vm.runInContext(simulatorCoreScript, context);
const simulator = context.RetirementSimulatorCore;
const plain = value => JSON.parse(JSON.stringify(value));
assert.equal(simulator.SCHEMA_VERSION, 5,
  'the v0.8 parity programme should use native schema 5');
const monteCarloDemo = simulator.makeSampleScenario();
assert.equal(monteCarloDemo.people[0].name, 'John');
assert.equal(monteCarloDemo.people[0].super, 220000);
assert.equal(monteCarloDemo.people[1].name, 'Jane');
assert.equal(monteCarloDemo.people[1].super, 165000);
assert.equal(monteCarloDemo.household.targetAfterTax, 80000);
assert.equal(monteCarloDemo.household.annualBudget, 70000);
assert.equal(monteCarloDemo.assumptions.inflationMode, 'manual');
assert.equal(monteCarloDemo.assumptions.manualInflationPct, 3);
assert.equal(monteCarloDemo.schemaVersion, 5);
assert.ok(monteCarloDemo.people.every(person => person.salaryGrowthPct === 0));
assert.deepEqual(plain(monteCarloDemo.otherIncomes), []);
assert.deepEqual(plain(monteCarloDemo.otherAssets), []);
assert.deepEqual(plain(monteCarloDemo.lumpSumWithdrawals), []);
assert.ok(monteCarloDemo.people.every(person =>
  !('ukPrivateAmountGbp' in person) &&
  !('ukPrivateTakeAge' in person) &&
  !('ukPrivateType' in person)),
'native schema 5 should not expose obsolete private-pension fields');
assert.ok(monteCarloDemo.people.every(person =>
  ['frozen', 'cpi'].includes(person.ukStateIndexation)));

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

const nativeSchema4 = structuredClone(monteCarloDemo);
nativeSchema4.schemaVersion = 4;
nativeSchema4.people.forEach(person => { delete person.salaryGrowthPct; });
delete nativeSchema4.otherIncomes;
delete nativeSchema4.otherAssets;
delete nativeSchema4.lumpSumWithdrawals;
delete nativeSchema4.assumptions.ukPensionsEnabled;
nativeSchema4.people[0].ukPrivateAmountGbp = 5000;
nativeSchema4.people[0].ukPrivateTakeAge = 67;
nativeSchema4.people[0].ukPrivateType = 'annuity';
nativeSchema4.people[1].ukPrivateAmountGbp = 20000;
nativeSchema4.people[1].ukPrivateTakeAge = 66;
nativeSchema4.people[1].ukPrivateType = 'lump';
nativeSchema4.shareholdings = [{
  id: 'legacy-share', symbol: 'BHP', quantity: 10,
  quoteCurrency: 'AUD', price: 40, fxToAud: 1,
  owner: 'joint', costBaseAud: 300, cgtDiscountEligible: true,
  saleYear: 2035, saleMonth: 1
}];
const migratedSchema5 = simulator.migrateScenario(nativeSchema4);
assert.equal(migratedSchema5.schemaVersion, 5);
assert.ok(migratedSchema5.people.every(person => person.salaryGrowthPct === 0));
assert.deepEqual(plain(migratedSchema5.lumpSumWithdrawals), []);
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

const guardedSchema5 = structuredClone(migratedSchema5);
guardedSchema5.otherIncomes = [];
guardedSchema5.otherAssets = [];
for (const [label, mutate, pattern] of [
  ['Other asset', scenario => {
    scenario.otherAssets = [{ label: 'Property', amount: 1000 }];
  }, /cannot yet model populated Other assets/],
  ['lump sum', scenario => {
    scenario.lumpSumWithdrawals = [{ enabled: true }];
  }, /cannot yet model lump-sum withdrawals/],
  ['share returns', scenario => {
    scenario.shareholdings = [{
      ...migratedSchema5.shareholdings[0], priceGrowthPct: 1
    }];
  }, /cannot yet model v1\.06 share price growth, dividends or franking/]
]) {
  const nativeUnsupported = structuredClone(guardedSchema5);
  mutate(nativeUnsupported);
  assert.throws(
    () => simulator.importScenario(JSON.stringify(nativeUnsupported)),
    pattern,
    `native schema 5 ${label} must remain explicitly guarded`
  );
}

const nativeBelowMinimumSuperAccess = structuredClone(monteCarloDemo);
nativeBelowMinimumSuperAccess.people[0].superAccessAge = 59;
const nativeBelowMinimumError = simulator.validateScenario(nativeBelowMinimumSuperAccess)
  .find(error => error.path === 'people.0.superAccessAge');
assert.equal(nativeBelowMinimumError?.message,
  'Super access age must be 60 or older because this simulator does not model taxation of withdrawals before age 60.');

const nativeMinimumSuperAccess = structuredClone(monteCarloDemo);
nativeMinimumSuperAccess.people[0].superAccessAge = 60;
assert.ok(!simulator.validateScenario(nativeMinimumSuperAccess)
  .some(error => error.path === 'people.0.superAccessAge'));

assert.ok(html.includes(
  "numberField('Super access age', `${path}.superAccessAge`, person.superAccessAge, 'min=\"60\" max=\"120\"')"));
assert.ok(html.includes(
  'The simulator treats super withdrawals as tax-free and does not model the additional tax rules that may apply before age 60.'));
assert.ok(html.includes("numberField('Salary growth above inflation %'"));
assert.ok(html.includes('salaryGrowthPct ?? 0'));
assert.ok(html.includes('<b>Salary growth above inflation:</b>'));
for (const contract of [
  'id="addOtherIncome"',
  'id="otherIncomeList"',
  'data-path="${path}.label"',
  'data-path="${path}.currency"',
  'data-path="${path}.fxToAud"',
  "moneyField('Amount per year'",
  'data-path="${path}.taxable"',
  'data-path="${path}.owner"',
  'Paid to survivor %',
  'class="remove-other-income"',
  '<b>Other income:</b>',
  'CPI-indexed and included in the Age Pension income assessment'
]) {
  assert.ok(html.includes(contract), `missing Other income UI contract: ${contract}`);
}

const v1Scenario = simulator.makeSampleScenario();
v1Scenario.schemaVersion = 6;
v1Scenario.otherIncomes = [];
v1Scenario.otherAssets = [];
v1Scenario.assumptions.ukPensionsEnabled = false;
v1Scenario.people = v1Scenario.people.map(person => {
  const { ukPrivateAmountGbp, ukPrivateTakeAge, ukPrivateType, ...rest } = person;
  return rest;
});
const adaptedV1Scenario = simulator.importScenario(JSON.stringify(v1Scenario));
assert.equal(adaptedV1Scenario.schemaVersion, 5,
  'v1.00 schema should adapt to the experimental engine schema');
assert.ok(adaptedV1Scenario.people.every(person =>
  !('ukPrivateAmountGbp' in person) &&
  !('ukPrivateTakeAge' in person) &&
  !('ukPrivateType' in person)),
  'deterministic adaptation should remove obsolete private-pension fields');

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

const activeSchema9 = structuredClone(v1Scenario);
activeSchema9.schemaVersion = 9;
activeSchema9.lumpSumWithdrawals = [
  { id: 'test-lump', amount: 100000, reason: 'Holiday', month: 6, year: 2032, source: 'automatic', enabled: true }
];
assert.throws(
  () => simulator.importScenario(JSON.stringify(activeSchema9)),
  /cannot yet model lump-sum withdrawals/,
  'schema 9 active lump sums should remain explicitly unsupported'
);
const disabledSchema9 = structuredClone(activeSchema9);
disabledSchema9.lumpSumWithdrawals[0].enabled = false;
const adaptedSchema9 = simulator.importScenario(JSON.stringify(disabledSchema9));
assert.equal(adaptedSchema9.schemaVersion, 5);
assert.equal(adaptedSchema9.lumpSumWithdrawals[0].enabled, false,
  'schema 9 disabled lump sums should survive native schema adaptation');

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

const activeSchema11 = structuredClone(v1Scenario);
activeSchema11.schemaVersion = 11;
activeSchema11.people.forEach(person => { person.salaryGrowthPct = 0; });
activeSchema11.shareholdings = [{
  id: 'growth-share', symbol: 'BHP', quantity: 100,
  quoteCurrency: 'AUD', quoteMarket: 'manual', price: 40, fxToAud: 1,
  owner: 'joint', costBaseAud: 3000, cgtDiscountEligible: true,
  saleYear: activeSchema11.startYear + 10, saleMonth: 1,
  priceGrowthPct: 3, dividendYieldPct: 4, frankedPct: 100,
  companyTaxRatePct: 30, frankingEligible: true
}];
assert.throws(
  () => simulator.importScenario(JSON.stringify(activeSchema11)),
  /cannot yet model v1\.06 share price growth, dividends or franking/i);

const inertSchema11 = structuredClone(activeSchema11);
Object.assign(inertSchema11.shareholdings[0], {
  priceGrowthPct: 0, dividendYieldPct: 0, frankedPct: 0,
  companyTaxRatePct: 30, frankingEligible: false
});
const adaptedSchema11 = simulator.importScenario(JSON.stringify(inertSchema11));
assert.equal(adaptedSchema11.schemaVersion, 5);
for (const key of ['priceGrowthPct', 'dividendYieldPct', 'frankedPct',
  'companyTaxRatePct', 'frankingEligible']) {
  assert.ok(key in adaptedSchema11.shareholdings[0], `${key} should be preserved`);
}

const supportedSchema12 = structuredClone(inertSchema11);
supportedSchema12.schemaVersion = 12;
supportedSchema12.otherIncomes = [];
supportedSchema12.otherAssets = [];
supportedSchema12.lumpSumWithdrawals = [];
supportedSchema12.household.firstDeath = {
  enabled: true,
  deceasedPerson: 'p0',
  deathAge: 65,
  survivorPreferredPct: 70,
  survivorEssentialPct: 70
};
supportedSchema12.people.forEach(person => {
  person.ukStateSurvivorPct = 0;
});
const adaptedSchema12 = simulator.importScenario(JSON.stringify(supportedSchema12));
assert.equal(adaptedSchema12.schemaVersion, 5);
assert.deepEqual(plain(adaptedSchema12.household.firstDeath),
  supportedSchema12.household.firstDeath,
  'schema 12 should retain supported first-death settings');

const definedBenefitInput = structuredClone(supportedSchema12);
definedBenefitInput.assumptions.ukPensionsEnabled = true;
definedBenefitInput.assumptions.gbpAud = 1;
definedBenefitInput.assumptions.uppPct = 0;
Object.assign(definedBenefitInput.people[0], {
  ukStateAnnualGbp: 24000, ukStateStartAge: 65,
  ukStateIndexation: 'cpi', ukStateSurvivorPct: 60
});
const adaptedDefinedBenefit = simulator.importScenario(
  JSON.stringify(definedBenefitInput));
assert.deepEqual(
  plain({
    assumptions: adaptedDefinedBenefit.assumptions,
    pension: adaptedDefinedBenefit.people[0]
  }),
  plain({
    assumptions: definedBenefitInput.assumptions,
    pension: definedBenefitInput.people[0]
  }),
  'Defined Benefit fields should survive deterministic adaptation'
);

const ukPensionInput = structuredClone(supportedSchema12);
ukPensionInput.assumptions.ukPensionsEnabled = true;
ukPensionInput.assumptions.gbpAud = 1.95;
ukPensionInput.assumptions.uppPct = 8;
Object.assign(ukPensionInput.people[0], {
  ukStateAnnualGbp: 12000, ukStateStartAge: 67,
  ukStateIndexation: 'frozen', ukStateSurvivorPct: 50
});
const adaptedUkPension = simulator.importScenario(JSON.stringify(ukPensionInput));
assert.equal(adaptedUkPension.assumptions.gbpAud, 1.95);
assert.equal(adaptedUkPension.assumptions.uppPct, 8);
assert.deepEqual(
  plain({
    annual: adaptedUkPension.people[0].ukStateAnnualGbp,
    startAge: adaptedUkPension.people[0].ukStateStartAge,
    indexation: adaptedUkPension.people[0].ukStateIndexation,
    survivorPct: adaptedUkPension.people[0].ukStateSurvivorPct
  }),
  { annual: 12000, startAge: 67, indexation: 'frozen', survivorPct: 50 }
);
const importedBelowMinimumSuperAccess = structuredClone(supportedSchema12);
importedBelowMinimumSuperAccess.people[0].superAccessAge = 59;
assert.throws(
  () => simulator.importScenario(JSON.stringify(importedBelowMinimumSuperAccess)),
  /Super access age must be 60 or older because this simulator does not model taxation of withdrawals before age 60\./,
  'deterministic imports must not bypass the age-60 boundary'
);

const importedMinimumSuperAccess = structuredClone(supportedSchema12);
importedMinimumSuperAccess.people[0].superAccessAge = 60;
assert.equal(
  simulator.importScenario(JSON.stringify(importedMinimumSuperAccess)).people[0].superAccessAge,
  60,
  'deterministic imports should retain the valid age-60 boundary'
);
for (const [label, mutate, pattern] of [
  ['Other asset', scenario => { scenario.otherAssets = [{ label: 'Property' }]; },
    /cannot yet model populated Other assets/],
  ['lump sum', scenario => { scenario.lumpSumWithdrawals = [{ enabled: true }]; },
    /cannot yet model lump-sum withdrawals/]
]) {
  const unsupported = structuredClone(supportedSchema12);
  mutate(unsupported);
  assert.throws(() => simulator.importScenario(JSON.stringify(unsupported)),
    pattern, `schema 12 active ${label} should remain explicitly unsupported`);
}

for (const [deceasedPerson, ages, survivorIndex] of [
  ['p0', [65, 63], 1],
  ['p1', [63, 65], 0]
]) {
  const scenario = structuredClone(adaptedSchema12);
  scenario.household.firstDeath.deceasedPerson = deceasedPerson;
  scenario.household.firstDeath.deathAge = 65;
  const state = simulator.makeProjectionState(scenario);
  const deceasedIndex = 1 - survivorIndex;
  const openingSuper = simulator.totalSuper(state, deceasedIndex);
  const transition = simulator.applyFirstDeathTransition({
    scenario, state, year: scenario.startYear + 2, ages
  });
  assert.equal(transition.survivorIndex, survivorIndex);
  assert.equal(state.lifecycle.householdStatus, 'survivor');
  assert.equal(simulator.totalSuper(state, deceasedIndex), 0);
  assert.equal(state.inheritedSuper.accum + state.inheritedSuper.retire,
    openingSuper);
  assert.equal(transition.preferredTargetPct, 70);
  assert.equal(transition.essentialTargetPct, 70);
  const repeat = simulator.applyFirstDeathTransition({
    scenario, state, year: scenario.startYear + 3,
    ages: ages.map(age => age + 1)
  });
  assert.equal(repeat.transitionedThisYear, false);
  assert.equal(state.inheritedSuper.accum + state.inheritedSuper.retire,
    openingSuper, 'first-death transition should be idempotent');
}

assert.equal(typeof simulator.agePensionForHousehold, 'function');
assert.deepEqual(plain(simulator.agePensionForHousehold({
  ages: [70, 68], alive: [true, false], survivorIndex: 0,
  assets: 0, assessableIncome: 0, included: true
})), {
  eligibleCount: 1,
  household: 1200.90 * 26,
  byPerson: [1200.90 * 26, 0],
  status: 'single'
});

const monteCarloCoreScript = scripts.find(script =>
  script.includes('RetirementMonteCarloCore')
);
assert.ok(monteCarloCoreScript, 'Monte Carlo core script should exist');
vm.runInContext(monteCarloCoreScript, context);

const core = context.RetirementMonteCarloCore;

const monteCarloPensionInputs = { assets: 0, assessableIncome: 0 };
const monteCarloFullPension = simulator.agePensionCouple(
  monteCarloPensionInputs);
assert.equal(typeof simulator.agePensionForAges, 'function');
assert.deepEqual(
  plain(simulator.agePensionForAges({
    ages: [67, 66], ...monteCarloPensionInputs, included: true
  })),
  {
    eligibleCount: 1,
    household: monteCarloFullPension / 2,
    byPerson: [monteCarloFullPension / 2, 0]
  }
);
assert.deepEqual(
  plain(simulator.agePensionForAges({
    ages: [66, 67], ...monteCarloPensionInputs, included: true
  }).byPerson),
  [0, monteCarloFullPension / 2]
);
assert.equal(
  simulator.agePensionForAges({
    ages: [66, 66], ...monteCarloPensionInputs, included: true
  }).household,
  0
);
assert.equal(
  simulator.agePensionForAges({
    ages: [67, 67], ...monteCarloPensionInputs, included: true
  }).household,
  monteCarloFullPension
);

function makeMonteCarloAgeGapScenario(ages = [66, 64]) {
  const scenario = structuredClone(monteCarloDemo);
  scenario.startYear = 2026;
  scenario.people.forEach((person, index) => {
    person.age = ages[index];
    person.retireAge = Math.max(person.retireAge, ages[index]);
    person.salary = 0;
    person.super = 0;
    person.ukStateAnnualGbp = 0;
  });
  scenario.cash.amount = 0;
  scenario.savings.amount = 0;
  scenario.shareholdings = [];
  scenario.lumpSumWithdrawals = [];
  scenario.household.targetAfterTax = 0;
  scenario.household.annualBudget = 0;
  scenario.household.modelEndAge = 70;
  scenario.household.applyMinimumDrawdown = false;
  scenario.assumptions.manualInflationPct = 0;
  return scenario;
}

const monteCarloAgeGapRows = simulator.projectScenario(
  makeMonteCarloAgeGapScenario()).rows;
assert.equal(monteCarloAgeGapRows[0].components.agePensionNet, 0);
assert.ok(Math.abs(
  monteCarloAgeGapRows[1].components.agePensionNet -
  monteCarloFullPension / 2) < 0.01);
assert.ok(Math.abs(
  monteCarloAgeGapRows[3].components.agePensionNet -
  monteCarloFullPension) < 0.01);

const monteCarloTaxedAgeGap = makeMonteCarloAgeGapScenario([67, 66]);
monteCarloTaxedAgeGap.people[0].retireAge = 68;
monteCarloTaxedAgeGap.people[0].salary = 40000;
monteCarloTaxedAgeGap.people[0].sgPct = 0;
const monteCarloExpectedPension = simulator.agePensionForAges({
  ages: [67, 66], assets: 0, assessableIncome: 40000, included: true
}).household;
const monteCarloExpectedTax = simulator.netTax({
  taxableIncome: 40000 + monteCarloExpectedPension,
  rebateIncome: 40000 + monteCarloExpectedPension,
  year: 2026,
  seniorEligible: true
});
const monteCarloTaxedRow = simulator.projectScenario(
  monteCarloTaxedAgeGap).rows[0];
assert.ok(Math.abs(monteCarloTaxedRow.tax - monteCarloExpectedTax) < 0.01,
  'one-eligible Monte Carlo pension should be taxed only to its recipient');

const fixedDeathScenario = structuredClone(adaptedSchema12);
fixedDeathScenario.assumptions.inflationMode = 'manual';
fixedDeathScenario.assumptions.manualInflationPct = 0;
fixedDeathScenario.household.includeAgePension = false;
fixedDeathScenario.household.applyMinimumDrawdown = false;
fixedDeathScenario.household.targetAfterTax = 0;
fixedDeathScenario.household.annualBudget = 0;
fixedDeathScenario.household.modelEndAge = 66;
fixedDeathScenario.household.firstDeath = {
  enabled: true, deceasedPerson: 'p0', deathAge: 65,
  survivorPreferredPct: 70, survivorEssentialPct: 70
};
fixedDeathScenario.people[0] = {
  ...fixedDeathScenario.people[0], age: 64, retireAge: 67,
  salary: 100000, sgPct: 0, accumulationReturnPct: 0,
  retirementReturnPct: 0, super: 100000
};
fixedDeathScenario.people[1] = {
  ...fixedDeathScenario.people[1], age: 62, retireAge: 67,
  salary: 50000, sgPct: 0, accumulationReturnPct: 0,
  retirementReturnPct: 0, super: 50000
};
fixedDeathScenario.cash.amount = 0;
fixedDeathScenario.savings.amount = 0;
fixedDeathScenario.shareholdings = [];
const zeroProfiles = {
  p0Accum: { expectedReturnPct: 0, volatilityPct: 0 },
  p0Retire: { expectedReturnPct: 0, volatilityPct: 0 },
  p1Accum: { expectedReturnPct: 0, volatilityPct: 0 },
  p1Retire: { expectedReturnPct: 0, volatilityPct: 0 }
};
const fixedDeathPaths = core.simulatePaths({
  scenario: fixedDeathScenario,
  pathCount: 4,
  seed: 12345,
  profiles: zeroProfiles,
  projectScenario: simulator.projectScenario
});
assert.ok(fixedDeathPaths.every(result => result.engineError === null));
const transitionRows = fixedDeathPaths.map(result =>
  result.projection.rows.find(row => row.lifecycle?.transitionedThisYear));
assert.ok(transitionRows.every(row => row?.year === 2027 &&
  row.lifecycle.survivorIndex === 1),
  'every Monte Carlo path should apply the same fixed first-death event');
assert.ok(transitionRows.every(row => row.ages[0] === null &&
  row.taxByPerson[0] === 0 && row.inheritedSuper.total > 0),
  'every path should expose the same survivor audit state');
const repeatedFixedDeathPaths = core.simulatePaths({
  scenario: fixedDeathScenario,
  pathCount: 4,
  seed: 12345,
  profiles: zeroProfiles,
  projectScenario: simulator.projectScenario
});
assert.deepEqual(
  plain(repeatedFixedDeathPaths.map(result => result.projection.rows.map(row => ({
    year: row.year,
    totalAssets: row.totalAssets,
    totalIncome: row.totalIncome,
    transitionYear: row.lifecycle.transitionYear
  })))),
  plain(fixedDeathPaths.map(result => result.projection.rows.map(row => ({
    year: row.year,
    totalAssets: row.totalAssets,
    totalIncome: row.totalIncome,
    transitionYear: row.lifecycle.transitionYear
  })))),
  'the same seed and fixed death should be reproducible'
);

const deterministicCoreSource = deterministicHtml.match(
  /<script id="simulator-core">([\s\S]*?)<\/script>/
)?.[1];
assert.ok(deterministicCoreSource, 'deterministic core should be available for parity');
const deterministicContext = vm.createContext({
  console, structuredClone, Math, Date, globalThis: {}
});
deterministicContext.globalThis = deterministicContext;
vm.runInContext(deterministicCoreSource, deterministicContext);
const deterministic = deterministicContext.RetirementSimulatorCore;
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

const pensionPerson = {
  ...definedBenefitInput.people[0], age: 64,
  ukStateAnnualGbp: 24000, ukStateStartAge: 65,
  ukStateIndexation: 'cpi', ukStateSurvivorPct: 60
};
const roundedPensionFlow = flow => ({
  grossNominal: Math.round(flow.grossNominal * 1e6) / 1e6,
  taxableNominal: Math.round(flow.taxableNominal * 1e6) / 1e6
});
assert.deepEqual(plain(simulator.pensionFlows({
  person: pensionPerson, age: 64, inflationFactor: 1.1,
  assumptions: definedBenefitInput.assumptions
})), { grossNominal: 0, taxableNominal: 0 });
assert.deepEqual(roundedPensionFlow(simulator.pensionFlows({
  person: pensionPerson, age: 65, inflationFactor: 1.1,
  assumptions: definedBenefitInput.assumptions
})), { grossNominal: 26400, taxableNominal: 26400 });

const fixedUkPerson = {
  ...pensionPerson, ukStateAnnualGbp: 12000,
  ukStateStartAge: 65, ukStateIndexation: 'frozen'
};
assert.deepEqual(roundedPensionFlow(simulator.pensionFlows({
  person: fixedUkPerson, age: 65, inflationFactor: 1.1,
  assumptions: ukPensionInput.assumptions
})), { grossNominal: 23400, taxableNominal: 21528 });

const disabledPension = structuredClone(ukPensionInput.assumptions);
disabledPension.ukPensionsEnabled = false;
assert.deepEqual(plain(simulator.pensionFlows({
  person: fixedUkPerson, age: 67, inflationFactor: 1.2,
  assumptions: disabledPension
})), { grossNominal: 0, taxableNominal: 0 });

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
  targetAfterTax: 30000, annualBudget: 30000, modelEndAge: 67,
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

for (const [label, pensionInput] of [
  ['Defined Benefit', adaptedDefinedBenefit],
  ['UK State Pension', adaptedUkPension]
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

const stochasticUkPension = configurePensionParityScenario(
  adaptedUkPension, adaptedUkPension);
const pensionStochasticA = core.simulatePaths({
  scenario: stochasticUkPension,
  pathCount: 3,
  seed: 86420,
  profiles: salaryStochasticProfiles,
  projectScenario: simulator.projectScenario
});
const pensionStochasticB = core.simulatePaths({
  scenario: stochasticUkPension,
  pathCount: 3,
  seed: 86420,
  profiles: salaryStochasticProfiles,
  projectScenario: simulator.projectScenario
});
const pensionStochasticShape = results => plain(results.map(result =>
  result.projection.rows.map(row => ({
    ukStateNet: row.components.ukStateNet,
    totalIncome: row.totalIncome,
    totalAssets: row.totalAssets
  }))));
assert.deepEqual(
  pensionStochasticShape(pensionStochasticA),
  pensionStochasticShape(pensionStochasticB),
  'pension stochastic paths should remain seed-reproducible'
);
assert.ok(pensionStochasticA.every(result =>
  result.engineError === null && result.projection.rows.every(row =>
    Number.isFinite(row.totalIncome) && Number.isFinite(row.totalAssets) &&
    row.totalAssets >= 0)),
'pension stochastic paths should preserve accounting invariants');
const disabledStochasticPension = structuredClone(stochasticUkPension);
disabledStochasticPension.assumptions.ukPensionsEnabled = false;
const disabledPensionPaths = core.simulatePaths({
  scenario: disabledStochasticPension,
  pathCount: 3,
  seed: 86420,
  profiles: salaryStochasticProfiles,
  projectScenario: simulator.projectScenario
});
assert.ok(
  pensionStochasticA[0].projection.rows[1].components.ukStateNet > 0 &&
  pensionStochasticA[0].projection.rows[1].components.potDraw <
    disabledPensionPaths[0].projection.rows[1].components.potDraw,
  'active pensions must contribute to funding rather than being omitted'
);

const deterministicFixedDeath = deterministic.makeSampleScenario();
deterministicFixedDeath.assumptions.inflationMode = 'manual';
deterministicFixedDeath.assumptions.manualInflationPct = 0;
deterministicFixedDeath.assumptions.ukPensionsEnabled = false;
deterministicFixedDeath.household.includeAgePension = false;
deterministicFixedDeath.household.applyMinimumDrawdown = false;
deterministicFixedDeath.household.targetAfterTax = 0;
deterministicFixedDeath.household.annualBudget = 0;
deterministicFixedDeath.household.modelEndAge = 66;
deterministicFixedDeath.household.firstDeath = structuredClone(
  fixedDeathScenario.household.firstDeath);
deterministicFixedDeath.people.forEach((person, index) => Object.assign(person, {
  age: fixedDeathScenario.people[index].age,
  retireAge: fixedDeathScenario.people[index].retireAge,
  salary: fixedDeathScenario.people[index].salary,
  sgPct: 0,
  accumulationReturnPct: 0,
  retirementReturnPct: 0,
  super: fixedDeathScenario.people[index].super,
  ukStateAnnualGbp: 0,
  ukStateSurvivorPct: 0
}));
deterministicFixedDeath.cash.amount = 0;
deterministicFixedDeath.savings.amount = 0;
deterministicFixedDeath.shareholdings = [];
deterministicFixedDeath.otherIncomes = [];
deterministicFixedDeath.otherAssets = [];
deterministicFixedDeath.lumpSumWithdrawals = [];
const deterministicFixedRows = deterministic.projectScenario(
  deterministicFixedDeath).rows;
assert.deepEqual(
  plain(fixedDeathPaths[0].projection.rows.map(row => ({
    year: row.year,
    totalAssets: row.totalAssets,
    totalIncome: row.totalIncome,
    survivorIndex: row.lifecycle.survivorIndex
  }))),
  plain(deterministicFixedRows.map(row => ({
    year: row.year,
    totalAssets: row.totalAssets,
    totalIncome: row.totalIncome,
    survivorIndex: row.lifecycle.survivorIndex
  }))),
  'zero-volatility first-death totals should match deterministic projection'
);

assert.match(html, /effectiveYear:\s*2025/, 'Medicare data should be for 2025-26');
assert.match(html, /ordinary:\s*\{ lower: 28011, upper: 35013 \}/,
  'ordinary Medicare thresholds should be current');
assert.match(html, /sapto:\s*\{ lower: 44268, upper: 55335 \}/,
  'SAPTO Medicare thresholds should be current');

assert.equal(
  typeof core.riskModePolicy,
  'function',
  'Monte Carlo core should expose a risk-mode policy'
);

const aggressive = core.riskModePolicy('aggressive-spending');
const middle = core.riskModePolicy('middle-ground');
const capital = core.riskModePolicy('capital-preservation');

assert.ok(
  aggressive.successThreshold < middle.successThreshold,
  'aggressive spending should use a lower confidence threshold than middle ground'
);
assert.ok(
  middle.successThreshold < capital.successThreshold,
  'capital preservation should use a higher confidence threshold than middle ground'
);
assert.ok(
  aggressive.terminalReserveYears < middle.terminalReserveYears,
  'middle ground should require more terminal reserve than aggressive spending'
);
assert.ok(
  middle.terminalReserveYears < capital.terminalReserveYears,
  'capital preservation should require more terminal reserve than middle ground'
);
assert.ok(
  aggressive.runBudgetMultiplier > middle.runBudgetMultiplier,
  'aggressive spending should test a higher run budget than middle ground'
);
assert.ok(
  aggressive.runBudgetMultiplier >= 1.5,
  'aggressive spending should push spending hard enough to visibly stress the model'
);
assert.ok(
  middle.runBudgetMultiplier > capital.runBudgetMultiplier,
  'capital preservation should test a lower run budget than middle ground'
);
assert.ok(
  capital.runBudgetMultiplier <= 0.7,
  'capital preservation should materially pull spending back'
);
assert.equal(
  typeof core.applyRiskModeToScenario,
  'function',
  'Monte Carlo core should expose a risk-mode scenario applicator'
);

const baselineRiskScenario = {
  household: {
    annualBudget: 60000,
    targetAfterTax: 90000
  }
};
const aggressiveScenario = core.applyRiskModeToScenario(
  baselineRiskScenario,
  'aggressive-spending'
);
const middleScenario = core.applyRiskModeToScenario(
  baselineRiskScenario,
  'middle-ground'
);
const capitalScenario = core.applyRiskModeToScenario(
  baselineRiskScenario,
  'capital-preservation'
);

assert.ok(
  aggressiveScenario.household.annualBudget > middleScenario.household.annualBudget,
  'aggressive spending should materially increase the tested annual budget'
);
assert.ok(
  middleScenario.household.annualBudget > capitalScenario.household.annualBudget,
  'capital preservation should materially reduce the tested annual budget'
);
assert.equal(
  baselineRiskScenario.household.annualBudget,
  60000,
  'risk-mode application must not mutate the imported baseline scenario'
);

const observedBudgets = [];
core.calculateBudgetCurve({
  scenario: {
    startYear: 2026,
    people: [{ age: 62 }],
    household: { annualBudget: 60000, modelEndAge: 62 }
  },
  budgets: [60000],
  pathCount: 1,
  seed: 1,
  profiles: {
    p0Accum: { expectedReturnPct: 0, volatilityPct: 0 },
    p0Retire: { expectedReturnPct: 0, volatilityPct: 0 },
    p1Accum: { expectedReturnPct: 0, volatilityPct: 0 },
    p1Retire: { expectedReturnPct: 0, volatilityPct: 0 }
  },
  riskMode: 'aggressive-spending',
  projectScenario(candidate) {
    observedBudgets.push(candidate.household.annualBudget);
    return {
      rows: [{ year: 2026, shortfall: 0, savings: 0, totalAssets: 0 }],
      firstShortfall: null
    };
  }
});
assert.equal(
  observedBudgets[0],
  90000,
  'budget sweep should apply the selected risk-mode spending multiplier'
);

const scenario = {
  startYear: 2026,
  people: [{ age: 62 }],
  household: {
    annualBudget: 100000,
    modelEndAge: 63
  }
};

const viableButThinResults = [
  {
    engineError: null,
    projection: {
      rows: [
        { year: 2026, shortfall: 0, savings: 100000, totalAssets: 140000 },
        { year: 2027, shortfall: 0, savings: 80000, totalAssets: 50000 }
      ],
      firstShortfall: null
    }
  }
];

assert.equal(
  core.summarizeResults(
    viableButThinResults,
    scenario,
    'aggressive-spending'
  ).successProbability,
  1,
  'aggressive spending can count a fully funded but thin terminal path as successful'
);

assert.equal(
  core.summarizeResults(
    viableButThinResults,
    scenario,
    'middle-ground'
  ).successProbability,
  0,
  'middle ground should fail a path that ends below its reserve floor'
);

assert.equal(
  core.summarizeResults(
    viableButThinResults,
    scenario,
    'capital-preservation'
  ).successProbability,
  0,
  'capital preservation should fail a path that ends below its reserve floor'
);

const curve = [
  { budget: 70000, successProbability: 0.96 },
  { budget: 80000, successProbability: 0.92 },
  { budget: 90000, successProbability: 0.82 },
  { budget: 100000, successProbability: 0.72 }
];

assert.deepEqual(
  plain(core.summarizeBudgetBreakpoints(curve, { successThreshold: 0.75 })),
  { maxBudgetAtThreshold: 90000, firstBelowThreshold: 100000 }
);
assert.deepEqual(
  plain(core.summarizeBudgetBreakpoints(curve, { successThreshold: 0.90 })),
  { maxBudgetAtThreshold: 80000, firstBelowThreshold: 90000 }
);
assert.deepEqual(
  plain(core.summarizeBudgetBreakpoints(curve, { successThreshold: 0.95 })),
  { maxBudgetAtThreshold: 70000, firstBelowThreshold: 80000 }
);

assert.equal(
  typeof core.stressAssumptionOverride,
  'function',
  'Monte Carlo core should expose stress assumption overrides'
);
assert.equal(
  typeof core.applyStressAssumptionOverride,
  'function',
  'Monte Carlo core should expose a stress override applicator'
);

const baselineScenario = {
  assumptions: {
    inflationMode: 'manual',
    manualInflationPct: 2.5
  },
  cash: { interestPct: 1.5 },
  savings: { interestPct: 4 }
};

const severeOverride = core.stressAssumptionOverride('severe-early-downturn');
assert.deepEqual(
  plain(severeOverride.inflationPctByYear),
  [8, 6, 4.5, 3.5, 3],
  'severe early downturn should use a credible inflation shock capped at 8%'
);

const stressedScenario = core.applyStressAssumptionOverride(
  baselineScenario,
  severeOverride
);
assert.equal(
  stressedScenario.assumptions.inflationMode,
  'stress-path',
  'stress override should make inflation use an explicit stress path'
);
assert.deepEqual(
  plain(stressedScenario.assumptions.stressInflationPctByYear),
  [8, 6, 4.5, 3.5, 3],
  'stress override should preserve the explicit inflation path for auditability'
);
assert.equal(
  baselineScenario.assumptions.inflationMode,
  'manual',
  'stress override must not mutate the imported baseline scenario'
);
assert.ok(
  stressedScenario.savings.interestPct > baselineScenario.savings.interestPct,
  'savings interest should rise under the inflation stress but remain explicit'
);

console.log('retirement-monte-carlo-v0.7 survivor-boundary, risk-mode, age-gap and stress override tests passed');
