# Age-Gap Age Pension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release deterministic simulator v1.0.7 and experimental Monte Carlo v0.6 with correct zero/half/full Age Pension treatment for couples where neither, one, or both partners have reached age 67.

**Architecture:** Add the same pure `agePensionForAges` boundary helper to both embedded deterministic cores. It will run the existing combined couple means tests once, multiply the result by the eligible-person share, and return both the household total and person allocation so tax is charged only to eligible recipients. Preserve the current schema and interface, archive deterministic v1.0.6 before editing, and Git-rename the sole Monte Carlo entry point to v0.6.

**Tech Stack:** Self-contained HTML/CSS/JavaScript, Node.js `vm`-based regression tests, Playwright/browser verification, PowerShell, Git, GitHub CLI.

---

## File Map

- Create `archive/retirement-simulator-v1.0.6.html`: exact outgoing deterministic v1.0.6 executable.
- Modify `archive/README.md`: record the immutable v1.0.6 source commit, blob, and SHA-256.
- Modify `retirement-simulator.html`: add eligibility/allocation logic, use it in projection tax, update v1.07 identity and assumptions copy.
- Rename `retirement-monte-carlo-v0.5.html` to `retirement-monte-carlo-v0.6.html`: preserve a single canonical companion while adding matching eligibility/allocation logic and v0.6 identity.
- Modify `tests/retirement-simulator.test.mjs`: unit, projection, tax-allocation, archive, version, and documentation contracts.
- Modify `tests/retirement-monte-carlo.test.mjs`: v0.6 filename/identity, helper, projection, tax-allocation, and storage-migration contracts.
- Modify `README.md`: v1.07/v0.6 usage, feature summary, and screenshot reference.
- Modify `CHANGELOG.md`: v1.07 and Monte Carlo v0.6 release notes.
- Modify `docs/MODEL-METHODOLOGY.md`: document combined means testing, the one-eligible partnered share, and younger-partner super treatment.
- Modify `docs/TESTING.md`: add the age-gap boundary matrix and new archive comparison.
- Modify `docs/DEFERRED-REVIEW.md`: retain issue #6 and mark it resolved in v1.0.7/v0.6.
- Create `docs/assets/retirement-simulator-v1.07.png`: sanitized dark-theme release screenshot.

## Task 1: Freeze the outgoing deterministic release

**Files:**
- Create: `archive/retirement-simulator-v1.0.6.html`
- Modify: `archive/README.md`
- Modify: `tests/retirement-simulator.test.mjs`

- [ ] **Step 1: Verify the outgoing executable before copying it**

