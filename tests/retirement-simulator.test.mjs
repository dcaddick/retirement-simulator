// Deterministic simulator smoke test: core engine + syntax check of both script blocks.
// Run with: node tests/retirement-simulator.test.mjs
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const FILE = fileURLToPath(new URL('../retirement-simulator.html', import.meta.url));
const ARCHIVE_104 = fileURLToPath(
  new URL('../archive/retirement-simulator-v1.0.4.html', import.meta.url)
);
const ARCHIVE_105 = fileURLToPath(
  new URL('../archive/retirement-simulator-v1.0.5.html', import.meta.url)
);
const ARCHIVE_106 = fileURLToPath(
  new URL('../archive/retirement-simulator-v1.0.6.html', import.meta.url)
);
const DEFERRED_REVIEW = fileURLToPath(
  new URL('../docs/DEFERRED-REVIEW.md', import.meta.url)
);
const METHODOLOGY = fileURLToPath(
  new URL('../docs/MODEL-METHODOLOGY.md', import.meta.url)
);
const README = fileURLToPath(new URL('../README.md', import.meta.url));
const html = readFileSync(FILE, 'utf8');
const deferredReview = existsSync(DEFERRED_REVIEW)
  ? readFileSync(DEFERRED_REVIEW, 'utf8')
  : '';
const methodology = readFileSync(METHODOLOGY, 'utf8');
const readme = readFileSync(README, 'utf8');

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
check('schema version is 11', core.SCHEMA_VERSION === 11);
const sample = core.makeSampleScenario();
check('sample validates', core.validateScenario(sample).length === 0,
  JSON.stringify(core.validateScenario(sample)[0] ?? null));
check('sample has otherIncomes/otherAssets arrays',
  Array.isArray(sample.otherIncomes) && Array.isArray(sample.otherAssets));
check('sample lump sums include valid intended months',
  sample.lumpSumWithdrawals.every(item => Number.isInteger(item.month) && item.month >= 1 && item.month <= 12));
check('sample people have no ukPrivate fields',
  sample.people.every(p => !('ukPrivateAmountGbp' in p)));
check('sample salary growth defaults to zero',
  sample.people.every(person => person.salaryGrowthPct === 0));
check('v1.01 fictional couple sample is installed',
  sample.people[0].name === 'John' && sample.people[0].age === 63 && sample.people[0].super === 220000 &&
  sample.people[1].name === 'Jane' && sample.people[1].age === 61 && sample.people[1].super === 165000);
check('sample uses lower accumulation and higher retirement-phase net returns',
  sample.people.every(p => p.accumulationReturnPct === 5.5 && p.retirementReturnPct === 6.5));
check('sample has UK pensions cleared and disabled',
  sample.people.every(p => p.ukStateAnnualGbp === 0) && sample.assumptions.ukPensionsEnabled === false);
check('sample defaults to Australian defined benefit mode',
  sample.assumptions.gbpAud === 1 && sample.assumptions.uppPct === 0);
check('sample includes two relative-year demo lump sums',
  sample.lumpSumWithdrawals.length === 2 &&
  sample.lumpSumWithdrawals[0].reason === 'New car' && sample.lumpSumWithdrawals[0].amount === 20000 && sample.lumpSumWithdrawals[0].year === sample.startYear + 3 &&
  sample.lumpSumWithdrawals[1].reason === 'European holiday' && sample.lumpSumWithdrawals[1].amount === 50000 && sample.lumpSumWithdrawals[1].year === sample.startYear + 5 &&
  sample.lumpSumWithdrawals.every(item => item.source === 'automatic' && item.enabled === true));
check('sample distinguishes preferred income from essential budget',
  sample.household.targetAfterTax === 80000 && sample.household.annualBudget === 70000);
check('sample uses the approved Treasury inflation default',
  sample.assumptions.inflationMode === 'treasury');
check('v1.00 terminology is rendered',
  html.includes('Preferred Retirement Income') && html.includes('Essential Annual Budget'));
check('return assumptions are explained below the table',
  html.indexOf('Return assumptions.') > html.indexOf('<div class="tblwrap">') &&
  html.includes('estimated net returns after fees and tax'));
check('assumptions and methodology moved out of the controls panel',
  html.indexOf('<summary>Model assumptions and sources</summary>') > html.indexOf('<div class="tblwrap">') &&
  html.indexOf('id="methodologySection"') > html.indexOf('<div class="tblwrap">'));
check('v1.06 document version is consistent',
  html.includes('<title>Family Retirement Income Simulator v1.06</title>') &&
  html.includes('<span class="version">v1.06</span>') &&
  html.includes("const STORAGE_KEY = 'family-retirement-simulator:v1.06:scenario'") &&
  html.includes("'family-retirement-simulator:v1.05:scenario'"));
check('outgoing v1.04 executable is archived', existsSync(ARCHIVE_104));
check('outgoing v1.0.5 executable is archived', existsSync(ARCHIVE_105));
check('outgoing v1.0.6 executable is archived', existsSync(ARCHIVE_106));

const schema10 = structuredClone(sample);
schema10.schemaVersion = 10;
schema10.otherIncomes = [{
  id: 'legacy-income', label: 'Rent', currency: 'AUD', fxToAud: 1,
  amount: 12000, taxable: true
}];
schema10.shareholdings = [{
  ...core.makeShareholding(0), id: 'legacy-share', symbol: 'BHP'
}];
delete schema10.shareholdings[0].priceGrowthPct;
delete schema10.shareholdings[0].dividendYieldPct;
delete schema10.shareholdings[0].frankedPct;
delete schema10.shareholdings[0].companyTaxRatePct;
delete schema10.shareholdings[0].frankingEligible;
const migrated11 = core.migrateScenario(schema10);
check('schema 10 migrates inert v1.06 tax and share defaults',
  migrated11.schemaVersion === 11 &&
  migrated11.otherIncomes[0].owner === 'joint' &&
  migrated11.shareholdings[0].priceGrowthPct === 0 &&
  migrated11.shareholdings[0].dividendYieldPct === 0 &&
  migrated11.shareholdings[0].frankedPct === 0 &&
  migrated11.shareholdings[0].companyTaxRatePct === 30 &&
  migrated11.shareholdings[0].frankingEligible === false);
