# Deferred Review Register

This register tracks known modelling limitations and review questions that are not resolved in v1.0.5. It is a product and engineering backlog, not professional tax, financial, accounting, actuarial or legal advice.

The identifiers originate in controlled review material. The descriptions below are deliberately original, concise summaries; they do not reproduce the confidential review pack or its local paths.

The open items are grouped in the [v1.0.6 review milestone](https://github.com/dcaddick/retirement-simulator/milestone/1). Milestone assignment identifies review scope and does not by itself commit an item to the release.

## Status definitions

- **Deferred:** acknowledged and intentionally outside the current release.
- **In review:** an owner or qualified reviewer is assessing the item.
- **Planned:** a separately approved design exists.
- **Resolved:** a named release or recorded decision closed the item.

## Register

| ID | Issue | Status | Current behaviour | Likely impact | Reason deferred | Required review or decision | Next action |
|---|---|---|---|---|---|---|---|
| AIPR-003-SHARES-STATIC | [#5](https://github.com/dcaddick/retirement-simulator/issues/5) | Deferred | Shareholdings use a manually entered static price and produce no dividends or franking credits. | Equity-heavy scenarios can understate assets and income over long horizons. | Requires return, income, tax, cost-base and interface assumptions. | Accounting, tax and product scope. | Design a separately testable share total-return model. |
| AIPR-003-AP-AGEGAP | [#6](https://github.com/dcaddick/retirement-simulator/issues/6) | Deferred | Age Pension remains zero until both partners reach pension age. | Can understate income for age-gapped couples. | One-partner eligibility and couple-rate mechanics need professional confirmation. | Financial-advice and social-security review. | Specify and test one-eligible-partner calculations. |
| AIPR-003-MORTALITY | [#7](https://github.com/dcaddick/retirement-simulator/issues/7) | Deferred | Survival probabilities are illustrative; both people remain in every cash-flow year. | Omits first-death spending and survivor-rate transitions. | Requires a first-death event model and survivor assumptions. | Actuarial and financial-planning scope. | Design an explicit survivor-state model or approve limitation-only treatment. |
| AIPR-003-SUPER-TAXFREE | [#8](https://github.com/dcaddick/retirement-simulator/issues/8) | Deferred | Super drawdowns do not enter taxable income at any configured access age. | Can understate tax for pre-60 access. | Benefit components, preservation rules and offsets are outside the current simple model. | Registered tax and superannuation review. | Decide whether to restrict access settings or model pre-60 taxation. |
| AIPR-003-CGT-LOSS | [#9](https://github.com/dcaddick/retirement-simulator/issues/9) | Deferred | Capital losses are discarded rather than offset or carried forward. | Can overstate CGT where losses coexist with gains. | Carry-forward requires persistent tax state and ordering rules. | Registered tax review. | Design same-year netting first, then carry-forward state. |
| AIPR-003-OTHERINC-SPLIT | [#10](https://github.com/dcaddick/retirement-simulator/issues/10) | Deferred | Other taxable income is split equally between the two people. | Can understate tax when income belongs mainly to one partner. | Adding ownership changes persisted data and interface controls. | Accounting, tax and migration design. | Specify an owner field and schema migration. |
| AIPR-003-CGT-WATERFALL | [#11](https://github.com/dcaddick/retirement-simulator/issues/11) | Deferred | CGT is included in tax while sale gains are excluded from gross taxable cash-flow sources. | May distort income presentation or drawdown top-ups in large-sale years. | Needs an end-to-end reconciliation before any code change. | Accounting and technical trace. | Reconcile a large-sale, low-income scenario before designing remediation. |

## Maintenance rule

Do not delete an entry when work starts or finishes. Update its status and add the release, design or decision that resolved it so the reasoning remains traceable.
