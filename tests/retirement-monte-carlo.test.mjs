import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(
  new URL('../retirement-monte-carlo-v0.6.html', import.meta.url),
  'utf8'
);

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
assert.match(html, /Family Retirement Monte Carlo Report v0\.6/,
  'Monte Carlo title should identify v0.6');
assert.match(html, /<span class="version">v0\.6<\/span>/,
  'Monte Carlo heading should identify v0.6');
assert.ok(
  html.includes("const STORAGE_KEY = 'family-retirement-simulator:v0.6:scenario'") &&
  html.includes("'family-retirement-simulator:v0.95:scenario'"),
  'Monte Carlo v0.6 should retain the legacy saved-scenario fallback'
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
const monteCarloDemo = simulator.makeSampleScenario();
assert.equal(monteCarloDemo.people[0].name, 'John');
assert.equal(monteCarloDemo.people[0].super, 220000);
assert.equal(monteCarloDemo.people[1].name, 'Jane');
assert.equal(monteCarloDemo.people[1].super, 165000);
assert.equal(monteCarloDemo.household.targetAfterTax, 80000);
assert.equal(monteCarloDemo.household.annualBudget, 70000);
assert.equal(monteCarloDemo.assumptions.inflationMode, 'manual');
assert.equal(monteCarloDemo.assumptions.manualInflationPct, 3);

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
assert.equal(adaptedV1Scenario.schemaVersion, 3,
  'v1.00 schema should adapt to the experimental engine schema');
assert.ok(adaptedV1Scenario.people.every(person => person.ukPrivateAmountGbp === 0),
  'v1.00 adapter should install inert legacy pension fields');

const unsupportedV1Scenario = structuredClone(v1Scenario);
unsupportedV1Scenario.otherIncomes = [{ label: 'Rental', amount: 1000 }];
assert.throws(
  () => simulator.importScenario(JSON.stringify(unsupportedV1Scenario)),
  /cannot yet model populated Other income or Other assets/,
  'unsupported v1.00 cash flows should be rejected rather than silently omitted'
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
assert.equal(adaptedSchema9.schemaVersion, 3);
assert.ok(!('lumpSumWithdrawals' in adaptedSchema9),
  'schema 9 disabled lump sums should be discarded by the adapter');

const activeSchema10 = structuredClone(disabledSchema9);
activeSchema10.schemaVersion = 10;
activeSchema10.people[0].salaryGrowthPct = 1;
activeSchema10.people[1].salaryGrowthPct = 0;
assert.throws(
  () => simulator.importScenario(JSON.stringify(activeSchema10)),
  /cannot yet model above-inflation salary growth/,
  'schema 10 active salary growth should be explicitly unsupported'
);
const zeroGrowthSchema10 = structuredClone(activeSchema10);
zeroGrowthSchema10.people.forEach(person => { person.salaryGrowthPct = 0; });
const adaptedSchema10 = simulator.importScenario(JSON.stringify(zeroGrowthSchema10));
assert.equal(adaptedSchema10.schemaVersion, 3);
assert.ok(adaptedSchema10.people.every(person => !('salaryGrowthPct' in person)),
  'schema 10 zero salary growth should be removed by the adapter');

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
assert.equal(adaptedSchema11.schemaVersion, 3);
for (const key of ['priceGrowthPct', 'dividendYieldPct', 'frankedPct',
  'companyTaxRatePct', 'frankingEligible']) {
  assert.ok(!(key in adaptedSchema11.shareholdings[0]), `${key} should be stripped`);
}

const monteCarloCoreScript = scripts.find(script =>
  script.includes('RetirementMonteCarloCore')
);
assert.ok(monteCarloCoreScript, 'Monte Carlo core script should exist');
vm.runInContext(monteCarloCoreScript, context);

const core = context.RetirementMonteCarloCore;
const plain = value => JSON.parse(JSON.stringify(value));

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

console.log('retirement-monte-carlo-v0.6 risk-mode, age-gap and stress override tests passed');