check('deferred review covers all approved out-of-scope items', [
  'AIPR-003-SHARES-STATIC',
  'AIPR-003-AP-AGEGAP',
  'AIPR-003-MORTALITY',
  'AIPR-003-SUPER-TAXFREE',
  'AIPR-003-CGT-LOSS',
  'AIPR-003-OTHERINC-SPLIT',
  'AIPR-003-CGT-WATERFALL'
].every(id => deferredReview.includes(id)));
check('methodology discloses fixed nominal brackets',
  methodology.includes('fixed nominal') && methodology.includes('bracket creep'));
check('README identifies v1.06 share returns and tax ownership',
  readme.includes('v1.06') && readme.includes('franking') &&
  readme.includes('capital-loss') && readme.includes('docs/DEFERRED-REVIEW.md'));
check('deferred register records the four v1.0.6 resolutions',
  ['#5', '#9', '#10', '#11'].every(issue => deferredReview.includes(issue)) &&
  (deferredReview.match(/Resolved in v1\.0\.6/g) ?? []).length >= 4);
check('methodology documents annual share growth timing and franking eligibility',
  methodology.includes('before dividends and share sales') &&
  methodology.includes('holding-period') && methodology.includes('losses are applied'));
check('returns and inflation share a dedicated upper controls block',
  html.indexOf('id="returnAssumptions"') < html.indexOf('id="peopleFields"') &&
  html.includes('Estimated net returns after fees and tax'));
check('defined benefit wording leads the combined pension section',
  html.includes('Defined Benefit/UK Pensions') &&
  html.includes('Australian defined benefit'));
check('deterministic CSP bounds scripts, styles and external connections',
  /Content-Security-Policy[^>]+default-src 'none'/.test(html) &&
  html.includes("connect-src https://api.frankfurter.app https://stooq.com"));
check('theme toggle sits immediately after Export JSON',
  /id="exportScenario"[^>]*>Export JSON<\/button>\s*<button[^>]+id="themeToggle"/.test(html));
check('theme preference is locally persisted and accessible',
  html.includes('retirement-simulator-theme') &&
  html.includes('aria-pressed') && html.includes('aria-label'));
check('every control section uses collapsible chevrons',
  ['scenarioSection', 'returnsSection', 'peopleSection', 'cashSavingsSection',
    'lumpSumSection', 'shareholdingsSection', 'ukPensionsSection',
    'otherItemsSection', 'householdSection'].every(id =>
    new RegExp(`<details[^>]+id="${id}"`).test(html)));
check('only the first three sections start open',
  ['scenarioSection', 'returnsSection', 'peopleSection'].every(id =>
    new RegExp(`<details[^>]+id="${id}"[^>]*open`).test(html)) &&
  !/<details[^>]+id="cashSavingsSection"[^>]*open/.test(html));
check('Cash & Savings and lump sum editor are present',
  html.includes('Cash &amp; Savings') && html.includes('id="addLumpSum"'));
check('chart-table splitter is persistent and accessible',
  html.includes('id="chartTableSplitter"') && html.includes('family-retirement-simulator:chart-height'));
check('privacy copy sits in header meta beneath actions',
  html.includes('class="header-meta"') && html.includes('class="privacy-note"'));
check('all section headings use one accent colour',
  !html.includes('.group.uk h3') && !html.includes('.group.share h3') && !html.includes('.group.pot h3'));
check('real return meaning is explained', html.includes('Nominal return minus inflation'));
check('single Mercer-style survival label is present', html.includes('Chance of living to each age'));
check('age labels use conventional multiples of five', html.includes('row.ages[0] % 5 === 0'));
check('lump sums render an aligned collapsible summary',
  html.includes('class="lump-summary"') && html.includes('class="lump-chevron"') &&
  html.includes('class="lump-summary-amount"') && html.includes('class="lump-summary-date"'));
check('lump chevron is accessible',
  html.includes('aria-expanded="${expanded}"') && html.includes('aria-controls="${escapeHtml(editorId)}"'));
check('collapsed checkbox remains a direct modelling control',
  html.includes('class="lump-summary-enabled"') && html.includes('Include ${escapeHtml(accessibleReason)} in modelling'));
check('open lump IDs survive rerenders', html.includes('expandedLumpIds'));
check('lump editor uses month and year intended date controls',
  html.includes('Intended Date') && html.includes('aria-label="Intended month"') &&
  html.includes('Include &amp; calculate on chart'));
check('lump summaries use fixed aligned columns',
  html.includes('grid-template-columns:44px minmax(48px,auto) minmax(45px,1fr) minmax(62px,auto) 44px'));
check('lump reason truncates before key values',
  html.includes('.lump-summary-reason{') && html.includes('text-overflow:ellipsis'));
check('lump controls retain iPad touch targets',
  html.includes('.lump-chevron,.lump-summary-enabled{min-width:44px;min-height:44px'));
check('lump editor displays latest intended year first',
  html.includes('.sort((a, b) => b.item.year - a.item.year || a.index - b.index)'));
check('compact lump-sum formatter uses the exported core formatter',
  /function compactMoney\([^)]+\)\s*\{[\s\S]*?return core\.formatMoney\(amount\);[\s\S]*?\}/.test(html));
check('table height splitter is accessible and persistent',
  html.includes('id="tableHeightSplitter"') &&
  html.includes('family-retirement-simulator:table-height'));
check('table actions place Export CSV after Display',
  /class="table-actions"[\s\S]*id="displayMode"[\s\S]*id="exportProjectionCsv"/.test(html));
check('Export CSV is the final table action',
  /id="exportProjectionCsv"[^>]*>Export CSV<\/button>\s*<\/div>/.test(html));
check('return readouts are left aligned and use concise labels',
  html.includes('.return-readout{') &&
  html.includes('text-align:left') &&
  html.includes('Real return:') &&
  html.includes('long-term'));
check('desktop workspace uses viewport grid and independent scrolling',
  html.includes('grid-template-rows:auto auto minmax(0,1fr) auto') &&
  html.includes('.controls{padding:14px 16px') && html.includes('max-height:none'));
