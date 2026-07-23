# GitHub Pages iPad Hosting Design

**Date:** 2026-07-23  
**Status:** Design approved; written specification awaiting user review

## Purpose

Offer an easy way for iPad users to open the deterministic retirement simulator
and experience its look and feel without downloading and launching a local HTML
file.

The hosted version complements the existing downloadable HTML. It does not
replace the download, create a separate demo build, or publish the experimental
Monte Carlo tool.

## User experience

The GitHub Pages project URL opens the deterministic simulator immediately:

`https://dcaddick.github.io/retirement-simulator/`

The README keeps the existing download link as the primary option and adds a
secondary invitation directly beneath it:

> **Using an iPad? Try the simulator in your browser**  
> Open the deterministic simulator to explore its look and feel without
> downloading the HTML file.

The accompanying note states that:

- the hosted page is the same deterministic simulator rather than a reduced
  demo;
- results remain estimates and are not advice;
- scenario data stays in that browser's local storage;
- scenarios saved while using a local file do not automatically appear on the
  hosted origin, but JSON export/import can move them.

## Publishing architecture

GitHub Actions publishes a deliberately small Pages artifact. The workflow:

1. Checks out the tested `main` commit.
2. Uses Node 20 and runs `node tests/retirement-simulator.test.mjs`.
3. Creates a temporary `_site` directory.
4. Copies `retirement-simulator.html` to `_site/index.html`.
5. Creates `_site/.nojekyll`.
6. Confirms the generated `index.html` is byte-for-byte identical to
   `retirement-simulator.html`.
7. Uploads `_site` as the Pages artifact.
8. Deploys that artifact to the `github-pages` environment.

The source file remains canonical. No committed duplicate `index.html` is
maintained.

The artifact contains only:

- `index.html`
- `.nojekyll`

It does not publish the repository root, documentation, archived releases,
tests, private verification material, or any Monte Carlo HTML.

## Workflow triggers and permissions

The Pages workflow runs:

- after a push to `main` that changes `retirement-simulator.html` or the Pages
  workflow itself;
- manually through `workflow_dispatch`, always packaging the current `main`
  version rather than an arbitrary branch.

The deployment has a concurrency group named `pages` and does not cancel an
in-progress deployment.

Permissions are job-scoped:

- validation/build: `contents: read`;
- deployment: `contents: read`, `pages: write`, and `id-token: write`.

The deploy job uses GitHub's `github-pages` environment and reports the
deployment URL.

The existing regression workflow remains unchanged. The Pages workflow runs the
deterministic suite independently because only the deterministic simulator is
published. Deployment is not blocked by the known experimental Monte Carlo
zero-volatility Other-income parity failure.

## One-time repository configuration

GitHub Pages is currently disabled for the repository. During implementation,
the repository Pages source will be set to **GitHub Actions**. No custom domain
or DNS changes are included.

The default GitHub Pages project address and HTTPS are used.

## Privacy and security

The hosted simulator keeps the existing local-first calculation model:

- no account is required;
- scenario data is stored in browser local storage for the
  `dcaddick.github.io` origin;
- no scenario is uploaded by the simulator;
- JSON import/export remains user-controlled;
- the simulator adds no analytics, trackers, advertising, cookies, server-side
  storage, or new network services;
- optional Stooq and Frankfurter requests retain their existing user-triggered
  behaviour and CSP restrictions.

GitHub Pages receives ordinary web-request metadata, including visitor IP
addresses, under GitHub's privacy terms. The README privacy copy will distinguish
this hosting metadata from simulator scenario data.

The public app retains its existing estimate-only and financial-advice
disclosures.

## Failure and rollback behaviour

- A deterministic validation failure prevents a new artifact from deploying.
- A packaging or deployment failure leaves the previous successful Pages
  deployment available.
- Every deployment is tied to a `main` commit and can be rolled back by
  reverting that commit or manually rerunning a previously restored version.
- The downloadable release asset and stable repository HTML are unaffected by
  Pages deployment failures.

## Verification

### Local and workflow checks

- Run `node tests/retirement-simulator.test.mjs`.
- Validate workflow YAML structure.
- Confirm `_site/index.html` matches `retirement-simulator.html`.
- Confirm the artifact contains no unexpected files.
- Run `git diff --check`.

### Deployed checks

- Confirm the Pages deployment completes successfully.
- Confirm the root URL returns HTTP 200 over HTTPS.
- Confirm the page title and displayed deterministic version match the source.
- Confirm CSP is active and there are no console errors.
- Confirm the simulator recalculates and persists a fictional scenario after
  reload.
- Confirm JSON export/import works on the hosted origin.
- Check an iPad-sized viewport, including portrait and landscape layout,
  controls, table scrolling, chart rendering, confirmation modal and
  Couple/Single switching.
- Confirm the README's iPad link opens the root URL directly.

## Out of scope

- Publishing the experimental Monte Carlo tool.
- A landing page.
- A custom domain.
- PWA installation, service workers, offline caching or an App Store package.
- Analytics or usage telemetry.
- Moving local-file browser storage automatically to the hosted origin.
- Changing the simulator's calculation model or release version.

## Acceptance criteria

1. The Pages root URL opens the deterministic simulator directly.
2. Only the deterministic simulator and `.nojekyll` are present in the
   deployment artifact.
3. A deterministic regression failure blocks deployment.
4. The README retains the download link and offers the approved iPad/browser
   link beneath it.
5. The hosted app retains local-only scenario storage and existing disclosures.
6. The experimental Monte Carlo tool is not published or changed.
7. The deployed page passes the defined desktop and iPad-sized browser checks.
