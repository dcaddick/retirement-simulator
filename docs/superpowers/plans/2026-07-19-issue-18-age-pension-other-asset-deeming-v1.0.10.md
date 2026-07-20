# Issue #18 Age Pension Other-Asset Deeming v1.0.10 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let deterministic-simulator users classify individual Other Assets for Age Pension deeming and publish the backward-compatible change as v1.0.10.

**Architecture:** Add one schema-13 boolean to the existing Other Asset record, derive total and deemable live balances through a pure helper after asset transactions, and add only the selected balance to the existing Age Pension deeming input. Keep CSHC and all Monte Carlo artefacts unchanged, reuse the current single-file UI and projection boundaries, and preserve v1.0.9 before advancing deterministic release identity.

**Tech Stack:** Standalone HTML/CSS/JavaScript, Node.js `vm` regression harness, Git/GitHub Actions, browser acceptance with Playwright or an equivalent real-browser workflow.

---

## File Map

- Create `archive/retirement-simulator-v1.0.9.html` as the exact outgoing deterministic executable from tag `v1.0.9`.
- Modify `archive/README.md` to record the v1.0.9 tag path and Git blob.
- Modify `.github/workflows/test.yml` to enforce v1.0.9 archive provenance.
- Modify `retirement-simulator.html` for schema 13, the Other Asset control, assessment helper, projection integration, assumptions disclosure and deterministic v1.10 identity.
- Modify `tests/retirement-simulator.test.mjs` for archive, schema, validation, assessment, transaction, CSHC, UI, documentation and release contracts.
- Modify `README.md` for the deterministic feature, v1.10 screenshot and release description.
- Modify `CHANGELOG.md` to add the dated v1.10 deterministic release while retaining unrelated `Unreleased` entries.
- Modify `docs/MODEL-METHODOLOGY.md` to document the Age Pension/CSHC classification boundary and annual timing.
- Modify `docs/TESTING.md` to document deterministic automated and browser coverage.
- Create `docs/assets/retirement-simulator-v1.10.png` as the sanitized deterministic release screenshot.

Do not modify `retirement-monte-carlo-v0.7.html`, `tests/retirement-monte-carlo.test.mjs`, Monte Carlo documentation text or Monte Carlo release assets.

### Task 1: Preserve and enforce outgoing v1.0.9 provenance

**Files:**
- Create: `archive/retirement-simulator-v1.0.9.html`
- Modify: `archive/README.md:5-18`
- Modify: `.github/workflows/test.yml:21-30`
- Modify: `tests/retirement-simulator.test.mjs:1-35,159-164`

- [ ] **Step 1: Add the failing archive-existence test**

Add this constant after `ARCHIVE_108`:

```js
const ARCHIVE_109 = fileURLToPath(
  new URL('../archive/retirement-simulator-v1.0.9.html', import.meta.url)
);
```

Add this assertion after the v1.0.8 archive assertion:

```js
check('outgoing v1.0.9 executable is archived', existsSync(ARCHIVE_109));
```

- [ ] **Step 2: Run the deterministic suite and verify the new test fails**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: the suite exits non-zero with `FAIL outgoing v1.0.9 executable is archived`.

- [ ] **Step 3: Copy the untouched outgoing executable before editing it**

Run from the repository root:

```powershell
Copy-Item -LiteralPath 'retirement-simulator.html' -Destination 'archive\retirement-simulator-v1.0.9.html'
git hash-object archive/retirement-simulator-v1.0.9.html
git rev-parse v1.0.9:retirement-simulator.html
```

Expected: both Git object IDs are exactly:

```text
1fbb3a5c086f49ea33e66d106468a85812908eeb
```

- [ ] **Step 4: Record and enforce the provenance**

Append this row to `archive/README.md`:

```markdown
| `retirement-simulator-v1.0.9.html` | `v1.0.9:retirement-simulator.html` | `1fbb3a5c086f49ea33e66d106468a85812908eeb` | — |
```

