# Super Access Age Validation Design

**Date:** 2026-07-15
**Issue:** [#8 Review taxation of super drawdowns before age 60](https://github.com/dcaddick/retirement-simulator/issues/8)
**Status:** Approved for implementation planning

## Purpose

Prevent the simulator from presenting understated tax results for super withdrawals before age 60. Both engines currently treat super withdrawals as tax-free and do not model the additional tax rules that can apply below age 60.

## Decision

Both the deterministic simulator and experimental Monte Carlo companion will require each person's super access age to be 60 or older.

This is a validation tightening, not a schema migration. Existing JSON remains unchanged, but a scenario with a super access age below 60 will be rejected rather than silently modified.

## Policy basis

ATO guidance current at 15 July 2026 states that the taxed element of an account-based super income stream is generally not assessable from age 60, while payments below 60 can be assessable and may receive an offset. The simulator retains its existing simplified taxed-fund assumption and excludes benefit-component modelling. See the ATO [super income-stream tax tables](https://www.ato.gov.au/api/public/content/0-af5a46ad-7287-431c-be8e-4a0c9bbc5fc1) and [super lump-sum guidance](https://www.ato.gov.au/myTax25SuperLumpSums).

## User-facing explanation

The validation error will be:

> Super access age must be 60 or older because this simulator does not model taxation of withdrawals before age 60.

The helper and assumptions copy will use the shorter explanation:

> The simulator treats super withdrawals as tax-free and does not model the additional tax rules that may apply before age 60.

## Behaviour

- Set the super access age input minimum to 60 in both applications.
- Reject values below 60 during scenario validation in both engines.
- Apply the same validation to interactive edits and JSON imports.
- Continue accepting age 60 and all otherwise-valid older ages.
- Do not clamp, migrate or otherwise rewrite an invalid saved value.
- Keep the existing schema versions unchanged.

## Documentation

Update the in-app assumptions, README, model methodology, testing guide, changelog and deferred-review register. The deferred item remains in the register but changes to `Resolved`, with the implementing release and decision recorded.

The explanation should stay brief: the simulator supports the straightforward age-60-and-over tax treatment and deliberately excludes the more detailed benefit-component and offset rules needed below age 60.

## Testing

Add deterministic and Monte Carlo regression coverage proving that:

- age 59 is rejected with the approved message;
- age 60 is accepted;
- an imported deterministic scenario below 60 is rejected by Monte Carlo;
- interactive and imported scenarios use the same core validation rule;
- the input controls expose a minimum of 60;
- existing regression suites remain green.

## Out of scope

- Modelling pre-60 super benefit taxation.
- Tracking tax-free, taxed or untaxed benefit components.
- Modelling preservation conditions, Transition-to-Retirement caps or exceptional early-release rules.
- Changing existing scenario values automatically.
- Implementing Monte Carlo import parity tracked by issue #1; that work will receive a separate design and plan.

## Completion criteria

Issue #8 can close when both engines enforce the age-60 minimum, the approved explanation appears consistently, regression suites pass, release documentation records the decision and the deferred-review register marks the item resolved.
