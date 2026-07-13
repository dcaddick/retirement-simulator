---
title: Lump-sum regression fix and release archive design
date: 2026-07-13
status: approved-design
---

# Lump-sum Regression Fix and Release Archive Design

## Goal

Fix issue #2, which raises `ReferenceError: formatMoney is not defined` when a lump-sum withdrawal is added after the Age Pension estimate is disabled, and establish a public archive of sanitized deterministic simulator releases for repeatable cross-version testing.

## Version and filename model

The live deterministic simulator keeps the stable production filename `retirement-simulator.html`. Release numbers describe published iterations; they are not added to the production filename.

Historical public builds are preserved as executable snapshots:

```text
archive/
  retirement-simulator-v1.0.1.html
  retirement-simulator-v1.0.2.html
```

The current v1.03 implementation remains at `retirement-simulator.html`. Before a future v1.04 replaces it, the outgoing v1.03 build must be copied to `archive/retirement-simulator-v1.0.3.html` in the same change that advances production.

Only sanitized public builds may enter `archive/`. Personal scenarios, balances, names, screenshots, and private development artifacts remain excluded.

## Historical snapshot provenance

The v1.0.1 and v1.0.2 archive files must be recovered from the exact public Git tags or GitHub release assets, not reconstructed from the current file. Their hashes are recorded during implementation so future testers can verify provenance.

Git tags remain the authoritative release history. The archive provides convenient, directly executable fixtures for browser testing and technically capable users who want to compare older behavior.

## Regression investigation

One identical browser interaction is run against:

1. `archive/retirement-simulator-v1.0.1.html`;
2. `archive/retirement-simulator-v1.0.2.html`;
3. the local v1.03 `retirement-simulator.html`.

The interaction uses only the fictional demo scenario:

1. open the simulator;
2. reset or load demo values;
3. disable **Include Aged Pension estimate**;
4. add a lump-sum withdrawal;
5. collect page errors and the in-app script-error banner;
6. verify that the new withdrawal UI appears and the projection chart remains available.

The comparison identifies the first affected release and captures the actual failing stack before production code changes.

## Fix boundary

The implementation makes the smallest source correction supported by the reproduced stack. The expected failure is an out-of-scope money formatter reference; if confirmed, the UI path must call the formatter through its exported core namespace. No calculation, schema, layout, or modelling behavior changes are in scope.

## Test coverage

The repository gains a durable sanitized interaction regression test for the toggle-then-add sequence. It must fail against every affected archived release and pass against the corrected production file. Existing deterministic and Monte Carlo Node suites must continue to pass.

A real-browser verification repeats the interaction against v1.0.1, v1.0.2, the pre-fix v1.03 state, and corrected v1.03. Screenshots are unnecessary; test output must not include personal data.

## Documentation and contributor workflow

`README.md`, `CHANGELOG.md`, and `docs/TESTING.md` document:

- the stable unversioned production filename;
- the purpose and sanitized-only rule for `archive/`;
- how to run an archived build;
- the cross-version regression test;
- the rule that an outgoing production build is archived before replacement.

This intentionally supersedes the earlier policy of relying only on Git history without duplicated historical source files.

## Delivery

Work occurs on `codex/fix-issue-2-archives`, based on the local v1.03 implementation branch. The completed change is committed, pushed, and opened as a pull request linked to issue #2. Creating a v1.03 release, replacing `origin/main`, or publishing a release asset is outside this change and requires separate approval.
