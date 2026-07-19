# Issue #4 Lump-Sum Funding Warning and v1.0.9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make partially and completely unfunded deterministic lump-sum withdrawals visible and auditable, then prepare a deterministic-only v1.0.9 release candidate.

**Architecture:** Extend the existing per-withdrawal projection event with requested, funded and unfunded values, aggregate those structured events at the projection boundary, and render a separate amber status card without changing annual-budget shortfall semantics. Preserve the current single-file application architecture and existing drawdown helpers; release work archives the exact v1.0.8 tag before advancing only the deterministic simulator to v1.09.

**Tech Stack:** Self-contained HTML/CSS/JavaScript, Node.js 20 regression scripts, Git/GitHub Actions, Playwright/browser acceptance.

---

**Origin specification:** `docs/superpowers/specs/2026-07-19-issue-4-lump-sum-funding-warning-release-design.md`

**Release boundary:** deterministic v1.0.9 only. Monte Carlo remains identified as v0.7 in-app, its current v0.8 work stays under `Unreleased`, issue #1 remains open, and issue #18 remains outside this release.

## File Map

- `retirement-simulator.html` — projection event data, result aggregation, tooltip text, amber status card and deterministic v1.09 identity.
- `tests/retirement-simulator.test.mjs` — engine, presentation-contract, archive and release-identity regression coverage.
- `archive/retirement-simulator-v1.0.8.html` — exact deterministic executable from tag `v1.0.8`.
- `archive/README.md` — immutable archive provenance.
- `.github/workflows/test.yml` — CI blob-equivalence check for the v1.0.8 archive.
- `CHANGELOG.md` — split deterministic v1.09 entries from still-unreleased Monte Carlo v0.8 work.
- `README.md` — active deterministic release identity and feature summary.
- `docs/TESTING.md` — issue #4 regression and release acceptance guidance.
- `docs/MODEL-METHODOLOGY.md` — disclosure of funded versus unfunded planned withdrawals.
- `docs/DEFERRED-REVIEW.md` — corrected current-behaviour text for already-resolved review items.
- `docs/assets/retirement-simulator-v1.09.png` — sanitized deterministic release screenshot.

## Task 1: Reconcile issue state and freeze the outgoing v1.0.8 executable

**Files:**
- Create: `archive/retirement-simulator-v1.0.8.html`
- Modify: `archive/README.md`
- Modify: `.github/workflows/test.yml`
- Modify: `tests/retirement-simulator.test.mjs`

- [ ] **Step 1: Reopen issue #4 before implementation**

Run:

```powershell
gh issue reopen 4 --repo dcaddick/retirement-simulator
gh issue comment 4 --repo dcaddick/retirement-simulator --body "Reopened because the requested/funded/unfunded audit fields and amber warning are not yet implemented. Work is proceeding toward deterministic v1.0.9."
gh issue view 4 --repo dcaddick/retirement-simulator --json state,stateReason,url
```

Expected: issue #4 reports `OPEN`. Do not change issues #1 or #18.

- [ ] **Step 2: Extract the exact v1.0.8 tagged executable**

Use a temporary archive so the bytes originate from the tag rather than the already-modified `main` executable:

```powershell
$stage = Join-Path $env:TEMP "retirement-v108-$PID"
New-Item -ItemType Directory -Path $stage | Out-Null
git archive --format=zip --output="$stage\v108.zip" v1.0.8 retirement-simulator.html
Expand-Archive -LiteralPath "$stage\v108.zip" -DestinationPath $stage
Copy-Item -LiteralPath "$stage\retirement-simulator.html" -Destination archive\retirement-simulator-v1.0.8.html
git hash-object archive\retirement-simulator-v1.0.8.html
git rev-parse v1.0.8:retirement-simulator.html
Remove-Item -Recurse -LiteralPath $stage
```

Expected: both blob hashes equal `56d1025edfadb121f372b06e27c0b42cd6f5fd9e`. Stop if they differ.