Add this workflow step after the v1.0.8 check:

```yaml
      - name: Verify archived v1.0.9 source
        run: test "$(git hash-object archive/retirement-simulator-v1.0.9.html)" = "$(git rev-parse v1.0.9:retirement-simulator.html)"
```

- [ ] **Step 5: Run the archive tests and integrity checks**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
git hash-object archive/retirement-simulator-v1.0.9.html
```

Expected: the deterministic suite passes, `git diff --check` is silent and the archive hash remains `1fbb3a5c086f49ea33e66d106468a85812908eeb`.

- [ ] **Step 6: Commit the archive boundary**

```powershell
git add archive/retirement-simulator-v1.0.9.html archive/README.md .github/workflows/test.yml tests/retirement-simulator.test.mjs
git commit -m "chore: archive deterministic v1.0.9"
```

### Task 2: Introduce the schema-13 Other Asset contract

**Files:**
- Modify: `retirement-simulator.html:471,889-1055,1251-1261,2340-2367`
- Modify: `tests/retirement-simulator.test.mjs:70-102,165-208,1174-1207,1435-1505`

- [ ] **Step 1: Write failing schema, migration and validation tests**

Change the schema assertion to:

```js
check('schema version is 13', core.SCHEMA_VERSION === 13);
```

Add these checks in the schema section:

```js
check('new Other Assets default outside Age Pension deeming',
  core.makeOtherAsset(0).agePensionDeemed === false);

const schema12 = structuredClone(sample);
schema12.schemaVersion = 12;
schema12.otherAssets = [{
  id: 'legacy-asset', label: 'Boat', currency: 'AUD', fxToAud: 1,
  amount: 100000, growthPct: 0, disposalYear: schema12.startYear + 10
}];
const migrated13 = core.migrateScenario(schema12);
check('schema 12 Other Assets migrate outside Age Pension deeming',
  migrated13.schemaVersion === 13 &&
  migrated13.otherAssets[0].agePensionDeemed === false);

const invalidDeemingFlag = structuredClone(sample);
invalidDeemingFlag.otherAssets = [{
  ...core.makeOtherAsset(0), id: 'bad-deeming', label: 'Private loan',
  agePensionDeemed: 'yes'
}];
check('Other Asset deeming classification must be boolean',
  core.validateScenario(invalidDeemingFlag).some(error =>
    error.path === 'otherAssets.0.agePensionDeemed'));
```

Update every migration assertion whose expected final deterministic schema is `12` to `13`. Update the headings `migration v1 -> v12`, `v1 chains to v12` and `JSON round-trip retains all schema-v12 survivor fields` to use `v13`.

- [ ] **Step 2: Run the deterministic suite and verify the schema tests fail**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: failures report schema 12, a missing `agePensionDeemed` default and no field-specific validation error.

- [ ] **Step 3: Add the minimal schema and migration implementation**

Change the core version:

```js
const SCHEMA_VERSION = 13;
```

Add this migration after the existing schema-11 block:

```js
if (current.schemaVersion === 12) {
  const migrated = structuredClone(current);
  migrated.schemaVersion = 13;
  migrated.otherAssets = (migrated.otherAssets ?? []).map(asset => ({
    ...asset,
    agePensionDeemed: false
  }));
  current = migrated;
}
```

Add the default to `makeOtherAsset`:

```js
function makeOtherAsset(index) {
  return {
    id: `asset-${Date.now()}-${index}`,
    label: '',
    currency: 'AUD',
    fxToAud: 1,
    amount: 0,
    agePensionDeemed: false,
    growthPct: 0,
    disposalYear: new Date().getFullYear() + 5
  };
}
```

Add this validation inside the Other Asset loop:

```js
if (typeof item.agePensionDeemed !== 'boolean') {
  add(`${path}.agePensionDeemed`,
    'Age Pension deeming selection must be true or false.');
}
```

- [ ] **Step 4: Add the flag to explicit test fixtures**

For every hand-written Other Asset fixture that is intended to validate, add:

```js
agePensionDeemed: false
```

Leave `schema12.otherAssets[0]` without the property so the migration test remains meaningful. For deliberately invalid fixtures, add the correct boolean unless that fixture is specifically testing `agePensionDeemed`.

- [ ] **Step 5: Run the deterministic suite and stale-schema scan**

Run:

```powershell
node tests/retirement-simulator.test.mjs
rg -n "schema version is 12|schemaVersion === 12|v1 chains to v12|migration v1 -> v12" tests/retirement-simulator.test.mjs
git diff --check
```

Expected: the suite passes, the scan returns no stale final-schema assertions other than the intentional `schema12.schemaVersion = 12` migration fixture, and the whitespace check is silent.

- [ ] **Step 6: Commit the schema contract**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: classify Other Assets for Age Pension deeming"
```

