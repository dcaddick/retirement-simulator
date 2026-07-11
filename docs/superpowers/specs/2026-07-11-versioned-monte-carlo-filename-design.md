# Versioned Monte Carlo Filename Design

## Purpose

Remove any possible implication that the experimental Monte Carlo companion shares the deterministic simulator's v1.00 maturity level.

## Design

- Rename `retirement-monte-carlo.html` to `retirement-monte-carlo-v0.5.html`.
- Keep `retirement-simulator.html` as the stable deterministic v1.00 entry point.
- Update every repository reference, including README instructions and the Monte Carlo regression-suite fixture path.
- Do not retain an unversioned duplicate or redirect file because duplicate entry points can drift and reintroduce ambiguity.
- Do not move or rewrite the published `v1.0.0` tag; the rename is a post-release clarification on `main`.

## Verification

- Search the repository for stale references to `retirement-monte-carlo.html`.
- Run both Node regression suites.
- Run `git diff --check`.
- Confirm the renamed page still presents `v0.5` and `experimental` prominently.

## Publication

Commit the rename and reference updates as a focused clarification, push `main`, and require the GitHub Actions workflow to pass.
