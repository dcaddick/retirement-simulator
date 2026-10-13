import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../retirement-simulator.html', import.meta.url), 'utf8');
const context = vm.createContext({ structuredClone, console });
vm.runInContext(html.match(/<script id="simulator-core">([\s\S]*?)<\/script>/)[1], context);
const core = context.RetirementSimulatorCore;

const legacy = core.makeSampleScenario();
legacy.schemaVersion = 14;
legacy.household.targetAfterTax = 90000;
legacy.household.annualBudget = 60000;
const legacyReturns = legacy.people.map(({ accumulationReturnPct, retirementReturnPct }) => [accumulationReturnPct, retirementReturnPct]);
const migrated = core.migrateScenario(legacy);
assert.equal(migrated.schemaVersion, 16);
assert.equal(migrated.household.targetAfterTax, 60000);
assert.equal(migrated.household.annualBudget, 60000);
assert.equal(migrated.household.cashBufferYears, undefined);
assert.equal(migrated.spendingReview.previousPreferred, 90000);
assert.equal(migrated.spendingReview.previousEssential, 60000);
assert.ok(migrated.people.every(person => person.superReturnProfile === 'growth'));
assert.equal(JSON.stringify(migrated.people.map(({ accumulationReturnPct, retirementReturnPct }) => [accumulationReturnPct, retirementReturnPct])), JSON.stringify(legacyReturns));
assert.deepEqual(core.migrateScenario(migrated), migrated);
console.log('v1.1.1 migration and spending-policy checks passed');

const scenario = core.makeSampleScenario();
assert.equal(scenario.household.cashBufferYears, undefined);
const schema15WithLegacyBuffer = structuredClone(scenario);
schema15WithLegacyBuffer.schemaVersion = 15;
schema15WithLegacyBuffer.household.cashBufferYears = 2;
const schema16WithoutBuffer = core.migrateScenario(schema15WithLegacyBuffer);
assert.equal(schema16WithoutBuffer.household.cashBufferYears, undefined);
const withoutStrategy = structuredClone(scenario);
withoutStrategy.household.cashBufferYears = 0;
const withStrategy = structuredClone(scenario);
withStrategy.household.cashBufferYears = 2;
const baselineProjection = core.projectScenario(withoutStrategy);
const strategyProjection = core.projectScenario(withStrategy);
assert.deepEqual(strategyProjection, baselineProjection);
assert.ok(strategyProjection.rows.every(row => row.bucket === undefined));
console.log('Legacy buffer settings are ignored by projections and removed during schema-16 migration');

const event = { reason: 'Car', requested: 20000, funded: 15000, unfunded: 5000, requestedSource: 'cash', drawsBySource: { cash: 10000, savings: 5000 } };
const nominalLabel = core.lumpSumEventLabel(event, scenario.people, 2);
assert.match(nominalLabel, /requested \$40,000/);
assert.match(nominalLabel, /\$30,000 funded/);
assert.match(nominalLabel, /Cash \$20,000/);
assert.match(nominalLabel, /Savings \$10,000/);
assert.match(nominalLabel, /\$10,000 unfunded/);

const beforeGuidance = JSON.stringify(scenario);
core.returnGuidance(10, scenario);
core.returnGuidance(10, scenario, 'savings');
assert.equal(JSON.stringify(scenario), beforeGuidance);
console.log('v1.1.1 lump-sum and return-context checks passed');