- [ ] **Step 3: Write failing archive-contract coverage first**

Add near the existing archive constants in `tests/retirement-simulator.test.mjs`:

```js
const ARCHIVE_108 = fileURLToPath(
  new URL('../archive/retirement-simulator-v1.0.8.html', import.meta.url)
);
```

Add beside the outgoing archive checks:

```js
check('outgoing v1.0.8 executable is archived', existsSync(ARCHIVE_108));
```

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: the new check passes only after the exact archive exists.

- [ ] **Step 4: Record and enforce provenance**

Append this row to `archive/README.md`:

```markdown
| `retirement-simulator-v1.0.8.html` | `v1.0.8:retirement-simulator.html` | `56d1025edfadb121f372b06e27c0b42cd6f5fd9e` | — |
```

Add to `.github/workflows/test.yml` before the Node test commands:

```yaml
      - name: Verify archived v1.0.8 source
        run: test "$(git hash-object archive/retirement-simulator-v1.0.8.html)" = "$(git rev-parse v1.0.8:retirement-simulator.html)"
```

Run:

```powershell
git diff --check
node tests/retirement-simulator.test.mjs
```

Expected: deterministic suite passes and the archive hash remains `56d1025edfadb121f372b06e27c0b42cd6f5fd9e`.

- [ ] **Step 5: Commit the immutable archive**

```powershell
git add archive/retirement-simulator-v1.0.8.html archive/README.md .github/workflows/test.yml tests/retirement-simulator.test.mjs
git commit -m "chore: archive deterministic v1.0.8"
```

## Task 2: Add structured lump-sum funding outcomes test-first

**Files:**
- Modify: `tests/retirement-simulator.test.mjs`
- Modify: `retirement-simulator.html`

- [ ] **Step 1: Add failing partial-funding assertions**

Extend the existing `lump-sum withdrawals` test section with a scenario that has only $15,000 available for a $25,000 request:

```js
const partialLump = structuredClone(withLump);
partialLump.cash.amount = 10000;
partialLump.savings.amount = 5000;
partialLump.lumpSumWithdrawals = [{
  id: 'partial-lump', amount: 25000, reason: 'European holiday',
  month: 1, year: partialLump.startYear, source: 'cash', enabled: true
}];
const partialResult = core.projectScenario(partialLump);
const partialRow = partialResult.rows[0];
const partialEvent = partialRow.events.find(event => event.type === 'lump-sum');
check('partial lump sum retains requested funded and unfunded amounts',
  partialEvent.requested === 25000 &&
  partialEvent.funded === 15000 &&
  partialEvent.unfunded === 10000 &&
  partialEvent.amount === 15000,
  JSON.stringify(partialEvent));
check('partial lump sum exposes row and projection aggregates',
  partialRow.lumpSumFundingShortfall === 10000 &&
  partialResult.lumpSumFunding.totalUnfunded === 10000 &&
  partialResult.lumpSumFunding.count === 1,
  JSON.stringify(partialResult.lumpSumFunding));
```

- [ ] **Step 2: Add failing zero, multiple and disabled assertions**

Add these fixtures in the same section:

```js
const zeroFundedLump = structuredClone(withLump);
zeroFundedLump.cash.amount = 0;
zeroFundedLump.savings.amount = 0;
zeroFundedLump.lumpSumWithdrawals = [{
  id: 'zero-lump', amount: 20000, reason: 'Gift', month: 1,
  year: zeroFundedLump.startYear, source: 'automatic', enabled: true
}];
const zeroResult = core.projectScenario(zeroFundedLump);
const zeroRow = zeroResult.rows[0];
const zeroEvent = zeroRow.events.find(event => event.type === 'lump-sum');
check('completely unfunded lump sum remains auditable without charted money',
  zeroEvent.requested === 20000 && zeroEvent.funded === 0 &&
  zeroEvent.unfunded === 20000 && zeroRow.lumpSumTotal === 0 &&
  zeroResult.lumpSumFunding.count === 1,
  JSON.stringify(zeroEvent));

const multipleLumps = structuredClone(zeroFundedLump);
multipleLumps.lumpSumWithdrawals = [
  { id: 'm1', amount: 10000, reason: 'Gift one', month: 1,
    year: multipleLumps.startYear, source: 'automatic', enabled: true },
  { id: 'm2', amount: 15000, reason: 'Gift two', month: 1,
    year: multipleLumps.startYear, source: 'automatic', enabled: true },
  { id: 'm3', amount: 50000, reason: 'Disabled', month: 1,
    year: multipleLumps.startYear, source: 'automatic', enabled: false }
];
const multipleResult = core.projectScenario(multipleLumps);
check('multiple shortfalls aggregate while disabled withdrawals stay inert',
  multipleResult.lumpSumFunding.totalUnfunded === 25000 &&
  multipleResult.lumpSumFunding.count === 2 &&
  multipleResult.rows[0].events.filter(event => event.type === 'lump-sum').length === 2,
  JSON.stringify(multipleResult.lumpSumFunding));
```

- [ ] **Step 3: Run the deterministic suite and verify the contract is red**

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: failures show missing `requested`, `funded`, `unfunded`, `lumpSumFundingShortfall` and `lumpSumFunding` fields.

- [ ] **Step 4: Reconcile each withdrawal into one structured event**

In `projectYear`, initialise the row accumulator beside `lumpSumTotalNominal`:

```js
let lumpSumFundingShortfallNominal = 0;
```

After named-source liquidation and fallback drawdown, replace the existing event construction with this shape:

```js
const fundedNominal = named.drawn + result.drawn;
const unfundedNominal = Math.max(0, requestedNominal - fundedNominal);
const requested = requestedNominal / inflationFactor;
const funded = fundedNominal / inflationFactor;
const unfunded = unfundedNominal / inflationFactor;
lumpSumTotalNominal += fundedNominal;
if (unfunded > 0.005) lumpSumFundingShortfallNominal += unfundedNominal;
events.push({
  type: 'lump-sum',
  reason: withdrawal.reason,
  month: withdrawal.month,
  requestedSource: withdrawal.source,
  drawsBySource: actualDraws,
  requested,
  funded,
  unfunded,
  amount: funded,
  label: lumpSumEventLabel({
    reason: withdrawal.reason,
    requested,
    funded,
    unfunded,
    drawsBySource: actualDraws
  }, scenario.people)
});
```

Define the pure label helper beside `sourceSummary` and export it through `RetirementSimulatorCore`:

```js
function lumpSumEventLabel(event, people) {
  const funding = event.funded > 0.005
    ? `${formatMoney(event.funded)} funded from ` +
      sourceSummary(event.drawsBySource, people)
    : `${formatMoney(0)} funded`;
  const shortfall = event.unfunded > 0.005
    ? `; ${formatMoney(event.unfunded)} unfunded`
    : '';
  return `${event.reason} - requested ${formatMoney(event.requested)}; ` +
    `${funding}${shortfall}`;
}
```

Expose the row total in the return object:

```js
lumpSumFundingShortfall: lumpSumFundingShortfallNominal / inflationFactor,
```

- [ ] **Step 5: Aggregate structured outcomes at the projection boundary**

Before `projectScenario` returns, add:

```js
const lumpSumEvents = rows.flatMap(row =>
  row.events.filter(event => event.type === 'lump-sum' && event.unfunded > 0.005)
);
const lumpSumFunding = {
  totalUnfunded: lumpSumEvents.reduce((sum, event) => sum + event.unfunded, 0),
  count: lumpSumEvents.length
};
return { rows, firstShortfall, lumpSumFunding };
```

Remove the old `return { rows, firstShortfall };`.