check('rerenders preserve modelling context',
  html.includes('function captureUiContext()') && html.includes('function restoreUiContext(context)'));
check('focus restoration selects text-capable inputs only',
  html.includes("['text', 'search', 'url', 'tel', 'password'].includes(focusTarget.type)"));
check('fresh installs default to dark theme', html.includes("applyTheme(saved || 'dark')"));
check('iPad widths retain a usable controls column',
  html.includes('@media (max-width:1200px)') &&
  html.includes('clamp(320px,var(--left-w,340px),38vw)'));
check('survival ribbon uses Safari-safe rounded path', html.includes('function roundedRectPath('));

console.log('\nreal-return readouts');
check('real return uses nominal less inflation', core.realReturnPct(7, 2.5) === 4.5);
check('real return preserves a negative spread', core.realReturnPct(3, 5) === -2);
check('Treasury 2026 accumulation spread is calculated',
  core.realReturnPct(5.5, core.TREASURY_INFLATION.rates[2026] * 100) === 0.5);
check('Treasury long-run retirement spread is calculated',
  core.realReturnPct(6.5, core.TREASURY_INFLATION.longRunRate * 100) === 4);

console.log('\nCSV export');
const csvFromMatrix = core.csvFromMatrix ?? (() => '');
const csv = csvFromMatrix([
  ['Name', 'Event', 'Value'],
  ['José', 'Car, holiday', '$1,000'],
  ['Quote', 'He said "yes"', '=2+2'],
  ['Line', 'first\nsecond', '@SUM(A1:A2)']
]);
check('CSV includes UTF-8 BOM', csv.charCodeAt(0) === 0xFEFF);
check('CSV quotes commas and doubles embedded quotes',
  csv.includes('"Car, holiday"') && csv.includes('"He said ""yes"""'));
check('CSV preserves UTF-8 and CRLF rows',
  csv.includes('José') && csv.includes('\r\n'));
check('CSV neutralises spreadsheet formulas',
  csv.includes("'=2+2") && csv.includes("'@SUM(A1:A2)"));
check('CSV export reads the rendered table',
  html.includes('visibleTableMatrix(table)') &&
  html.includes("const table = $('#tbl')"));
check('CSV filename records the active display basis',
  html.includes("'future-dollars'") && html.includes("'todays-dollars'"));
check('CSV export reports success and failure accessibly',
  html.includes('Projection table downloaded as CSV.') &&
  html.includes('CSV export failed:'));
check('share dividends are a conditional chart source',
  html.includes("['shareDividendNet'") && html.includes('Share dividends'));
check('enabled lump sums are represented in the chart legend',
  html.includes('const lumpLegend = rows.some') &&
  html.includes('Lump sum withdrawal</span>'));
check('projection table conditionally exposes franking and CGT',
  html.includes("hasFranking ? ['Franking credits'] : []") &&
  html.includes("hasCgt ? ['CGT'] : []"));
check('tax refunds are labelled rather than shown as negative tax',
  html.includes('Estimated tax refund'));
check('CGT and loss events expose audit details',
  html.includes("type: 'capital-loss'") &&
  html.includes("type: 'cgt-payment'") &&
  html.includes('closingLoss'));

console.log('\nmarket quote policy');
const manualHolding = core.makeShareholding(0);
check('new holdings default to manual quotes', manualHolding.quoteMarket === 'manual');
check('new share-return assumptions are inert',
  manualHolding.priceGrowthPct === 0 &&
  manualHolding.dividendYieldPct === 0 &&
  manualHolding.frankedPct === 0 &&
  manualHolding.companyTaxRatePct === 30 &&
  manualHolding.frankingEligible === false);
check('share-return controls stay inline in each chevron editor',
  html.includes('Expected share-price growth %/yr') &&
  html.includes('Annual cash dividend yield %') &&
  html.includes('Franked portion %') &&
  html.includes('Assume owner is eligible to claim franking credits'));
check('shareholding editors preserve open state through field rerenders',
  html.includes('const expandedShareIds = new Set()') &&
  html.includes("expandedShareIds.has(holding.id) ? ' open' : ''") &&
  html.includes("addEventListener('toggle', event =>"));
check('manual holdings do not construct a Stooq URL',
  core.stooqQuoteUrl({ ...manualHolding, symbol: 'BHP' }) === null);
check('US Stooq holdings construct an explicit .us URL',
  core.stooqQuoteUrl({ ...manualHolding, symbol: 'VTI', quoteMarket: 'stooq-us' }) ===
    'https://stooq.com/q/l/?s=vti.us&f=sd2t2ohlcv&h&e=csv');

const badShareReturns = structuredClone(sample);
badShareReturns.shareholdings = [{
  ...core.makeShareholding(0), symbol: 'BAD', price: 1,
  priceGrowthPct: -101, dividendYieldPct: 101, frankedPct: -1,
  companyTaxRatePct: 27.5, frankingEligible: 'yes'
}];
const shareReturnErrors = core.validateScenario(badShareReturns);
check('invalid share-return assumptions are rejected',
  ['priceGrowthPct', 'dividendYieldPct', 'frankedPct',
    'companyTaxRatePct', 'frankingEligible'].every(field =>
      shareReturnErrors.some(error => error.path.endsWith(field))));

const growthState = {
  holdings: [{
    ...core.makeShareholding(0), id: 'growth', quantity: 10,
    price: 100, costBaseAud: 700, priceGrowthPct: 10, sold: false
  }]
};
core.beginShareYear(growthState);
check('share price grows without changing cost base',
  Math.abs(growthState.holdings[0].price - 110) < 0.001 &&
  growthState.holdings[0].costBaseAud === 700);
core.recordDividendExposure(growthState.holdings[0], 6);
growthState.holdings[0].quantity = 5;
core.finishDividendExposure(growthState.holdings[0]);
check('partial sale records time-weighted quantity exposure',
  growthState.holdings[0].dividendQuantityMonths === 90,
  String(growthState.holdings[0].dividendQuantityMonths));