### Task 3: Apply the classification at the projection boundary

**Files:**
- Modify: `retirement-simulator.html:1251-1314,1518-1553,1755-1914,2505-2578`
- Modify: `tests/retirement-simulator.test.mjs:1174-1207,1209-1385`

- [ ] **Step 1: Add failing pure-helper tests**

Add this block at the start of the Other Assets test section:

```js
const assessmentBalances = core.otherAssetAssessmentBalances([
  { value: 500000, sold: false, agePensionDeemed: true },
  { value: 80000, sold: false, agePensionDeemed: false },
  { value: 40000, sold: true, agePensionDeemed: true }
]);
check('Other Asset assessment balances separate total and deemable value',
  assessmentBalances.totalNominal === 580000 &&
  assessmentBalances.deemableNominal === 500000,
  JSON.stringify(assessmentBalances));
```

- [ ] **Step 2: Add failing projection tests for the pension and CSHC boundary**

Add this fixture and assertions after the existing Other Asset growth checks:

```js
function privateLoanScenario(agePensionDeemed) {
  const scenario = structuredClone(sample);
  scenario.people.forEach(person => {
    person.age = 67;
    person.retireAge = 67;
    person.superAccessAge = 67;
    person.super = 0;
    person.salary = 0;
    person.ukStateAnnualGbp = 0;
  });
  scenario.cash.amount = 0;
  scenario.savings.amount = 0;
  scenario.shareholdings = [];
  scenario.otherIncomes = [];
  scenario.lumpSumWithdrawals = [];
  scenario.household.targetAfterTax = 100000;
  scenario.household.annualBudget = 100000;
  scenario.household.includeAgePension = true;
  scenario.otherAssets = [{
    id: 'private-loan', label: 'Private loan', currency: 'AUD', fxToAud: 1,
    amount: 500000, agePensionDeemed, growthPct: 0,
    disposalYear: scenario.startYear + 20
  }];
  return scenario;
}

const unflaggedLoanRow = core.projectScenario(privateLoanScenario(false)).rows[0];
const flaggedLoanRow = core.projectScenario(privateLoanScenario(true)).rows[0];
check('flagged private loan reduces Age Pension through deemed income',
  flaggedLoanRow.components.agePensionNet <
    unflaggedLoanRow.components.agePensionNet,
  `${flaggedLoanRow.components.agePensionNet} vs ${unflaggedLoanRow.components.agePensionNet}`);
check('classification does not change asset value',
  flaggedLoanRow.otherAssets === unflaggedLoanRow.otherAssets &&
  flaggedLoanRow.totalAssets === unflaggedLoanRow.totalAssets);

const unflaggedCshcScenario = privateLoanScenario(false);
unflaggedCshcScenario.household.includeAgePension = false;
const flaggedCshcScenario = privateLoanScenario(true);
flaggedCshcScenario.household.includeAgePension = false;
const unflaggedCshcRow = core.projectScenario(unflaggedCshcScenario).rows[0];
const flaggedCshcRow = core.projectScenario(flaggedCshcScenario).rows[0];
check('classification does not change CSHC assessed income',
  flaggedCshcRow.cshc.assessedIncome ===
    unflaggedCshcRow.cshc.assessedIncome);

const flaggedLoanRoundTrip = core.importScenario(
  core.exportScenario(privateLoanScenario(true)));
check('JSON round-trip preserves Other Asset deeming classification',
  flaggedLoanRoundTrip.otherAssets[0].agePensionDeemed === true);
```

