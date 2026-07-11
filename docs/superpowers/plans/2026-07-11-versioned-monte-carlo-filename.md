# Versioned Monte Carlo Filename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the experimental Monte Carlo entry point so its v0.5 maturity is explicit in the public filename and every repository reference.

**Architecture:** Perform one Git-aware rename, then update the two consumers that name the file directly: the README handoff instructions and the Monte Carlo regression fixture. Retain one canonical file only, leave the existing v1.0.0 tag unchanged, and publish the clarification as a new commit on `main`.

**Tech Stack:** Git, Markdown, self-contained HTML, Node.js `.mjs` regression tests, GitHub Actions.

---

### Task 1: Pin the versioned filename contract

**Files:**
- Modify: `C:\repos\retirement-simulator-mc-rename\tests\retirement-monte-carlo.test.mjs`

- [ ] **Step 1: Change the fixture path to the required public filename**

Replace:

```js
new URL('../retirement-monte-carlo.html', import.meta.url)
```

with:

```js
new URL('../retirement-monte-carlo-v0.5.html', import.meta.url)
```

- [ ] **Step 2: Run the focused suite and verify it fails before the rename**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: failure reading `retirement-monte-carlo-v0.5.html` because the versioned file does not yet exist.

### Task 2: Rename the canonical entry point and documentation reference

**Files:**
- Rename: `C:\repos\retirement-simulator-mc-rename\retirement-monte-carlo.html`
- To: `C:\repos\retirement-simulator-mc-rename\retirement-monte-carlo-v0.5.html`
- Modify: `C:\repos\retirement-simulator-mc-rename\README.md`
- Modify: `C:\repos\retirement-simulator-mc-rename\CHANGELOG.md`

- [ ] **Step 1: Perform the Git-aware rename**

Run:

```powershell
git mv retirement-monte-carlo.html retirement-monte-carlo-v0.5.html
```

- [ ] **Step 2: Update the README handoff instruction**

Replace:

```markdown
4. Optionally export the scenario and import it into `retirement-monte-carlo.html`.
```

with:

```markdown
4. Optionally export the scenario and import it into `retirement-monte-carlo-v0.5.html`.
```

- [ ] **Step 3: Record the clarification in the changelog**

Add this v1.00 bullet:

```markdown
- Renamed the experimental companion entry point to `retirement-monte-carlo-v0.5.html` so its maturity cannot be confused with the deterministic v1.00 simulator.
```

### Task 3: Verify and publish the clarification

**Files:**
- Verify: `C:\repos\retirement-simulator-mc-rename\retirement-monte-carlo-v0.5.html`
- Verify: `C:\repos\retirement-simulator-mc-rename\README.md`
- Verify: `C:\repos\retirement-simulator-mc-rename\CHANGELOG.md`
- Verify: `C:\repos\retirement-simulator-mc-rename\tests\retirement-monte-carlo.test.mjs`

- [ ] **Step 1: Confirm no stale unversioned filename references remain**

Run:

```powershell
rg -n "retirement-monte-carlo\.html" . --glob '!docs/superpowers/**'
```

Expected: no matches.

- [ ] **Step 2: Confirm the renamed file still declares v0.5 experimental status**

Run:

```powershell
rg -n "v0\.5|experimental" retirement-monte-carlo-v0.5.html README.md CHANGELOG.md
```

Expected: the HTML title and heading show v0.5 and public documentation labels the companion experimental.

- [ ] **Step 3: Run both regression suites**

Run:

```powershell
node tests/retirement-simulator.test.mjs
node tests/retirement-monte-carlo.test.mjs
```

Expected: deterministic suite reports 58 passed and Monte Carlo suite reports its risk-mode and stress tests passed.

- [ ] **Step 4: Check diff integrity**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; status shows one rename plus the intentional README, changelog, test and plan changes.

- [ ] **Step 5: Commit the implementation**

Run:

```powershell
git add README.md CHANGELOG.md tests/retirement-monte-carlo.test.mjs retirement-monte-carlo-v0.5.html docs/superpowers/plans/2026-07-11-versioned-monte-carlo-filename.md
git commit -m "chore: make Monte Carlo v0.5 filename explicit"
```

- [ ] **Step 6: Fast-forward and publish**

Run from `C:\repos\retirement-simulator`:

```powershell
git merge --ff-only codex/monte-carlo-v05-filename
git push origin main
gh run watch --repo dcaddick/retirement-simulator --exit-status
```

Expected: `main` pushes successfully and the Regression tests workflow completes successfully.
