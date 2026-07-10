// Deterministic simulator smoke test: core engine + syntax check of both script blocks.
// Run with: node tests/retirement-simulator.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const FILE = fileURLToPath(new URL('../retirement-simulator.html', import.meta.url));
const html = readFileSync(FILE, 'utf8');

function extract(id) {
  const match = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`));
  if (!match) throw new Error(`script #${id} not found`);
  return match[1];
}

let passed = 0;
let failed = 0;
function check(name, condition, detail = '') {
  if (condition) { passed += 1; console.log(`  ok   ${name}`); }
  else { failed += 1; console.log(`  FAIL ${name} ${detail}`); }
}

// 1. Syntax-check the UI script without running it (needs a DOM).
new vm.Script(extract('simulator-ui'), { filename: 'simulator-ui.js' });
new vm.Script(extract('compat-shim'), { filename: 'compat-shim.js' });
console.log('script blocks parse cleanly');

// 2. Run the core.
const context = vm.createContext({ globalThis: {}, console, structuredClone });
context.globalThis = context;
vm.runInContext(extract('simulator-core'), context, { filename: 'simulator-core.js' });
const core = context.RetirementSimulatorCore;

console.log('\nschema + sample');
check('schema version is 6', core.SCHEMA_VERSION === 6);
const sample = core.makeSampleScenario();
check('sample validates', core.validateScenario(sample).length === 0,
  JSON.stringify(core.validateScenario(sample)[0] ?? null));
check('sample has otherIncomes/otherAssets arrays',
  Array.isArray(sample.otherIncomes) && Array.isArray(sample.otherAssets));
check('sample people have no ukPrivate fields',
  sample.people.every(p => !('ukPrivateAmountGbp' in p)));

console.log('\nbaseline projection');
const base = core.projectScenario(sample);
check('rows produced', base.rows.length > 30);
check('no NaN in totals', base.rows.every(r =>
  Number.isFinite(r.totalAssets) && Number.isFinite(r.totalIncome) && Number.isFinite(r.tax)));
check('rows expose otherAssets = 0', base.rows.every(r => r.otherAssets === 0));
check('rows expose components.otherIncomeNet = 0',
  base.rows.every(r => r.components.otherIncomeNet === 0));

console.log('\nother income');
const withIncome = structuredClone(sample);
withIncome.otherIncomes = [
  { id: 'i1', label: 'Rental', currency: 'AUD', fxToAud: 1, amount: 10000, taxable: true },
  { id: 'i2', label: 'Gift', currency: 'GBP', fxToAud: 2, amount: 1000, taxable: false }
];
check('scenario with income validates', core.validateScenario(withIncome).length === 0,
  JSON.stringify(core.validateScenario(withIncome)[0] ?? null));
const projIncome = core.projectScenario(withIncome);
const r0 = projIncome.rows[0];
// Year 0: inflationFactor 1. Non-taxable GBP 1000 * 2 = 2000 flows through untaxed.
// Taxable 10000 is net of blended ratio, so otherIncomeNet is (10000*ratio + 2000).
check('year-0 otherIncomeNet between 2000 and 12000',
  r0.components.otherIncomeNet > 2000 && r0.components.otherIncomeNet <= 12000,
  String(r0.components.otherIncomeNet));
// Total income is capped at the requested target while tiers can fill the gap,
// so extra income shows up as a smaller drawdown, i.e. higher end assets.
check('income reduces year-0 drawdown vs baseline',
  (r0.components.potDraw + r0.components.person0Super + r0.components.person1Super) <
  (base.rows[0].components.potDraw + base.rows[0].components.person0Super + base.rows[0].components.person1Super),
  `draws ${r0.components.potDraw} vs ${base.rows[0].components.potDraw}`);
check('income raises end-of-model assets vs baseline',
  projIncome.rows.at(-1).totalAssets > base.rows.at(-1).totalAssets,
  `${projIncome.rows.at(-1).totalAssets} vs ${base.rows.at(-1).totalAssets}`);
// CPI indexing: real (today's-dollars) value of otherIncomeNet should be roughly
// stable in later years, not eroding like a frozen pension.
const rLate = projIncome.rows[20];
check('CPI-indexed income holds real value at year 20 (>= 80% of year 0)',
  rLate.components.otherIncomeNet >= r0.components.otherIncomeNet * 0.8,
  `${r0.components.otherIncomeNet} -> ${rLate.components.otherIncomeNet}`);

console.log('\nother assets');
const withAsset = structuredClone(sample);
const disposalYear = sample.startYear + 5;
withAsset.otherAssets = [
  { id: 'a1', label: 'Boat', currency: 'AUD', fxToAud: 1, amount: 100000, growthPct: 3, disposalYear }
];
check('scenario with asset validates', core.validateScenario(withAsset).length === 0,
  JSON.stringify(core.validateScenario(withAsset)[0] ?? null));
