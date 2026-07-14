# Confidential Verification Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a confidential, controlled due-diligence pack that external specialists can use to examine the Retirement Simulator's accounting, tax, retirement-planning and technical-model correctness.

**Architecture:** Maintain one private master dossier as the authoritative narrative, supported by four bounded reviewer schedules and three machine-readable registers for sources, evidence and findings. Bind the pack to an exact simulator artifact with SHA-256, keep all working material under the already-ignored `private/` directory, and use fictional reference scenarios only.

**Tech Stack:** Markdown, CSV, PowerShell, Git, Node.js regression suites, SHA-256 artifact hashing, official Australian legislative/regulatory sources.

---

## Confidentiality constraint

The repository is public-facing and already ignores `private/`. Every implemented pack artifact belongs under `private/verification-pack/` and must remain untracked. Do not use `git add -f`, do not put reviewer names or reports under `docs/`, and do not modify the user's existing uncommitted `.gitignore` change.

Because the deliverables are intentionally untracked, implementation checkpoints use file hashes and verification commands instead of commits. The only version-controlled artifact produced by this planning phase is this implementation plan.

## File map

Create these private files during implementation:

```text
private/verification-pack/
├── README.md
├── master-verification-dossier.md
├── registers/
│   ├── source-register.csv
│   ├── evidence-register.csv
│   ├── findings-register.csv
│   └── distribution-register.csv
├── reviewer-schedules/
│   ├── schedule-a-accountant.md
│   ├── schedule-b-tax-agent.md
│   ├── schedule-c-financial-adviser.md
│   └── schedule-d-technical-model.md
├── reference-scenarios/
│   ├── README.md
│   └── scenario-register.csv
└── supporting-evidence/
    ├── release-baseline.txt
    ├── regression-results.txt
    └── pack-file-hashes.txt
```

Responsibilities:

- `README.md`: private pack index, handling instructions and current completion state.
- `master-verification-dossier.md`: integrated document control, Executive Summary, common methodology, consolidated results and re-verification policy.
- `source-register.csv`: authoritative external sources, effective periods and affected model rules.
- `evidence-register.csv`: traceability from requirement through implementation, procedure and finding.
- `findings-register.csv`: immutable finding lifecycle and remediation record.
- `distribution-register.csv`: controlled-copy issue and return/destruction record.
- `reviewer-schedules/*.md`: role-specific scope, procedures, factual findings and declarations.
- `reference-scenarios/*`: fictional scenario catalogue and independent-calculation protocol.
- `supporting-evidence/*`: exact release identity, test results and issued-pack hashes.

### Task 1: Establish the private controlled workspace

**Files:**
- Create: `private/verification-pack/README.md`
- Create: `private/verification-pack/supporting-evidence/release-baseline.txt`

- [ ] **Step 1: Confirm the destination is ignored**

Run:

```powershell
git check-ignore -v private/verification-pack/README.md
```

Expected: output identifies the existing `private/` rule in `.gitignore`. Stop if the path is not ignored.

- [ ] **Step 2: Create the directory structure**

Create the directories listed in the file map using `New-Item -ItemType Directory`, without changing `.gitignore`.

- [ ] **Step 3: Write the private pack index**

Create `private/verification-pack/README.md` with this structure:

```markdown
# Retirement Simulator Confidential Verification Pack

**Classification:** Confidential — controlled due-diligence use only  
**Pack owner:** Project owner  
**Pack status:** Internal preparation  
**Public quotation or endorsement:** Not permitted

## Handling rules

- Issue only to an identified recipient for an agreed review purpose.
- Record each issued copy in `registers/distribution-register.csv`.
- Use fictional scenario data only.
- Do not commit any file in this directory to the public repository.
- Do not describe the simulator publicly as verified, certified or endorsed from this working pack.

## Pack contents

- `master-verification-dossier.md` — authoritative common dossier and Executive Summary.
- `reviewer-schedules/` — four bounded professional review schedules.
- `registers/` — source, evidence, findings and distribution records.
- `reference-scenarios/` — fictional test cases and independent-calculation protocol.
- `supporting-evidence/` — release identity, regression evidence and pack hashes.

## Current domain status

| Domain | Status |
|---|---|
| Accounting and reconciliation | Not yet commenced |
| Australian tax treatment | Not yet commenced |
| Financial-advice and retirement-planning review | Not yet commenced |
| Technical and model validation | Not yet commenced |
```