- [ ] **Step 3: Run the deterministic suite and verify the assessment tests fail**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: `otherAssetAssessmentBalances` is missing and flagged/unflagged pension results remain equal.

- [ ] **Step 4: Add and export the pure assessment helper**

Add after `otherItemFx`:

```js
function otherAssetAssessmentBalances(otherAssets) {
  return otherAssets.reduce((balances, asset) => {
    if (asset.sold) return balances;
    const value = Number.isFinite(asset.value) ? Math.max(0, asset.value) : 0;
    balances.totalNominal += value;
    if (asset.agePensionDeemed) balances.deemableNominal += value;
    return balances;
  }, { totalNominal: 0, deemableNominal: 0 });
}
```

Add `otherAssetAssessmentBalances` beside `otherItemFx` in `RetirementSimulatorCore`.

- [ ] **Step 5: Replace the pre-transaction accumulator with live balances**

In the Other Asset growth loop, remove the `otherAssetsNominal` accumulator and do not add `asset.value` during iteration. Remove this stale named-liquidation adjustment:

```js
if (withdrawal.source.startsWith('asset:')) otherAssetsNominal = Math.max(0, otherAssetsNominal - named.drawn);
```

Immediately after all due lump sums have been processed, derive the live balances:

```js
const {
  totalNominal: otherAssetsNominal,
  deemableNominal: deemableOtherAssetsNominal
} = otherAssetAssessmentBalances(state.otherAssets);
```

At the Age Pension boundary, add:

```js
const otherAssetsReal = otherAssetsNominal / inflationFactor;
const deemableOtherAssetsReal = deemableOtherAssetsNominal / inflationFactor;
```

Change only the deeming call:

```js
deemedIncome(
  assessableAssetsReal + deemableOtherAssetsReal,
  state.lifecycle.householdStatus === 'survivor' ? 'single' : 'couple'
)
```

Keep the assets-test input unchanged:

```js
assets: assessableAssetsReal + otherAssetsReal
```

Do not pass either Other Asset balance to `cshcEstimate`.

- [ ] **Step 6: Run the focused deterministic suite**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: all deterministic tests pass, including the pure split, pension difference, identical asset values and CSHC invariance.

- [ ] **Step 7: Add transaction and survivor regression cases**

Add these cases using `privateLoanScenario`:

```js
const disposedLoan = privateLoanScenario(true);
disposedLoan.otherAssets[0].disposalYear = disposedLoan.startYear;
const disposedLoanRow = core.projectScenario(disposedLoan).rows[0];
const disposedUnflaggedLoan = privateLoanScenario(false);
disposedUnflaggedLoan.otherAssets[0].disposalYear = disposedUnflaggedLoan.startYear;
const disposedUnflaggedLoanRow = core.projectScenario(disposedUnflaggedLoan).rows[0];
check('disposed deemed asset is assessed once through savings',
  disposedLoanRow.otherAssets === 0 &&
  disposedLoanRow.savings > 0 &&
  disposedLoanRow.components.agePensionNet ===
    disposedUnflaggedLoanRow.components.agePensionNet);

const partialLoan = privateLoanScenario(true);
partialLoan.otherAssets[0].amount = 700000;
partialLoan.lumpSumWithdrawals = [{
  id: 'loan-draw', enabled: true, amount: 200000,
  reason: 'Capital repayment', month: 1, year: partialLoan.startYear,
  source: 'asset:private-loan'
}];
const partialLoanRow = core.projectScenario(partialLoan).rows[0];
check('partial named liquidation leaves only the residual asset',
  partialLoanRow.otherAssets === 500000 &&
  partialLoanRow.lumpSumTotal === 200000);

const fullLoan = privateLoanScenario(true);
fullLoan.lumpSumWithdrawals = [{
  id: 'loan-close', enabled: true, amount: 500000,
  reason: 'Loan repaid', month: 1, year: fullLoan.startYear,
  source: 'asset:private-loan'
}];
const fullLoanRow = core.projectScenario(fullLoan).rows[0];
check('full named liquidation removes the deemed asset balance',
  fullLoanRow.otherAssets === 0 && fullLoanRow.lumpSumTotal === 500000);
```

