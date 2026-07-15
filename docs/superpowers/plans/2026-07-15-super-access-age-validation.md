# Super Access Age Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reject super access ages below 60 in both simulators with the approved concise explanation, while leaving saved data and schema versions unchanged.

**Architecture:** Tighten the existing `validateScenario` boundary in each embedded core, then align the corresponding numeric input and assumptions copy. Keep the rule in core validation so interactive edits and JSON imports cannot bypass it; documentation and the deferred-review register record the simplified taxed-fund rationale.

**Tech Stack:** Standalone HTML/CSS/JavaScript applications, Node.js `vm`-based regression suites, Markdown documentation.

---

### Task 1: Enforce the deterministic simulator boundary

**Files:**
- Modify: `tests/retirement-simulator.test.mjs:65-95`
- Modify: `retirement-simulator.html:350-359`
- Modify: `retirement-simulator.html:2187-2192`
- Modify: `retirement-simulator.html:2722-2732`

- [ ] **Step 1: Write failing deterministic validation and interface tests**

Immediately after the existing `sample validates` check in `tests/retirement-simulator.test.mjs`, add:

```js
const belowMinimumSuperAccess = structuredClone(sample);
belowMinimumSuperAccess.people[0].superAccessAge = 59;
const belowMinimumSuperAccessError = core.validateScenario(belowMinimumSuperAccess)
  .find(error => error.path === 'people.0.superAccessAge');
check('super access age 59 is rejected with the approved explanation',
  belowMinimumSuperAccessError?.message ===
    'Super access age must be 60 or older because this simulator does not model taxation of withdrawals before age 60.',
  JSON.stringify(belowMinimumSuperAccessError));

const minimumSuperAccess = structuredClone(sample);
minimumSuperAccess.people[0].superAccessAge = 60;
check('super access age 60 remains valid',
  !core.validateScenario(minimumSuperAccess)
    .some(error => error.path === 'people.0.superAccessAge'));

check('deterministic super access control exposes the age-60 minimum',
  html.includes("numberField('Super access age', `${path}.superAccessAge`, person.superAccessAge, 'min=\"60\" max=\"120\"')"));
check('deterministic assumptions explain the age-60 boundary',
  html.includes('The simulator treats super withdrawals as tax-free and does not model the additional tax rules that may apply before age 60.'));
```

- [ ] **Step 2: Run the deterministic suite and verify the new assertions fail**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: non-zero exit with failures for the age-59 rule, the input minimum and the approved assumptions explanation. The age-60 boundary assertion should already pass.

- [ ] **Step 3: Tighten deterministic core validation**

Replace the existing `superAccessAge` validation block in `retirement-simulator.html` with:

```js
if (!Number.isFinite(person.superAccessAge) ||
    person.superAccessAge < 60 || person.superAccessAge > 120) {
  add(`people.${index}.superAccessAge`,
    'Super access age must be 60 or older because this simulator does not model taxation of withdrawals before age 60.');
}
```

This rejects malformed values, ages below 60 and ages above 120 without changing schema migration or stored values.

- [ ] **Step 4: Align the deterministic input and concise explanation**

In `personFields`, change the access-age control and helper to:

```js
${numberField('Super access age', `${path}.superAccessAge`, person.superAccessAge, 'min="60" max="120"')}
${numberField('Super access %', `${path}.superAccessPct`, person.superAccessPct, 'min="0" max="100" step="1"')}
<p class="sub">Age and % of super balance moved into drawdown phase. The simulator treats super withdrawals as tax-free and does not model the additional tax rules that may apply before age 60.</p>
```

Replace the old early-access limitation list item under `Model assumptions and sources` with:

```html
<li>Super access age is limited to 60 or older. The simulator treats super withdrawals as tax-free and does not model the additional tax rules that may apply before age 60.</li>
```

- [ ] **Step 5: Run the deterministic suite and verify it passes**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: `240 passed, 0 failed` if no other tests were added during execution.

- [ ] **Step 6: Commit the deterministic boundary**

```powershell
git add retirement-simulator.html tests/retirement-simulator.test.mjs
git commit -m "fix: require super access from age 60"
```

### Task 2: Enforce the same boundary in Monte Carlo

**Files:**
- Modify: `tests/retirement-monte-carlo.test.mjs:75-85`
- Modify: `tests/retirement-monte-carlo.test.mjs:168-205`
- Modify: `retirement-monte-carlo-v0.7.html:315-322`
- Modify: `retirement-monte-carlo-v0.7.html:1640-1655`
- Modify: `retirement-monte-carlo-v0.7.html:1997-2007`