- [ ] **Step 4: Freeze the release baseline**

Run these commands and record their literal outputs in `supporting-evidence/release-baseline.txt`:

```powershell
git rev-parse HEAD
Get-FileHash -Algorithm SHA256 retirement-simulator.html
git status --short --branch
```

Use these field labels and paste the actual command outputs after each label:

```text
RETIREMENT SIMULATOR RELEASE BASELINE
Captured: 2026-07-14 Australia/Perth
Artifact: retirement-simulator.html
Working-tree note: the artifact hash, not an uncommitted workspace state, defines the reviewed release
```

Insert `Git commit:` and `SHA-256:` lines between the artifact and working-tree lines, using the literal outputs captured in this step.

- [ ] **Step 5: Verify confidentiality and baseline completeness**

Run:

```powershell
git status --short
git check-ignore -v private/verification-pack/supporting-evidence/release-baseline.txt
rg -n "T[B]D|T[O]DO|PLACEHOLD[E]R" private/verification-pack
```

Expected: only the user's pre-existing `.gitignore` modification and any intentional version-controlled work appear in Git status; the private file is ignored; the placeholder scan returns no matches.

### Task 2: Create the controlled master dossier

**Files:**
- Create: `private/verification-pack/master-verification-dossier.md`

- [ ] **Step 1: Write document control and the plain-language Executive Summary**

Start the dossier with:

```markdown
# Retirement Simulator Confidential Verification Dossier

## Document control

| Field | Controlled value |
|---|---|
| Classification | Confidential — controlled due-diligence use only |
| Purpose | Independent scrutiny of the stated simulator release |
| Simulator artifact | `retirement-simulator.html` |
| Artifact identity | See `supporting-evidence/release-baseline.txt` |
| Pack status | Internal preparation; external procedures not yet commenced |
| Public use | No public quotation, certification or endorsement permitted |

## Executive Summary

### What this simulator does

The Retirement Simulator is an educational annual projection that helps a household explore how employment income, superannuation, savings, investments, pensions, tax estimates and planned withdrawals may interact over time. It produces estimates from user-entered assumptions; it does not predict outcomes or provide personal financial, tax, legal or investment advice.

### Why this review pack exists

This pack gives independent specialists a common, traceable body of evidence for examining the simulator. Each reviewer is asked to report factual findings only within an agreed professional scope. Completion of one review does not imply approval of another domain.

### Current review position

External review has not yet commenced. Consequently, this dossier does not state that the simulator has been verified. The final Executive Summary will be completed only after procedures, findings, remediation and any retesting have been recorded.

### What remains outside the review

The first review excludes personal advice, universal suitability, future law changes, regulator approval and the experimental Monte Carlo companion. The simulator's published limitations remain applicable even after due diligence is completed.
```

- [ ] **Step 2: Add verification meaning and scope boundaries**

Add sections that define:

- verification as evidence tied to specified procedures, criteria, effective dates and an exact artifact;
- domain statuses: `Reviewed — no material exceptions identified`, `Reviewed — qualified`, `Remediation required`, `Not reviewed`, and `Superseded`;
- the four mandatory review domains;
- no cross-domain implied approval;
- no public claim without a separate approved communication decision; and
- no formal assurance claim unless a practitioner accepts and conducts an applicable assurance engagement.

Include this required statement:

```markdown
“Verified” is not a permanent or universal property of the simulator. Any positive conclusion applies only to the identified artifact, review procedures, stated criteria, effective dates, assumptions, exclusions and unresolved qualifications recorded in this pack.
```

