# How to have this reviewed

> **Status: no independent review has been performed.**
> This page sets out what a qualified professional would examine. It records no result and implies no approval.

## What to give them

1. The exact `retirement-simulator.html` file you hold, and its SHA-256 so they can confirm it matches the release described in these materials.
2. A link to this directory, or a copy of it.
3. [Model methodology](../MODEL-METHODOLOGY.md) and the [Deferred Review Register](../DEFERRED-REVIEW.md).
4. Your own fictional scenario, or one of the [reference scenarios](reference-scenarios.md). Do not send a real household's data to anyone who does not need it.

The file runs entirely in a browser with no network calls, so a reviewer can open it, read its source and run it without installing anything.

## The four domains, and why they are separate

No single professional covers all of this. A tax agent confirming a threshold has not approved the drawdown logic, and a technical reviewer reproducing the arithmetic has not decided whether an output is legally acceptable. Keeping the four apart is deliberate: it prevents one person's competence being read as cover for everything else.

### A. Accounting and reconciliation

Whether the money adds up: annual roll-forwards of every account, opening balance to inflows to earnings to withdrawals to closing balance; household aggregation and per-person allocation; nominal to today's-dollar conversion; surplus banking and shortfall reporting; and whether the table, chart, KPI cards and CSV export all show the same underlying numbers.

Specific to this release: the explicit Single household (Person 2 contributing zero, Joint records contributing half), the fixed first-death transition, and the split between requested, funded and unfunded lump sums.

Excludes tax-law opinion, financial advice and code assurance.

### B. Australian tax treatment

Whether the represented tax rules are right for the years modelled: resident rates, Medicare levy including the childless-couple family threshold, LITO, SAPTO including the prescribed spouse transfer, the order in which offsets and the levy are applied, classification of taxable and non-taxable retirement income, superannuation contribution and withdrawal assumptions, capital gains including the 1 July 2027 discount change, defined-benefit income, and UK State Pension with any undeducted purchase price deduction.

The reviewer should pay attention to the accepted simplifications rather than only the arithmetic: the model uses an age-and-income proxy for SAPTO eligibility, uses taxable income as a rebate-income approximation, applies annual rather than intra-year timing, and maps a projection calendar year onto an Australian income year in a way that is currently unasserted (see [known limitations](known-limitations.md)).

Requires current Tax Practitioners Board registration for anything that constitutes a tax agent service.

### C. Financial advice and retirement planning

Whether the retirement logic and its presentation are sound and honest: preservation and access assumptions, account-based pension minimums, drawdown ordering, Age Pension and Commonwealth Seniors Health Card modelling, return, inflation and longevity assumptions, the illustrative survival ribbon, and whether any output, label or default could be read as a recommendation.

Also: foreseeable misuse. Would a reasonable person treat an estimate as a prediction, or the default drawdown order as advice?

Requires appropriate AFS authorisation for anything that constitutes financial product advice.

### D. Technical and model validation

Whether the code does what the documentation says: source-to-code traceability, independent recalculation without copying the implementation, black-box comparison against independently prepared expected results, boundary and transition-year testing, calculation ordering, rounding and tolerances, model invariants, consistency between engine values and what is displayed, import and export behaviour, and reproducibility from the identified release.

The reviewer should distinguish an implementation defect from an accepted limitation of the documented model. They are different findings with different consequences.

## Questions worth asking

These are the questions the project would want asked. They are not leading questions with known good answers.

**On dated rules.** Which of the stored thresholds have gone stale since their check dates, and does anything in the model warn a user when that has happened? (The project already knows the answer to the second part is no. See open issue #33.)

**On the tax year mapping.** The model selects a tax schedule by projection calendar year. Which Australian income year does each projection year actually represent, and does the answer change any result materially?

**On offsets.** The model applies gross income tax, then non-refundable LITO and SAPTO against income tax only, then Medicare, then refundable franking credits. Is that order correct, and does anything in it produce a wrong result at a boundary?

**On the Age Pension.** The income test uses gross defined-benefit income and does not model the Work Bonus. How much does each of those move a realistic projection?

**On drawdown.** Drawing to a preferred income and banking the surplus can move value out of super and into assessable savings before Age Pension age. Is that behaviour defensible as a model default, or is it a trap?

**On presentation.** Read the dashboard as a first-time user. Is there anything on it that a reasonable person would take as a prediction, a recommendation, or a statement that the tool has been professionally checked?

**On what is missing.** What material thing does the model not represent at all, that would change a real household's conclusion?

## What a review would and would not settle

A completed review, if one ever happens, would say: these named procedures were performed against this exact file, for these dated rules, and these were the factual results, with these qualifications.

It would not make the simulator suitable for a particular household, keep the tax rules current, cover future law changes, or replace personal advice. It would not make the word "verified" a permanent property of the tool.
