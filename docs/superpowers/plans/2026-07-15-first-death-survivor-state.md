# First-Death and Survivor-State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release deterministic v1.08 and Monte Carlo v0.7 with an optional, fixed, start-of-year first-death transition and an auditable survivor state.

**Architecture:** Add a schema-v12 first-death contract and a pure lifecycle transition boundary to each embedded core, using the same field names and transition semantics. The deterministic engine implements the complete survivor income and asset model; Monte Carlo applies the same fixed transition to its existing supported import subset and continues explicitly rejecting issue #1 inputs.

**Tech Stack:** Self-contained HTML/CSS/JavaScript, Node.js `vm` regression tests, Playwright browser acceptance, PowerShell, Git, GitHub CLI.

---

## File map

- Create `archive/retirement-simulator-v1.0.7.html`: immutable outgoing deterministic executable.
- Modify `archive/README.md`: record v1.0.7 source commit, blob and SHA-256.
- Modify `retirement-simulator.html`: schema v12, migration, validation, single Age Pension rules, lifecycle state, deterministic projection, controls, chart/table/CSV output and v1.08 identity.
- Rename `retirement-monte-carlo-v0.6.html` to `retirement-monte-carlo-v0.7.html`: matching fixed lifecycle boundary for supported inputs and v0.7 identity.
- Modify `tests/retirement-simulator.test.mjs`: schema, migration, helper, projection, tax, transfer, output, version and archive contracts.
- Modify `tests/retirement-monte-carlo.test.mjs`: v0.7 identity, import boundary, lifecycle parity, fixed-path and reproducibility contracts.
- Modify `README.md`, `CHANGELOG.md`, `docs/MODEL-METHODOLOGY.md`, `docs/TESTING.md`, `docs/DEFERRED-REVIEW.md`: document the release and resolve issue #7 without closing issue #1.
- Create `docs/assets/retirement-simulator-v1.08.png`: fictional-data release screenshot.

## Task 1: Freeze deterministic v1.07

**Files:**
- Create: `archive/retirement-simulator-v1.0.7.html`
- Modify: `archive/README.md`
- Modify: `tests/retirement-simulator.test.mjs`

- [ ] **Step 1: Verify outgoing provenance**

Run:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath retirement-simulator.html
git rev-list -1 HEAD -- retirement-simulator.html
git rev-parse e430f94cfb1188b6326fc762f07a927a902729fd:retirement-simulator.html
```

Expected:

```text
845D94E26C6B743197DCF40E7DD4F79EBA9A4A498B67C2A03868C57E8915CCEB
e430f94cfb1188b6326fc762f07a927a902729fd
67582a86d901651068b6e9e467141eba9bed7a69
```

Stop if the executable hash differs; re-establish provenance before copying.

- [ ] **Step 2: Copy and verify the archive**

```powershell
Copy-Item -LiteralPath retirement-simulator.html -Destination archive\retirement-simulator-v1.0.7.html
Get-FileHash -Algorithm SHA256 -LiteralPath archive\retirement-simulator-v1.0.7.html
```

Expected: the archive SHA-256 equals `845D94E26C6B743197DCF40E7DD4F79EBA9A4A498B67C2A03868C57E8915CCEB`.

- [ ] **Step 3: Add the archive test and provenance row**

Add to `tests/retirement-simulator.test.mjs`:

```js
const ARCHIVE_107 = fileURLToPath(
  new URL('../archive/retirement-simulator-v1.0.7.html', import.meta.url)
);
check('outgoing v1.0.7 executable is archived', existsSync(ARCHIVE_107));
```

Add to `archive/README.md`:

```markdown
| `retirement-simulator-v1.0.7.html` | `e430f94:retirement-simulator.html` | `67582a86d901651068b6e9e467141eba9bed7a69` | `845D94E26C6B743197DCF40E7DD4F79EBA9A4A498B67C2A03868C57E8915CCEB` |
```

- [ ] **Step 4: Run tests and commit**

```powershell
node tests/retirement-simulator.test.mjs
git add archive/README.md archive/retirement-simulator-v1.0.7.html tests/retirement-simulator.test.mjs
git commit -m "chore: archive deterministic v1.0.7"
```

Expected: all deterministic checks pass before the canonical executable changes.

## Task 2: Add schema-v12 survivor inputs

**Files:**
- Modify: `retirement-simulator.html`
- Modify: `tests/retirement-simulator.test.mjs`

- [ ] **Step 1: Add failing schema and migration tests**

Add a `firstDeathDefaults` assertion block:

```js
console.log('\nfirst-death schema');
const sampleV12 = core.makeSampleScenario();
check('schema version is 12', sampleV12.schemaVersion === 12);
check('first death is disabled by default',
  sampleV12.household.firstDeath.enabled === false);