- [ ] **Step 1: Write failing native Monte Carlo validation and interface tests**

After the `monteCarloDemo` assertions in `tests/retirement-monte-carlo.test.mjs`, add:

```js
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
```

- [ ] **Step 2: Write failing deterministic-import boundary tests**

Immediately after `adaptedSchema12` is created, add:

```js
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
```

- [ ] **Step 3: Run the Monte Carlo suite and verify the new assertions fail**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: non-zero exit at the first new age-59 validation assertion.

- [ ] **Step 4: Tighten Monte Carlo core validation**

Replace the existing `superAccessAge` validation block in `retirement-monte-carlo-v0.7.html` with:

```js
if (!Number.isFinite(person.superAccessAge) ||
    person.superAccessAge < 60 || person.superAccessAge > 120) {
  add(`people.${index}.superAccessAge`,
    'Super access age must be 60 or older because this simulator does not model taxation of withdrawals before age 60.');
}
```

The deterministic adapter continues to preserve the imported value. `importScenario` then applies this native core validation and rejects 59 rather than rewriting it.

- [ ] **Step 5: Align the Monte Carlo input and concise explanation**

In `personFields`, change the access-age control and helper to:

```js
${numberField('Super access age', `${path}.superAccessAge`, person.superAccessAge, 'min="60" max="120"')}
${numberField('Super access %', `${path}.superAccessPct`, person.superAccessPct, 'min="0" max="100" step="1"')}
<p class="sub">Age and % of super balance moved into drawdown phase. The simulator treats super withdrawals as tax-free and does not model the additional tax rules that may apply before age 60.</p>
```

Replace the old early-access limitation list item with:

```html
<li>Super access age is limited to 60 or older. The simulator treats super withdrawals as tax-free and does not model the additional tax rules that may apply before age 60.</li>
```

- [ ] **Step 6: Run the Monte Carlo suite and verify it passes**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: `retirement-monte-carlo-v0.7 survivor-boundary, risk-mode, age-gap and stress override tests passed`.

- [ ] **Step 7: Commit Monte Carlo parity**

```powershell
git add retirement-monte-carlo-v0.7.html tests/retirement-monte-carlo.test.mjs
git commit -m "fix: align Monte Carlo super access validation"
```

### Task 3: Record the decision and resolve the deferred item

**Files:**
- Modify: `tests/retirement-simulator.test.mjs:200-242`
- Modify: `README.md:53-84`
- Modify: `docs/MODEL-METHODOLOGY.md:45-49`
- Modify: `docs/TESTING.md:3-16`
- Modify: `docs/TESTING.md:31-65`
- Modify: `CHANGELOG.md:1-7`
- Modify: `docs/DEFERRED-REVIEW.md:18-28`

- [ ] **Step 1: Write failing documentation-contract tests**

At the top of `tests/retirement-simulator.test.mjs`, add this path and read beside the existing documentation constants:

```js
const CHANGELOG = fileURLToPath(new URL('../CHANGELOG.md', import.meta.url));
const changelog = readFileSync(CHANGELOG, 'utf8');
```

After the existing deferred-register checks, add:

```js
check('public docs explain the supported age-60 super boundary',
  readme.includes('super access age of 60 or older') &&
  methodology.includes('Super access age is limited to 60 or older') &&
  testingGuide.includes('age 59 is rejected') &&
  testingGuide.includes('age 60 is accepted'));
check('changelog records the super access validation decision',
  changelog.includes('Reject super access ages below 60') &&
  changelog.includes('issues/8'));
check('deferred register resolves the pre-60 taxation item',
  deferredReview.includes('| AIPR-003-SUPER-TAXFREE |') &&
  deferredReview.includes('| Resolved | Super access ages below 60 are rejected') &&
  deferredReview.includes('taxation of withdrawals before age 60'));
```

- [ ] **Step 2: Run the deterministic suite and verify the documentation assertions fail**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: non-zero exit with the three new documentation-contract checks failing.

- [ ] **Step 3: Update README and methodology with the concise rationale**

In `README.md`, change the super-access feature bullet to:

```markdown
- super access from age 60 and ordered drawdown tiers;
```

After the return-assumptions paragraph, add:

```markdown
Both tools require a super access age of 60 or older. They treat super withdrawals as tax-free and do not model the additional tax rules that may apply before age 60.
```

