# Simulator Fixes, Salary Growth and Release Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix issues #2 and #3, clarify UK State Pension chart tooltips, and preserve sanitized v1.0.1/v1.0.2 builds as executable public regression fixtures.

**Architecture:** Keep `retirement-simulator.html` as the stable production entry point and extend its existing embedded core/UI boundaries without refactoring the single-file application. Exact tagged releases become immutable files under `archive/`; deterministic Node tests cover core, schema and HTML contracts, while Playwright CLI supplies the real-browser cross-version interaction matrix. Schema 10 introduces per-person `salaryGrowthPct`, defaulting to zero; Monte Carlo accepts schema 10 only when unsupported active salary growth is absent.

**Tech Stack:** Self-contained HTML/CSS/JavaScript, Node.js 20 `vm` regression tests, PowerShell/Git SHA-256 verification, Playwright CLI real-browser checks, GitHub Actions.

---

## File map

- Create `archive/retirement-simulator-v1.0.1.html`: exact sanitized source from tag `v1.0.1`.
- Create `archive/retirement-simulator-v1.0.2.html`: exact sanitized source from tag `v1.0.2`.
- Create `archive/README.md`: snapshot provenance, hashes, privacy rule and archive-before-replacement workflow.
- Modify `retirement-simulator.html`: issue #2 fix, schema 10 salary growth, and dual-value UK pension tooltip.
- Modify `tests/retirement-simulator.test.mjs`: deterministic regression, migration, salary and tooltip contracts.
- Modify `retirement-monte-carlo-v0.5.html`: explicit schema 10 adapter handling.
- Modify `tests/retirement-monte-carlo.test.mjs`: schema 10 zero-growth acceptance and active-growth rejection.
- Modify `README.md`, `CHANGELOG.md`, `docs/MODEL-METHODOLOGY.md`, `docs/TESTING.md`, `CONTRIBUTING.md`: public archive and modelling documentation.
- Modify `.github/workflows/test.yml`: verify archive hashes as well as both Node suites.

### Task 1: Preserve exact public release snapshots

**Files:**
- Create: `archive/retirement-simulator-v1.0.1.html`
- Create: `archive/retirement-simulator-v1.0.2.html`
- Create: `archive/README.md`
- Modify: `.github/workflows/test.yml`

- [ ] **Step 1: Extract exact tagged files without changing either tag**

Run from the fix worktree:

```powershell
New-Item -ItemType Directory -Path archive -Force
git show v1.0.1:retirement-simulator.html | Set-Content -LiteralPath archive/retirement-simulator-v1.0.1.html -Encoding utf8NoBOM
git show v1.0.2:retirement-simulator.html | Set-Content -LiteralPath archive/retirement-simulator-v1.0.2.html -Encoding utf8NoBOM
```

Expected: two standalone HTML files appear under `archive/` and contain only fictional public sample data.

- [ ] **Step 2: Verify byte identity against Git objects**

Use binary-safe extraction for the committed copies, then verify each archived blob equals its tag blob:

```powershell
git hash-object archive/retirement-simulator-v1.0.1.html
git rev-parse v1.0.1:retirement-simulator.html
git hash-object archive/retirement-simulator-v1.0.2.html
git rev-parse v1.0.2:retirement-simulator.html
```

Expected: the two hashes in each version pair match. If PowerShell newline conversion changed bytes, replace the files with a binary-safe `git archive` extraction before continuing.

- [ ] **Step 3: Record provenance and the future archive rule**

Create `archive/README.md` with:

```markdown
# Archived deterministic simulator releases

These executable snapshots are exact, sanitized public releases retained for regression testing and comparison. The live entry point remains `../retirement-simulator.html`.

| File | Git source |
|---|---|
| `retirement-simulator-v1.0.1.html` | `v1.0.1:retirement-simulator.html` |
| `retirement-simulator-v1.0.2.html` | `v1.0.2:retirement-simulator.html` |

Only public fictional sample data may be stored here. Never archive personal scenarios, balances, names, screenshots, exports or private development artifacts.

Before a new production iteration replaces `retirement-simulator.html`, copy the outgoing sanitized build here as `retirement-simulator-vX.Y.Z.html`, verify it against the outgoing tag or release asset, and update this table.
```

- [ ] **Step 4: Add CI archive-integrity checks**

Set full history on the existing checkout so release tags are available, then add these steps before the Node suites in `.github/workflows/test.yml`:

```yaml
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Verify archived v1.0.1 source
        run: test "$(git hash-object archive/retirement-simulator-v1.0.1.html)" = "$(git rev-parse v1.0.1:retirement-simulator.html)"
      - name: Verify archived v1.0.2 source
        run: test "$(git hash-object archive/retirement-simulator-v1.0.2.html)" = "$(git rev-parse v1.0.2:retirement-simulator.html)"
```