- [ ] **Step 3: Add the common methodology map**

Summarise the annual sequence from `docs/MODEL-METHODOLOGY.md` and map material components to the implementation functions in `retirement-simulator.html`:

| Model area | Primary implementation reference |
|---|---|
| Inflation path and real-return readout | `inflationRateForYear` at line 505; `realReturnPct` at line 512 |
| Income-tax schedule and net tax | `taxScheduleForYear` at line 516 through `netTax` at line 551 |
| Deeming and Age Pension estimates | `deemedIncome` at line 559 through `agePensionCouple` at line 580 |
| CSHC estimate | `cshcEstimate` at line 587 |
| Assessable financial assets | `assessableFinancialAssets` at line 598 |
| Shares and capital gains | `shareValueAud` at line 884; `discountedCapitalGainByPerson` at line 893; `applyShareSales` at line 1097 |
| UK State Pension | `ukPensionFlows` at line 952 |
| Super access and source drawdown | `superAccessSplit` at line 962 through `drawForLumpSum` at line 1043 |
| Minimum pension drawdown | `minDrawRate` at line 1125 |
| Projection orchestration | `projectScenario` at line 1135; `projectYear` at line 1172 |
| Scenario validation | `validateScenario` at line 1490 |
| Illustrative survival context | `survivalProbability` at line 1683; `survivalMilestones` at line 1689 |

State that line numbers are navigation aids for the frozen artifact and must be refreshed if the artifact changes.

- [ ] **Step 4: Add limitations, findings summary and re-verification sections**

Carry forward the important exclusions in `docs/MODEL-METHODOLOGY.md`, including annual timing, future rule changes, incomplete TTR treatment, capital-loss simplification, aged-care and health costs, property shocks, non-stochastic risks, and personalised fees or advice.

Add empty-state summary tables whose initial values are explicit rather than blank:

```markdown
| Finding class | Current count |
|---|---:|
| Pass | 0 — procedures not commenced |
| Qualified pass | 0 — procedures not commenced |
| Observation | 0 — procedures not commenced |
| Remediation required | 0 — procedures not commenced |
```

Add the re-verification triggers from the approved design: material logic/order changes, regulated assumption changes, material defaults or interpretations, finding remediation, scope expansion, legislative change, material defect discovery, and scheduled expiry.

- [ ] **Step 5: Check dossier readability and prohibited claims**

Run:

```powershell
rg -n "T[B]D|T[O]DO|certified|regulator approved|fully accurate|guaranteed" private/verification-pack/master-verification-dossier.md
```

Expected: no matches. Manually confirm the first two pages can be understood without reading implementation references.

### Task 3: Build the authoritative source register

**Files:**
- Create: `private/verification-pack/registers/source-register.csv`

- [ ] **Step 1: Create the register schema**

Use this exact CSV header:

```csv
source_id,authority_class,issuing_body,title,url_or_identifier,published_or_last_updated,applicable_period,accessed_date,model_areas,review_status,notes
```

Allowed `authority_class` values are `Legislation`, `Legislative instrument`, `Official guidance`, `Professional standard`, `Technical guidance`, and `Secondary context`.

- [ ] **Step 2: Seed the governing review-framework sources**

Add records for:

- ASIC Corporations (Generic Calculators) Instrument 2026/41;
- ASIC RG 167, *AFS licensing: Discretionary powers*;
- ASIC RG 276, *Superannuation forecasts: Calculators and retirement estimates*;
- TPB guidance, *Tax agent services* and TPB(GS) 44/2023;
- AUASB ASRS 4400, *Agreed-Upon Procedures Engagements*; and
- Moneysmart guidance distinguishing financial information, general advice and personal advice.

Use direct official URLs. Set `review_status` to `Applicable scope to be confirmed by engaged reviewer` where the project cannot determine legal applicability itself.

- [ ] **Step 3: Seed calculation-authority source families**

Add separate records for the current official material supporting:

- resident individual income-tax rates;
- Medicare levy and low-income thresholds;
- LITO and SAPTO;
- superannuation guarantee and contribution tax;
- preservation/access and account-based pension minimums;
- Age Pension age, rates, assets test, income test and deeming;
- Commonwealth Seniors Health Card income rules;
- capital gains and the individual discount;
- UK State Pension and Australian taxation/UPP treatment; and
- Treasury inflation assumptions used by the simulator.

Do not use an accounting-firm article when an ATO, Services Australia, ASIC, Treasury or legislation source is available.

- [ ] **Step 4: Validate every source record**

For each record, open the URL, confirm the issuing body and title, record the page's stated update date where available, and set `accessed_date` to `2026-07-14` for sources checked during initial assembly. A later implementer must use the actual later access date if implementation occurs after that date.

- [ ] **Step 5: Check register integrity**

Run a CSV-aware inspection or import the file in a spreadsheet and confirm:

- every row has 11 columns;
- every `source_id` is unique;
- every regulated model area has at least one primary official source;
- no URL is a search-results page; and
- no record has an empty effective/applicable-period explanation.

### Task 4: Build the evidence and findings registers

**Files:**
- Create: `private/verification-pack/registers/evidence-register.csv`
- Create: `private/verification-pack/registers/findings-register.csv`
- Create: `private/verification-pack/registers/distribution-register.csv`

- [ ] **Step 1: Create the evidence schema**

Use:

```csv
evidence_id,review_domain,requirement,source_ids,effective_date,methodology_summary,implementation_reference,procedure_id,expected_result,actual_result,finding_id,status,notes
```

Seed one row for each material implementation area listed in Task 2. Use `Not yet performed` for `actual_result`, `Not assigned` for `finding_id`, and `Not reviewed` for `status` until external procedures occur.

- [ ] **Step 2: Create the immutable findings schema**

Use:

```csv
finding_id,review_domain,reviewer_id,procedure_id,evidence_ids,affected_artifact_hash,expected_result,observed_result,impact,classification,recommendation,owner_response,target_release,retest_result,closure_status,opened_date,closed_date
```

The initial file contains only the header. When findings are added, retain the original finding text and record remediation/retest in later fields rather than overwriting history.

- [ ] **Step 3: Create the controlled-distribution schema**

Use:

```csv
copy_id,pack_hash,recipient,organisation,purpose,issued_by,issued_date,return_or_destroy_due,returned_or_destroyed_date,status,notes
```

The initial file contains only the header. Do not record a recipient until a copy is actually issued.

- [ ] **Step 4: Cross-check identifiers**

Confirm every `source_id` used in `evidence-register.csv` exists in `source-register.csv`, every `procedure_id` uses the format `A-001`, `B-001`, `C-001` or `D-001`, and no evidence row claims a completed result.

### Task 5: Create the four bounded reviewer schedules

**Files:**
- Create: `private/verification-pack/reviewer-schedules/schedule-a-accountant.md`
- Create: `private/verification-pack/reviewer-schedules/schedule-b-tax-agent.md`
- Create: `private/verification-pack/reviewer-schedules/schedule-c-financial-adviser.md`
- Create: `private/verification-pack/reviewer-schedules/schedule-d-technical-model.md`

- [ ] **Step 1: Apply the common schedule contract**

Every schedule must contain:

```markdown
## Engagement identification
## Reviewer competence and scope
## Independence and conflicts declaration
## Artifact and evidence received
## Agreed procedures
## Factual findings
## Qualifications and scope exclusions
## Reviewer declaration
## Project-owner response
## Retest and closure
```

Use `Not yet assigned`, `Not yet agreed`, or `Not yet performed` for fields awaiting an external reviewer. Never pre-populate a positive conclusion.

- [ ] **Step 2: Write Schedule A procedures**

Include individually numbered procedures to:

- reconcile opening balances, income, contributions, earnings, withdrawals and closing balances;
- reproduce nominal and today's-dollar conversions;
- test household aggregation and per-person allocation;
- verify surplus banking and essential-budget shortfalls;
- reconcile table, chart and export values; and
- independently calculate selected reference scenarios.

