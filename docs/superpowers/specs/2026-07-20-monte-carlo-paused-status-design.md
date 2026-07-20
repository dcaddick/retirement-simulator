# Monte Carlo Paused Status and Contribution Path Design

**Date:** 2026-07-20

**Status target:** experimental and paused indefinitely

**Canonical tracker:** [#1 — Complete remaining Monte Carlo parity for Other assets, lump sums and share returns](https://github.com/dcaddick/retirement-simulator/issues/1)

## Goal

Make the Monte Carlo report's status unmistakable without removing the tool: it remains available for inspection, experimentation and forks, but active development is paused with no delivery timetable because it has not demonstrated enough decision value or dependable personal success probabilities to justify continued investment.

## Problem

The Monte Carlo companion has automated regression coverage and explicit compatibility guards, but passing those tests does not establish that its probability output is calibrated, practically useful or capable of distinguishing sufficiently between safe, borderline and unsustainable retirement scenarios.

The report can be difficult to drive to a failure result under plausible inputs. That may reflect a strongly funded scenario, permissive success criteria, insufficiently discriminating stress assumptions or output that does not reveal which assumptions drive apparent resilience. The project does not currently have enough independent evidence to distinguish among those explanations.

Completing the remaining deterministic-import parity would improve technical consistency, but would not by itself establish the report's decision value. The project should therefore record an explicit product pause rather than imply that parity completion is scheduled.

## Status Decision

The Monte Carlo report remains:

- experimental;
- unreleased beyond its existing experimental identity;
- available in the repository for inspection, experimentation, forks and focused contributions; and
- paused indefinitely, with no promised restart date or parity milestone.

The pause concerns usefulness, calibration and confidence in the reported probability output. It must not be described as proof that the existing implementation is defective. Automated tests continue to provide engineering regression evidence, but they are not evidence that the model produces dependable personal probabilities or regulated advice.

The deterministic simulator remains the project's primary supported modelling tool. No deterministic calculation, interface or release identity changes as part of this documentation work.

## Alternatives Considered

### Dedicated status document plus in-tool notice — selected

Create a focused `MONTE-CARLO.md`, add a prominent concise pause notice to the Monte Carlo HTML, keep a short link from the main README and update contribution and testing documentation. This reaches both repository readers and people who open the standalone HTML directly while preserving the report for future examination.

### Documentation-only notice

A dedicated document without an in-tool notice would keep the executable unchanged, but users who receive or open the HTML directly could miss the pause and its limitations.

### Archive or remove the report

Removing the report would be the strongest warning, but would make independent review, reproduction and revival harder. The project does not need that irreversible step while the report can remain clearly labelled and safely isolated as experimental.

## Documentation Structure

### Dedicated Monte Carlo document

Add `MONTE-CARLO.md` at the repository root so its purpose is visible alongside the executable and primary README. It is the canonical public explanation of the report's status and must contain:

1. A prominent opening statement that development is paused indefinitely and there is no current delivery timetable.
2. A concise explanation that the report has not demonstrated enough decision value or dependable personal probability output to justify continued development.
3. A clear distinction between passing regression tests and validating model usefulness or calibration.
4. Instructions to treat results as exploratory sensitivity information, not assurance, a personal forecast, a recommendation or financial advice.
5. The three remaining parity areas and their required boundaries.
6. The evidence that could justify reconsidering the pause.
7. A contribution path using fictional data and issue #1 as the canonical tracker.

The document must avoid claiming that the model is known to be wrong, universally incapable of failure or valueless to every user. The evidence supports a pause because usefulness has not been demonstrated, not a stronger technical conclusion.

### Main README

Keep the main README concise. Its Monte Carlo section should:

- label the companion **experimental and paused**;
- state that there is no active development timetable;
- retain the warning that it does not calculate a dependable personal success probability; and
- link to `MONTE-CARLO.md` for status, limitations, contribution expectations and the parity backlog.

Detailed pause reasoning and parity mechanics belong in the dedicated document rather than being duplicated in the main README.

### In-tool notice

Add a high-visibility, accessible status notice near the top of `retirement-monte-carlo-v0.7.html`, before users reach the controls or results. The notice should state, in compact form:

> Experimental and paused. This report has not demonstrated dependable personal probability output, active development is paused with no timetable, and its results are exploratory only.

It should link to `MONTE-CARLO.md` when the repository-relative link is available. The existing experimental description and advice disclaimer remain. The notice must not prevent the report from running, alter calculations or imply that automated tests are failing.

Styling should reuse the existing warning/banner language and theme variables where practical, remain legible in light and dark themes, and avoid introducing scripts or external resources.

### Supporting documentation

Update:

- `CONTRIBUTING.md` with Monte Carlo-specific evidence expectations and the privacy requirement for fictional scenarios;
- `docs/MODEL-METHODOLOGY.md` so the methodology records the pause and separates regression evidence from probability validation;
- `docs/TESTING.md` so passing the Monte Carlo suite is not presented as validation of calibration or decision usefulness; and
- `CHANGELOG.md` under Unreleased with the documentation and project-status decision.

## Remaining Parity Backlog

Issue #1 remains open as the canonical paused tracker. The dedicated document and issue body must name the following next technical steps without implying that they are scheduled.

### 1. Other assets

Parity requires:

- nominal growth and scheduled disposal;
- ownership transfer after the fixed first-death event;
- Age Pension assets-test inclusion;
- the `agePensionDeemed` financial-investment classification introduced in deterministic v1.0.10;
- no unintended change to the separate CSHC boundary; and
- zero-volatility comparison with deterministic rows.

### 2. Share returns and tax ledger

Parity requires more than removing the current compatibility guard. It includes:

- annual nominal share-price growth;
- holding-period dividend exposure;
- ownership allocation;
- optional franking credits and refunds;
- scheduled and named sales;
- capital-loss carry-forward and CGT ordering; and
- savings-first CGT funding and audit output.

Imported share-return assumptions would remain deterministic within every path unless a separately approved design introduces stochastic shareholding returns, volatility and correlation assumptions.

### 3. Lump-sum withdrawals

Parity requires:

- fixed nominated events in every path;
- explicit and automatic drawdown sources;
- named share and Other Asset liquidation;
- fallback through the household drawdown waterfall;
- requested, funded and unfunded amounts;
- non-negative balance and accounting invariants; and
- audit events consistent with the deterministic simulator.

This slice depends on the Other Asset and share-ledger work and should be considered last if development resumes.

## Reconsideration and Contribution Threshold

General interest or a request to finish the feature is not sufficient to restart active development. Reconsideration may be warranted after a small body—roughly two or three—of specific, well-evidenced reports or contributions demonstrates a concrete reason to revisit the report.

A useful report should include:

- the exact Monte Carlo tool version and browser;
- a fictional, privacy-safe scenario or minimal reproduction steps;
- the selected seed, risk mode, glide path and stress settings where relevant;
- expected and observed behaviour;
- why the result appears misleading, insensitive or internally inconsistent; and
- whether the concern is a calculation defect, success-definition problem, stress-design problem, missing explanation or parity gap.

Especially useful evidence would show that:

- an obviously unsustainable fictional scenario is reported as successful;
- a controlled change expected to materially affect risk barely changes the result;
- repeated seeds, stresses or boundary cases behave inconsistently;
- an independent worked example or recognised benchmark materially disagrees; or
- one of the three parity gaps causes a reproducible misleading result.

A focused pull request may also justify review when it includes a narrow design, regression coverage, zero-volatility deterministic comparison where applicable and an explanation of how the change improves decision usefulness rather than only increasing feature count.

Reports and contributions are welcome, but submission does not guarantee review time, acceptance or resumption of the project.

## GitHub Issue State

Keep issue #1 open. Update its body to include:

- `Status: paused indefinitely` near the top;
- no current delivery timetable;
- a link to `MONTE-CARLO.md`;
- the three remaining parity areas;
- the evidence expected from new reports; and
- an explicit statement that the issue is a canonical tracker, not a release commitment.

The repository has no existing pause-status label. Create and apply `status: paused`, with a neutral grey colour and the description `Work is paused with no current delivery timetable.` Do not apply `wontfix`, and do not close the issue as completed or not planned.

## Validation Design

Automated documentation checks should verify that:

1. `MONTE-CARLO.md` exists and contains the paused status, lack of timetable, experimental-use boundary and all three parity headings.
2. The main README labels the companion experimental and paused and links to `MONTE-CARLO.md`.
3. The Monte Carlo HTML contains the prominent pause notice and dedicated-document link.
4. Contribution guidance requires fictional reproduction data and specific expected-versus-observed evidence.
5. Methodology and testing documentation distinguish regression coverage from calibration and decision-value evidence.
6. The changelog records the pause decision.
7. Existing deterministic and Monte Carlo calculation suites remain green.

Browser acceptance should confirm that the in-tool notice is prominent, readable and non-obstructive in desktop and narrow layouts and in both themes, with no console errors or warnings. The report must still load and run its existing fictional sample.

## Out of Scope

- Any Monte Carlo calculation, schema, migration, seed, stress, risk-mode, profile or success-definition change.
- Any implementation of the three parity areas.
- A v0.8 or v1.1.0 release.
- Removal or archival of the Monte Carlo executable.
- New claims that the deterministic simulator provides certainty or regulated advice.
- Promises about response times, maintenance or acceptance of outside contributions.

## Acceptance Criteria

- A dedicated root-level Monte Carlo status document is the canonical public explanation.
- The report is consistently labelled experimental and paused indefinitely with no timetable.
- The wording states that dependable personal probability output and decision value have not been demonstrated without asserting an unproven universal defect.
- Passing regression tests is explicitly separated from model calibration and usefulness.
- The main README stays concise and links to the dedicated document.
- The standalone Monte Carlo HTML shows the status before users reach results.
- Issue #1 remains open as a paused canonical tracker.
- Other Assets, share returns/tax and lump sums are documented as the three unscheduled parity areas.
- Contributors are asked for specific, privacy-safe, reproducible evidence.
- Roughly two or three substantive reports or contributions are identified as a possible reconsideration trigger, not a promise to resume.
- Existing calculations and releases are unchanged.
- Both automated suites and the targeted browser acceptance pass after implementation.