Run:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath retirement-simulator.html
git rev-list -1 HEAD -- retirement-simulator.html
git rev-parse dc0d1f844e73663890941106152a07436c38c988:retirement-simulator.html
```

Expected:

```text
SHA256 348F57E7DE1BECF86D40583E71DC96747DAA50052F350C64FFD5F3DCB03A4672
dc0d1f844e73663890941106152a07436c38c988
35f1c887d2446becad6aaa0ddd99269463a1a8eb
```

If the first hash differs, stop: the outgoing executable has changed since this plan was written and its provenance must be re-established before archiving.

- [ ] **Step 2: Copy and verify the exact outgoing executable**

Run:

```powershell
Copy-Item -LiteralPath retirement-simulator.html -Destination archive\retirement-simulator-v1.0.6.html
Get-FileHash -Algorithm SHA256 -LiteralPath archive\retirement-simulator-v1.0.6.html
```

Expected: the archive hash is `348F57E7DE1BECF86D40583E71DC96747DAA50052F350C64FFD5F3DCB03A4672`.

- [ ] **Step 3: Add the archive contract to the deterministic suite**

At the top of `tests/retirement-simulator.test.mjs`, add:

```js
const ARCHIVE_106 = fileURLToPath(
  new URL('../archive/retirement-simulator-v1.0.6.html', import.meta.url)
);
```

Beside the existing archive checks, add:

```js
check('outgoing v1.0.6 executable is archived', existsSync(ARCHIVE_106));
```

- [ ] **Step 4: Record immutable provenance**

Append this row to `archive/README.md`:

```markdown
| `retirement-simulator-v1.0.6.html` | `dc0d1f8:retirement-simulator.html` | `35f1c887d2446becad6aaa0ddd99269463a1a8eb` | `348F57E7DE1BECF86D40583E71DC96747DAA50052F350C64FFD5F3DCB03A4672` |
```

- [ ] **Step 5: Run the deterministic suite**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: all checks pass, including `outgoing v1.0.6 executable is archived`.

- [ ] **Step 6: Commit the release freeze**

Run:

```powershell
git add archive/README.md archive/retirement-simulator-v1.0.6.html tests/retirement-simulator.test.mjs
git commit -m "chore: archive deterministic v1.0.6"
```

## Task 2: Define the deterministic eligibility boundary

**Files:**
- Modify: `tests/retirement-simulator.test.mjs`
- Modify: `retirement-simulator.html`

- [ ] **Step 1: Add failing helper tests**

After the existing Age Pension income-taper checks in `tests/retirement-simulator.test.mjs`, add:

```js
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
```

- [ ] **Step 2: Run the deterministic suite and verify failure**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: `FAIL Age Pension eligibility helper is exported`; the existing younger-partner super invariant passes.

- [ ] **Step 3: Add the pure eligibility helper**

Immediately after `agePensionCouple` in `retirement-simulator.html`, add:

```js
  function agePensionForAges({
    ages, assets, assessableIncome, included = true
  }) {
    const eligible = ages.map(age => age >= 67);
    const eligibleCount = eligible.filter(Boolean).length;
    if (!included || eligibleCount === 0) {
      return { eligibleCount, household: 0, byPerson: [0, 0] };
    }
    const household = agePensionCouple({ assets, assessableIncome }) *
      eligibleCount / 2;
    return {
      eligibleCount,
      household,
      byPerson: eligible.map(isEligible =>
        isEligible ? household / eligibleCount : 0)
    };
  }
```

Add `agePensionForAges` beside `agePensionCouple` in `RetirementSimulatorCore`'s exported object.

- [ ] **Step 4: Run the deterministic suite**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: all helper and existing regression checks pass.

- [ ] **Step 5: Commit the boundary helper**

Run:

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: define age-gap Age Pension eligibility"
```

## Task 3: Integrate deterministic projection and person-level tax

**Files:**
- Modify: `tests/retirement-simulator.test.mjs`
- Modify: `retirement-simulator.html`

- [ ] **Step 1: Add a controlled age-gap scenario fixture**

After the helper tests in `tests/retirement-simulator.test.mjs`, add:

```js
function makeAgeGapScenario(ages = [66, 64]) {
  const scenario = structuredClone(sample);
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
  scenario.otherIncomes = [];
  scenario.otherAssets = [];
  scenario.household.targetAfterTax = 0;
  scenario.household.annualBudget = 0;
  scenario.household.modelEndAge = 70;
  scenario.household.applyMinimumDrawdown = false;
  scenario.household.includeAgePension = true;
  scenario.assumptions.inflationMode = 'manual';
  scenario.assumptions.manualInflationPct = 0;
  return scenario;
}
```

- [ ] **Step 2: Add failing projection-transition tests**

Add:

```js
const ageGapRows = core.projectScenario(makeAgeGapScenario()).rows;
const maximumCouplePension = core.SERVICES_AUSTRALIA_2026
  .agePensionMaxCoupleAnnual;
check('age-gap projection starts at zero',
  ageGapRows[0].ages[0] === 66 && ageGapRows[0].ages[1] === 64 &&
  ageGapRows[0].components.agePensionNet === 0);
check('age-gap projection pays half when one partner reaches 67',
  ageGapRows[1].ages[0] === 67 && ageGapRows[1].ages[1] === 65 &&
  Math.abs(ageGapRows[1].components.agePensionNet -
    maximumCouplePension / 2) < 0.01);
check('age-gap projection pays full when both partners reach 67',
  ageGapRows[3].ages[0] === 69 && ageGapRows[3].ages[1] === 67 &&
  Math.abs(ageGapRows[3].components.agePensionNet -
    maximumCouplePension) < 0.01);

const reversedAgeGap = core.projectScenario(
  makeAgeGapScenario([66, 67])).rows[0];
check('age-gap projection is independent of person order',
  Math.abs(reversedAgeGap.components.agePensionNet -
    maximumCouplePension / 2) < 0.01);

const disabledAgeGap = makeAgeGapScenario([67, 67]);
disabledAgeGap.household.includeAgePension = false;
check('disabled Age Pension remains zero in projection',
  core.projectScenario(disabledAgeGap).rows[0].components.agePensionNet === 0);
```

