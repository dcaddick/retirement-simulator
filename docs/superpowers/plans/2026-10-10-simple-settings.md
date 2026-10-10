# Simple settings implementation plan

**Goal:** Give newcomers three short sections and an immediate projection, with the complete existing editor available in Advanced.

**Architecture:** Keep the deterministic engine and scenario schema intact. Add a compact Simple editor bound to the same scenario through distinct `data-simple-path` controls. Store view and spending-period preferences separately; switching views never modifies financial values.

**Tech stack:** Existing standalone HTML, CSS and JavaScript; Node regression suites; Chromium browser checks.

## Accepted design

- Default to Simple: About you (household type, ages, retirement ages, conditional salary), What you have (super, cash, savings), Your retirement lifestyle (one spending amount with annual/monthly/weekly display).
- Keep names optional by leaving them in Advanced. Preserve saved scenario names and all advanced values.
- Advanced retains every existing section. Provide an obvious switch and Explore more options action.
- Fresh starts use labelled fictional example amounts with no planned expenses, equal income/spending targets, and otherwise existing model assumptions. Reset sample keeps the original sample.
- Simple spending edits update both target and budget only when previously equal. Existing distinct budgets remain intact and are disclosed with an Advanced link.
- Preserve ownership semantics, including Single joint-share and excluded-person notices.
- Show validation in the active view and provide a route to hidden fields.

## Implementation sequence

- [x] Add accessible mode buttons and three-section Simple editor in `retirement-simulator.html`, preserving existing theme and Advanced markup.
- [x] Connect Simple changes to existing immutable scenario updates, validation, persistence and recalculation. Use full precision for period conversion; only commit actual edits.
- [x] Introduce UI-only starter defaults and use them only for fresh/new scenarios. Preserve imports and legacy storage.
- [x] Add browser regression checks for mode parity, editing, conditional salary, period conversion, hidden settings, validation, reload, import/export and responsive layouts.
- [x] Run `node tests/retirement-simulator.test.mjs` and `node tests/retirement-monte-carlo.test.mjs`; report existing failures independently.
- [x] Inspect desktop/mobile screenshots, update README and testing notes, and review the final diff.

## Baseline

2026-10-10: deterministic 379 passed, 0 failed. Monte Carlo fails the pre-existing zero-volatility Other income parity assertion at line 1066. Existing untracked `docs/plans/` is unrelated and remains untouched.

## Verification

Final deterministic suite: 379 passed, 0 failed. Focused Chrome browser checks pass, including theme changes while input is invalid and recovery of related age/retirement-age edits. Desktop dark and mobile light screenshots inspected. `git diff --check` passes. Monte Carlo source and the deterministic core are unchanged; its baseline failure remains outside this UI change. No deployment or commit performed.