const lossSale = core.makeShareSaleRecord({
  holding: { ...core.makeShareholding(0), id: 'loss', owner: 'p0' },
  proceedsNominal: 800,
  allocatedCostBaseNominal: 1000,
  saleMonth: 6,
  saleKind: 'scheduled'
});
check('share sale record preserves an undiscounted capital loss',
  lossSale.capitalResultNominal === -200 &&
  lossSale.owner === 'p0' && lossSale.saleKind === 'scheduled');

const capitalLedger = core.capitalLedgerForPeople([
  { owner: 'p0', capitalResultNominal: 1000, discountEligible: false },
  { owner: 'p0', capitalResultNominal: 2000, discountEligible: true },
  { owner: 'p0', capitalResultNominal: -1500, discountEligible: true },
  { owner: 'p1', capitalResultNominal: -500, discountEligible: true }
], [200, 0]);
check('capital losses reduce non-discount gains before discount gains',
  capitalLedger.people[0].lossAppliedNonDiscount === 1000 &&
  capitalLedger.people[0].lossAppliedDiscount === 700 &&
  capitalLedger.people[0].netCapitalGainNominal === 650);
check('unused capital loss carries forward for the correct person',
  capitalLedger.closingLosses[0] === 0 &&
  capitalLedger.closingLosses[1] === 500);

check('30% company rate grosses up a fully franked dividend',
  Math.abs(core.frankingCreditNominal(1000, 100, 30) - 428.5714286) < 0.001);
check('25% company rate grosses up a fully franked dividend',
  Math.abs(core.frankingCreditNominal(1000, 100, 25) - 333.3333333) < 0.001);

const dividendState = {
  holdings: [{
    ...core.makeShareholding(0), id: 'dividend', owner: 'p0', quantity: 10,
    price: 100, dividendYieldPct: 12, frankedPct: 100,
    companyTaxRatePct: 30, frankingEligible: true, sold: false,
    dividendQuantityMonths: 60, dividendCursorMonth: 13
  }]
};
const dividendFlows = core.shareDividendFlows(dividendState);
check('six months of exposure prorates the cash dividend',
  Math.abs(dividendFlows.cashByPerson[0] - 60) < 0.001);
check('dividend and franking credit follow share ownership',
  dividendFlows.cashByPerson[1] === 0 &&
  dividendFlows.frankingByPerson[0] > 25);

const taxState = {
  superRetire: [1000, 1000], cash: 300, savings: 400
};
const taxFunding = core.fundTaxExpense(taxState, [
  [{ source: 'savings', weight: 1 }],
  [{ source: 'cash', weight: 1 }],
  [{ source: 'p0Super', weight: 1 }]
], 900);
check('CGT funding uses savings before the household order',
  taxFunding.drawsBySource.savings === 400 &&
  taxFunding.drawsBySource.cash === 300 &&
  taxFunding.drawsBySource.p0Super === 200 &&
  taxFunding.unfunded === 0);
check('tax funding does not create a negative balance',
  taxState.savings === 0 && taxState.cash === 0 && taxState.superRetire[0] === 800);

const growingShares = structuredClone(sample);
growingShares.shareholdings = [{
  ...core.makeShareholding(0), id: 'grow', symbol: 'GROW', quantity: 100,
  price: 10, costBaseAud: 1000, priceGrowthPct: 10,
  saleYear: growingShares.startYear + 20
}];
const growingProjection = core.projectScenario(growingShares);
check('share growth compounds annually in nominal dollars',
  growingProjection.rows[1].shares * growingProjection.rows[1].inflationFactor >
    growingProjection.rows[0].shares * growingProjection.rows[0].inflationFactor * 1.09);
check('zero share growth preserves static nominal value', (() => {
  const flat = structuredClone(growingShares);
  flat.shareholdings[0].priceGrowthPct = 0;
  const rows = core.projectScenario(flat).rows;
  return Math.abs(
    rows[1].shares * rows[1].inflationFactor -
    rows[0].shares * rows[0].inflationFactor) < 0.01;
})());

const lossCarry = structuredClone(sample);
lossCarry.shareholdings = [
  { ...core.makeShareholding(0), id: 'loss-first', symbol: 'LOSS',
    owner: 'p0', quantity: 100, price: 5, costBaseAud: 1000,
    cgtDiscountEligible: false, saleYear: lossCarry.startYear, saleMonth: 1 },
  { ...core.makeShareholding(1), id: 'gain-later', symbol: 'GAIN',
    owner: 'p0', quantity: 100, price: 20, costBaseAud: 1000,
    cgtDiscountEligible: false, saleYear: lossCarry.startYear + 1, saleMonth: 1 }
];
const lossRows = core.projectScenario(lossCarry).rows;
check('projection carries a loss into a later gain year',
  lossRows[0].capitalLedger[0].closingLoss === 500 &&
  lossRows[1].capitalLedger[0].netCapitalGainNominal === 500 &&
  lossRows[1].capitalLedger[0].closingLoss === 0);

function makeDividendScenario(owner = 'p0', frankingEligible = true) {
  const scenario = structuredClone(sample);
  scenario.people.forEach(person => {
    person.salary = 0;
    person.super = 0;
  });
  scenario.cash = { amount: 0, interestPct: 0, owner: 'joint' };
  scenario.savings = { amount: 0, interestPct: 0, owner: 'joint' };
  scenario.lumpSumWithdrawals = [];
  scenario.otherIncomes = [];
  scenario.otherAssets = [];
  scenario.household.targetAfterTax = 0;
  scenario.household.annualBudget = 0;
  scenario.household.includeAgePension = false;
  scenario.shareholdings = [{
    ...core.makeShareholding(0),
    id: `refund-${owner}-${frankingEligible}`,
    symbol: 'TEST', owner, quantity: 100, price: 10, costBaseAud: 1000,
    priceGrowthPct: 0, dividendYieldPct: 10, frankedPct: 100,
    companyTaxRatePct: 30, frankingEligible,
    saleYear: scenario.startYear + 20
  }];
  return scenario;
}

const frankedRow = core.projectScenario(makeDividendScenario()).rows[0];
const ineligibleRow = core.projectScenario(
  makeDividendScenario('p0', false)).rows[0];
const jointRow = core.projectScenario(
  makeDividendScenario('joint', true)).rows[0];