- [ ] **Step 3: Add failing means-test and tax-allocation tests**

Add:

```js
const taperedInputs = {
  assets: core.SERVICES_AUSTRALIA_2026.homeownerAssetFreeArea + 100000,
  assessableIncome: core.SERVICES_AUSTRALIA_2026.incomeFreeAreaCoupleAnnual + 1000
};
const taperedOneEligible = core.agePensionForAges({
  ages: [67, 66], ...taperedInputs, included: true
});
check('combined means tests run before the one-eligible multiplier',
  taperedOneEligible.household ===
    core.agePensionCouple(taperedInputs) / 2);

const taxedAgeGap = makeAgeGapScenario([67, 66]);
taxedAgeGap.otherIncomes = [{
  id: 'age-gap-tax', label: 'Taxable income', currency: 'AUD', fxToAud: 1,
  amount: 40000, taxable: true, owner: 'p0'
}];
const taxedAgeGapRow = core.projectScenario(taxedAgeGap).rows[0];
const expectedPension = core.agePensionForAges({
  ages: [67, 66], assets: 0, assessableIncome: 40000, included: true
}).household;
const expectedEligibleTax = core.projectionNetTax({
  taxableNominal: 40000 + expectedPension,
  rebateNominal: 40000 + expectedPension,
  inflationFactor: 1,
  year: 2026,
  seniorEligible: true
});
check('one-eligible pension is taxed only to the eligible person',
  Math.abs(taxedAgeGapRow.taxLedger[0].baseTax.beforeFrankingNominal -
    expectedEligibleTax) < 0.01 &&
  taxedAgeGapRow.taxLedger[1].baseTax.beforeFrankingNominal === 0);
```

- [ ] **Step 4: Run the deterministic suite and verify integration failures**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: the half-rate projection and eligible-person tax checks fail because projection still requires both partners and still splits household pension equally.

- [ ] **Step 5: Replace the both-partners gate with the helper**

Replace:

```js
    const bothAgePensionAge = ages.every(age => age >= 67);
    const agePensionReal = scenario.household.includeAgePension && bothAgePensionAge
      ? agePensionCouple({
          assets: assessableAssetsReal + otherAssetsReal,
          assessableIncome: agePensionIncomeReal
        })
      : 0;
    const agePensionNominal = agePensionReal * inflationFactor;
```

with:

```js
    const agePension = agePensionForAges({
      ages,
      assets: assessableAssetsReal + otherAssetsReal,
      assessableIncome: agePensionIncomeReal,
      included: scenario.household.includeAgePension
    });
    const agePensionReal = agePension.household;
    const agePensionNominal = agePensionReal * inflationFactor;
    const agePensionByPersonNominal = agePension.byPerson.map(
      value => value * inflationFactor);
```

- [ ] **Step 6: Allocate taxable pension income by eligible person**

In `baseTaxableNominal`, replace:

```js
      agePensionNominal / 2 +
```

with:

```js
      agePensionByPersonNominal[index] +
```

Do not change household income, chart, table, or CSV use of `agePensionNominal`.

- [ ] **Step 7: Run the deterministic suite**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: all zero/half/full, reversed-order, combined-means-test, tax-allocation, and prior regression checks pass.

- [ ] **Step 8: Commit deterministic integration**

Run:

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: pay Age Pension to eligible partners"
```

## Task 4: Rename and align the Monte Carlo companion

**Files:**
- Rename: `retirement-monte-carlo-v0.5.html` to `retirement-monte-carlo-v0.6.html`
- Modify: `tests/retirement-monte-carlo.test.mjs`

- [ ] **Step 1: Pin the required v0.6 filename**

In `tests/retirement-monte-carlo.test.mjs`, replace the fixture URL and final status line:

```js
new URL('../retirement-monte-carlo-v0.6.html', import.meta.url)
```

```js
console.log('retirement-monte-carlo-v0.6 risk-mode, age-gap and stress override tests passed');
```

- [ ] **Step 2: Run the Monte Carlo suite and verify filename failure**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: fail with `ENOENT` for `retirement-monte-carlo-v0.6.html`.

- [ ] **Step 3: Perform the Git-aware rename**

Run:

```powershell
git mv retirement-monte-carlo-v0.5.html retirement-monte-carlo-v0.6.html
```

- [ ] **Step 4: Add v0.6 identity and storage-migration contracts**

Near the top of `tests/retirement-monte-carlo.test.mjs`, add:

```js
assert.match(html, /Family Retirement Monte Carlo Report v0\.6/,
  'Monte Carlo title should identify v0.6');
