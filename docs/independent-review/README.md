# Independent Review Materials

> **Status: no independent review has been performed.**
> Nothing in these materials is a verification, certification, endorsement, audit, assurance conclusion or regulator approval. No accountant, registered tax agent, financial adviser or technical reviewer has completed any procedure against this release. These pages describe what the model does, how it is implemented, what is already known to be wrong or incomplete, and what a qualified professional would need in order to examine it.

## Why these exist

The simulator is a free, self-contained educational model, not a regulated calculator and not advice. If you are considering using it, you are entitled to have someone qualified look at it first, and you should not have to take the author's word for anything.

These materials let your own accountant, registered tax agent or financial adviser examine the model directly, without contacting the author and without any gate. They are published as-is. They are self-disclosure by the project about the project's own work.

## Release these materials describe

| Field | Value |
|---|---|
| File | `retirement-simulator.html` |
| Version label | v1.12 |
| Scenario schema | 14 |
| Commit | `f61188d0a9d6d5cee245a34abfc1185f0a3bd130` |
| SHA-256 | `0E0B790C85798F09C9A519AA5DAF69432673F9ADC5F188FD1E3565EF276A24C9` |
| Captured | 2026-08-01 |

Everything here is bound to that exact file. A conclusion about it does not carry to a later release, an edited copy, the hosted page if it has moved on, or any other simulator.

**Check the file you actually hold before relying on any of this:**

```bash
sha256sum retirement-simulator.html
```

On Windows PowerShell:

```bash
Get-FileHash -Algorithm SHA256 retirement-simulator.html
```

If the hash differs, the file is not the one described here. The line numbers in the implementation map will also be wrong for it.

## Contents

| Document | What it gives a reviewer |
|---|---|
| [How to have this reviewed](how-to-review.md) | What to hand a professional, the four review domains, the boundary of each, and the questions worth asking |
| [Model and implementation map](model-implementation-map.md) | The annual calculation sequence and the exact function and line reference for every material rule |
| [Known limitations and open defects](known-limitations.md) | Defects the project has already identified and not yet fixed, plus the model's structural limitations |
| [Test evidence](test-evidence.md) | What the automated suites cover, what they prove, what they do not prove, and the one suite that currently fails |
| [Reference scenarios](reference-scenarios.md) | The fictional test cases and boundary rules a reviewer can work through, with an independent-calculation protocol |
| [`source-register.csv`](source-register.csv) | Every external rule the model relies on, with its issuing body, effective period and affected model areas |
| [`evidence-register.csv`](evidence-register.csv) | Requirement to source to implementation to procedure traceability for 53 material rules |
| [`scenario-register.csv`](scenario-register.csv) | The 21 reference scenarios in machine-readable form |

Supporting project documentation: [Model methodology](../MODEL-METHODOLOGY.md), [Testing](../TESTING.md), [Deferred Review Register](../DEFERRED-REVIEW.md).

## What is not published here

Reviewer schedules that carry a named professional's identity, credentials, independence declarations, procedures accepted and factual findings are kept out of these public materials. That is not to hide results: no review has happened. It is because a professional's report is normally restricted-use, its author has to consent to publication, and publishing a named person's findings about a live tool is their decision rather than the author's.

If an independent review is ever completed, what gets published, in what form and with whose consent will be a separate and explicit decision. Until then the status line at the top of this page is the whole story.

## Reading these materials fairly

- **An empty finding column is not a pass.** Where a register says "Not yet performed" it means nobody has looked, not that nothing is wrong.
- **The passing test suite is not verification.** The project wrote both the code and the expected values. See [Test evidence](test-evidence.md).
- **The known-defect list is not exhaustive.** It is what the project has found so far.
- **Dated rules go stale.** Tax, superannuation and social-security thresholds change on statutory and indexation dates. The source register records the effective period for each one.

## If you find something

Open an issue at <https://github.com/dcaddick/retirement-simulator/issues>. Defects found by readers are logged and tracked in the open, the same as defects found by the project.