Extend the existing `survivorPensionScenario` fixture with a flagged Other Asset and compare it with an otherwise identical unflagged copy:

```js
const unflaggedSurvivorDeemingScenario = structuredClone(survivorPensionScenario);
unflaggedSurvivorDeemingScenario.otherAssets = [{
  id: 'survivor-loan', label: 'Survivor private loan',
  currency: 'AUD', fxToAud: 1, amount: 300000,
  agePensionDeemed: false, growthPct: 0,
  disposalYear: unflaggedSurvivorDeemingScenario.startYear + 20
}];
const flaggedSurvivorDeemingScenario =
  structuredClone(unflaggedSurvivorDeemingScenario);
flaggedSurvivorDeemingScenario.otherAssets[0].agePensionDeemed = true;
const unflaggedSurvivorRow =
  core.projectScenario(unflaggedSurvivorDeemingScenario).rows[1];
const flaggedSurvivorRow =
  core.projectScenario(flaggedSurvivorDeemingScenario).rows[1];
check('survivor projection applies single-person deeming to flagged assets',
  flaggedSurvivorRow.agePensionStatus === 'single' &&
  flaggedSurvivorRow.components.agePensionNet <
    unflaggedSurvivorRow.components.agePensionNet);
```

- [ ] **Step 8: Run tests and commit the assessment engine**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
```

Expected: all tests pass and the whitespace check is silent.

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: deem selected Other Assets for Age Pension"
```

### Task 4: Expose and explain the deterministic control

**Files:**
- Modify: `retirement-simulator.html:294-358,3095-3125,4020-4052`
- Modify: `tests/retirement-simulator.test.mjs:140-165,234-280,1155-1207`
- Modify: `README.md:51-79`
- Modify: `docs/MODEL-METHODOLOGY.md:59-77,101-110`
- Modify: `docs/TESTING.md:3-16,31-65,70-79`

- [ ] **Step 1: Add failing interface and disclosure tests**

Add these assertions near the existing UI contract tests:

```js
check('Other Asset editor exposes the Age Pension deeming option',
  html.includes('data-path="${path}.agePensionDeemed"') &&
  html.includes('Treat as financial investment for Age Pension deeming'));
check('Other Asset copy separates Age Pension deeming from CSHC',
  html.includes('does not change CSHC treatment') &&
  html.includes('enter actual returns separately under Other Income'));
check('assumptions disclose selected deemed Other Assets',
  html.includes('agePensionDeemed === true') &&
  html.includes('selected for Age Pension deeming'));
check('public methodology documents Other Asset assessment classification',
  methodology.includes('financial investment for Age Pension deeming') &&
  methodology.includes('account-based income streams') &&
  methodology.includes('Other Income'));
check('browser checklist covers Other Asset deeming',
  testingGuide.includes('flagged and unflagged Other Assets') &&
  testingGuide.includes('CSHC assessed income remains unchanged'));
```

- [ ] **Step 2: Run the deterministic suite and verify the disclosure tests fail**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: the five new interface/documentation checks fail.

- [ ] **Step 3: Add the checkbox to the existing editor**

Insert after Current value in `otherAssetFields`:

```js
<label><span class="k">Treat as financial investment for Age Pension deeming</span>
  <input type="checkbox" data-path="${path}.agePensionDeemed"${item.agePensionDeemed ? ' checked' : ''}>
</label>
```