const expectedCredit = 100 * 0.30 / 0.70;
check('eligible franking can create an estimated refund',
  Math.abs(frankedRow.components.shareDividendNet -
    (100 + expectedCredit)) < 0.01 &&
  Math.abs(frankedRow.frankingCredits - expectedCredit) < 0.01 &&
  Math.abs(frankedRow.taxRefund - expectedCredit) < 0.01);
check('ineligible holding receives cash but no franking credit',
  Math.abs(ineligibleRow.components.shareDividendNet - 100) < 0.01 &&
  ineligibleRow.frankingCredits === 0);
check('joint dividends and credits split across both tax ledgers',
  Math.abs(jointRow.taxLedger[0].frankingNominal - expectedCredit / 2) < 0.01 &&
  Math.abs(jointRow.taxLedger[1].frankingNominal - expectedCredit / 2) < 0.01);

function makeCgtFundingScenario() {
  const scenario = structuredClone(sample);
  scenario.people.forEach(person => {
    person.salary = 0;
    person.super = 0;
  });
  scenario.cash = { amount: 0, interestPct: 0, owner: 'joint' };
  scenario.savings = { amount: 0, interestPct: 0, owner: 'joint' };
  scenario.lumpSumWithdrawals = [];
  scenario.otherIncomes = [];
  scenario.otherAssets = [];
  scenario.household.targetAfterTax = 0;
  scenario.household.annualBudget = 0;
  scenario.household.includeAgePension = false;
  scenario.shareholdings = [{
    ...core.makeShareholding(0), id: 'cgt-source', symbol: 'CGT', owner: 'p0',
    quantity: 100, price: 2000, costBaseAud: 1000,
    priceGrowthPct: 0, dividendYieldPct: 0, frankedPct: 0,
    frankingEligible: false, cgtDiscountEligible: true,
    saleYear: scenario.startYear, saleMonth: 1
  }];
  return scenario;
}

const scheduledCgt = makeCgtFundingScenario();
const saleRow = core.projectScenario(scheduledCgt).rows[0];
const namedCgt = makeCgtFundingScenario();
namedCgt.shareholdings[0].saleYear = namedCgt.startYear + 20;
namedCgt.lumpSumWithdrawals = [{
  id: 'consume-sale-proceeds', amount: 100000,
  reason: 'Fictional asset purchase', month: 1, year: namedCgt.startYear,
  source: 'share:cgt-source', enabled: true
}];
const unfundedTaxRow = core.projectScenario(namedCgt).rows[0];
check('sale proceeds do not satisfy retirement income target',
  saleRow.totalIncome < saleRow.shareSaleProceeds);
check('CGT is paid from sale proceeds in savings',
  saleRow.cgtTax > 0 && saleRow.cgtFunding.drawsBySource.savings > 0);
check('CGT funding does not appear as income',
  Math.abs(saleRow.totalIncome - [
    saleRow.components.workNet,
    saleRow.components.ukStateNet,
    saleRow.components.otherIncomeNet,
    saleRow.components.shareDividendNet,
    saleRow.components.agePensionNet,
    saleRow.components.person0Super,
    saleRow.components.person1Super,
    saleRow.components.potDraw
  ].reduce((sum, value) => sum + (Number(value) || 0), 0)) < 0.01 &&
  !Object.hasOwn(saleRow.components, 'cgtFunding') &&
  !Object.hasOwn(saleRow.components, 'shareSaleProceeds'));
check('unfunded CGT is explicit and balances stay non-negative',
  unfundedTaxRow.taxFundingShortfall > 0 &&
  [unfundedTaxRow.cash, unfundedTaxRow.savings,
   ...unfundedTaxRow.superBalances].every(value => value >= 0));
check('named-source sale uses the same CGT expense path',
  unfundedTaxRow.cgtTax > 0 &&
  unfundedTaxRow.events.some(event => event.type === 'cgt-payment') &&
  unfundedTaxRow.lumpSumTotal === 100000);

console.log('\ncurrent Medicare thresholds');
check('Medicare data is for 2025-26', core.MEDICARE_BASE.effectiveYear === 2025);
check('ordinary Medicare thresholds are current',
  core.MEDICARE_BASE.ordinary.lower === 28011 && core.MEDICARE_BASE.ordinary.upper === 35013);
check('SAPTO Medicare thresholds are current',
  core.MEDICARE_BASE.sapto.lower === 44268 && core.MEDICARE_BASE.sapto.upper === 55335);

console.log('\nAge Pension income taper');
const pensionRules = core.SERVICES_AUSTRALIA_2026;
const freeArea = pensionRules.incomeFreeAreaCoupleAnnual;
const maximumPension = pensionRules.agePensionMaxCoupleAnnual;
check('couple income taper is 50 cents combined',
  pensionRules.incomeTaperCouple === 0.50);
check('income below free area leaves pension unchanged',
  core.agePensionIncomeRate(freeArea - 1) === maximumPension);
check('income at free area leaves pension unchanged',
  core.agePensionIncomeRate(freeArea) === maximumPension);
check('income above free area tapers at 50 cents combined',
  core.agePensionIncomeRate(freeArea + 1000) === maximumPension - 500);

console.log('\nAge Pension age-gap eligibility');
const pensionInputs = { assets: 0, assessableIncome: 0 };
const fullCouplePension = core.agePensionCouple(pensionInputs);

check('Age Pension eligibility helper is exported',
  typeof core.agePensionForAges === 'function');