- [ ] **Step 6: Add named-source and balance-invariant coverage**

Extend the existing named-asset fixture so the request exceeds the named asset and all liquid fallback sources:

```js
assetFunded.lumpSumWithdrawals[0].amount = 50000;
const namedShortfallResult = core.projectScenario(assetFunded);
const namedShortfallRow = namedShortfallResult.rows[0];
const namedShortfallEvent = namedShortfallRow.events.find(event => event.type === 'lump-sum');
check('named source shortfall reconciles after fallback funding',
  namedShortfallEvent.requested === 50000 &&
  namedShortfallEvent.funded === 40000 &&
  namedShortfallEvent.unfunded === 10000 &&
  namedShortfallEvent.label.includes('Investment property'),
  JSON.stringify(namedShortfallEvent));
check('unaffordable lump sums never create negative liquid balances',
  namedShortfallRow.cash >= 0 && namedShortfallRow.savings >= 0 &&
  namedShortfallRow.superBalances.every(value => value >= 0));
```

- [ ] **Step 7: Run tests and commit the engine contract**

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: expose unfunded lump-sum requests"
```

Expected: all deterministic checks pass and funded plus unfunded reconciles to requested for every new fixture.

## Task 3: Render a separate amber warning and auditable tooltip

**Files:**
- Modify: `retirement-simulator.html`
- Modify: `tests/retirement-simulator.test.mjs`

- [ ] **Step 1: Replace the existing tooltip expectation with the new audit wording**

Update the existing `lumpTooltip` check and add partial funding coverage:

```js
check('fully funded lump tooltip reports requested and funded amounts',
  lumpTooltip.length === 2 &&
  lumpTooltip[1] === 'New car - requested $25,000; $25,000 funded from Cash + Savings',
  JSON.stringify(lumpTooltip));
const partialTooltip = core.chartTooltipLines(
  { key: 'lumpSum', value: 15000, label: 'Lump sum withdrawal', displayFactor: 1 },
  partialRow,
  partialLump
);
check('partial lump tooltip exposes the unfunded remainder',
  partialTooltip[1] ===
    'European holiday - requested $25,000; $15,000 funded from Cash + Savings; $10,000 unfunded',
  JSON.stringify(partialTooltip));
```

Add markup contracts near the existing UI checks:

```js
check('lump-sum warning is separate from annual-budget status',
  html.includes("result.lumpSumFunding.count > 0") &&
  html.includes("'Projected lump-sum shortfall'") &&
  html.includes("result.firstShortfall") &&
  html.includes("'Projected shortfall'"));
```

- [ ] **Step 2: Run tests and verify presentation contracts fail**

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: tooltip and amber-card markup assertions fail.

- [ ] **Step 3: Render tooltip text from the structured events**

Replace the lump-sum branch in `chartTooltipLines` with:

```js
if (segment.key === 'lumpSum') {
  const detail = row.events.filter(event => event.type === 'lump-sum')
    .map(event => lumpSumEventLabel(event, scenario.people))
    .join(' · ');
  return [context, detail];
}
```

This keeps full and partial events consistent with the Event column. Completely unfunded events remain visible in the Event column and amber card even though no chart segment exists.

- [ ] **Step 4: Add the independent amber status card**

In the `#flags` card array within `renderDashboard`, insert this card after the annual-budget card and before the first-death card:

```js
...(result.lumpSumFunding.count > 0 ? [statusCard(
  'warn',
  'Projected lump-sum shortfall',
  `${core.formatMoney(result.lumpSumFunding.totalUnfunded)} unfunded across ` +
    `${result.lumpSumFunding.count} planned ` +
    `${result.lumpSumFunding.count === 1 ? 'withdrawal' : 'withdrawals'}.`
)] : []),
```

Do not change `firstShortfall`, the existing red/green card, row shortfall classes or KPI logic.

- [ ] **Step 5: Prove annual-budget and lump-sum status independence**