check('survivor spending defaults are 70 percent',
  sampleV12.household.firstDeath.survivorPreferredPct === 70 &&
  sampleV12.household.firstDeath.survivorEssentialPct === 70);
check('UK survivor continuation defaults to zero',
  sampleV12.people.every(person => person.ukStateSurvivorPct === 0));
check('new Other income survivor continuation defaults to zero',
  core.makeOtherIncome(0).survivorPct === 0);
```

Create a schema-v11 fixture from the sample, delete the new fields, migrate it, and assert `enabled === false` plus unchanged baseline rows.

- [ ] **Step 2: Run the test to prove it is red**

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: failures for schema 12 and missing first-death defaults.

- [ ] **Step 3: Add defaults and migration**

Change `SCHEMA_VERSION` to `12` and add:

```js
function defaultFirstDeath() {
  return {
    enabled: false,
    deceasedPerson: 'p0',
    deathAge: 80,
    survivorPreferredPct: 70,
    survivorEssentialPct: 70
  };
}
```

Add `ukStateSurvivorPct: 0` to both sample people, `survivorPct: 0` to `makeOtherIncome`, and `firstDeath: defaultFirstDeath()` to `household`.

Append a v11-to-v12 migration stage:

```js
if (current.schemaVersion === 11) {
  current = structuredClone(current);
  current.people = current.people.map(person => ({
    ...person,
    ukStateSurvivorPct: Number.isFinite(person.ukStateSurvivorPct)
      ? person.ukStateSurvivorPct : 0
  }));
  current.otherIncomes = (current.otherIncomes ?? []).map(item => ({
    ...item,
    survivorPct: Number.isFinite(item.survivorPct) ? item.survivorPct : 0
  }));
  current.household.firstDeath = {
    ...defaultFirstDeath(),
    ...(current.household.firstDeath ?? {}),
    enabled: false
  };
  current.schemaVersion = 12;
}
```

- [ ] **Step 4: Add exact validation**

Validate the enabled contract:

```js
const firstDeath = scenario.household.firstDeath;
if (!firstDeath || typeof firstDeath.enabled !== 'boolean') {
  add('household.firstDeath.enabled', 'First-death inclusion must be true or false.');
} else if (firstDeath.enabled) {
  if (!['p0', 'p1'].includes(firstDeath.deceasedPerson)) {
    add('household.firstDeath.deceasedPerson', 'Select the person who dies first.');
  }
  const deceasedIndex = firstDeath.deceasedPerson === 'p1' ? 1 : 0;
  const survivorIndex = 1 - deceasedIndex;
  const deceased = scenario.people[deceasedIndex];
  const survivor = scenario.people[survivorIndex];
  const survivorAgeAtDeath = survivor.age + firstDeath.deathAge - deceased.age;
  if (!Number.isInteger(firstDeath.deathAge) || firstDeath.deathAge <= deceased.age) {
    add('household.firstDeath.deathAge', 'Death age must be above the current age.');
  } else if (survivorAgeAtDeath >= scenario.household.modelEndAge) {
    add('household.firstDeath.deathAge', 'Death must occur before the survivor reaches Model End Age.');
  }
  for (const field of ['survivorPreferredPct', 'survivorEssentialPct']) {
    if (!Number.isFinite(firstDeath[field]) || firstDeath[field] < 0 || firstDeath[field] > 100) {
      add(`household.firstDeath.${field}`, 'Survivor percentage must be from 0% to 100%.');
    }
  }
}
```

Validate `ukStateSurvivorPct` and every `otherIncomes[index].survivorPct` from 0 to 100.

- [ ] **Step 5: Run tests and commit**

```powershell
node tests/retirement-simulator.test.mjs
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: define survivor scenario schema"
```

## Task 3: Add single-person Age Pension rules

**Files:**
- Modify: `retirement-simulator.html`
- Modify: `tests/retirement-simulator.test.mjs`

- [ ] **Step 1: Add failing single-status tests**

Add tests for these July 2026 constants and boundaries:

```js
const singleFull = core.agePensionForHousehold({
  ages: [70, 68],
  alive: [true, false],
  survivorIndex: 0,
  assets: 333000,
  assessableIncome: 226 * 26,
  included: true
});
check('single maximum Age Pension uses one survivor rate',
  singleFull.household === 1200.90 * 26);