assert.match(html, /<span class="version">v0\.6<\/span>/,
  'Monte Carlo heading should identify v0.6');
assert.ok(
  html.includes("const STORAGE_KEY = 'family-retirement-simulator:v0.6:scenario'") &&
  html.includes("'family-retirement-simulator:v0.95:scenario'"),
  'Monte Carlo v0.6 should retain the legacy saved-scenario fallback'
);
```

- [ ] **Step 5: Add matching helper, projection, and tax-allocation tests**

After `const plain = value => JSON.parse(JSON.stringify(value));`, add:

```js
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
```

Immediately after those helper assertions, add this controlled projection fixture (the existing `monteCarloDemo` declared earlier remains in scope):

```js
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
```

- [ ] **Step 6: Run the Monte Carlo suite and verify feature/identity failures**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: v0.6 identity, storage-key, and `agePensionForAges` checks fail.

- [ ] **Step 7: Update v0.6 identity without changing schema maturity**

In `retirement-monte-carlo-v0.6.html`:

- change title, heading, and visible release note from `v0.5` to `v0.6`;
- change user-facing unsupported-feature error strings from `Monte Carlo v0.5` to `Monte Carlo v0.6`;
- leave the imported scenario schema version unchanged;
- replace the UI storage declarations with:

```js
  const STORAGE_KEY = 'family-retirement-simulator:v0.6:scenario';
  const LEGACY_STORAGE_KEYS = [
    'family-retirement-simulator:v0.95:scenario'
  ];
  const THEME_STORAGE_KEY = 'retirement-simulator-theme';
```

Replace `loadScenario`'s first line with:

```js
    const text = window.__safeStorage.getItem(STORAGE_KEY) ||
      LEGACY_STORAGE_KEYS.map(key =>
        window.__safeStorage.getItem(key)).find(Boolean);
```

- [ ] **Step 8: Add the helper to the embedded deterministic core**

Immediately after `agePensionCouple`, add the same implementation used by the deterministic v1.0.7 core:

```js
  function agePensionForAges({
    ages, assets, assessableIncome, included = true
  }) {
    const eligible = ages.map(age => age >= 67);
    const eligibleCount = eligible.filter(Boolean).length;
    if (!included || eligibleCount === 0) {
      return { eligibleCount, household: 0, byPerson: [0, 0] };
    }
    const household = agePensionCouple({ assets, assessableIncome }) *
      eligibleCount / 2;
    return {
      eligibleCount,
      household,
      byPerson: eligible.map(isEligible =>
        isEligible ? household / eligibleCount : 0)
    };
  }
```

Export it beside `agePensionCouple`.

- [ ] **Step 9: Integrate the helper and person allocation**

Replace the Monte Carlo file's `bothAgePensionAge` gate with:

```js
    const agePension = agePensionForAges({
      ages,
      assets: assessableAssetsReal,
      assessableIncome: agePensionIncomeReal,
      included: scenario.household.includeAgePension
    });
    const agePensionReal = agePension.household;
    const agePensionNominal = agePensionReal * inflationFactor;
    const agePensionByPersonNominal = agePension.byPerson.map(
      value => value * inflationFactor);
```

In `taxableNominal`, replace:

```js
      agePensionNominal / 2 +
```

with:

```js
      agePensionByPersonNominal[index] +