Add projection assertions:

```js
check('amber lump-sum warning does not create an annual-budget shortfall',
  partialResult.firstShortfall === null && partialResult.lumpSumFunding.count === 1);
const redAndAmber = structuredClone(partialLump);
redAndAmber.household.annualBudget = 100000;
const redAndAmberResult = core.projectScenario(redAndAmber);
check('annual-budget red and lump-sum amber can coexist',
  redAndAmberResult.firstShortfall !== null &&
  redAndAmberResult.lumpSumFunding.count === 1);
```

- [ ] **Step 6: Run both suites and commit presentation changes**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
git diff --check
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: warn about lump-sum funding gaps"
```

Expected: deterministic count increases beyond 243 with zero failures; Monte Carlo remains green.

## Task 4: Advance deterministic identity and release documentation

**Files:**
- Modify: `retirement-simulator.html`
- Modify: `tests/retirement-simulator.test.mjs`
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `docs/TESTING.md`
- Modify: `docs/MODEL-METHODOLOGY.md`
- Modify: `docs/DEFERRED-REVIEW.md`

- [ ] **Step 1: Make deterministic v1.09 identity tests fail first**

Replace the current version contract with:

```js
check('v1.09 document version is consistent',
  html.includes('<title>Family Retirement Income Simulator v1.09</title>') &&
  html.includes('<span class="version">v1.09</span>') &&
  html.includes("const STORAGE_KEY = 'family-retirement-simulator:v1.09:scenario'") &&
  html.includes("'family-retirement-simulator:v1.08:scenario'"));
```

Add documentation contracts:

```js
check('v1.09 documents lump-sum affordability warnings',
  readme.includes('unfunded lump-sum') &&
  methodology.includes('requested, funded and unfunded') &&
  testingGuide.includes('partially and completely unfunded'));
check('Monte Carlo remains unreleased and experimental',
  readme.includes('Unreleased v0.8 work') &&
  readme.includes('retirement-monte-carlo-v0.7.html'));
```

Run the deterministic suite and expect version/documentation failures.

- [ ] **Step 2: Advance only deterministic identity**

In `retirement-simulator.html`:

```text
v1.08 -> v1.09 in the title, visible heading and release-description copy
family-retirement-simulator:v1.08:scenario -> family-retirement-simulator:v1.09:scenario
```

Insert the previous key first in `LEGACY_STORAGE_KEYS`:

```js
const LEGACY_STORAGE_KEYS = [
  'family-retirement-simulator:v1.08:scenario',
  'family-retirement-simulator:v1.07:scenario',
  // existing keys continue unchanged
];
```

Do not change `SCHEMA_VERSION`, the Monte Carlo filename, Monte Carlo title or Monte Carlo storage key.

- [ ] **Step 3: Split the changelog by release line**

Keep the three issue #1 Monte Carlo parity bullets under `## Unreleased`. Split the existing age-60 bullet by release line: retain the Monte Carlo validation change under `Unreleased`, and place only the deterministic change under the new v1.09 section:

```markdown
## 1.09 - 2026-07-19

- Reject deterministic simulator super access ages below 60 because pre-60 withdrawal taxation is outside the simplified model ([#8](https://github.com/dcaddick/retirement-simulator/issues/8)).
- Report requested, funded and unfunded planned lump-sum withdrawals, with a separate amber funding warning that does not change annual-budget status ([#4](https://github.com/dcaddick/retirement-simulator/issues/4)).
- Archived the exact outgoing deterministic v1.0.8 executable.
```

Retain this Monte Carlo bullet under `Unreleased`:

```markdown
- Reject experimental Monte Carlo super access ages below 60 because pre-60 withdrawal taxation is outside the simplified model ([#8](https://github.com/dcaddick/retirement-simulator/issues/8)).
```

The release date may be adjusted only if publication occurs on a later day; keep code and documentation consistent.

- [ ] **Step 4: Update public documentation**