Explicitly exclude tax-law approval, personal financial advice and source-code assurance unless separately engaged.

- [ ] **Step 3: Write Schedule B procedures**

Include individually numbered procedures for income-tax brackets, Medicare, LITO, SAPTO, taxable/non-taxable retirement income, contribution/withdrawal assumptions, capital-gains approximations, defined-benefit and UK-pension treatment, threshold boundaries, and disclosure of annual-timing simplifications.

Require the reviewer to state their TPB registration status and whether any part of the scope requires a specialist they cannot independently review.

- [ ] **Step 4: Write Schedule C procedures**

Include individually numbered procedures for superannuation access and phases, minimum drawdowns, drawdown ordering, Age Pension/CSHC retirement-planning treatment, return/inflation/longevity assumptions, output interpretation, foreseeable misuse, and the boundary between factual modelling and financial advice.

Require the reviewer to record relevant AFS authorisation and retirement-planning competence.

- [ ] **Step 5: Write Schedule D procedures**

Include individually numbered procedures for source-to-code traceability, independent recalculation, black-box comparisons, boundaries, transition years, invalid inputs, annual ordering, rounding/tolerances, invariants, displayed-output consistency, regression independence, import/export behaviour and release reproducibility.

Require the technical reviewer to distinguish an implementation defect from an accepted model limitation.

- [ ] **Step 6: Verify scope separation**

Read the four declarations side by side. Confirm no reviewer is asked to certify a domain outside their engagement, and each schedule states that its report cannot be treated as approval of the other domains.

### Task 6: Define the fictional reference-scenario bundle

**Files:**
- Create: `private/verification-pack/reference-scenarios/README.md`
- Create: `private/verification-pack/reference-scenarios/scenario-register.csv`

- [ ] **Step 1: Write the independent-calculation protocol**

The README must require:

- fictional inputs only;
- a stable scenario identifier;
- a saved input artifact or complete input table;
- independent calculations prepared without copying simulator outputs;
- expected results before simulator comparison;
- explicit rounding/tolerance rules;
- actual results and variance;
- linked evidence, procedure and finding identifiers; and
- reviewer name/date recorded only after assignment.

- [ ] **Step 2: Create the scenario schema**

Use:

```csv
scenario_id,title,primary_domains,purpose,input_file,independent_workpaper,expected_output,simulator_output,tolerance,variance,status,evidence_ids,finding_ids
```

- [ ] **Step 3: Seed the scenario catalogue**

Create explicit rows for:

- `RS-001` simple household baseline;
- `RS-002` two people retiring in different years;
- `RS-003` accumulation-to-retirement transition;
- `RS-004` zero and positive salary growth;
- `RS-005` minimum account-based pension drawdown;
- `RS-006` no, partial and threshold Age Pension cases;
- `RS-007` income-tax, Medicare, LITO and SAPTO boundaries;
- `RS-008` planned lump sums from different sources;
- `RS-009` savings depletion and essential-budget shortfall;
- `RS-010` defined-benefit income;
- `RS-011` UK State Pension and currency/UPP assumptions;
- `RS-012` shares and capital-gains approximation;
- `RS-013` nominal versus today's-dollar output; and
- `RS-014` invalid and unsupported inputs.

Initial `status` is `Designed — independent workpaper not yet prepared`. Do not invent expected numerical outputs before the independent workpapers exist.

- [ ] **Step 4: Add boundary-case rules**

Require immediately-below, exact-boundary and immediately-above cases for every represented regulated threshold where the annual model can express the distinction. Require transition-year cases for retirement, super access, pension commencement and ending other income.

### Task 7: Capture reproducible automated-test evidence

**Files:**
- Create: `private/verification-pack/supporting-evidence/regression-results.txt`

- [ ] **Step 1: Run the deterministic regression suite**

Run:

```powershell
node tests/retirement-simulator.test.mjs
```