if (typeof core.agePensionForAges === 'function') {
  const neitherEligible = core.agePensionForAges({
    ages: [66, 66], ...pensionInputs, included: true
  });
  const person0Eligible = core.agePensionForAges({
    ages: [67, 66], ...pensionInputs, included: true
  });
  const person1Eligible = core.agePensionForAges({
    ages: [66, 67], ...pensionInputs, included: true
  });
  const bothEligible = core.agePensionForAges({
    ages: [67, 67], ...pensionInputs, included: true
  });
  const switchedOff = core.agePensionForAges({
    ages: [67, 67], ...pensionInputs, included: false
  });

  check('neither eligible produces zero',
    neitherEligible.household === 0 &&
    neitherEligible.byPerson.every(value => value === 0));
  check('Person 1 receives one partnered share',
    person0Eligible.household === fullCouplePension / 2 &&
    person0Eligible.byPerson[0] === fullCouplePension / 2 &&
    person0Eligible.byPerson[1] === 0);
  check('Person 2 receives one partnered share',
    person1Eligible.household === fullCouplePension / 2 &&
    person1Eligible.byPerson[0] === 0 &&
    person1Eligible.byPerson[1] === fullCouplePension / 2);
  check('both eligible receive the combined couple rate',
    bothEligible.household === fullCouplePension &&
    bothEligible.byPerson.every(value => value === fullCouplePension / 2));
  check('Age Pension switch remains authoritative',
    switchedOff.household === 0 &&
    switchedOff.byPerson.every(value => value === 0));
}

check('younger partner super remains exempt until age 67',
  core.assessableFinancialAssets({
    cash: 0, savings: 0, shareholdings: [],
    superBalances: [100000, 200000], ages: [67, 66]
  }) === 100000 &&
  core.assessableFinancialAssets({
    cash: 0, savings: 0, shareholdings: [],
    superBalances: [100000, 200000], ages: [67, 67]
  }) === 300000);

console.log('\nprojection tax basis');
const projectionNetTax = core.projectionNetTax ?? (() => NaN);
const taxNow = projectionNetTax({
  taxableNominal: 100000,
  rebateNominal: 100000,
  inflationFactor: 1,
  year: 2027,
  seniorEligible: false
});
const factor10 = 1.03 ** 10;
const taxYear10 = projectionNetTax({
  taxableNominal: 100000 * factor10,
  rebateNominal: 100000 * factor10,
  inflationFactor: factor10,
  year: 2037,
  seniorEligible: false
});
check('fixed nominal brackets create bracket creep in real tax', taxYear10 > taxNow,
  `${taxNow} -> ${taxYear10}`);
check('projection tax matches ordinary net tax at inflation factor 1',
  taxNow === core.netTax({
    taxableIncome: 100000,
    rebateIncome: 100000,
    year: 2027,
    seniorEligible: false
  }), `${taxNow}`);
check('legislated 2026 to 2027 rate transition remains active',
  core.incomeTaxResident(50000, 2026) - core.incomeTaxResident(50000, 2027) === 268);

console.log('\nbaseline projection');
const base = core.projectScenario(sample);
check('rows produced', base.rows.length > 30);
check('no NaN in totals', base.rows.every(r =>
  Number.isFinite(r.totalAssets) && Number.isFinite(r.totalIncome) && Number.isFinite(r.tax)));
check('rows expose otherAssets = 0', base.rows.every(r => r.otherAssets === 0));
check('rows expose components.otherIncomeNet = 0',
  base.rows.every(r => r.components.otherIncomeNet === 0));

console.log('\nsalary growth above inflation');
const salaryBase = structuredClone(sample);
salaryBase.assumptions.inflationMode = 'manual';
salaryBase.assumptions.manualInflationPct = 0;
salaryBase.people[0].age = 60;
salaryBase.people[0].retireAge = 63;
salaryBase.people[0].salary = 100000;
salaryBase.people[0].salaryGrowthPct = 10;
salaryBase.people[1].salary = 0;
salaryBase.people[1].salaryGrowthPct = 0;
const salaryRows = core.projectScenario(salaryBase).rows;
check('salary growth starts after the first model year',
  Math.round(salaryRows[0].components.workGross) === 100000);
check('salary growth compounds independently',
  Math.round(salaryRows[1].components.workGross) === 110000 &&
  Math.round(salaryRows[2].components.workGross) === 121000);
check('salary growth stops at retirement', salaryRows[3].components.workGross === 0);
const noGrowth = structuredClone(salaryBase);
noGrowth.people[0].salaryGrowthPct = 0;
const noGrowthRows = core.projectScenario(noGrowth).rows;
check('zero salary growth preserves the entered real salary',
  Math.round(noGrowthRows[1].components.workGross) === 100000);
check('salary growth raises SG-supported super balance',
  salaryRows[1].superBalances[0] > noGrowthRows[1].superBalances[0]);