Update `README.md` to identify deterministic v1.09 and include this supported behaviour:

```markdown
- planned lump-sum withdrawals with requested, funded and unfunded audit output plus a separate affordability warning;
```

Update `docs/MODEL-METHODOLOGY.md` in the lump-sum section:

```markdown
The projection retains requested, funded and unfunded amounts for each enabled planned withdrawal. Only the funded amount reduces assets or appears on the chart. An unfunded remainder produces a separate planning warning and does not change the annual-budget shortfall calculation.
```

Update `docs/TESTING.md` to require fully, partially and completely unfunded cases, multiple aggregation, disabled exclusion, separate red/amber status, and a zero-funded Event inspection in the browser.

- [ ] **Step 5: Repair stale resolved-register behaviour text**

In `docs/DEFERRED-REVIEW.md`, replace only the `Current behaviour` cells for these resolved rows:

```markdown
AIPR-003-SHARES-STATIC: Shareholdings support nominal price growth, holding-period dividends and optional ownership-aware franking credits.
AIPR-003-CGT-LOSS: Per-person capital losses net against gains in the required order and unused losses carry forward from a zero opening balance.
AIPR-003-OTHERINC-SPLIT: Other taxable income has a persisted Tax owner, including joint 50/50 allocation and schema migration.
AIPR-003-CGT-WATERFALL: CGT is funded as a savings-first asset expense and is not counted as retirement income.
```

Preserve each row's issue link, resolved status, historical impact, review rationale and next action.

- [ ] **Step 6: Run documentation and regression gates**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
rg -n "v1\.08|v1\.09|v0\.7|Unreleased v0\.8" retirement-simulator.html retirement-monte-carlo-v0.7.html README.md CHANGELOG.md docs
git diff --check
```

Expected: deterministic surfaces consistently say v1.09; the previous v1.08 storage key remains only as a legacy key and archive/release reference; Monte Carlo remains v0.7 in-app with v0.8 work explicitly unreleased.

- [ ] **Step 7: Commit release identity and documentation**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs CHANGELOG.md README.md docs/TESTING.md docs/MODEL-METHODOLOGY.md docs/DEFERRED-REVIEW.md
git commit -m "release: prepare deterministic simulator v1.0.9"
```

## Task 5: Perform browser acceptance and capture sanitized evidence

**Files:**
- Create: `docs/assets/retirement-simulator-v1.09.png`
- Modify: `README.md`
- Modify: `tests/retirement-simulator.test.mjs`

- [ ] **Step 1: Serve the repository and run desktop/narrow acceptance**

Serve the repository locally and inspect `retirement-simulator.html` in a real browser. Use only fictional sample data. Verify in dark and light themes at desktop and narrow widths:

1. Fully funded withdrawal: no amber funding card.
2. Partially funded withdrawal: amber card, Event text and chart tooltip reconcile requested/funded/unfunded values.
3. Completely unfunded withdrawal: amber card and Event text remain visible with no yellow chart block.
4. Multiple shortfalls: aggregate total and count reconcile to individual events.
5. Disabled withdrawal: absent from all calculations and warnings.
6. Green annual-budget card plus amber funding card.
7. Red annual-budget card plus amber funding card.
8. No console errors, clipped warning text or inaccessible focus behaviour.

- [ ] **Step 2: Complete the documented real-iPad gate**

Using current iPadOS Safari, verify portrait and landscape behaviour at the device sizes listed in `docs/TESTING.md`. Confirm touch targets, independent scrolling, warning wrapping, chart inspection and Event-table horizontal scrolling.

If a real iPad is unavailable, record the release as blocked at this gate rather than representing emulation as equivalent.

- [ ] **Step 3: Capture and inspect the sanitized v1.09 screenshot**

Capture `docs/assets/retirement-simulator-v1.09.png` using fictional sample values and a visible issue #4 amber warning. Inspect the image for personal data, clipping, stale version text and legibility.