check('single pension is allocated only to the survivor',
  singleFull.byPerson[0] === singleFull.household && singleFull.byPerson[1] === 0);
check('single deeming threshold is applied',
  core.deemedIncome(66800, 'single') === 66800 * 0.0125);
```

Also test age 66 gives zero, assets above $333,000 taper by $78 annually per $1,000, income above $5,876 annually tapers at 50 cents, and CSHC single threshold is $101,105.

- [ ] **Step 2: Run red tests**

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: `agePensionForHousehold` is not exported.

- [ ] **Step 3: Add explicit status-aware rules**

Extend the policy constants:

```js
agePensionMaxSingleAnnual: 1200.90 * 26,
homeownerAssetFreeAreaSingle: 333000,
incomeFreeAreaSingleAnnual: 226 * 26,
incomeTaperSingle: 0.50,
deemingThresholdSingle: 66800,
cshcSingleThreshold: 101105
```

Implement:

```js
function pensionRuleSet(status) {
  const rules = SERVICES_AUSTRALIA_2026;
  return status === 'single'
    ? {
        maximum: rules.agePensionMaxSingleAnnual,
        assetFreeArea: rules.homeownerAssetFreeAreaSingle,
        incomeFreeArea: rules.incomeFreeAreaSingleAnnual,
        incomeTaper: rules.incomeTaperSingle,
        deemingThreshold: rules.deemingThresholdSingle,
        cshcThreshold: rules.cshcSingleThreshold
      }
    : {
        maximum: rules.agePensionMaxCoupleAnnual,
        assetFreeArea: rules.homeownerAssetFreeArea,
        incomeFreeArea: rules.incomeFreeAreaCoupleAnnual,
        incomeTaper: rules.incomeTaperCouple,
        deemingThreshold: rules.deemingThresholdCouple,
        cshcThreshold: rules.cshcCoupleThreshold
      };
}

function deemedIncome(financialAssets, status = 'couple') {
  const rules = pensionRuleSet(status);
  const lowerBand = Math.min(financialAssets, rules.deemingThreshold);
  return lowerBand * SERVICES_AUSTRALIA_2026.deemingLowerRate +
    Math.max(0, financialAssets - rules.deemingThreshold) *
      SERVICES_AUSTRALIA_2026.deemingUpperRate;
}

function agePensionForHousehold({
  ages, alive = [true, true], survivorIndex = null,
  assets, assessableIncome, included = true
}) {
  if (!included) return { household: 0, byPerson: [0, 0], status: 'off' };
  if (survivorIndex !== null) {
    if (!alive[survivorIndex] || ages[survivorIndex] < 67) {
      return { household: 0, byPerson: [0, 0], status: 'single' };
    }
    const household = agePensionRate({ status: 'single', assets, assessableIncome });
    const byPerson = [0, 0];
    byPerson[survivorIndex] = household;
    return { household, byPerson, status: 'single' };
  }
  return agePensionForAges({ ages, assets, assessableIncome, included });
}
```

Implement `agePensionRate` as the minimum of status-aware asset and income rates. Export all three helpers used by tests.

- [ ] **Step 4: Run tests and commit**

```powershell
node tests/retirement-simulator.test.mjs
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: add survivor Age Pension rules"
```

## Task 4: Build the lifecycle transition unit

**Files:**
- Modify: `retirement-simulator.html`
- Modify: `tests/retirement-simulator.test.mjs`

- [ ] **Step 1: Add failing pure-transition tests**

Create a fixture with death enabled at Person 1 age 65 and assert:

```js
const state = core.makeProjectionState(deathScenario);
const transition = core.applyFirstDeathTransition({
  scenario: deathScenario,
  state,
  year: deathScenario.startYear + 2,
  ages: [65, 63]
});
check('transition selects the correct survivor', transition.survivorIndex === 1);
check('deceased super moves to inherited super',
  state.superAccum[0] === 0 && state.superRetire[0] === 0 &&
  state.inheritedSuper.ownerIndex === 1);