```

- [ ] **Step 10: Run both suites**

Run:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

Expected: both suites pass; Monte Carlo reports v0.6 and the age-gap checks pass.

- [ ] **Step 11: Verify the canonical filename contract**

Run:

```powershell
rg -n "retirement-monte-carlo-v0\.5|Monte Carlo v0\.5|Report v0\.5" . --glob '!docs/superpowers/**'
git status --short
```

Expected: stale references remain only in README/changelog/testing files scheduled for Task 5; Git reports one rename rather than two independent HTML files.

- [ ] **Step 12: Commit Monte Carlo v0.6**

Run:

```powershell
git add retirement-monte-carlo-v0.6.html tests/retirement-monte-carlo.test.mjs
git commit -m "fix: align Monte Carlo age-gap pension treatment"
```

## Task 5: Publish release metadata and modelling documentation

**Files:**
- Modify: `retirement-simulator.html`
- Modify: `tests/retirement-simulator.test.mjs`
- Modify: `tests/retirement-monte-carlo.test.mjs`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/MODEL-METHODOLOGY.md`
- Modify: `docs/TESTING.md`
- Modify: `docs/DEFERRED-REVIEW.md`

- [ ] **Step 1: Add failing deterministic release contracts**

Replace the current v1.06 identity check in `tests/retirement-simulator.test.mjs` with:

```js
check('v1.07 document version is consistent',
  html.includes('<title>Family Retirement Income Simulator v1.07</title>') &&
  html.includes('<span class="version">v1.07</span>') &&
  html.includes("const STORAGE_KEY = 'family-retirement-simulator:v1.07:scenario'") &&
  html.includes("'family-retirement-simulator:v1.06:scenario'"));
```

Add these documentation checks:

```js
check('README identifies v1.07 and Monte Carlo v0.6',
  readme.includes('v1.07') &&
  readme.includes('retirement-monte-carlo-v0.6.html') &&
  readme.includes('one partner'));
check('methodology documents one-eligible couple treatment',
  methodology.includes('one partner has reached Age Pension age') &&
  methodology.includes('half of the means-tested combined couple rate'));
check('deferred register resolves the age-gap item',
  deferredReview.includes('AIPR-003-AP-AGEGAP') &&
  deferredReview.includes('Resolved in v1.0.7'));
```

- [ ] **Step 2: Run both suites and verify documentation failures**

Run:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

Expected: deterministic v1.07 and public-documentation checks fail; engine tests continue to pass.

- [ ] **Step 3: Update deterministic release identity and storage migration**

In `retirement-simulator.html`:

- change title, heading, and visible release note from `v1.06` to `v1.07`;
- change `STORAGE_KEY` to `family-retirement-simulator:v1.07:scenario`;
- add `family-retirement-simulator:v1.06:scenario` as the first `LEGACY_STORAGE_KEYS` entry;
- change the in-app assumption from “starts only after both partners reach pension age” to:

```html
Age Pension estimate assumes a homeowner couple and excludes the principal residence. Combined couple income and asset tests apply; when only one partner has reached age 67, the estimate pays half of the means-tested combined couple rate.
```

Update the rendered methodology bullet to the same zero/half/full boundary without describing the old limitation.

- [ ] **Step 4: Update public documentation**

Add this section at the top of `CHANGELOG.md`:

```markdown
## 1.07 - 2026-07-15

- Corrected Age Pension projections for age-gapped couples: the existing combined couple means tests now pay one partnered share when exactly one person has reached age 67, with taxable pension income allocated only to that eligible person ([#6](https://github.com/dcaddick/retirement-simulator/issues/6)).
- Released the experimental Monte Carlo companion as v0.6 with the same Age Pension eligibility boundary and person-level tax allocation.
- Archived the exact outgoing deterministic v1.0.6 executable.
```

In `README.md`:

- change the deterministic identity and screenshot reference from v1.06 to v1.07;
- change the optional import filename and companion heading/copy from v0.5 to v0.6;
- add that age-gapped couples receive one partnered share when only one person is 67;
- retain the experimental warning and unsupported-feature list.

In `docs/MODEL-METHODOLOGY.md`, replace the sentence that says both partners must be 67 with:

```markdown
The normal Age Pension estimate applies the combined homeowner-couple income and assets tests. If one partner has reached Age Pension age, the household receives half of the means-tested combined couple rate and the taxable payment is allocated to that eligible person; once both partners are 67, the household receives the full combined rate. Superannuation held by a partner under Age Pension age remains excluded while it stays in the modelled super environment.
```

In `docs/TESTING.md`:

- add `archive/retirement-simulator-v1.0.6.html` to archived comparison examples;
- add zero/half/full ages, reversed partner order, person-level tax allocation, combined means-test tapering, and younger-partner super transition to the automated coverage list;
- update the companion filename to v0.6.

In `docs/DEFERRED-REVIEW.md`, retain the #6 row and change it to:

```markdown
| AIPR-003-AP-AGEGAP | [#6](https://github.com/dcaddick/retirement-simulator/issues/6) | Resolved | Combined couple means tests apply when either partner reaches age 67; one eligible partner receives one partnered share and both eligible partners receive the combined rate. | Age-gapped household income and person-level tax allocation are represented across both engines. | Required confirmation of one-partner eligibility and combined means-test mechanics. | Services Australia and social-security policy review recorded in the v1.0.7 design. | Resolved in v1.0.7/v0.6 with zero/half/full boundary, eligible-person tax allocation and regression coverage. |
```

- [ ] **Step 5: Remove every stale active-release reference**

Run:

```powershell
rg -n "retirement-monte-carlo-v0\.5|Monte Carlo v0\.5|Report v0\.5|v1\.06 document version|starts only after both partners" . --glob '!docs/superpowers/**' --glob '!archive/**' --glob '!CHANGELOG.md'
```

Expected: no matches. Historical changelog references to past behaviour remain valid release history; all active instructions and test contracts use the new identities.

- [ ] **Step 6: Run both suites and check the diff**

Run:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
git diff --check
```

Expected: both suites pass and `git diff --check` produces no output.

- [ ] **Step 7: Commit release metadata and documentation**

Run:

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs tests/retirement-monte-carlo.test.mjs README.md CHANGELOG.md docs/MODEL-METHODOLOGY.md docs/TESTING.md docs/DEFERRED-REVIEW.md
git commit -m "docs: publish age-gap pension methodology"
```

## Task 6: Complete automated and browser acceptance

**Files:**
- Create: `docs/assets/retirement-simulator-v1.07.png`
- Verify: `retirement-simulator.html`
- Verify: `retirement-monte-carlo-v0.6.html`
- Verify: all modified tests and documentation

- [ ] **Step 1: Run the full local test matrix**

Run:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
git diff --check
```

Expected: both suites pass, including release/documentation contracts, and the diff check is silent.

- [ ] **Step 2: Serve the repository locally**

Run from the repository root:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Expected: the deterministic page is available at `http://127.0.0.1:4173/retirement-simulator.html` and the companion at `http://127.0.0.1:4173/retirement-monte-carlo-v0.6.html`.

- [ ] **Step 3: Verify deterministic age-gap behaviour in a real browser**

Using fictional data only:

1. Open the deterministic page at 1440×1000 in dark theme.
2. Set Person 1 age to 67 and Person 2 age to 66.
3. Set both salaries, cash, savings, shares, other income, other assets, and lump sums to zero.
4. Set preferred income and essential budget to zero.
5. Confirm the chart/table show approximately half the maximum combined Age Pension.
6. Reverse the ages and confirm the household amount is unchanged.
7. Set both ages to 67 and confirm the household amount doubles.
8. Disable Include Age Pension and confirm the amount becomes zero.
9. Repeat at 390×844 and in light theme.
10. Confirm zero console errors and warnings at each viewport/theme combination.

- [ ] **Step 4: Verify Monte Carlo v0.6 in a real browser**

Open `retirement-monte-carlo-v0.6.html` at desktop and 390×844 widths. Confirm:

- title and visible badge say v0.6 and experimental;
- a fictional 67/66 scenario produces a one-partner Age Pension rather than zero;
- the results render without layout regressions;
- the browser console contains no errors or warnings.

- [ ] **Step 5: Capture the sanitized release screenshot**

Restore the deterministic fictional sample, use dark theme at 1440×1000, keep the chart as the primary hero item, and save the screenshot as:

```text
docs/assets/retirement-simulator-v1.07.png
```

Inspect the image before staging it. It must contain no personal names, balances, filenames, browser paths, downloads, or imported scenarios beyond the repository's fictional sample.

- [ ] **Step 6: Re-verify archive integrity and repository scope**