Update the README image reference and caption from v1.08 to v1.09, describing the separate lump-sum affordability warning.

- [ ] **Step 4: Add screenshot existence coverage**

Replace the screenshot constant/check in `tests/retirement-simulator.test.mjs`:

```js
const SCREENSHOT_109 = fileURLToPath(
  new URL('../docs/assets/retirement-simulator-v1.09.png', import.meta.url)
);
check('v1.09 release screenshot exists', existsSync(SCREENSHOT_109));
```

- [ ] **Step 5: Run both suites and commit browser evidence**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
git diff --check
git add docs/assets/retirement-simulator-v1.09.png README.md tests/retirement-simulator.test.mjs
git commit -m "docs: add deterministic v1.09 release evidence"
```

## Task 6: Verify the release candidate and prepare publication

**Files:**
- No additional source files expected.

- [ ] **Step 1: Run the complete local release gate**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
git diff --check
git status --short --branch
git branch --no-merged main
git worktree list --porcelain
```

Expected: both suites pass, the worktree is clean, and only the intended release branch differs from `main`.

- [ ] **Step 2: Review the release diff against v1.0.8**

```powershell
git diff --stat v1.0.8...HEAD
git diff --check v1.0.8...HEAD
git log --oneline v1.0.8..HEAD
```

Verify that:

- deterministic #8 and #4 changes are release-listed;
- Monte Carlo parity commits remain documented as unreleased;
- no Monte Carlo v0.8 asset or identity is introduced;
- issue #18 is not implemented or claimed;
- the archive contains only fictional public data.

- [ ] **Step 3: Push the branch and require passing CI**

Push `codex/issue-4-v1.0.9-release`, open a pull request targeting `main`, and require the archive provenance check plus both Node suites to pass. Review the PR patch for generated, personal or unrelated files before merge.

- [ ] **Step 4: Stop at the publication approval gate**

After the pull request is merged and `main` is clean and synchronized, report the exact commit proposed for tag `v1.0.9`, the passing CI checks, the verified browser matrix and the intended single asset `retirement-simulator.html`.

Do not create the tag, GitHub release or release asset until the user explicitly approves publication.

- [ ] **Step 5: Publish and verify only after approval**

After explicit approval:

1. Tag the verified `main` commit as `v1.0.9`.
2. Publish a GitHub release containing `retirement-simulator.html` only.
3. Download the published asset and compare its hash with the tagged file.
4. Verify the README latest-download link resolves to the v1.0.9 asset.
5. Close issue #4 only after the asset and release page are verified.
6. Leave issues #1 and #18 open.

- [ ] **Step 6: Confirm final repository hygiene**

Refresh remote references and verify:

```powershell
git status --short --branch
git rev-list --left-right --count origin/main...main
git branch -a
git worktree list --porcelain
```

Expected: `main` is clean and synchronized, no merged release branch/worktree remains after approved cleanup, v1.0.9 is the latest deterministic release, and #4 is closed with a release reference.

## Completion Criteria

- [ ] Issue #4 was reopened before work and remains open until release verification.
- [ ] Every enabled due withdrawal records requested, funded, unfunded and source data.
- [ ] Completely unfunded withdrawals remain visible without charting invented money.
- [ ] Aggregate amber warning totals and counts are correct.
- [ ] Annual-budget red/green semantics remain independent.
- [ ] Disabled withdrawals remain inert.
- [ ] v1.0.8 archive provenance matches blob `56d1025edfadb121f372b06e27c0b42cd6f5fd9e`.
- [ ] Deterministic identity and documentation consistently say v1.09.
- [ ] Monte Carlo remains unreleased v0.8 development work and is not published.
- [ ] Both Node suites, browser matrix, real-iPad check and CI pass.
- [ ] Publication waits for explicit user approval.
- [ ] The published deterministic asset is hash-verified before #4 closes.