check('deceased capital losses lapse', state.capitalLossCarryForward[0] === 0);
check('survivor capital losses remain', state.capitalLossCarryForward[1] === 2000);
check('transition is idempotent',
  core.applyFirstDeathTransition({ scenario: deathScenario, state, year: deathScenario.startYear + 3, ages: [66, 64] }).transitionedThisYear === false);
```

Add ownership, cost-base and 70% target assertions.

- [ ] **Step 2: Run red tests**

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: missing lifecycle helper and inherited-super state.

- [ ] **Step 3: Extend projection state**

Add:

```js
lifecycle: {
  householdStatus: 'couple',
  alive: [true, true],
  survivorIndex: null,
  deceasedIndex: null,
  transitionYear: null
},
ownership: {
  cash: scenario.cash.owner,
  savings: scenario.savings.owner
},
inheritedSuper: { accum: 0, retire: 0, ownerIndex: null }
```

- [ ] **Step 4: Implement the pure boundary**

Implement `applyFirstDeathTransition({ scenario, state, year, ages })` so it:

```js
const firstDeath = scenario.household.firstDeath;
const deceasedIndex = firstDeath.deceasedPerson === 'p1' ? 1 : 0;
const survivorIndex = 1 - deceasedIndex;
const shouldTransition = firstDeath.enabled &&
  state.lifecycle.householdStatus === 'couple' &&
  ages[deceasedIndex] === firstDeath.deathAge;
```

When true, move both deceased super arrays to `inheritedSuper`, zero them, convert cash/savings/holding owners of `joint` or the deceased to the survivor ID, lapse only the deceased loss balance, and write lifecycle state. Return an event object containing names, transferred super, lapsed losses and spending percentages. When false, return the current context with `transitionedThisYear: false` and do not mutate balances.

- [ ] **Step 5: Make drawdown helpers inherited-super aware**

When a source refers to the deceased person's super after transition, route its available retirement-phase balance to `state.inheritedSuper.retire`. Include both inherited phases in total assets and apply future phase transition using the survivor's access age.

- [ ] **Step 6: Run tests and commit**

```powershell
node tests/retirement-simulator.test.mjs
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: add first-death lifecycle transition"
```

## Task 5: Integrate deterministic survivor cash flows

**Files:**
- Modify: `retirement-simulator.html`
- Modify: `tests/retirement-simulator.test.mjs`

- [ ] **Step 1: Add failing projection fixtures**

Add tests covering Person 1 and Person 2 death, start-of-year salary/SG cessation, horizon ending at survivor Model End Age, spending reduction, survivor income percentages, single Age Pension, deceased zero tax, inherited-super balance, transfer event and person-order independence.

Use a zero-return, zero-inflation fixture and assert exact rows:

```js
const rows = core.projectScenario(deathScenario).rows;
const deathRow = rows.find(row => row.lifecycle.transitionedThisYear);
check('death happens at the selected start-of-year age', deathRow.ages[0] === null);
check('salary stops in the transition year', deathRow.salaryByPerson[0] === 0);
check('deceased tax is zero', deathRow.taxByPerson[0] === 0);
check('targets step to seventy percent',
  deathRow.targetAfterTax === deathScenario.household.targetAfterTax * 0.70 &&
  deathRow.annualBudget === deathScenario.household.annualBudget * 0.70);
```

- [ ] **Step 2: Run tests to prove the integration is red**

```powershell
node tests/retirement-simulator.test.mjs
```

- [ ] **Step 3: Call lifecycle before annual finance**

In `projectYear`, derive raw ages, call the lifecycle helper, then use:

```js
const alive = state.lifecycle.alive;
const displayedAges = ages.map((age, index) => alive[index] ? age : null);
const survivorIndex = state.lifecycle.survivorIndex;
const preferredPct = survivorIndex === null
  ? 100 : scenario.household.firstDeath.survivorPreferredPct;
const essentialPct = survivorIndex === null
  ? 100 : scenario.household.firstDeath.survivorEssentialPct;