const projAsset = core.projectScenario(withAsset);
check('asset appears in year-0 otherAssets (real, ~103000 nominal)',
  projAsset.rows[0].otherAssets > 100000 * 0.9,
  String(projAsset.rows[0].otherAssets));
check('total assets includes the asset',
  projAsset.rows[0].totalAssets > base.rows[0].totalAssets + 90000);
const disposalRow = projAsset.rows.find(r => r.year === disposalYear);
check('disposal event fires in disposal year',
  disposalRow.events.some(e => e.type === 'asset-disposal'),
  JSON.stringify(disposalRow.events));
check('asset zero after disposal', disposalRow.otherAssets === 0);
const afterRow = projAsset.rows.find(r => r.year === disposalYear + 1);
check('no double disposal', afterRow.events.every(e => e.type !== 'asset-disposal'));
// Savings should absorb the proceeds: compare savings before/after vs baseline.
check('savings jump at disposal vs baseline',
  disposalRow.savings > base.rows.find(r => r.year === disposalYear).savings + 50000,
  `${disposalRow.savings}`);

console.log('\nnegative growth');
const shrink = structuredClone(withAsset);
shrink.otherAssets[0].growthPct = -10;
shrink.otherAssets[0].disposalYear = sample.startYear + 30;
const projShrink = core.projectScenario(shrink);
check('asset shrinks with negative growth',
  projShrink.rows[10].otherAssets < projShrink.rows[0].otherAssets);
check('never NaN with negative growth', projShrink.rows.every(r => Number.isFinite(r.otherAssets)));

console.log('\nvalidation rejects bad items');
const badIncome = structuredClone(sample);
badIncome.otherIncomes = [{ id: 'x', label: '', currency: 'EUR', fxToAud: 0, amount: -5, taxable: 'yes' }];
const incomeErrors = core.validateScenario(badIncome);
check('bad income: label/currency/fx/amount/taxable all flagged', incomeErrors.length >= 5,
  JSON.stringify(incomeErrors));
const badAsset = structuredClone(sample);
badAsset.otherAssets = [{ id: 'y', label: 'ok', currency: 'AUD', fxToAud: 1, amount: 100, growthPct: 500, disposalYear: 1999 }];
const assetErrors = core.validateScenario(badAsset);
check('bad asset: growth + disposal year flagged', assetErrors.length >= 2,
  JSON.stringify(assetErrors));

console.log('\nmigration v5 -> v6');
const v5 = structuredClone(sample);
v5.schemaVersion = 5;
delete v5.otherIncomes;
delete v5.otherAssets;
v5.people[0].ukPrivateAmountGbp = 5000;
v5.people[0].ukPrivateTakeAge = 67;
v5.people[0].ukPrivateType = 'annuity';
v5.people[1].ukPrivateAmountGbp = 20000;
v5.people[1].ukPrivateTakeAge = 66;
v5.people[1].ukPrivateType = 'lump';
const migrated = core.migrateScenario(structuredClone(v5));
check('migrates to v6', migrated.schemaVersion === 6);
check('annuity becomes other income', migrated.otherIncomes.length === 1 &&
  migrated.otherIncomes[0].amount === 5000 && migrated.otherIncomes[0].currency === 'GBP');
check('lump becomes other asset with disposal year',
  migrated.otherAssets.length === 1 &&
  migrated.otherAssets[0].amount === 20000 &&
  migrated.otherAssets[0].disposalYear === v5.startYear + (66 - v5.people[1].age),
  JSON.stringify(migrated.otherAssets[0]));
check('ukPrivate fields stripped', migrated.people.every(p => !('ukPrivateAmountGbp' in p)));
check('migrated scenario validates', core.validateScenario(migrated).length === 0,
  JSON.stringify(core.validateScenario(migrated)[0] ?? null));
core.projectScenario(migrated);
console.log('  ok   migrated scenario projects without error');
passed += 1;

console.log('\nmigration v1 -> v6 (full chain)');
const v1 = structuredClone(v5);
v1.schemaVersion = 1;
delete v1.household.annualBudget;
v1.people = v1.people.map(({ superAccessAge, superAccessPct, ukStateIndexation, ...rest }) => rest);
delete v1.assumptions.ukPensionsEnabled;
const chained = core.migrateScenario(structuredClone(v1));
check('v1 chains to v6', chained.schemaVersion === 6);
check('chained validates', core.validateScenario(chained).length === 0,
  JSON.stringify(core.validateScenario(chained)[0] ?? null));

console.log('\nengine parity: no other items => matches v0.98c behaviour shape');
// Sample with UK pensions but no other items should still meet income target early.
check('no shortfall in first 5 years', base.rows.slice(0, 5).every(r => r.shortfall < 1));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
