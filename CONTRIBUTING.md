# Contributing

Issues, feature requests, forks and pull requests are welcome. This is a personal open-source project, so review and response times are not guaranteed and proposed changes may not be accepted.

## Protect personal information

Retirement scenarios can contain names, ages, balances, salaries, pensions, holdings and tax information.

- Do not commit or attach a real scenario export.
- Do not paste personal financial figures into public issues.
- Reproduce problems with fictional names and invented values.
- Check screenshots for names, balances, filenames and browser paths before posting.

If a report cannot be reproduced without sensitive information, describe the behaviour without sharing the data.

## Good issues

A useful issue includes:

- the tool and browser involved;
- the expected and observed behaviour;
- minimal fictional reproduction steps;
- any visible validation or script error;
- whether the issue affects calculations, presentation or documentation.

## Modelling changes

Changes to tax, pension, superannuation or retirement rules should include:

- an authoritative public source;
- the jurisdiction and effective date;
- a plain-language explanation of the approximation;
- limitations and known exclusions;
- regression tests covering the changed behaviour.

Do not present estimates as regulated advice or claim precision the model does not provide.

### Date-sensitive assumptions

Whenever a code change touches a rate, threshold, date-sensitive policy rule or its source metadata, check the current authoritative source before changing the code. Record the source URL, effective date, page-updated date (when available) and the date checked; update the in-app provenance and `docs/independent-review/source-register.csv` together. If the source has not changed, still record that it was reviewed and when. For a change that does not touch date-sensitive assumptions, mark the source-review item as not applicable in the pull request rather than doing an unrelated rates lookup.

## Pull requests

Keep changes focused and reviewable. Before opening a pull request:

1. Run both regression suites.
2. Open the affected HTML file in a real browser.
3. Check import/export, charts, responsive layout and error reporting when relevant.
4. Run a privacy scan over the changed files.
5. Update documentation and the changelog when behaviour changes.
6. Before replacing the deterministic production build, preserve the outgoing sanitized `retirement-simulator.html` under `archive/retirement-simulator-vX.Y.Z.html`, verify it against its tag or release asset, and update `archive/README.md`. Never archive personal scenarios or screenshots.

Complete the repository pull-request template, including the date-sensitive source review or its not-applicable reason. A source review does not by itself establish that the simulator's full entitlement calculations have been independently validated.

GitHub Actions runs both `.mjs` suites for pull requests and pushes to `main`. A contribution is not ready to merge while that workflow is failing, even if the change appears unrelated to the model.

By contributing, you agree that your contribution is licensed under Apache License 2.0.
