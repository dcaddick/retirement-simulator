# GitHub Pages iPad Hosting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the canonical deterministic simulator at the repository's GitHub Pages root, release the combined work as deterministic v1.0.11, and close issue #36 only after both delivery paths are verified.

**Architecture:** A dedicated GitHub Actions workflow validates only the deterministic simulator, copies the canonical HTML to a temporary Pages artifact as `index.html`, adds `.nojekyll`, and deploys only those two files. The same tested `main` commit is tagged as v1.0.11 and publishes the canonical deterministic HTML as its sole release asset; Pages, the independently downloaded asset, and the stable latest-download URL are verified before issue #36 closes. The repository keeps no duplicate app entry point, and the Monte Carlo tool remains unpublished.

**Tech Stack:** Static HTML, Node 20 regression tests, GitHub Actions, GitHub Pages actions, GitHub CLI, Playwright/Chromium browser verification.

**Design specification:** `docs/superpowers/specs/2026-07-23-github-pages-ipad-hosting-design.md`

---

## File map

- Create `.github/workflows/deploy-pages.yml`
  - Validate the deterministic simulator.
  - Build the two-file Pages artifact.
  - Deploy through the `github-pages` environment.
- Modify `tests/retirement-simulator.test.mjs`
  - Treat the Pages workflow, README invitation, privacy copy, testing guidance,
    and changelog entry as regression-tested public contracts.
- Modify `README.md`
  - Keep the downloadable HTML as the primary action.
  - Add the hosted iPad/browser invitation and origin-specific storage note.
  - Disclose ordinary GitHub Pages request metadata.
- Modify `docs/TESTING.md`
  - Document local packaging and live Pages/iPad checks.
- Modify `CHANGELOG.md`
  - Publish the Pages, issue #34 and issue #36 entries under v1.11 while
    retaining unrelated Monte Carlo work under Unreleased.
- Create `archive/retirement-simulator-v1.0.10.html`
  - Preserve the exact tagged outgoing deterministic executable.
- Modify `archive/README.md`
  - Record v1.0.10 tag-blob and SHA-256 provenance.
- Modify `retirement-simulator.html`
  - Advance deterministic identity to v1.11 and preserve v1.10 local-storage
    migration.
- Create `docs/assets/retirement-simulator-v1.11.png`
  - Show the current deterministic release with fictional sample data.

No Monte Carlo source, calculation model, schema, or Monte Carlo release asset
changes are planned.

---

### Task 1: Lock down the Pages workflow contract

**Files:**
- Modify: `tests/retirement-simulator.test.mjs:26-47`
- Modify: `tests/retirement-simulator.test.mjs:2330-2342`
- Create: `.github/workflows/deploy-pages.yml`

- [ ] **Step 1: Add a guarded workflow fixture to the deterministic test**

Add the workflow path beside the existing documentation paths:

```js
const PAGES_WORKFLOW = fileURLToPath(
  new URL('../.github/workflows/deploy-pages.yml', import.meta.url)
);
```

Add the guarded read beside the existing `readme`, `changelog`, and testing
guide reads:

```js
const pagesWorkflow = existsSync(PAGES_WORKFLOW)
  ? readFileSync(PAGES_WORKFLOW, 'utf8')
  : '';
```

- [ ] **Step 2: Add failing workflow contract checks**

Add these checks after the existing issue #36 documentation checks:

```js
console.log('\ngithub pages deployment');
check('Pages workflow exists', pagesWorkflow.length > 0);
check('Pages workflow validates only the deterministic simulator',
  pagesWorkflow.includes('node tests/retirement-simulator.test.mjs') &&
  !pagesWorkflow.includes('retirement-monte-carlo.test.mjs') &&
  pagesWorkflow.includes('needs: validate'));
check('Pages workflow publishes only the canonical simulator artifact',
  pagesWorkflow.includes('cp retirement-simulator.html _site/index.html') &&
  pagesWorkflow.includes('touch _site/.nojekyll') &&
  pagesWorkflow.includes('cmp retirement-simulator.html _site/index.html') &&
  pagesWorkflow.includes("path: '_site'"));
check('Pages workflow is main-scoped and permission-bounded',
  pagesWorkflow.includes('branches: [main]') &&
  pagesWorkflow.includes('workflow_dispatch:') &&
  pagesWorkflow.includes('pages: write') &&
  pagesWorkflow.includes('id-token: write') &&
  pagesWorkflow.includes('cancel-in-progress: false'));
```