const targetAfterTax = scenario.household.targetAfterTax * preferredPct / 100;
const annualBudget = scenario.household.annualBudget * essentialPct / 100;
```

Gate salary, SG, UK pension, taxable ledgers and tax by `alive[index]`.

- [ ] **Step 4: Apply survivor income ownership**

For deceased-owned Other income, multiply by `survivorPct / 100` and allocate the result entirely to the survivor. Joint and survivor-owned income continue at 100%. Apply the same rule to `ukStateAnnualGbp` using `ukStateSurvivorPct`.

- [ ] **Step 5: Apply single social-security and tax context**

Call `deemedIncome(financialAssets, survivorIndex === null ? 'couple' : 'single')` and `agePensionForHousehold`. Set deceased taxable, rebate, franking, capital-gain and tax values to zero. Use the status-aware CSHC threshold.

- [ ] **Step 6: Use the survivor horizon**

In `projectScenario`, calculate years as:

```js
const firstDeath = scenario.household.firstDeath;
const survivorIndex = firstDeath.enabled
  ? 1 - (firstDeath.deceasedPerson === 'p1' ? 1 : 0)
  : 0;
const years = scenario.household.modelEndAge - scenario.people[survivorIndex].age + 1;
```

- [ ] **Step 7: Run tests and commit**

```powershell
node tests/retirement-simulator.test.mjs
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: project deterministic survivor state"
```

## Task 6: Add deterministic controls and audit output

**Files:**
- Modify: `retirement-simulator.html`
- Modify: `tests/retirement-simulator.test.mjs`

- [ ] **Step 1: Add failing markup and output contracts**

Assert exact labels, paths, chart marker function, em-dash ages, inherited-super output, transition event text, v1.08 identity and CSV inclusion.

- [ ] **Step 2: Add Household controls**

Render:

```html
<h4>First-death scenario</h4>
<label><span class="k">Model first death</span>
  <input type="checkbox" data-path="household.firstDeath.enabled">
</label>
<label><span class="k">Person who dies first</span>
  <select data-path="household.firstDeath.deceasedPerson"></select>
</label>
```

Add numeric controls for death age, Survivor Preferred Income %, and Survivor Essential Budget %. Add `Paid to survivor %` to UK State Pension and Other income editors.

- [ ] **Step 3: Add chart and table audit output**

Implement one shared `drawFirstDeathMarker(ctx, rows, xScale, top, bottom)` and call it from both chart renderers. Render `—` for null ages, add `First death: <name>` to the Event cell, step both target lines from the transition row, and expose inherited super in balance legend/details.

- [ ] **Step 4: Preserve CSV and JSON auditability**

Because CSV reads the rendered table, assert the exported matrix contains `First death`, the deceased em dash and inherited-super detail. Confirm JSON round-trip retains all v12 fields.

- [ ] **Step 5: Update deterministic identity and storage migration**

Change title, heading, footer and saved-scenario key to v1.08, retaining v1.07 as a legacy fallback.

- [ ] **Step 6: Run tests and commit**

```powershell
node tests/retirement-simulator.test.mjs
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: expose survivor scenario controls"
```

## Task 7: Rename Monte Carlo and add the supported lifecycle boundary

**Files:**
- Rename: `retirement-monte-carlo-v0.6.html` to `retirement-monte-carlo-v0.7.html`
- Modify: `tests/retirement-monte-carlo.test.mjs`

- [ ] **Step 1: Git-rename the canonical file and make version tests red**

```powershell
git mv retirement-monte-carlo-v0.6.html retirement-monte-carlo-v0.7.html
```

Update the test file URL to v0.7 and assert title, heading, footer and storage key. Run the test; expect v0.6 identity failures.

- [ ] **Step 2: Add adapter boundary tests**

Assert a schema-v12 first-death scenario with no issue #1 inputs adapts successfully, while Other income/assets, active DB/UK pension or lump sums continue returning the existing explicit compatibility rejection.

- [ ] **Step 3: Add lifecycle parity tests**

Port the deterministic `defaultFirstDeath`, lifecycle state and transition helper contract to the Monte Carlo core. Test both deceased-person orders, idempotence, inherited super, 70% targets, single Age Pension and deceased zero tax.

- [ ] **Step 4: Implement v0.7 core and adapter**

Advance the Monte Carlo native schema from 3 to 4. Adapt deterministic schema 12 fields into the native scenario, but keep the issue #1 guards before adaptation. Add the same July 2026 single constants and set the existing combined income taper to `0.50` so accepted zero-volatility fixtures match deterministic policy.

- [ ] **Step 5: Run tests and commit**

```powershell
node tests/retirement-monte-carlo.test.mjs
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "feat: add Monte Carlo survivor boundary"
```

## Task 8: Apply the fixed event to every Monte Carlo path

**Files:**
- Modify: `retirement-monte-carlo-v0.7.html`
- Modify: `tests/retirement-monte-carlo.test.mjs`

- [ ] **Step 1: Add failing path and reproducibility tests**

Run multiple seeded paths and assert every path has the same transition year and survivor index. Add a zero-volatility fixture that matches deterministic household totals through the transition. Re-run the same seed and compare serialized summaries.

- [ ] **Step 2: Integrate lifecycle state before path-year finance**

Call the helper at the start of every `projectYear`. Carry lifecycle and inherited-super state through `runBatch`, stress paths, risk modes and break-point sweeps. Do not sample mortality from the RNG.

- [ ] **Step 3: Add assumptions and output disclosure**

Render:

```js
`Fixed first-death scenario: ${person.name} at age ${firstDeath.deathAge}, applied at the start of the same projection year in every Monte Carlo path. Probabilistic mortality is not modelled.`
```

Show the survivor spending percentages and single Age Pension status in the assumptions panel.

- [ ] **Step 4: Run tests and commit**

```powershell
node tests/retirement-monte-carlo.test.mjs
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "feat: apply fixed death across Monte Carlo paths"
```

## Task 9: Publish documentation and browser evidence

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/MODEL-METHODOLOGY.md`
- Modify: `docs/TESTING.md`
- Modify: `docs/DEFERRED-REVIEW.md`
- Create: `docs/assets/retirement-simulator-v1.08.png`

