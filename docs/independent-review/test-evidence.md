# Test evidence

> **Status: no independent review has been performed.**
> Passing tests are not verification. The project wrote both the implementation and the expected values, so the suites can only show that the model behaves the way the project believes it should.

## What was run

Captured 2026-08-01 against `retirement-simulator.html` v1.12, SHA-256 `0E0B790C…`, commit `f61188d`, on Node v25.9.0.

```bash
node tests/retirement-simulator.test.mjs
```

**Result: 379 passed, 0 failed, exit code 0.**

```bash
node tests/retirement-monte-carlo.test.mjs
```

**Result: FAILED, exit code 1.** See below.

## Deterministic suite coverage

The 379 assertions are grouped as: script parsing; schema and sample scenario; real-return readouts; CSV export; market quote policy; single household ownership; current Medicare thresholds; SAPTO and Medicare household rules; Age Pension income taper; Age Pension age-gap eligibility; single-person Age Pension; first-death lifecycle transition; deterministic single household; deterministic survivor projection; projection tax basis; baseline projection; salary growth above inflation; other income; other assets; negative growth; lump-sum withdrawals; validation of bad input; schema migration from v5 and the full v1 to v14 chain; single-household controls; GitHub Pages deployment; and engine parity with earlier behaviour.

The suite grew from 110 to 379 assertions between 14 July and 1 August 2026, mainly through the household tax, single household, first-death survivor, Age Pension, CSV export and Pages-deployment groups.

## The failing suite

`tests/retirement-monte-carlo.test.mjs` aborts on an uncaught assertion at line 1066, so no later assertion in that file runs:

```
AssertionError: zero-volatility Other income should match deterministic ownership, tax, pension and funding
```

The divergence is in projection year 2031, comparing the experimental Monte Carlo engine against the deterministic engine:

| Field | Monte Carlo | Deterministic |
|---|---:|---:|
| `agePensionNet` | 22,460.79 | 23,073.90 |
| `otherIncomeNet` | 17,681.14 | 18,000 |
| `taxByPerson[1]` | 931.97 | 0 |
| `totalAssets` | 188,710.93 | 189,642.91 |
| `totalIncome` | 40,141.93 | 41,073.90 |

**Cause.** The household tax corrections in the v1.11 line (SAPTO eligibility, the prescribed spouse transfer and the Medicare family reduction) were applied to the deterministic engine only. The parity test compares the two engines directly, so the experimental companion now diverges. Tracked as [issue #37](https://github.com/dcaddick/retirement-simulator/issues/37).

**What it does and does not mean.**

- The deterministic simulator, which is what these materials describe, is unaffected. Its suite passes in full.
- The experimental Monte Carlo companion is outside the scope of any review described here.
- Continuous integration runs both suites, so the repository's CI state at this commit is failing. **Do not treat a green CI badge as evidence for this release.** Check the run yourself.
- It is disclosed here rather than omitted, because a reviewer reproducing the suites would otherwise hit an undisclosed failure and have to work out why.

## What the suites do not prove

- **They are not independent.** Expected values were written by the same project that wrote the code. Where the implementation embodies a misunderstanding of a rule, a test can happily confirm the misunderstanding.
- **They do not test the law.** A test asserting that a threshold is $28,011 proves the constant is used consistently. It does not prove $28,011 is the right number for the year being modelled.
- **They are not a browser test.** Visual output, chart rendering and iPad Safari behaviour still need a real browser. See [Testing](../TESTING.md).
- **Passing is not a pass.** Nothing in this file is a review finding.

## Reproducing this

Clone the repository at commit `f61188d`, confirm the artifact hash, then run both commands above. Record your own runtime, because results are asserted against a specific engine and a different Node version is worth noting. Any variance you cannot explain is worth an issue.