- [ ] **Step 3: Run the deterministic suite and verify the new checks fail**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: the existing 360 checks pass and the four new GitHub Pages checks
fail because `.github/workflows/deploy-pages.yml` does not exist.

- [ ] **Step 4: Create the minimal Pages workflow**

Create `.github/workflows/deploy-pages.yml` with this complete content:

```yaml
name: Deploy deterministic simulator to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'retirement-simulator.html'
      - '.github/workflows/deploy-pages.yml'
  workflow_dispatch:

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  validate:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event_name == 'workflow_dispatch' && 'main' || github.sha }}
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Run deterministic regression suite
        run: node tests/retirement-simulator.test.mjs
      - name: Build controlled Pages artifact
        shell: bash
        run: |
          mkdir -p _site
          cp retirement-simulator.html _site/index.html
          touch _site/.nojekyll
          cmp retirement-simulator.html _site/index.html
          test "$(find _site -maxdepth 1 -type f | wc -l)" -eq 2
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '_site'

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Deploy Pages artifact
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Run the deterministic suite and workflow text checks**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
```

Expected: 364 deterministic checks pass, the script blocks parse cleanly, and
`git diff --check` produces no errors.

- [ ] **Step 6: Commit the workflow contract**

```powershell
git add .github/workflows/deploy-pages.yml tests/retirement-simulator.test.mjs
git commit -m "ci: deploy deterministic simulator to Pages"
```

Expected: one commit containing only the workflow and its deterministic
contract tests.

---

### Task 2: Add the iPad invitation and hosting disclosures

**Files:**
- Modify: `tests/retirement-simulator.test.mjs:2330-2350`
- Modify: `README.md:12-27`
- Modify: `README.md:95-107`
- Modify: `docs/TESTING.md:34-78`
- Modify: `CHANGELOG.md:5-12`

- [ ] **Step 1: Add failing public-copy checks**

Add these checks after the workflow checks:

```js
const pagesUrl = 'https://dcaddick.github.io/retirement-simulator/';
const downloadLinkIndex = readme.indexOf(
  'https://github.com/dcaddick/retirement-simulator/releases/latest/download/retirement-simulator.html'
);
const hostedLinkIndex = readme.indexOf(pagesUrl);
check('README offers the hosted simulator beneath the download',
  downloadLinkIndex >= 0 &&
  hostedLinkIndex > downloadLinkIndex &&
  readme.includes('Using an iPad? Try the simulator in your browser'));
check('README explains hosted storage and transfer boundaries',
  readme.includes("that browser's local storage") &&
  readme.includes('do not automatically appear') &&
  readme.includes('JSON export/import'));
check('README discloses GitHub Pages request metadata',
  readme.includes('GitHub Pages') &&
  readme.includes('visitor IP address'));
check('testing guide covers controlled Pages publishing',
  testingGuide.includes('### GitHub Pages verification') &&
  testingGuide.includes('retirement-monte-carlo-v0.7.html') &&
  testingGuide.includes('return 404'));
check('changelog records deterministic Pages hosting',
  changelog.includes('GitHub Pages') &&
  changelog.includes('iPad'));
```

- [ ] **Step 2: Run the deterministic suite and verify the copy checks fail**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: the 364 checks from Task 1 pass and the five new public-copy checks
fail.

- [ ] **Step 3: Add the hosted invitation beneath the download link**

Immediately after the existing Download Retirement Simulator link in
`README.md`, add:

```markdown
[**Using an iPad? Try the simulator in your browser**](https://dcaddick.github.io/retirement-simulator/)

Open the same deterministic simulator to explore its look and feel without downloading the HTML file. Scenario data stays in that browser's local storage. Scenarios created from a locally opened file do not automatically appear on the hosted site, but you can move them with JSON export/import.
```