- [ ] **Step 1: Add documentation contract tests**

Assert README identifies v1.08/v0.7, methodology states start-of-year and bereavement exclusions, deferred item #7 is resolved, issue #1 remains open, and the screenshot path is v1.08.

- [ ] **Step 2: Update public documentation**

Document the deterministic full model, Monte Carlo supported-subset boundary, policy sources, capital-loss lapse, inherited-super abstraction, survivor horizon, validation matrix and browser acceptance steps. Add a v1.08 changelog entry and mark AIPR-003-MORTALITY resolved in v1.0.8/v0.7.

- [ ] **Step 3: Run both suites**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
git diff --check
```

Expected: all checks pass and diff hygiene is clean.

- [ ] **Step 4: Perform Playwright acceptance**

Serve the repository on localhost. Verify deterministic desktop 1440×1000 and mobile 390×844 in dark and light themes; enable a fictional first-death scenario and inspect controls, target step, marker, event, inherited super, em-dash age and CSV. Verify Monte Carlo v0.7 desktop/mobile, fixed-event assumptions and clean consoles.

- [ ] **Step 5: Save and inspect the screenshot**

Save the fictional dark-theme chart-led view to `docs/assets/retirement-simulator-v1.08.png` and inspect it at original resolution.

- [ ] **Step 6: Commit documentation and evidence**

```powershell
git add README.md CHANGELOG.md docs retirement-simulator.html retirement-monte-carlo-v0.7.html tests
git commit -m "docs: publish survivor-state methodology"
```

## Task 10: Final verification and release

**Files:**
- Verify all release files; no new implementation files.

- [ ] **Step 1: Run the complete local gate**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
Get-FileHash -Algorithm SHA256 -LiteralPath archive\retirement-simulator-v1.0.7.html
git diff --check
git status --short --branch
```

Expected: green suites, archive hash `845D94E26C6B743197DCF40E7DD4F79EBA9A4A498B67C2A03868C57E8915CCEB`, clean diff and only intentional commits.

- [ ] **Step 2: Fast-forward and publish main**

Fetch origin, verify `origin/main` has not diverged, fast-forward main to the feature branch and push main.

- [ ] **Step 3: Require successful CI**

Use `gh run list` to identify the exact pushed SHA and `gh run watch <run-id> --exit-status`. Do not tag if CI fails.

- [ ] **Step 4: Tag and release**

```powershell
git tag -a v1.0.8 -m "Retirement Income Simulator v1.08"
git push origin v1.0.8
gh release create v1.0.8 retirement-simulator.html retirement-monte-carlo-v0.7.html --title "Retirement Income Simulator v1.08" --notes "Adds an optional fixed first-death and survivor-state scenario to deterministic v1.08 and the Monte Carlo v0.7 supported scenario subset."
```

- [ ] **Step 5: Verify assets and close only issue #7**

Compare GitHub release asset SHA-256 digests with local files. Confirm main is `0 0` against origin, tag dereferences to HEAD, CI succeeded, issue #1 remains open, then close issue #7 with a release link and test summary.