In `docs/MODEL-METHODOLOGY.md`, replace the final sentence of the opening Superannuation paragraph with:

```markdown
Super access age is limited to 60 or older because the simulator treats withdrawals as tax-free and does not model the additional tax rules that may apply before age 60. It remains a simplified model and does not implement complete Transition-to-Retirement compliance rules.
```

- [ ] **Step 4: Update the testing guide**

Append this sentence to each automated-suite description in `docs/TESTING.md`:

```markdown
The suite also verifies that age 59 is rejected with the approved explanation and age 60 is accepted.
```

Add this item to the browser-verification list:

```markdown
- super access validation in both tools, confirming age 59 is rejected with the concise tax explanation and age 60 is accepted;
```

- [ ] **Step 5: Add an unreleased changelog entry**

Insert this above `## 1.08` in `CHANGELOG.md`:

```markdown
## Unreleased

- Reject super access ages below 60 in both simulators because pre-60 withdrawal taxation is outside the simplified model ([#8](https://github.com/dcaddick/retirement-simulator/issues/8)).
```

This keeps release numbering unchanged while issue #1 proceeds through its separate design cycle.

- [ ] **Step 6: Resolve the retained deferred-review row**

Replace the `AIPR-003-SUPER-TAXFREE` row in `docs/DEFERRED-REVIEW.md` with:

```markdown
| AIPR-003-SUPER-TAXFREE | [#8](https://github.com/dcaddick/retirement-simulator/issues/8) | Resolved | Super access ages below 60 are rejected; supported withdrawals retain the simulator's simplified tax-free treatment. | Prevents the model from understating tax by applying its age-60-and-over assumption to younger withdrawals. | Benefit components, preservation rules and offsets remain outside the simple model. | Product decision recorded in the approved super-access-age validation design, based on current ATO guidance. | Resolved after v1.0.8/v0.7: both engines enforce age 60 with a concise explanation and regression coverage; the next release will carry the public change. |
```

- [ ] **Step 7: Run the deterministic suite and verify all documentation contracts pass**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: all deterministic checks pass with zero failures.

- [ ] **Step 8: Commit the documentation and register update**

```powershell
git add README.md CHANGELOG.md docs/MODEL-METHODOLOGY.md docs/TESTING.md docs/DEFERRED-REVIEW.md tests/retirement-simulator.test.mjs
git commit -m "docs: resolve pre-60 super tax limitation"
```

### Task 4: Verify the complete issue #8 change

**Files:**
- Verify: `retirement-simulator.html`
- Verify: `retirement-monte-carlo-v0.7.html`
- Verify: `tests/retirement-simulator.test.mjs`
- Verify: `tests/retirement-monte-carlo.test.mjs`
- Verify: `README.md`
- Verify: `CHANGELOG.md`
- Verify: `docs/MODEL-METHODOLOGY.md`
- Verify: `docs/TESTING.md`
- Verify: `docs/DEFERRED-REVIEW.md`

- [ ] **Step 1: Run both complete regression suites**

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

Expected: deterministic suite reports zero failures; Monte Carlo reports its survivor-boundary, risk-mode, age-gap and stress-override success line.

- [ ] **Step 2: Confirm the obsolete boundary is absent from executable files**

```powershell
rg -n "Super access age must be between 0 and 120|min=\"0\" max=\"120\".*superAccessAge|model will misstate results for anyone under 60" retirement-simulator.html retirement-monte-carlo-v0.7.html
```

Expected: no matches.

- [ ] **Step 3: Confirm the approved explanation and age-60 minimum are aligned**

```powershell
rg -n "Super access age must be 60 or older|additional tax rules that may apply before age 60|min=\"60\" max=\"120\"" retirement-simulator.html retirement-monte-carlo-v0.7.html
```

Expected: matching validation, helper, assumptions and input-control lines in both files.

- [ ] **Step 4: Check patch integrity and repository state**

```powershell
git diff --check
git status --short --branch
git log -5 --oneline
```

Expected: no whitespace errors, no uncommitted implementation files and the three issue #8 implementation commits above the design and plan commits.

- [ ] **Step 5: Preserve the release boundary**

Do not publish a GitHub release or close issue #8 in this implementation plan. Leave the changelog entry under `Unreleased`; after issue #1 has its own approved design and implementation, perform release numbering, archive creation, publishing and issue closure as a separately authorised release task.