- [ ] **Step 5: Verify and commit the archive**

Run:

```powershell
git diff --check
git status --short
```

Expected: only the two archives, archive README and workflow are changed.

Commit:

```powershell
git add archive .github/workflows/test.yml
git commit -m "test: preserve public simulator release fixtures"
```

### Task 2: Reproduce and fix issue #2

**Files:**
- Modify: `tests/retirement-simulator.test.mjs`
- Modify: `retirement-simulator.html:2016-2021`

- [ ] **Step 1: Add the failing issue #2 contract test**

Add beside the existing lump-editor HTML checks:

```js
check('compact lump-sum formatter uses the exported core formatter',
  /function compactMoney\([^)]+\)\s*\{[\s\S]*?return core\.formatMoney\(amount\);[\s\S]*?\}/.test(html));
```

This isolates the precise scope failure reached when `renderScenario()` rebuilds collapsed lump-sum rows after the Age Pension toggle has been changed.

- [ ] **Step 2: Run the deterministic test and verify failure**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: `FAIL compact lump-sum formatter uses the exported core formatter` because `compactMoney()` calls undefined UI-global `formatMoney()`.

- [ ] **Step 3: Apply the minimal production fix**

Change only the final line of `compactMoney()`:

```js
  function compactMoney(value) {
    const amount = Number(value) || 0;
    if (Math.abs(amount) >= 1000000) return `$${(amount / 1000000).toFixed(amount % 1000000 ? 1 : 0)}M`;
    if (Math.abs(amount) >= 1000) return `$${(amount / 1000).toFixed(amount % 1000 ? 1 : 0)}K`;
    return core.formatMoney(amount);
  }
```

- [ ] **Step 4: Run the deterministic suite and commit**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
```

Expected: all deterministic checks pass and no whitespace errors appear.

Commit:

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: render new lump sums after pension changes"
```

### Task 3: Add schema 10 per-person salary growth

**Files:**
- Modify: `retirement-simulator.html:455,623-690,837-846,1189-1197,1467-1510,1910-1930`
- Modify: `tests/retirement-simulator.test.mjs`

- [ ] **Step 1: Add failing schema, migration and projection tests**

Update the schema assertion and add these focused checks:

```js
check('schema version is 10', core.SCHEMA_VERSION === 10);
check('sample salary growth defaults to zero',
  sample.people.every(person => person.salaryGrowthPct === 0));

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
check('salary growth stops at retirement',
  salaryRows[3].components.workGross === 0);
```

Add a migration fixture by cloning a schema 9 scenario, deleting `salaryGrowthPct`, importing it, and asserting schema 10 plus two zero defaults. Add a validation test asserting a negative value produces an error at `people.0.salaryGrowthPct`.

- [ ] **Step 2: Run the suite and verify the new tests fail**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: schema/default/migration tests fail because schema 10 and `salaryGrowthPct` do not exist.

- [ ] **Step 3: Implement schema 9 to 10 migration and defaults**

Set:

```js
const SCHEMA_VERSION = 10;
```

Add `salaryGrowthPct: 0` to both fictional people. After the schema 8 to 9 migration, add:

```js
    if (current.schemaVersion === 9) {
      const migrated = structuredClone(current);
      migrated.schemaVersion = 10;
      migrated.people = migrated.people.map(person => ({
        ...person,
        salaryGrowthPct: Number.isFinite(person.salaryGrowthPct)
          ? person.salaryGrowthPct
          : 0
      }));
      current = migrated;
    }
```

- [ ] **Step 4: Implement salary calculation and expose gross salary for testing**

In the projection-year function, calculate:

```js
      const working = ages[index] < person.retireAge;
      const yearsElapsed = year - scenario.startYear;
      const salaryGrowthFactor = Math.pow(
        1 + (person.salaryGrowthPct ?? 0) / 100,
        yearsElapsed
      );
      const salary = working
        ? person.salary * inflationFactor * salaryGrowthFactor
        : 0;
```

Add the non-tax-adjusted value to returned components without changing chart segments:

```js
        workGross: salaries.reduce((sum, value) => sum + value, 0) / inflationFactor,
```

Existing `salaries` consumers automatically carry the new value through SG, tax, Age Pension assessment and drawdown calculations.

- [ ] **Step 5: Add UI field and validation**

Immediately after Salary in each person field, render:

```js
      ${numberField('Salary growth above inflation %', `${path}.salaryGrowthPct`,
        person.salaryGrowthPct ?? 0, 'min="0" step="0.1"')}
```

In `validateScenario()`, add:

```js
        if (!finiteNonNegative(person.salaryGrowthPct)) {
          add(`people.${index}.salaryGrowthPct`,
            'Salary growth above inflation must be zero or greater.');
        }
```

- [ ] **Step 6: Run deterministic tests and commit**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
```

Expected: all deterministic tests pass, including zero compatibility, compounding, independent people, SG downstream behavior, validation, migration and retirement cutoff.

Commit:

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "feat: model salary growth above inflation"
```

### Task 4: Keep Monte Carlo schema handling explicit

**Files:**
- Modify: `retirement-monte-carlo-v0.5.html:712-737`
- Modify: `tests/retirement-monte-carlo.test.mjs:87-102`

- [ ] **Step 1: Add failing schema 10 adapter tests**

Add:

```js
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
```

- [ ] **Step 2: Run the Monte Carlo suite and verify failure**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: schema 10 is rejected with the generic unsupported-schema error rather than the required explicit salary-growth message.

- [ ] **Step 3: Extend the adapter without silently dropping active growth**

Change the accepted deterministic schemas and add the guard:

```js
    if (![6, 7, 8, 9, 10].includes(scenario.schemaVersion)) return scenario;
    if (scenario.people?.some(person => Number(person.salaryGrowthPct) > 0)) {
      throw new Error('Monte Carlo v0.5 cannot yet model above-inflation salary growth. Set it to 0% in a fictional copy before importing.');
    }
```

Before returning the adapted schema, remove the unsupported inert property:

```js
    adapted.people = adapted.people.map(person => {
      const { salaryGrowthPct, ...rest } = person;
      return rest;
    });
```

- [ ] **Step 4: Run both suites and commit**

Run:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

Expected: both suites pass.

Commit:

```powershell
git add retirement-monte-carlo-v0.5.html tests/retirement-monte-carlo.test.mjs
git commit -m "fix: handle schema 10 Monte Carlo imports explicitly"
```

### Task 5: Clarify UK State Pension chart tooltip

**Files:**
- Modify: `retirement-simulator.html:1671-1681,2694-2702`
- Modify: `tests/retirement-simulator.test.mjs:255-275`

- [ ] **Step 1: Add the failing dual-value tooltip test**

Add a UK pension tooltip fixture with an explicit display factor:

```js
const pensionTooltip = core.chartTooltipLines(
  { key: 'ukStateNet', value: 40172, label: 'UK State Pension', displayFactor: 1 },
  {
    year: 2062,
    ages: [100, 101],
    totalIncome: 199349,
    components: { ukStateGross: 45809 }
  },
  sample
);
check('UK pension tooltip distinguishes allocated net from gross',
  pensionTooltip[1] === '$40,172 after estimated household tax allocation' &&
  pensionTooltip[2] === '$45,809 gross UK State Pension',
  JSON.stringify(pensionTooltip));
```

- [ ] **Step 2: Run the deterministic suite and verify failure**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: the tooltip still returns the generic single detail line.

- [ ] **Step 3: Implement the approved tooltip wording**

Before the generic segment branch in `chartTooltipLines()`, add:

```js
    if (segment.key === 'ukStateNet') {
      const factor = segment.displayFactor ?? 1;
      return [
        context,
        `${formatMoney(segment.value)} after estimated household tax allocation`,
        `${formatMoney((row.components?.ukStateGross ?? 0) * factor)} gross ${segment.label}`
      ];
    }
```

The existing tooltip renderer already renders every returned line, so no table or tax-engine change is required.

- [ ] **Step 4: Run tests and commit**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
```

Expected: tooltip and all deterministic checks pass.

Commit:

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: explain UK pension chart values"
```

### Task 6: Document the archive, salary model and fixes

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/MODEL-METHODOLOGY.md`
- Modify: `docs/TESTING.md`
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Update public usage and contribution guidance**

Document in `README.md` that `retirement-simulator.html` is the stable live filename and `archive/` contains exact sanitized releases for comparison. Document the `0%` per-person salary-growth default.

Add this contributor rule to `CONTRIBUTING.md`:

```markdown
Before replacing the deterministic production build, preserve the outgoing sanitized `retirement-simulator.html` under `archive/retirement-simulator-vX.Y.Z.html`, verify it against its tag or release asset, and update `archive/README.md`. Never archive personal scenarios or screenshots.
```

- [ ] **Step 2: Document calculation semantics**

Add to `docs/MODEL-METHODOLOGY.md`:

```markdown
### Salary growth above inflation

