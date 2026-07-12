# One-click Simulator Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give non-technical README visitors a stable one-click download for the latest deterministic simulator.

**Architecture:** The README links to GitHub's stable latest-release asset URL rather than a branch-specific raw file. The release process must attach the self-contained HTML under the exact filename used by that URL.

**Tech Stack:** Markdown, GitHub Releases, self-contained HTML

---

### Task 1: Add the prominent download link

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add the download block below the opening warning**

```markdown
## Download

[**Download Retirement Simulator**](https://github.com/dcaddick/retirement-simulator/releases/latest/download/retirement-simulator.html)

Single HTML file · no installation · opens locally in a modern browser.
```

- [ ] **Step 2: Verify the stable URL and wording**

Run:

```powershell
rg -n "releases/latest/download/retirement-simulator.html|Single HTML file" README.md
```

Expected: one match for the stable release URL and one match for the explanatory sentence.

- [ ] **Step 3: Check Markdown and repository diffs**

Run:

```powershell
git diff --check
git diff -- README.md
```

Expected: no whitespace errors and only the approved download block added to `README.md`.

- [ ] **Step 4: Commit the README change**

```powershell
git add README.md
git commit -m "docs: add one-click simulator download"
```

### Task 2: Verify the release asset at publication

**Files:**
- Source asset: `retirement-simulator.html`

- [ ] **Step 1: Attach the deterministic simulator to the v1.02 GitHub release**

Upload `retirement-simulator.html` without renaming it. The release asset name must remain exactly `retirement-simulator.html`.

- [ ] **Step 2: Verify the public download**

Open this URL in a signed-out browser after publishing the release:

```text
https://github.com/dcaddick/retirement-simulator/releases/latest/download/retirement-simulator.html
```

Expected: the browser downloads `retirement-simulator.html`; opening that file shows the v1.02 simulator in its default dark theme.