Keep the existing “Single HTML file” line and release download link unchanged.

- [ ] **Step 4: Extend the README privacy section**

Add this bullet after “Core calculations run locally in the browser”:

```markdown
- The optional GitHub Pages version is served by GitHub. GitHub receives ordinary web-request metadata, including the visitor IP address, but the simulator does not send scenario contents to GitHub.
```

Do not remove or weaken the existing local-storage, JSON sensitivity,
market-data, or CSP disclosures.

- [ ] **Step 5: Document Pages verification**

Insert this section in `docs/TESTING.md` immediately before the iPad Safari
release check:

```markdown
### GitHub Pages verification

The hosted deterministic simulator is built from `retirement-simulator.html` as a two-file artifact containing only `index.html` and `.nojekyll`. Before deployment, confirm the deterministic suite passes, the copied HTML matches the canonical source and no other files enter `_site`.

After deployment, verify:

- `https://dcaddick.github.io/retirement-simulator/` returns 200 over HTTPS and opens the deterministic simulator directly;
- `/retirement-monte-carlo-v0.7.html` and `/README.md` return 404;
- the displayed version, CSP, theme, confirmation modal, chart, table, JSON import/export and local persistence work without console errors;
- Couple/Single switching works at iPad portrait and landscape viewport sizes;
- the README iPad link opens the Pages root.
```

- [ ] **Step 6: Record the hosting milestone**

Add this bullet at the top of the Unreleased section in `CHANGELOG.md`:

```markdown
- Added an optional GitHub Pages entry point for iPad and browser users, publishing only the deterministic simulator while retaining the downloadable HTML as the primary distribution.
```

- [ ] **Step 7: Run the deterministic suite and documentation checks**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
```

Expected: 369 deterministic checks pass and `git diff --check` is clean.

- [ ] **Step 8: Commit the public invitation and disclosures**

```powershell
git add README.md docs/TESTING.md CHANGELOG.md tests/retirement-simulator.test.mjs
git commit -m "docs: offer hosted simulator for iPad"
```

Expected: one documentation commit with its regression checks.

---

### Task 3: Prepare deterministic v1.0.11

**Files:**
- Modify: `tests/retirement-simulator.test.mjs:1-50`
- Modify: `tests/retirement-simulator.test.mjs:215-350`
- Create: `archive/retirement-simulator-v1.0.10.html`
- Modify: `archive/README.md:5-19`
- Modify: `.github/workflows/test.yml:19-31`
- Modify: `retirement-simulator.html:7,212,437,3164-3180`
- Modify: `README.md:18-20`
- Modify: `CHANGELOG.md:5-16`
- Create: `docs/assets/retirement-simulator-v1.11.png`

- [ ] **Step 1: Add failing v1.0.11 release-contract checks**

Add these fixtures beside the existing archive and screenshot fixtures:

```js
const ARCHIVE_110 = fileURLToPath(
  new URL('../archive/retirement-simulator-v1.0.10.html', import.meta.url)
);
const ARCHIVE_README = fileURLToPath(
  new URL('../archive/README.md', import.meta.url)
);
const TEST_WORKFLOW = fileURLToPath(
  new URL('../.github/workflows/test.yml', import.meta.url)
);
const SCREENSHOT_111 = fileURLToPath(
  new URL('../docs/assets/retirement-simulator-v1.11.png', import.meta.url)
);
```

Add these reads beside the existing README, changelog and testing-guide reads:

```js
const archiveReadme = readFileSync(ARCHIVE_README, 'utf8');
const testWorkflow = readFileSync(TEST_WORKFLOW, 'utf8');
```

Replace the current v1.10 identity, README, screenshot and changelog checks with:

```js
check('v1.11 document version is consistent',
  html.includes('<title>Family Retirement Income Simulator v1.11</title>') &&
  html.includes('<span class="version">v1.11</span>') &&
  html.includes("const STORAGE_KEY = 'family-retirement-simulator:v1.11:scenario'") &&
  html.includes("'family-retirement-simulator:v1.10:scenario'"));
check('outgoing v1.0.10 executable is archived', existsSync(ARCHIVE_110));
check('v1.0.10 archive provenance is recorded',
  archiveReadme.includes('v1.0.10:retirement-simulator.html') &&
  archiveReadme.includes('87d456f500a6f48f2289e91afb553d267faa8ff9') &&
  archiveReadme.includes('6F9401E74709A67BDD539DD353ED9E4C78A71ACA4B78D8D2A8206811BAE9C394'));
check('CI verifies the archived v1.0.10 tag blob',
  testWorkflow.includes('Verify archived v1.0.10 source') &&
  testWorkflow.includes('v1.0.10:retirement-simulator.html'));
check('README identifies deterministic v1.11 and its screenshot',
  readme.includes('v1.11') &&
  readme.includes('docs/assets/retirement-simulator-v1.11.png') &&
  existsSync(SCREENSHOT_111));
check('changelog records v1.11 Pages and iPad household work',
  changelog.includes('## 1.11 - 2026-07-23') &&
  changelog.includes('GitHub Pages') &&
  changelog.includes('[#34]') &&
  changelog.includes('[#36]'));
```

- [ ] **Step 2: Run the deterministic suite and verify six release checks fail**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: the Pages and public-copy checks pass and the six v1.0.11
release-contract checks fail; replacing four prior v1.10 checks and adding two
archive checks brings the suite total to 371.

- [ ] **Step 3: Recover the exact v1.0.10 tagged executable**

Run:

```powershell
$archiveExtractDir = Join-Path ([System.IO.Path]::GetTempPath()) ("retirement-v110-" + [guid]::NewGuid())
$archiveTar = Join-Path $archiveExtractDir 'v1.0.10.tar'
New-Item -ItemType Directory -Path $archiveExtractDir | Out-Null
git archive --format=tar --output=$archiveTar v1.0.10 retirement-simulator.html
tar -xf $archiveTar -C $archiveExtractDir
Copy-Item -LiteralPath (Join-Path $archiveExtractDir 'retirement-simulator.html') -Destination 'archive/retirement-simulator-v1.0.10.html'
git hash-object archive/retirement-simulator-v1.0.10.html
git rev-parse v1.0.10:retirement-simulator.html
Get-FileHash -Algorithm SHA256 -LiteralPath archive/retirement-simulator-v1.0.10.html
```

Expected:

```text
Git blob: 87d456f500a6f48f2289e91afb553d267faa8ff9
SHA-256: 6F9401E74709A67BDD539DD353ED9E4C78A71ACA4B78D8D2A8206811BAE9C394
```

Remove only the verified extraction directory:

```powershell
$resolvedArchiveExtractDir = (Resolve-Path -LiteralPath $archiveExtractDir).Path
$resolvedArchiveTempRoot = (Resolve-Path -LiteralPath ([System.IO.Path]::GetTempPath())).Path
if (-not $resolvedArchiveExtractDir.StartsWith($resolvedArchiveTempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to remove non-temporary path: $resolvedArchiveExtractDir"
}
Remove-Item -LiteralPath $resolvedArchiveExtractDir -Recurse -Force
```

- [ ] **Step 4: Record and enforce archive provenance**

Append this row to `archive/README.md`:

```markdown
| `retirement-simulator-v1.0.10.html` | `v1.0.10:retirement-simulator.html` | `87d456f500a6f48f2289e91afb553d267faa8ff9` | `6F9401E74709A67BDD539DD353ED9E4C78A71ACA4B78D8D2A8206811BAE9C394` |
```

Add this step after the v1.0.9 archive check in `.github/workflows/test.yml`:

```yaml
      - name: Verify archived v1.0.10 source
        run: test "$(git hash-object archive/retirement-simulator-v1.0.10.html)" = "$(git rev-parse v1.0.10:retirement-simulator.html)"
```

- [ ] **Step 5: Advance the deterministic release identity**

Make these exact replacements in `retirement-simulator.html`:

```text
Family Retirement Income Simulator v1.10
→ Family Retirement Income Simulator v1.11

<span class="version">v1.10</span>
→ <span class="version">v1.11</span>

<b>v1.10.</b>
→ <b>v1.11.</b>

family-retirement-simulator:v1.10:scenario
→ family-retirement-simulator:v1.11:scenario
```