Use the existing delegated `data-path` input handling; do not add a dedicated event handler.

- [ ] **Step 4: Replace the blanket non-deeming copy**

Update the Other Income/Assets subtext and methodology bullet to communicate exactly:

```text
All Other Assets count in the Age Pension assets test. Select “Treat as financial investment for Age Pension deeming” only when appropriate; the selection does not change CSHC treatment. Enter actual interest, rent or other returns separately under Other Income. Disposal proceeds move to savings and CGT is not modelled.
```

Retain the existing annual growth, disposal and CGT limitations around this text.

- [ ] **Step 5: Update assumptions and source output**

Calculate the selected count beside `otherAssetCount`:

```js
const deemedOtherAssetCount = (scenario.otherAssets ?? [])
  .filter(asset => asset.agePensionDeemed === true).length;
```

Replace the asset portion of the assumptions item with:

```js
`and ${otherAssetCount} asset (own growth rate; all in the assets test; ` +
`${deemedOtherAssetCount} selected for Age Pension deeming; disposal proceeds ` +
'to savings; actual returns entered separately; no CGT modelled)'
```

Add the existing deeming URL to `renderSources`:

```js
['Services Australia deeming', core.SERVICES_AUSTRALIA_2026.deemingUrl],
```

- [ ] **Step 6: Update deterministic public documentation**

In `README.md`, add a feature bullet stating that Other Assets can be individually selected for Age Pension deeming while all remain in the assets test.

In `docs/MODEL-METHODOLOGY.md`, add a paragraph under Assets and other income using this contract:

```markdown
Every Other Asset counts in the Age Pension assets test. An asset selected as a financial investment also contributes its remaining value to the financial-assets balance used for Age Pension deeming. Scheduled disposal moves the value to savings before assessment, while named liquidation immediately funds the nominated lump sum, so disposed value is not counted twice. The selection does not add ordinary Other Assets to CSHC deeming, which remains limited here to account-based income streams. Actual interest, rent and other returns are separate Other Income entries. The user is responsible for choosing the appropriate classification.
```

In `docs/TESTING.md`, add deterministic-suite and browser-checklist coverage for flagged/unflagged assets, mixed classifications, disposal, partial/full named liquidation, survivor thresholds and unchanged CSHC assessed income.

- [ ] **Step 7: Run tests and commit the interface/documentation slice**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
```

Expected: all deterministic checks pass and `git diff --check` is silent.

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs README.md docs/MODEL-METHODOLOGY.md docs/TESTING.md
git commit -m "docs: explain Other Asset Age Pension treatment"
```

### Task 5: Prepare deterministic v1.0.10 identity and release evidence

**Files:**
- Modify: `retirement-simulator.html:7,193,416,2586-2601`
- Modify: `tests/retirement-simulator.test.mjs:33-36,154-164,236-262`
- Modify: `README.md:12-20,51-79`
- Modify: `CHANGELOG.md:5-18`
- Modify: `docs/TESTING.md:18-29`
- Create: `docs/assets/retirement-simulator-v1.10.png`

- [ ] **Step 1: Add failing deterministic release-contract tests**

Rename `SCREENSHOT_109` to `SCREENSHOT_110` and point it to:

```js
const SCREENSHOT_110 = fileURLToPath(
  new URL('../docs/assets/retirement-simulator-v1.10.png', import.meta.url)
);
```

Replace the version assertion with:

```js
check('v1.10 document version is consistent',
  html.includes('<title>Family Retirement Income Simulator v1.10</title>') &&
  html.includes('<span class="version">v1.10</span>') &&
  html.includes("const STORAGE_KEY = 'family-retirement-simulator:v1.10:scenario'") &&
  html.includes("'family-retirement-simulator:v1.09:scenario'"));
```

Replace the README and screenshot assertions with:

```js
check('README identifies deterministic v1.10',
  readme.includes('v1.10') &&
  readme.includes('financial investment for Age Pension deeming'));
check('v1.10 release screenshot exists', existsSync(SCREENSHOT_110));
check('changelog records deterministic v1.10 and Issue #18',
  changelog.includes('## 1.10 - 2026-07-19') &&
  changelog.includes('issues/18') &&
  changelog.includes('Archived the exact outgoing deterministic v1.0.9 executable'));
```

- [ ] **Step 2: Run the deterministic suite and verify release-contract failures**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: v1.10 identity, screenshot and changelog assertions fail.

- [ ] **Step 3: Advance deterministic identity only**

Make these exact replacements in `retirement-simulator.html`:

```text
Family Retirement Income Simulator v1.09 -> Family Retirement Income Simulator v1.10
<span class="version">v1.09</span> -> <span class="version">v1.10</span>
<b>v1.09.</b> -> <b>v1.10.</b>
family-retirement-simulator:v1.09:scenario -> family-retirement-simulator:v1.10:scenario
```

Add the old current key as the first fallback:

```js
'family-retirement-simulator:v1.09:scenario',
```

Keep every older fallback below it.

- [ ] **Step 4: Add the v1.10 changelog section without moving unrelated work**

Leave all Monte Carlo entries under `Unreleased`. Insert below them:

```markdown
## 1.10 - 2026-07-19

- Added a per-asset option to include selected Other Assets as financial investments in Age Pension deeming while preserving assets-test treatment and leaving CSHC unchanged ([#18](https://github.com/dcaddick/retirement-simulator/issues/18)).
- Added schema 13 migration with existing Other Assets defaulted outside deeming.
- Archived the exact outgoing deterministic v1.0.9 executable.
```

- [ ] **Step 5: Update release-facing README and archive guidance**

Change the screenshot link and surrounding copy to v1.10 and describe the fictional private-loan classification without presenting personal data or advice. Add `archive/retirement-simulator-v1.0.9.html` to the archived-release comparison in `docs/TESTING.md`.

- [ ] **Step 6: Capture the sanitized release screenshot**

Use the Playwright/browser workflow against the local `retirement-simulator.html` and only fictional sample data:

1. Add one Other Asset labelled `Private loan example` with value `$500,000`, 0% growth, a distant disposal year and the Age Pension deeming checkbox selected.
2. Keep both fictional people, the default theme and all personal data absent.
3. Expand Other Income/Assets so the selected checkbox and recalculated dashboard context are visible.
4. Capture a full-width desktop screenshot to `docs/assets/retirement-simulator-v1.10.png`.
5. Inspect the saved PNG and confirm names, balances and labels are fictional.

- [ ] **Step 7: Run release-contract tests and check the archive remained exact**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git hash-object archive/retirement-simulator-v1.0.9.html
git diff --check
```

Expected: all tests pass, the archive hash is `1fbb3a5c086f49ea33e66d106468a85812908eeb` and the whitespace check is silent.

- [ ] **Step 8: Commit deterministic v1.0.10 preparation**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs README.md CHANGELOG.md docs/TESTING.md docs/assets/retirement-simulator-v1.10.png
git commit -m "release: prepare deterministic simulator v1.0.10"
```

### Task 6: Verify implementation, browser behaviour and release readiness

**Files:**
- Modify only if verification exposes a defect in an already scoped file.

- [ ] **Step 1: Run the automated and static verification set**

Run:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
git diff --check
rg -n "v1\.09|schema version is 12|in the assets test, not deemed" retirement-simulator.html README.md CHANGELOG.md docs/MODEL-METHODOLOGY.md docs/TESTING.md tests/retirement-simulator.test.mjs
git status --short --branch
```

Expected: both existing suites pass, the whitespace check is silent, remaining v1.09 references are only the archive and storage fallback, no blanket Other Asset non-deeming claim remains in active deterministic documentation, and the branch is clean.

- [ ] **Step 2: Verify the deterministic browser matrix**

Using only fictional data, verify:

1. New assets start unchecked and recalculation preserves the unchecked state.
2. Selecting the checkbox changes Age Pension but not CSHC assessed income.
3. Mixed flagged/unflagged assets display one combined asset value and the correct assumptions count.
4. Schema-12 JSON imports with the checkbox off and saves as schema 13.
5. Scheduled disposal, partial named liquidation and full named liquidation do not double count.
6. The configured first-death transition uses single-person deeming in the transition year.
7. Autosave and reload preserve the flag under the v1.10 storage key; a v1.09 saved scenario loads through fallback.
8. Desktop and narrow layouts work in light and dark themes.
9. The real-iPad Safari release checklist in `docs/TESTING.md` passes.

Expected: no script-error banner, stale control, layout regression or inconsistent assessment disclosure.

- [ ] **Step 3: Review the complete branch diff and privacy boundary**

Run:

```powershell
git diff origin/main...HEAD --stat
git diff origin/main...HEAD -- retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git status --short --branch
```

Expected: the branch contains only Issue #18 deterministic design/plan/implementation/release files, the Monte Carlo diff is empty and the worktree is clean. Inspect the screenshot and archive to confirm they contain only public fictional data.

- [ ] **Step 4: Push the branch and require passing CI**

Push `codex/issue-18-age-pension-deeming`, open a pull request targeting `main`, and require the archive provenance step plus all existing CI checks to pass. Review the PR patch for generated, personal or unrelated files before merge.

- [ ] **Step 5: Stop at the publication approval gate**

After the pull request is merged and `main` is clean and synchronized, report:

- the exact commit proposed for tag `v1.0.10`;
- passing CI checks;
- the verified browser matrix and real-iPad result;
- the archive hash `1fbb3a5c086f49ea33e66d106468a85812908eeb`; and
- the intended single release asset `retirement-simulator.html`.

Do not create the tag, GitHub release, release asset or close Issue #18 until the user explicitly approves publication.

- [ ] **Step 6: Publish and verify only after explicit approval**

After approval:

```powershell
git tag -a v1.0.10 -m "v1.0.10"
git push origin v1.0.10
gh release create v1.0.10 retirement-simulator.html --title "Retirement Simulator v1.0.10" --notes "Adds optional Age Pension deeming for selected Other Assets while preserving CSHC treatment."
```

Download the published `retirement-simulator.html`, compare its SHA-256 hash with the tagged file, verify the README latest-download link resolves to it, and then close Issue #18 with a link to the verified release.

- [ ] **Step 7: Confirm final repository hygiene**

Refresh remote references and run:

```powershell
git status --short --branch
git rev-list --left-right --count origin/main...main
git branch -a
git worktree list --porcelain
```

Expected: `main` is clean and synchronized, v1.0.10 is the latest deterministic release, the published asset matches the tag, Issue #18 is closed with release evidence and no Monte Carlo artefact changed.

## Completion Criteria

- [ ] Outgoing v1.0.9 archive provenance matches Git blob `1fbb3a5c086f49ea33e66d106468a85812908eeb`.
- [ ] Deterministic schema 13 defaults every new and migrated Other Asset outside Age Pension deeming.
- [ ] Flagged remaining asset value enters the Age Pension deeming balance and every Other Asset remains in the assets test.
- [ ] Scheduled disposal and named liquidation do not lose or double count assessable value.
- [ ] Couple and survivor thresholds behave correctly.
- [ ] CSHC assessed income remains unchanged by the flag.
- [ ] UI, assumptions, import/export and public methodology explain the boundary consistently.
- [ ] Deterministic v1.10 identity, screenshot, changelog and documentation agree.
- [ ] No Monte Carlo artefact or behaviour is changed or published.
- [ ] Automated suites, browser matrix, real-iPad check and CI pass.
- [ ] Publication waits for explicit approval.
- [ ] The published v1.0.10 asset is hash-verified before Issue #18 closes.