Expected: exit code 0 and the suite's passing summary.

- [ ] **Step 2: Run the companion suite as a repository regression guard**

Run:

```powershell
node tests/retirement-monte-carlo.test.mjs
```

Expected: exit code 0. State in the evidence file that this protects repository compatibility but does not bring the experimental Monte Carlo companion into the verification scope.

- [ ] **Step 3: Record reproducibility metadata**

Record command, date/time zone, Node version, exit code, complete summary output, simulator SHA-256 and Git commit in `regression-results.txt`.

- [ ] **Step 4: Link test evidence**

Reference `regression-results.txt` from the technical schedule and relevant evidence-register rows. Do not treat regression tests alone as independent model verification.

### Task 8: Perform internal pack quality control

**Files:**
- Modify: all files under `private/verification-pack/`
- Create: `private/verification-pack/supporting-evidence/pack-file-hashes.txt`

- [ ] **Step 1: Run the prohibited-content scan**

Run:

```powershell
rg -n "T[B]D|T[O]DO|PLACEHOLD[E]R|fully verified|regulator approved|guaranteed accurate" private/verification-pack
```

Expected: no matches.

- [ ] **Step 2: Check internal references and state consistency**

Confirm:

- the Executive Summary still says external review has not commenced;
- every evidence source identifier exists;
- every schedule procedure identifier is unique;
- the findings counts remain zero before fieldwork;
- the baseline hash matches the current reviewed artifact;
- the Monte Carlo companion remains out of scope; and
- all scenarios are fictional.

- [ ] **Step 3: Confirm nothing confidential is tracked**

Run:

```powershell
git status --short
git ls-files private
git check-ignore -v private/verification-pack/master-verification-dossier.md
```

Expected: no `private/` file appears in `git ls-files`; the master dossier is ignored; Git status does not list pack artifacts.

- [ ] **Step 4: Hash the assembled pack**

Generate SHA-256 hashes for every file under `private/verification-pack/` except `pack-file-hashes.txt`, sort by relative path and record them in `pack-file-hashes.txt`. Then hash `pack-file-hashes.txt` separately when issuing a controlled copy.

- [ ] **Step 5: Conduct the internal rehearsal**

Using only the README and master dossier, verify that a prospective reviewer can determine:

1. what artifact is under review;
2. what their scope is;
3. which evidence they receive;
4. how to record a procedure and finding;
5. how qualifications reach the Executive Summary; and
6. why their completion does not imply public endorsement.

Record any rehearsal issue as an internal observation in the findings register with reviewer ID `INTERNAL-QC`, then correct and close it through the normal lifecycle.

### Task 9: Prepare the external-review handoff

**Files:**
- Modify: `private/verification-pack/README.md`
- Modify: `private/verification-pack/master-verification-dossier.md`
- Modify: `private/verification-pack/registers/distribution-register.csv`

- [ ] **Step 1: Define the first reviewer assignment without naming an unconfirmed person**

Record the desired professional capacity, scope, required credentials, evidence set, intended report users and proposed procedures. Keep the assignment status `Reviewer not yet appointed` until engagement is confirmed.

- [ ] **Step 2: Prepare controlled-copy instructions**

Specify that each issued copy receives a unique `copy_id`, pack hash, named recipient, purpose, issue date and return/destruction status. Ensure the recipient understands that the pack is confidential and cannot be quoted as a public endorsement.

- [ ] **Step 3: Final owner review checkpoint**

Present the assembled internal pack to the project owner for joint review before any external distribution. Do not issue the pack, contact reviewers or make external claims without explicit owner approval.

## Completion definition

This implementation phase is complete when the private pack structure is populated, internally consistent, bound to an exact artifact, backed by an initial source/evidence register, ready for reviewer appointment, and still states that external procedures have not commenced.

The simulator itself is not “verified” at that point. Verification status can change only after appropriate external reviewers complete their agreed procedures, findings are resolved or qualified, and the final Executive Summary is reconciled to their reports.