Then add the outgoing key as the first legacy key:

```js
const LEGACY_STORAGE_KEYS = [
  'family-retirement-simulator:v1.10:scenario',
  'family-retirement-simulator:v1.09:scenario',
```

Do not change schema 14, calculation logic, sample data or any Monte Carlo
file.

- [ ] **Step 6: Publish the v1.11 changelog section**

Keep the Monte Carlo issue #8 and issue #1 bullets under `Unreleased`. Move the
Pages bullet and the existing issue #34 and #36 bullets beneath:

```markdown
## 1.11 - 2026-07-23
```

The three v1.11 bullets must remain substantively unchanged and ordered:
GitHub Pages, iPad-safe confirmations, then deterministic Couple/Single
households.

- [ ] **Step 7: Update the current-release screenshot and README identity**

Change the README image and caption from v1.10 to v1.11:

```markdown
![Retirement Income Simulator v1.11 showing a fictional single-person household](docs/assets/retirement-simulator-v1.11.png)

*Shown with fictional sample data in the default dark theme. The deterministic v1.11 simulator supports Couple and Single households, and the optional hosted version offers easier iPad access. Results are estimates, not financial advice.*
```

Open `retirement-simulator.html` in Chromium, select **Single**, keep only the
fictional sample values, render at 1440 × 1000 in the default dark theme, and
save the full-page screenshot to:

```text
docs/assets/retirement-simulator-v1.11.png
```

Visually inspect the saved PNG and confirm it contains no personal data,
validation banner, clipped primary controls or open modal.