Each person's entered salary is indexed by the selected inflation path while they remain employed. The optional salary-growth-above-inflation percentage then compounds independently from the second model year: `salary × inflation factor × (1 + growth rate)^years elapsed`. The default is 0%, and no salary is included from the person's retirement age onward.
```

Explain that the UK pension chart is after estimated household tax allocation while the table remains gross.

- [ ] **Step 3: Expand testing instructions and changelog**

In `docs/TESTING.md`, add exact commands for opening the two archived files and running the toggle/add interaction. Add privacy-safe checks for salary growth in both display modes and the dual pension tooltip.

In `CHANGELOG.md`, add an unreleased entry covering issue #2, issue #3, the pension tooltip clarification and public archive policy. Do not publish or tag a release.

- [ ] **Step 4: Scan documentation and commit**

Run:

```powershell
rg -n "Dave|Nat|codex-clipboard|AppData|DCs-SecondBrain|personal scenario" README.md CHANGELOG.md CONTRIBUTING.md docs archive
git diff --check
```

Expected: no personal data, local paths or private-vault references; policy wording such as “personal scenarios” may appear only as a prohibition.

Commit:

```powershell
git add README.md CHANGELOG.md CONTRIBUTING.md docs/MODEL-METHODOLOGY.md docs/TESTING.md archive/README.md
git commit -m "docs: explain archives and salary progression"
```

### Task 7: Cross-version and real-browser verification

**Files:**
- Verify only: `archive/retirement-simulator-v1.0.1.html`
- Verify only: `archive/retirement-simulator-v1.0.2.html`
- Verify only: `retirement-simulator.html`

- [ ] **Step 1: Verify Playwright CLI prerequisites**

Run:

```powershell
where.exe npx
```

Expected: an `npx` executable is found. Use `C:\Users\dcadd\.codex\skills\playwright\scripts\playwright_cli.sh` through a compatible shell, or the installed `playwright-cli` command on Windows.

- [ ] **Step 2: Serve the worktree locally**

Start a local static server bound to loopback only:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Expected: the three builds are reachable at `/archive/retirement-simulator-v1.0.1.html`, `/archive/retirement-simulator-v1.0.2.html`, and `/retirement-simulator.html`.

- [ ] **Step 3: Run the same issue #2 interaction against all builds**

For each URL:

1. open the page and snapshot;
2. use only fictional demo values;
3. disable **Include Aged Pension estimate**;
4. click **Add withdrawal**;
5. snapshot again;
6. record whether `#jsErrorBanner` appears and whether the new lump-sum editor/row is present.

Expected matrix:

| Build | Expected result |
|---|---|
| v1.0.1 | No `formatMoney` error; pre-v1.03 lump UI remains functional |
| v1.0.2 | No `formatMoney` error; pre-v1.03 lump UI remains functional |
| v1.03 before fix | `formatMoney is not defined` reproduced |
| corrected production file | No error; new expanded lump row appears |

- [ ] **Step 4: Verify salary growth and pension tooltip in the corrected build**

Using demo data only:

1. set Person 1 salary growth above inflation to `1%` and Person 2 to `0%`;
2. verify the first year is unchanged and later nominal salary-derived values rise faster for Person 1;
3. verify salary stops at retirement;
4. inspect a UK State Pension chart segment in today's dollars and nominal dollars;
5. verify the tooltip shows both “after estimated household tax allocation” and “gross UK State Pension”.

- [ ] **Step 5: Run final automated verification**

Run:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
git diff --check
git status --short --branch
```

Expected: both suites pass, no whitespace errors, and only intended committed work is present.

### Task 8: Push and open the pull request

**Files:**
- No additional source changes unless verification finds a defect.

- [ ] **Step 1: Review the complete branch**

Run:

```powershell
git log --oneline codex/v1.03-collapsible-lump-sums..HEAD
git diff --stat codex/v1.03-collapsible-lump-sums...HEAD
git status --short --branch
```

Expected: intentional design, archive, fix, feature, tooltip, tests and documentation commits; clean worktree.

- [ ] **Step 2: Push the branch**

Run:

```powershell
git push -u origin codex/fix-issue-2-archives
```

- [ ] **Step 3: Open a draft pull request**

Open the draft PR against `main`. This branch is intentionally based on the completed local v1.03 implementation, so the PR includes the unpublished v1.03 interaction work followed by the archive, fixes and salary feature. Confirm the PR diff begins after `origin/main` at `b616321` and does not contain private-vault files.

PR title:

```text
Fix lump-sum rendering and add salary progression
```

PR body must summarize the public archives, issue #2 root cause and fix, issue #3 salary model, schema 10 migration, Monte Carlo guard, pension tooltip clarification, automated results and real-browser matrix. Include `Closes #2` and `Closes #3`. Do not include user screenshots, personal figures or private-vault paths.

- [ ] **Step 4: Verify PR state**

Confirm the PR is a draft, targets the intended base, contains only this branch's changes, and has CI running.
