# Deferred Review Register

This register tracks known modelling limitations, resolved review items and questions remaining after v1.0.8. It is a product and engineering backlog, not professional tax, financial, accounting, actuarial or legal advice.

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
| AIPR-003-SHARES-STATIC | [#5](https://github.com/dcaddick/retirement-simulator/issues/5) | Resolved | Shareholdings use a manually entered static price and produce no dividends or franking credits. | Equity-heavy scenarios can understate assets and income over long horizons. | Requires return, income, tax, cost-base and interface assumptions. | Accounting, tax and product scope. | Resolved in v1.0.6: nominal price growth, holding-period dividends and optional ownership-aware franking were added. |
| AIPR-003-AP-AGEGAP | [#6](https://github.com/dcaddick/retirement-simulator/issues/6) | Resolved | Combined couple means tests apply when either partner reaches age 67; one eligible partner receives one partnered share and both eligible partners receive the combined rate. | Age-gapped household income and person-level tax allocation are represented across both engines. | Required confirmation of one-partner eligibility and combined means-test mechanics. | Services Australia and social-security policy review recorded in the v1.0.7 design. | Resolved in v1.0.7/v0.6 with zero/half/full boundary, eligible-person tax allocation and regression coverage. |
| AIPR-003-MORTALITY | [#7](https://github.com/dcaddick/retirement-simulator/issues/7) | Resolved | An optional selected first death applies at the start of its projection year; assets, income, spending, tax, super and government-support rules transition immediately to the survivor state. | Fixed-scenario survivor cash flows are represented; probabilistic mortality remains outside scope. | Required a first-death event model and explicit survivor assumptions. | Actuarial and financial-planning scope approved in the v1.0.8 design. | Resolved in v1.0.8/v0.7 with deterministic and fixed-path Monte Carlo transitions, audit output and regression coverage. |
| AIPR-003-SUPER-TAXFREE | [#8](https://github.com/dcaddick/retirement-simulator/issues/8) | Deferred | Super drawdowns do not enter taxable income at any configured access age. | Can understate tax for pre-60 access. | Benefit components, preservation rules and offsets are outside the current simple model. | Registered tax and superannuation review. | Decide whether to restrict access settings or model pre-60 taxation. |
| AIPR-003-CGT-LOSS | [#9](https://github.com/dcaddick/retirement-simulator/issues/9) | Resolved | Capital losses are discarded rather than offset or carried forward. | Can overstate CGT where losses coexist with gains. | Carry-forward requires persistent tax state and ordering rules. | Registered tax review. | Resolved in v1.0.6: per-person losses net before discounts and carry forward from a zero opening balance. |
| AIPR-003-OTHERINC-SPLIT | [#10](https://github.com/dcaddick/retirement-simulator/issues/10) | Resolved | Other taxable income is split equally between the two people. | Can understate tax when income belongs mainly to one partner. | Adding ownership changes persisted data and interface controls. | Accounting, tax and migration design. | Resolved in v1.0.6: a persisted Tax owner selector and schema-10 migration were added. |
| AIPR-003-CGT-WATERFALL | [#11](https://github.com/dcaddick/retirement-simulator/issues/11) | Resolved | CGT is included in tax while sale gains are excluded from gross taxable cash-flow sources. | May distort income presentation or drawdown top-ups in large-sale years. | Needs an end-to-end reconciliation before any code change. | Accounting and technical trace. | Resolved in v1.0.6: CGT is a savings-first asset expense and never counts as retirement income. |

## Maintenance rule

Do not delete an entry when work starts or finishes. Update its status and add the release, design or decision that resolved it so the reasoning remains traceable.