- [ ] **Step 8: Run release-contract and repository checks**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
git hash-object archive/retirement-simulator-v1.0.10.html
git rev-parse v1.0.10:retirement-simulator.html
```

Expected: 371 deterministic checks pass, diff-check is clean, and both Git blob
commands return `87d456f500a6f48f2289e91afb553d267faa8ff9`.

- [ ] **Step 9: Commit v1.0.11 preparation**

```powershell
git add retirement-simulator.html archive/retirement-simulator-v1.0.10.html archive/README.md .github/workflows/test.yml README.md CHANGELOG.md docs/assets/retirement-simulator-v1.11.png tests/retirement-simulator.test.mjs
git commit -m "release: prepare deterministic v1.0.11"
```

Expected: one release-preparation commit with no Monte Carlo changes.

---

### Task 4: Reproduce the Pages artifact and browser behaviour locally

**Files:**
- Verify: `retirement-simulator.html`
- Verify: `.github/workflows/deploy-pages.yml`
- Verify: repository worktree

- [ ] **Step 1: Create an isolated local artifact**

Run from PowerShell:

```powershell
$pagesVerifyDir = Join-Path ([System.IO.Path]::GetTempPath()) ("retirement-pages-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $pagesVerifyDir | Out-Null
Copy-Item -LiteralPath retirement-simulator.html -Destination (Join-Path $pagesVerifyDir 'index.html')
New-Item -ItemType File -Path (Join-Path $pagesVerifyDir '.nojekyll') | Out-Null
```

Expected: a new uniquely named temporary directory containing the candidate
artifact.

- [ ] **Step 2: Verify artifact identity and exact contents**

Run:

```powershell
$sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath retirement-simulator.html).Hash
$indexHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $pagesVerifyDir 'index.html')).Hash
if ($sourceHash -ne $indexHash) { throw 'Pages index differs from canonical simulator' }
$artifactFiles = Get-ChildItem -Force -File -LiteralPath $pagesVerifyDir | Select-Object -ExpandProperty Name
if (@($artifactFiles).Count -ne 2 -or 'index.html' -notin $artifactFiles -or '.nojekyll' -notin $artifactFiles) {
  throw "Unexpected Pages artifact: $($artifactFiles -join ', ')"
}
```

Expected: no exception; the source and index SHA-256 values match and the only
files are `index.html` and `.nojekyll`.

- [ ] **Step 3: Run a real-browser check against the generated index**

Use Playwright/Chromium to open the generated `index.html` and verify:

```text
page title contains "Family Retirement Income Simulator"
no pageerror or console error events
#confirmModal exists
Household section opens
household.type changes from Couple to Single
#peopleFields contains one fieldset in Single mode
the projection table contains no Person 2 heading in Single mode
reload restores the saved Single household
```

Repeat at:

```text
820 x 1180
1180 x 820
```

Expected: all assertions pass at iPad portrait and landscape sizes.

- [ ] **Step 4: Remove only the verified temporary directory**

Resolve and verify the target before removal:

```powershell
$resolvedPagesVerifyDir = (Resolve-Path -LiteralPath $pagesVerifyDir).Path
$resolvedTempRoot = (Resolve-Path -LiteralPath ([System.IO.Path]::GetTempPath())).Path
if (-not $resolvedPagesVerifyDir.StartsWith($resolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to remove non-temporary path: $resolvedPagesVerifyDir"
}
Remove-Item -LiteralPath $resolvedPagesVerifyDir -Recurse -Force
```

Expected: only the unique verification directory is removed.

- [ ] **Step 5: Run the final local repository audit**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check
git status --short --branch
git log -3 --oneline
```

Expected:

```text
371 passed, 0 failed
no diff-check errors
clean codex/github-pages-hosting worktree
three implementation commits above the planning commits
```

---

### Task 5: Enable Pages and deploy the tested main commit

**Files:**
- External repository setting: GitHub Pages source
- External deployment: `dcaddick/retirement-simulator`

- [ ] **Step 1: Refresh remote state and confirm branch scope**

Run:

```powershell
git fetch origin
git status --short --branch
git rev-list --left-right --count origin/main...HEAD
git log --oneline origin/main..HEAD
```

Expected: the worktree is clean and the output contains only the design,
workflow, and hosting-documentation commits. If `origin/main` has advanced,
merge it into the feature branch and rerun Task 4 before continuing.

- [ ] **Step 2: Enable the workflow publishing source**

Confirm current state:

```powershell
gh api repos/dcaddick/retirement-simulator/pages
```

Expected before first setup: HTTP 404 because Pages is disabled.

Create the Pages site:

```powershell
gh api --method POST repos/dcaddick/retirement-simulator/pages -f build_type=workflow
```

If Pages was enabled between checks and POST returns HTTP 409, set the build
type explicitly:

```powershell
gh api --method PUT repos/dcaddick/retirement-simulator/pages -f build_type=workflow
```

Verify:

```powershell
gh api repos/dcaddick/retirement-simulator/pages --jq '{build_type,html_url,status}'
```

Expected:

```json
{"build_type":"workflow","html_url":"https://dcaddick.github.io/retirement-simulator/","status":null}
```

The status may temporarily be `built`, `building`, or `errored`; `build_type`
and `html_url` are the authoritative setup checks.

- [ ] **Step 3: Integrate the approved branch into local main**

Run:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff codex/github-pages-hosting -m "merge: host deterministic simulator on GitHub Pages"
```

Expected: the feature branch merges without unrelated file changes. If a
same-line README or changelog conflict exists, retain both the newer `main`
entry and the approved Pages copy, then rerun the deterministic suite.

- [ ] **Step 4: Verify merged main before pushing**

Run:

```powershell
node tests/retirement-simulator.test.mjs
git diff --check origin/main...main
git status --short --branch
```

Expected: 371 checks pass, diff check is clean, and `main` is ahead of
`origin/main` with no working-tree changes.

- [ ] **Step 5: Push main and identify the deployment run**

Run:

```powershell
git push origin main
$pagesRun = gh run list --workflow deploy-pages.yml --branch main --limit 1 --json databaseId,status,conclusion,headSha,url | ConvertFrom-Json
if (-not $pagesRun) { throw 'No Pages deployment run found' }
$pagesRun
```

Expected: `main` pushes successfully and the latest Pages run targets the
pushed merge commit.

- [ ] **Step 6: Wait for the Pages workflow**

```powershell
gh run watch $pagesRun.databaseId --exit-status
```

Expected: validation, artifact upload, configuration and deployment all
complete successfully.

---

### Task 6: Verify the live iPad/browser experience

**Files:**
- Verify live URL: `https://dcaddick.github.io/retirement-simulator/`
- Verify repository README on `main`

- [ ] **Step 1: Verify live HTTP boundaries**

Run:

```powershell
$rootResponse = Invoke-WebRequest -Uri 'https://dcaddick.github.io/retirement-simulator/' -Method Head
if ($rootResponse.StatusCode -ne 200) { throw "Unexpected root status: $($rootResponse.StatusCode)" }

try {
  Invoke-WebRequest -Uri 'https://dcaddick.github.io/retirement-simulator/retirement-monte-carlo-v0.7.html' -Method Head -ErrorAction Stop
  throw 'Monte Carlo URL unexpectedly exists'
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 404) { throw }
}

try {
  Invoke-WebRequest -Uri 'https://dcaddick.github.io/retirement-simulator/README.md' -Method Head -ErrorAction Stop
  throw 'README unexpectedly exists in Pages artifact'
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 404) { throw }
}
```

Expected: root is 200; Monte Carlo and README are 404.

- [ ] **Step 2: Verify live app identity and console cleanliness**

Open the root URL with Playwright/Chromium and assert:

```text
document.title contains "Family Retirement Income Simulator"
header version matches the canonical deterministic HTML
Content-Security-Policy meta element is present
no pageerror or console error events
#confirmModal exists
```

Expected: all assertions pass.

- [ ] **Step 3: Verify local persistence and Single-mode output**

At 820 x 1180:

```text
open the Household section
change household.type to Single
confirm #peopleFields contains one fieldset
confirm the projection table contains no Person 2 heading
reload
confirm household.type remains Single
confirm the saved scenario remains in browser local storage
```

Repeat the layout and horizontal table-scroll check at 1180 x 820.

Expected: state persists on the hosted origin and both iPad-sized layouts remain
usable without console errors.

- [ ] **Step 4: Verify JSON round-trip on the hosted origin**

Using fictional data only:

```text
export the hosted scenario JSON
create or reset the hosted scenario
import the exported JSON
confirm the household type and fictional edited value are restored
```

Expected: JSON is user-controlled and moves scenario state successfully.

- [ ] **Step 5: Verify the public README link**

Open the `main` README on GitHub and follow “Using an iPad? Try the simulator in
your browser”.

Expected: it opens
`https://dcaddick.github.io/retirement-simulator/` directly with no landing
page.

- [ ] **Step 6: Confirm final repository and Pages state**

Run:

```powershell
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
gh api repos/dcaddick/retirement-simulator/pages --jq '{build_type,html_url,status}'
```

Expected:

```text
clean main worktree
local HEAD equals origin/main
build_type is workflow
html_url is https://dcaddick.github.io/retirement-simulator/
Pages status is built
```

Report the merge commit, workflow run URL, live Pages URL, deterministic test
count, iPad viewport results, and the confirmed Monte Carlo/README 404
boundaries.

---

### Task 7: Publish v1.0.11 and close issue #36

**Files:**
- External tag: `v1.0.11`
- External release: `Retirement Simulator v1.0.11`
- Release asset: `retirement-simulator.html`
- GitHub issue: `dcaddick/retirement-simulator#36`

- [ ] **Step 1: Confirm the release commit and repository CI**

Run:

```powershell
$releaseCommit = git rev-parse HEAD
if ($releaseCommit -ne (git rev-parse origin/main)) { throw 'Local main and origin/main differ' }
gh run list --workflow test.yml --branch main --limit 1 --json databaseId,status,conclusion,headSha,url
```

Expected: the latest `test.yml` run targets `$releaseCommit` and succeeds. If
the existing experimental Monte Carlo parity check still fails, do not hide or
waive it: report the exact failure and keep issue #36 open until the release
gate is explicitly resolved.

- [ ] **Step 2: Create and push the annotated release tag**

Run:

```powershell
git tag -a v1.0.11 -m "Retirement Simulator v1.0.11"
git push origin v1.0.11
git rev-parse v1.0.11^{}
```

Expected: the peeled tag commit equals `$releaseCommit`.

- [ ] **Step 3: Publish the deterministic-only GitHub release**

Run:

```powershell
gh release create v1.0.11 retirement-simulator.html `
  --repo dcaddick/retirement-simulator `
  --verify-tag `
  --latest `
  --title "Retirement Simulator v1.0.11" `
  --notes "Adds deterministic Couple/Single household modelling (#36), iPad-safe confirmation dialogs (#34), and an optional GitHub Pages entry point for easier iPad/browser access. The downloadable self-contained HTML remains the primary distribution. The experimental Monte Carlo companion is unchanged and is not included in this release. Results remain estimates, not financial advice."
```

Expected: the release publishes successfully with
`retirement-simulator.html` as its only asset.

- [ ] **Step 4: Independently verify the release asset**

Run:

```powershell
$releaseVerifyDir = Join-Path ([System.IO.Path]::GetTempPath()) ("retirement-v111-release-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $releaseVerifyDir | Out-Null
gh release download v1.0.11 --repo dcaddick/retirement-simulator --pattern retirement-simulator.html --dir $releaseVerifyDir
$sourceReleaseHash = (Get-FileHash -Algorithm SHA256 -LiteralPath retirement-simulator.html).Hash
$downloadedReleaseHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $releaseVerifyDir 'retirement-simulator.html')).Hash
if ($sourceReleaseHash -ne $downloadedReleaseHash) { throw 'Downloaded v1.0.11 asset differs from tagged source' }
gh release view v1.0.11 --repo dcaddick/retirement-simulator --json url,tagName,assets
gh api repos/dcaddick/retirement-simulator/releases/latest --jq '.tag_name'
```

Expected: one asset is reported, the latest tag is `v1.0.11`, and the
source/download SHA-256 values match.

- [ ] **Step 5: Verify the stable latest-download URL**

Run:

```powershell
$latestDownload = Join-Path $releaseVerifyDir 'latest-retirement-simulator.html'
Invoke-WebRequest -Uri 'https://github.com/dcaddick/retirement-simulator/releases/latest/download/retirement-simulator.html' -OutFile $latestDownload
$latestDownloadHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $latestDownload).Hash
if ($sourceReleaseHash -ne $latestDownloadHash) { throw 'Stable latest-download asset differs from v1.0.11 source' }
```

Expected: the stable download resolves and matches the tagged source by
SHA-256.

Remove only the verified release-download directory:

```powershell
$resolvedReleaseVerifyDir = (Resolve-Path -LiteralPath $releaseVerifyDir).Path
$resolvedReleaseTempRoot = (Resolve-Path -LiteralPath ([System.IO.Path]::GetTempPath())).Path
if (-not $resolvedReleaseVerifyDir.StartsWith($resolvedReleaseTempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to remove non-temporary path: $resolvedReleaseVerifyDir"
}
Remove-Item -LiteralPath $resolvedReleaseVerifyDir -Recurse -Force
```

- [ ] **Step 6: Close issue #36 with verified delivery links**

Run:

```powershell
gh issue comment 36 --repo dcaddick/retirement-simulator --body "Released in v1.0.11 after deterministic regression, GitHub Pages and independent release-asset verification. Release: https://github.com/dcaddick/retirement-simulator/releases/tag/v1.0.11 Hosted deterministic simulator: https://dcaddick.github.io/retirement-simulator/"
gh issue close 36 --repo dcaddick/retirement-simulator --reason completed
gh issue view 36 --repo dcaddick/retirement-simulator --json state,stateReason,url
```

Expected: issue #36 is closed as completed only after the release and hosted
links are live.

- [ ] **Step 7: Final release audit**

Run:

```powershell
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git rev-parse v1.0.11^{}
gh release view v1.0.11 --repo dcaddick/retirement-simulator --json url,tagName,assets
gh api repos/dcaddick/retirement-simulator/releases/latest --jq '.tag_name'
gh api repos/dcaddick/retirement-simulator/pages --jq '{build_type,html_url,status}'
gh issue view 36 --repo dcaddick/retirement-simulator --json state,stateReason,url
```

Expected: clean synchronized `main`, all three commit values match, the latest
tag is v1.0.11 with one deterministic asset, Pages is built, and issue #36 is
closed as completed.