console.log('\nother income');
const withIncome = structuredClone(sample);
withIncome.otherIncomes = [
  { id: 'i1', label: 'Rental', currency: 'AUD', fxToAud: 1, amount: 10000, taxable: true, owner: 'joint' },
  { id: 'i2', label: 'Gift', currency: 'GBP', fxToAud: 2, amount: 1000, taxable: false, owner: 'joint' }
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
// Working-year salary can cover the target in year 0. Compare the first year in
// which the baseline actually draws from assets.
const drawTotal = row =>
  row.components.potDraw + row.components.person0Super + row.components.person1Super;
const firstDrawIndex = base.rows.findIndex(row => drawTotal(row) > 0);
check('income reduces drawdown once the baseline draws from assets',
  firstDrawIndex >= 0 && drawTotal(projIncome.rows[firstDrawIndex]) < drawTotal(base.rows[firstDrawIndex]),
  firstDrawIndex < 0
    ? 'baseline never draws from assets'
    : `year ${base.rows[firstDrawIndex].year}: ${drawTotal(projIncome.rows[firstDrawIndex])} vs ${drawTotal(base.rows[firstDrawIndex])}`);
check('income raises end-of-model assets vs baseline',
  projIncome.rows.at(-1).totalAssets > base.rows.at(-1).totalAssets,
  `${projIncome.rows.at(-1).totalAssets} vs ${base.rows.at(-1).totalAssets}`);
// CPI indexing: real (today's-dollars) value of otherIncomeNet should be roughly
// stable in later years, not eroding like a frozen pension.
const rLate = projIncome.rows[20];
check('CPI-indexed income holds real value at year 20 (>= 80% of year 0)',
  rLate.components.otherIncomeNet >= r0.components.otherIncomeNet * 0.8,
  `${r0.components.otherIncomeNet} -> ${rLate.components.otherIncomeNet}`);

function projectOwnedIncome(owner) {
  const scenario = structuredClone(sample);
  scenario.people[0].salary = 90000;
  scenario.people[1].salary = 0;
  scenario.otherIncomes = [{
    id: `income-${owner}`, label: 'Rent', currency: 'AUD', fxToAud: 1,
    amount: 30000, taxable: true, owner
  }];
  return core.projectScenario(scenario).rows[0];
}

const p0OwnedIncome = projectOwnedIncome('p0');
const p1OwnedIncome = projectOwnedIncome('p1');
const jointOwnedIncome = projectOwnedIncome('joint');
check('other income ownership changes household tax',
  p0OwnedIncome.tax > jointOwnedIncome.tax &&
  jointOwnedIncome.tax > p1OwnedIncome.tax,
  `${p0OwnedIncome.tax} / ${jointOwnedIncome.tax} / ${p1OwnedIncome.tax}`);
check('other income UI reuses the owner selector',
  html.includes('Tax owner') &&
  html.includes('data-path="${path}.owner"') &&
  html.includes("item.taxable ? '' : ' disabled'"));

const badOwner = structuredClone(sample);
badOwner.otherIncomes = [{
  id: 'bad-owner', label: 'Rent', currency: 'AUD', fxToAud: 1,
  amount: 1000, taxable: true, owner: 'somebody-else'
}];
check('invalid other income owner is rejected',
  core.validateScenario(badOwner).some(error =>
    error.path === 'otherIncomes.0.owner'));

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

console.log('\nlump-sum withdrawals');
const withLump = structuredClone(sample);
withLump.people.forEach(person => { person.salary = 0; person.super = 0; });
withLump.cash.amount = 10000;
withLump.savings.amount = 30000;
withLump.household.targetAfterTax = 0;
withLump.household.annualBudget = 0;
withLump.lumpSumWithdrawals = [{ id: 'l1', amount: 25000, reason: 'New car', month: 1, year: withLump.startYear, source: 'cash' }];
const lumpRow = core.projectScenario(withLump).rows[0];
check('lump sum is excluded from income', lumpRow.totalIncome === 0);
check('explicit source falls back through household order',
  lumpRow.lumpSumTotal === 25000 && lumpRow.lumpSumDraws.cash === 10000 && lumpRow.lumpSumDraws.savings === 15000,
  JSON.stringify(lumpRow.lumpSumDraws));
check('lump sum is recorded in Event data', lumpRow.events.some(event =>
  event.type === 'lump-sum' && event.label.includes('New car') && event.label.includes('Cash') && event.label.includes('Savings')));
const lumpTooltip = core.chartTooltipLines(
  { key: 'lumpSum', value: 25000, label: 'Lump sum withdrawal', displayFactor: 1 }, lumpRow, withLump);
check('lump tooltip contains only context and essential funding sentence',
  lumpTooltip.length === 2 && lumpTooltip[1] === '$25,000 for New car from Cash + Savings');
const normalTooltip = core.chartTooltipLines(
  { key: 'person1Super', value: 17475, label: 'Jane super drawdown', displayFactor: 1 },
  { ...lumpRow, totalIncome: 80000 }, withLump);
check('normal tooltip contains only source contribution sentence',
  normalTooltip.length === 2 && normalTooltip[1] === '$17,475 this year from Jane super drawdown, contributing to total $80,000');
const pensionTooltip = core.chartTooltipLines(
  { key: 'ukStateNet', value: 40172, label: 'UK State Pension', displayFactor: 1 },
  { ...lumpRow, year: 2062, ages: [100, 101], totalIncome: 199349,
    components: { ...lumpRow.components, ukStateGross: 45809 } },
  withLump);
check('UK pension tooltip distinguishes allocated net from gross',
  pensionTooltip[1] === '$40,172 after estimated household tax allocation' &&
  pensionTooltip[2] === '$45,809 gross UK State Pension',
  JSON.stringify(pensionTooltip));
const nominalPensionTooltip = core.chartTooltipLines(
  { key: 'ukStateNet', value: 80344, label: 'UK State Pension', displayFactor: 2 },
  { ...lumpRow, components: { ...lumpRow.components, ukStateGross: 45809 } },
  withLump);
check('nominal UK pension tooltip applies the display factor to gross',
  nominalPensionTooltip[2] === '$91,618 gross UK State Pension',
  JSON.stringify(nominalPensionTooltip));
check('tooltip markup removes target and per-year noise',
  !html.includes('Target met</span>') && !html.includes('per year</span>'));
const disabledLump = structuredClone(withLump);
disabledLump.lumpSumWithdrawals[0].enabled = false;
const disabledRow = core.projectScenario(disabledLump).rows[0];
check('disabled lump sum stays saved but is excluded from modelling',
  disabledLump.lumpSumWithdrawals.length === 1 &&
  disabledRow.lumpSumTotal === 0 &&
  disabledRow.events.every(event => event.type !== 'lump-sum'));
disabledLump.lumpSumWithdrawals[0].amount = 0;
disabledLump.lumpSumWithdrawals[0].reason = '';
check('disabled lump sum does not block validation', core.validateScenario(disabledLump).length === 0,
  JSON.stringify(core.validateScenario(disabledLump)));
const assetFunded = structuredClone(withLump);
assetFunded.cash.amount = 0;
assetFunded.savings.amount = 0;
assetFunded.otherAssets = [{ id: 'car-fund', label: 'Investment property', currency: 'AUD', fxToAud: 1, amount: 40000, growthPct: 0, disposalYear: assetFunded.startYear + 10 }];
assetFunded.lumpSumWithdrawals = [{ id: 'l2', amount: 25000, reason: 'Help kids', month: 1, year: assetFunded.startYear, source: 'asset:car-fund' }];
const assetFundedRow = core.projectScenario(assetFunded).rows[0];
check('named asset can fund a lump sum', assetFundedRow.lumpSumTotal === 25000 &&
  assetFundedRow.events.some(event => event.type === 'lump-sum' && event.label.includes('Investment property')),
  JSON.stringify(assetFundedRow.events));
check('survival milestones are ordered', (() => {
  const m = core.survivalMilestones(63, 110);
  return m[0.8] < m[0.5] && m[0.5] < m[0.2] && m[0.2] < m[0.05];
})());

console.log('\nvalidation rejects bad items');
const badIncome = structuredClone(sample);
badIncome.otherIncomes = [{ id: 'x', label: '', currency: 'EUR', fxToAud: 0, amount: -5, taxable: 'yes', owner: 'joint' }];
const incomeErrors = core.validateScenario(badIncome);
check('bad income: label/currency/fx/amount/taxable all flagged', incomeErrors.length >= 5,
  JSON.stringify(incomeErrors));
const badAsset = structuredClone(sample);
badAsset.otherAssets = [{ id: 'y', label: 'ok', currency: 'AUD', fxToAud: 1, amount: 100, growthPct: 500, disposalYear: 1999 }];
const assetErrors = core.validateScenario(badAsset);
check('bad asset: growth + disposal year flagged', assetErrors.length >= 2,
  JSON.stringify(assetErrors));
const badSalaryGrowth = structuredClone(sample);
badSalaryGrowth.people[0].salaryGrowthPct = -1;
check('negative salary growth is rejected',
  core.validateScenario(badSalaryGrowth)
    .some(error => error.path === 'people.0.salaryGrowthPct'));

function validationPathsFor(path, values, prepare = scenario => scenario) {
  return values.map(value => {
    const scenario = prepare(structuredClone(sample));
    const parts = path.split('.');
    let target = scenario;
    for (const part of parts.slice(0, -1)) target = target[part];
    target[parts.at(-1)] = value;
    return core.validateScenario(scenario).map(error => error.path);
  });
}

check('salary rejects malformed values',
  validationPathsFor('people.0.salary', [-1, 'abc', NaN, Infinity])
    .every(paths => paths.includes('people.0.salary')));
check('SG rejects malformed and out-of-range values',
  validationPathsFor('people.0.sgPct', [-1, 31, null, NaN])
    .every(paths => paths.includes('people.0.sgPct')));
check('accumulation return rejects malformed and out-of-range values',
  validationPathsFor('people.0.accumulationReturnPct', [-21, 31, null, NaN])
    .every(paths => paths.includes('people.0.accumulationReturnPct')));
check('retirement return rejects malformed and out-of-range values',
  validationPathsFor('people.0.retirementReturnPct', [-21, 31, undefined, Infinity])
    .every(paths => paths.includes('people.0.retirementReturnPct')));
check('manual inflation rejects malformed and out-of-range values',
  validationPathsFor('assumptions.manualInflationPct', [-1, 21, 'x', NaN], scenario => {
    scenario.assumptions.inflationMode = 'manual';
    return scenario;
  }).every(paths => paths.includes('assumptions.manualInflationPct')));

const validBoundaries = structuredClone(sample);
validBoundaries.people[0].salary = 0;
validBoundaries.people[0].sgPct = 0;
validBoundaries.people[0].accumulationReturnPct = -20;
validBoundaries.people[0].retirementReturnPct = 30;
validBoundaries.people[1].sgPct = 30;
validBoundaries.people[1].accumulationReturnPct = 30;
validBoundaries.people[1].retirementReturnPct = -20;
validBoundaries.assumptions.inflationMode = 'manual';
validBoundaries.assumptions.manualInflationPct = 20;
check('critical numeric boundaries validate', core.validateScenario(validBoundaries).length === 0,
  JSON.stringify(core.validateScenario(validBoundaries)));

const treasuryUnused = structuredClone(sample);
delete treasuryUnused.assumptions.manualInflationPct;
check('Treasury mode ignores unused manual inflation',
  !core.validateScenario(treasuryUnused)
    .some(error => error.path === 'assumptions.manualInflationPct'));

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
check('migrates to v11', migrated.schemaVersion === 11);
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

const schema7 = structuredClone(sample);
schema7.schemaVersion = 7;
schema7.lumpSumWithdrawals.forEach(item => delete item.enabled);
const migrated8 = core.migrateScenario(schema7);
check('schema 7 lump sums migrate enabled',
  migrated8.schemaVersion === 11 && migrated8.lumpSumWithdrawals.every(item => item.enabled === true));

const schema8 = structuredClone(sample);
schema8.schemaVersion = 8;
schema8.lumpSumWithdrawals.forEach(item => delete item.month);
const migrated9 = core.migrateScenario(schema8);
check('schema 8 lump sums migrate to January and salary growth defaults to zero',
  migrated9.schemaVersion === 11 &&
  migrated9.lumpSumWithdrawals.every(item => item.month === 1) &&
  migrated9.people.every(person => person.salaryGrowthPct === 0));

const schema9 = structuredClone(sample);
schema9.schemaVersion = 9;
schema9.people.forEach(person => delete person.salaryGrowthPct);
const migrated10 = core.migrateScenario(schema9);
check('schema 9 migrates salary growth to zero',
  migrated10.schemaVersion === 11 && migrated10.people.every(person => person.salaryGrowthPct === 0));

const invalidMonth = structuredClone(sample);
invalidMonth.lumpSumWithdrawals[0].month = 13;
check('invalid lump-sum month is reported',
  core.validateScenario(invalidMonth).some(error => error.path === 'lumpSumWithdrawals.0.month'));

console.log('\nmigration v1 -> v11 (full chain)');
const v1 = structuredClone(v5);
v1.schemaVersion = 1;
delete v1.lumpSumWithdrawals;
delete v1.household.annualBudget;
v1.people = v1.people.map(({ superAccessAge, superAccessPct, ukStateIndexation, ...rest }) => rest);
delete v1.assumptions.ukPensionsEnabled;
const chained = core.migrateScenario(structuredClone(v1));
check('v1 chains to v11', chained.schemaVersion === 11);
check('migration adds empty lump sums', Array.isArray(chained.lumpSumWithdrawals) && chained.lumpSumWithdrawals.length === 0);
check('chained validates', core.validateScenario(chained).length === 0,
  JSON.stringify(core.validateScenario(chained)[0] ?? null));

console.log('\nengine parity: no other items => matches v0.98c behaviour shape');
// Sample with UK pensions but no other items should still meet income target early.
check('no shortfall in first 5 years', base.rows.slice(0, 5).every(r => r.shortfall < 1));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