Run:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath archive\retirement-simulator-v1.0.6.html
rg -n "retirement-monte-carlo-v0\.5|Monte Carlo v0\.5|Report v0\.5" . --glob '!docs/superpowers/**' --glob '!CHANGELOG.md'
git status --short
git diff --check
```

Expected:

- archive hash remains `348F57E7DE1BECF86D40583E71DC96747DAA50052F350C64FFD5F3DCB03A4672`;
- no stale active v0.5 references remain;
- only the new screenshot is uncommitted after prior task commits;
- the diff check is silent.

- [ ] **Step 7: Commit browser evidence**

Run:

```powershell
git add docs/assets/retirement-simulator-v1.07.png
git commit -m "docs: add v1.07 release screenshot"
```

## Task 7: Publish and close the issue

**Files:**
- Verify: repository and GitHub release state

- [ ] **Step 1: Verify final local state**

Run:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
git status --short --branch
git log -6 --oneline
```

Expected: both suites pass and the working tree is clean on the intended release branch.

- [ ] **Step 2: Merge to main if execution used a feature worktree**

From the canonical checkout, run:

```powershell
git merge --ff-only codex/age-gap-age-pension
```

Skip this command only if implementation was intentionally executed directly on `main`. Expected: a fast-forward merge with no conflict.

- [ ] **Step 3: Push main and verify CI**

Run:

```powershell
git push origin main
gh run watch --repo dcaddick/retirement-simulator --exit-status
```

Expected: the Regression tests workflow succeeds on the pushed `main` commit.

- [ ] **Step 4: Tag and publish deterministic v1.0.7 with both executables**

Run:

```powershell
git tag -a v1.0.7 -m "Retirement Simulator v1.0.7"
git push origin v1.0.7
gh release create v1.0.7 retirement-simulator.html retirement-monte-carlo-v0.6.html --repo dcaddick/retirement-simulator --title "Retirement Simulator v1.0.7" --notes "Corrects Age Pension estimates for age-gapped couples and publishes the aligned experimental Monte Carlo v0.6 companion. See CHANGELOG.md for modelling details and limitations."
```

Expected: GitHub release `v1.0.7` contains exactly the deterministic stable filename and the versioned Monte Carlo v0.6 companion.

- [ ] **Step 5: Close issue #6 only after release verification**

Run:

```powershell
gh issue close 6 --repo dcaddick/retirement-simulator --reason completed --comment "Resolved and regression-tested in deterministic v1.0.7 and experimental Monte Carlo v0.6: combined couple means tests now pay one partnered share when exactly one partner is 67, allocate taxable pension income only to the eligible person, and transition to the combined rate when both partners are eligible."
```

Expected: issue #6 is closed as completed.

- [ ] **Step 6: Confirm release and repository state**

Run:

```powershell
gh release view v1.0.7 --repo dcaddick/retirement-simulator
gh issue view 6 --repo dcaddick/retirement-simulator --json number,state,url
git status --short --branch
git rev-list --left-right --count origin/main...main
```

Expected: release v1.0.7 is published, issue #6 is closed, the tree is clean, and the divergence count is `0 0`.

## Final Acceptance Checklist

- [ ] Deterministic ages 66/66, 67/66, 66/67, and 67/67 produce zero, half, half, and full combined couple treatment.
- [ ] Monte Carlo v0.6 implements the same boundary and retains experimental labelling.
- [ ] The one-eligible payment is allocated only to the eligible person's taxable-income path.
- [ ] Combined couple income and asset tests run before the eligibility multiplier.
- [ ] Younger-partner super remains exempt below 67 and becomes assessable at 67 under the existing model boundary.
- [ ] Include Age Pension remains authoritative and the scenario schema is unchanged.
- [ ] Same-age regression coverage remains green.
- [ ] Deterministic v1.0.6 is archived with the verified source and SHA-256.
- [ ] Only `retirement-monte-carlo-v0.6.html` remains as the canonical companion entry point.
- [ ] README, changelog, methodology, testing guide, in-app assumptions, and deferred register agree on the release and calculation.
- [ ] Desktop/narrow and dark/light browser checks pass with zero console errors or warnings.
- [ ] The v1.07 screenshot contains only fictional sample data.
- [ ] CI passes, release v1.0.7 is published, and issue #6 closes only afterward.
