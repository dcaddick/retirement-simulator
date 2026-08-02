# Known limitations and open defects

> **Status: no independent review has been performed.**
> This is the project's own list of what it knows is wrong or incomplete. It is not the output of a review, and it is not exhaustive: it is what has been found so far.

## Open defects inside review scope

These items were open on 2026-08-01 and fall inside one or more of the four review domains. They are published so that a reviewer does not have to rediscover them, and so that a reader can see what the project already knows and has not yet fixed.

| Issue | Matter | Domain |
|---|---|---|
| [#31](https://github.com/dcaddick/retirement-simulator/issues/31) | Projection-year versus financial-year semantics are unasserted, and the 2025-26 rate of 16% is not represented in the schedules | Tax |
| [#32](https://github.com/dcaddick/retirement-simulator/issues/32) | Offset indexation is inconsistent: LITO is nominal and subject to bracket creep while SAPTO and Medicare thresholds are applied in today's-dollar terms | Tax |
| [#33](https://github.com/dcaddick/retirement-simulator/issues/33) | No staleness guard ties the dated constants to the run date, so a stored threshold can silently age | Tax; technical |
| [#29](https://github.com/dcaddick/retirement-simulator/issues/29) | The CSHC estimate uses a strict less-than comparator at the income threshold | Advice; technical |
| [#26](https://github.com/dcaddick/retirement-simulator/issues/26) | Defined-benefit income is assessed at gross in the Age Pension income test, ignoring any deductible amount | Tax; advice |
| [#25](https://github.com/dcaddick/retirement-simulator/issues/25) | The Work Bonus is not modelled in the Age Pension income test | Advice |
| [#24](https://github.com/dcaddick/retirement-simulator/issues/24) | The deeming rates of 1.25% and 3.25% require an independent dated source | Advice |
| [#28](https://github.com/dcaddick/retirement-simulator/issues/28) | Drawing to the preferred income and banking the surplus can convert under-67 exempt super into assessable savings | Advice |
| [#27](https://github.com/dcaddick/retirement-simulator/issues/27) | No concessional contributions cap or Division 293 treatment is applied to SG contributions | Tax |

One further item, [#37](https://github.com/dcaddick/retirement-simulator/issues/37), affects the experimental Monte Carlo companion rather than the deterministic simulator. It is outside review scope but it does affect the test evidence, so it is described in [Test evidence](test-evidence.md).

The [Deferred Review Register](../DEFERRED-REVIEW.md) records earlier items and the release that closed each one.

## Structural limitations

These are not defects to be fixed. They are the boundaries of what an annual educational model can represent, and they remain true no matter how much review is performed.

- **Annual timing.** One row per year. Intra-year cash-flow detail, part-year rules and mid-year threshold changes cannot be expressed exactly.
- **Future law.** Rates, thresholds and rules are dated. The model does not forecast legislative or policy change, and stored values go stale.
- **Transition to Retirement.** Not fully modelled. Super access is limited to age 60 and over because withdrawal taxation before 60 is outside the model.
- **Capital losses.** Pre-existing losses from before the projection cannot be entered; every projection starts from zero.
- **Aged care and health costs.** Not modelled in detail.
- **Property.** Transactions, maintenance and property-specific shocks are not modelled in detail.
- **Risk.** Investment returns are deterministic assumptions in this model. Inflation, exchange rates, employment and longevity are not stochastic.
- **Cross-border.** Pension, currency and undeducted purchase price treatment is simplified and is not jurisdiction-specific advice.
- **Products.** Personalised fees, insurance, investment selection and adviser recommendations are outside the model.
- **Households.** Dependent children are not modelled. Only a two-person maximum household is represented, as a Couple or a Single.
- **Survival.** The illustrative survival parameters are a project selection and have not been actuarially validated.

## What this means for you

The model can be useful for exploring how the pieces interact and how sensitive an outcome is to an assumption. It cannot tell you what will happen, and it cannot tell you what you should do. The items above are the reasons why, and a professional reviewing it for you should read them before they start.
