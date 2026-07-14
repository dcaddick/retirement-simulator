# Confidential Verification Pack Design

**Status:** Approved design for user review  
**Date:** 14 July 2026  
**Applies to:** Retirement Simulator deterministic model  
**Distribution:** Confidential — controlled due-diligence use only

## 1. Purpose

Create a confidential due-diligence pack that enables independent professionals to scrutinise the Retirement Simulator's methodology, calculations, implementation and communications.

The pack will support four distinct review perspectives:

1. accounting and financial reconciliation;
2. Australian tax treatment;
3. retirement-planning and financial-advice considerations; and
4. technical and quantitative model validation.

The pack will not assert that the simulator is universally correct, suitable for every user or a substitute for personal professional advice. It will record what was reviewed, the criteria used, the procedures performed, the findings, any qualifications, and the exact simulator release to which those findings apply.

## 2. Intended users and permitted use

The pack is intended for selected external accountants, registered tax agents, appropriately authorised financial advisers, technical model reviewers, and stakeholders conducting private due diligence.

It is not intended for public distribution, marketing, or use as a public endorsement. No public claim such as “verified,” “certified,” “approved,” or “professionally endorsed” may be derived from the pack without a separate decision about wording, evidence, reviewer consent and regulatory implications.

Every distributed copy will identify:

- the document owner;
- the recipient or recipient class;
- the pack version;
- the simulator version and cryptographic file hash under review;
- the issue date and review status;
- the confidentiality classification; and
- any restrictions on copying, onward distribution or quotation.

## 3. Design approach

The pack will use a hybrid structure:

- one integrated master dossier containing the common facts, methodology, evidence framework, consolidated findings and executive summary; and
- separate standardised reviewer schedules that allow each specialist to document procedures and findings without implying approval outside their professional scope.

This structure provides one authoritative record while keeping each review assignment bounded and practical. It can later support a formally agreed engagement, including an agreed-upon procedures engagement, if the engaging practitioner considers that approach appropriate.

## 4. Deliverables

### 4.1 Master Verification Dossier

The master dossier will contain:

1. document control and confidentiality notice;
2. plain-English Executive Summary;
3. purpose, intended use and meaning of verification;
4. simulator identity and release baseline;
5. scope, exclusions and materiality approach;
6. end-to-end model methodology;
7. authoritative source and evidence register;
8. reference scenarios and expected results;
9. automated and manual test evidence;
10. consolidated reviewer findings;
11. management responses and remediation evidence;
12. residual limitations and risks;
13. final verification status by review domain;
14. validity period and re-verification triggers; and
15. reviewer schedules and supporting exhibits.

### 4.2 Reviewer schedules

Four standardised schedules will be created:

- Schedule A — Accountant Review;
- Schedule B — Registered Tax Agent Review;
- Schedule C — Financial Adviser Review; and
- Schedule D — Technical and Model Validation.

Each schedule will state the reviewer competence expected, review boundaries, procedures, evidence supplied, results, exceptions, reviewer declarations and sign-off.

### 4.3 Evidence workbook

A structured evidence workbook will provide traceability between external requirements, documented methodology, implemented rules, tests and findings. It may initially be maintained as Markdown tables or a spreadsheet-ready table, but each record will use a stable evidence identifier.

### 4.4 Reference scenario bundle

The pack will include fictional scenarios designed to exercise ordinary cases, boundaries, transitions and known modelling approximations. Each scenario will contain inputs, independently calculated expected results, simulator results, variance tolerances and reviewer findings.

No real household data will be included.

## 5. Executive Summary

The Executive Summary will be written in plain language and will appear immediately after document control. It will be understandable without reading the detailed schedules.

It will answer:

- what the simulator does;
- why the review was undertaken;
- which release was reviewed;
- who reviewed each domain and in what capacity;
- what procedures were performed;
- what was not reviewed;
- what the review found;
- which findings remain qualified or unresolved;
- how current the regulated assumptions are;
- how long the review remains applicable; and
- what users must still refer to qualified professionals for.

The summary will report domain statuses separately. It will not collapse distinct reviews into one unconditional pass.

Recommended domain statuses are:

- **Reviewed — no material exceptions identified**;
- **Reviewed — qualified**;
- **Remediation required**;
- **Not reviewed**; and
- **Superseded**.

The Executive Summary will state that it is a summary and that reviewers and decision-makers must consider the complete pack, particularly qualifications and exclusions.

## 6. Evidence and source methodology

### 6.1 Evidence chain

Every material rule or calculation will use the following traceability chain:

> Requirement → authoritative source → effective date → simulator methodology → implementation reference → independent procedure → expected result → actual result → finding → remediation

Each link will be recorded under a stable evidence identifier so a reviewer can move from a user-facing output back to its basis and implementation.

### 6.2 Source hierarchy

Sources will be classified in descending order of authority:

1. legislation and legislative instruments;
2. regulator or government-administered rules and determinations;
3. official explanatory and administrative guidance;
4. applicable professional and assurance standards;
5. recognised technical or modelling guidance;
6. secondary commentary used only for context.

Secondary commentary will not be the sole support for a regulated calculation when a primary source is available.

Each source record will include title, issuing body, direct link or document identifier, publication or last-reviewed date, applicable period, access date, affected simulator rules and any interpretation made by the project.

### 6.3 Initial external framework references

The detailed pack will consider, at minimum, the current versions applicable at the time of review of:

- ASIC Corporations (Generic Calculators) Instrument 2026/41;
- ASIC Regulatory Guide 167, *AFS licensing: Discretionary powers*;
- ASIC Regulatory Guide 276, *Superannuation forecasts: Calculators and retirement estimates*, to the extent relevant;
- Tax Practitioners Board guidance on tax agent services;
- AUASB ASRS 4400, *Agreed-Upon Procedures Engagements*, if that form of external engagement is selected;
- Australian Taxation Office material supporting tax and superannuation rules;
- Services Australia material supporting Age Pension and Commonwealth Seniors Health Card rules; and
- Treasury and legislation sources supporting rates, thresholds and effective dates.

The engaged professionals will determine which standards and sources govern their work. The project will not describe an engagement as an assurance engagement unless the practitioner expressly accepts and conducts it as one under an applicable framework.

## 7. Review scopes

### 7.1 Accountant Review

The accountant schedule will cover:

- annual roll-forward and balance reconciliation;
- opening balances, inflows, earnings, withdrawals and closing balances;
- income classification and household aggregation;
- nominal and today's-dollar conversions;
- surplus banking, budget use and shortfall reporting;
- rounding, presentation and cross-report consistency;
- reconciliation between tables, charts and exported scenario data; and
- independent reproduction of selected reference scenarios.

The schedule will expressly exclude tax-law approval, financial-product advice and technical code assurance unless separately within the reviewer's competence and engagement.

### 7.2 Registered Tax Agent Review

The tax schedule will cover the tax rules actually represented by the reviewed release, including:

- individual income-tax rates and thresholds;
- Medicare levy treatment and applicable low-income thresholds;
- offsets represented by the simulator, including LITO and SAPTO;
- classification of taxable and non-taxable retirement income;
- superannuation contribution and withdrawal tax assumptions;
- share disposal and capital-gains approximations;
- defined-benefit and foreign-pension treatment, including any UPP treatment;
- age, date, income and threshold boundaries;
- annual-timing and other simplifications; and
- the accuracy and sufficiency of tax-related disclosures.

The reviewer will identify rules that are correct only under specified assumptions and areas where the simulator deliberately uses an approximation rather than a complete tax determination.

### 7.3 Financial Adviser Review

The adviser schedule will cover:

- retirement and superannuation phase logic;
- preservation and access assumptions;
- account-based pension minimums;
- drawdown ordering and retirement-income interactions;
- Age Pension and CSHC modelling from a retirement-planning perspective;
- investment return, inflation and longevity assumptions;
- sequence and timing limitations;
- the distinction between factual information, generic modelling and financial advice;
- the risk that outputs, labels or defaults could be interpreted as recommendations;
- suitability of user warnings, limitations and explanatory material; and
- realistic use cases and foreseeable misuse.

The reviewer must be appropriately authorised and experienced for the agreed scope. The schedule will not ask the adviser to certify tax calculations or software correctness outside that scope.

### 7.4 Technical and Model Validation

The technical schedule will cover:

- source-to-code traceability for material calculation rules;
- independent implementation or recalculation of critical formulas;
- black-box comparison against reference scenarios;
- boundary, transition and invalid-input testing;
- calculation ordering and annual timing;
- deterministic reproducibility;
- numerical precision, rounding and tolerances;
- model invariants and conservation-style reconciliations;
- consistency between engine values and displayed outputs;
- regression coverage and test independence;
- import, export and schema behaviour affecting calculations; and
- reproducibility from the identified release artifact.

The technical reviewer will distinguish defects in implementation from limitations or policy choices in the documented model.

## 8. Reference scenario design

The scenario bundle will use fictional data and cover, at minimum:

- a simple single-income household baseline;
- a two-person household retiring in different years;
- accumulation-to-retirement-phase transitions;
- salary growth at zero and a positive rate;
- minimum account-based pension drawdowns;
- no Age Pension, partial Age Pension and threshold-boundary cases;
- LITO, SAPTO and Medicare boundary cases;
- planned lump sums funded from different sources;
- savings depletion and essential-budget shortfall;
- defined-benefit income;
- UK State Pension and currency assumptions;
- shares and relevant capital-gains approximations;
- today's-dollar versus nominal-dollar output; and
- deliberate invalid or unsupported input cases.

Each regulated threshold will have tests immediately below, at and immediately above the boundary where the simulator's annual model can represent that distinction.

The final scenario list will be agreed with reviewers before fieldwork so that procedures are clear and results are reproducible.

## 9. Findings and remediation workflow

### 9.1 Finding classifications

Detailed findings will use four classifications:

- **Pass:** the agreed criterion was met within the stated tolerance;
- **Qualified pass:** the criterion was met only under a documented assumption or immaterial exception;
- **Observation:** no failure was identified, but clarity, resilience or evidence could improve; and
- **Remediation required:** a material error, unsupported rule, misleading presentation or control failure was identified.

Each finding will include the evidence identifier, affected release, reviewer, procedure, expected result, observed result, impact, classification and recommended action.

### 9.2 Management response

The project owner will record whether each finding is accepted, partly accepted or not accepted, with reasons. Accepted remediation will identify the responsible person, target release and validation required.

Closed findings will retain their original wording, management response, remediation evidence and independent retest result. Findings will not be deleted merely because they were fixed.

### 9.3 Conflicting professional findings

If reviewers disagree, the master dossier will preserve both findings, identify the source of disagreement and record the resolution or residual uncertainty. The project owner will not silently select the more favourable view.

## 10. Verification decision

Verification will be recorded by domain and release. A domain may receive a positive status only when:

- its agreed procedures have been completed;
- material exceptions have been resolved or explicitly qualified;
- the reviewer's report or schedule is final;
- the reviewed artifact matches the recorded hash; and
- the Executive Summary accurately reflects the detailed findings.

The pack will not use one reviewer’s completion to imply completion of another domain.

A final cover status may say **Due diligence completed for the stated scope** only when all mandatory domains have a final status and no undisclosed remediation-required finding remains.

## 11. Currency and re-verification

The verification record applies only to the identified simulator artifact and dated rules.

Re-verification will be triggered by:

- a change to calculation logic or calculation ordering;
- a change to tax, superannuation, pension or regulated assumptions;
- a change to a material default or user-facing interpretation;
- correction of a material finding;
- expansion into a previously excluded modelling area;
- a relevant legislative or regulatory change;
- discovery of a material defect; or
- expiry of the scheduled periodic review date.

Editorial changes may be assessed through documented impact analysis rather than full re-performance. The decision and rationale will be recorded.

The Executive Summary will display the earliest relevant rule-review date and will clearly identify a superseded verification record.

## 12. Confidentiality, privacy and independence controls

The pack will contain fictional scenarios only. Reviewer access to source code and working materials will be limited to what is necessary for the agreed scope.

Before receiving the pack, each reviewer will be asked to acknowledge confidentiality terms appropriate to the engagement. The project will maintain a controlled distribution register.

Each reviewer schedule will record:

- identity, organisation and professional capacity;
- relevant registration, authorisation or qualifications;
- scope competence;
- financial or other interests relevant to independence;
- prior involvement in developing the simulator;
- reliance on experts or other reviewers; and
- any limitation on distribution or quotation of their report.

Independence will not be claimed merely because a reviewer is external. Any prior involvement or relationship will be disclosed and evaluated.

## 13. Pack workflow and information flow

1. Freeze and hash the simulator release under review.
2. Complete the common methodology and evidence register.
3. Agree each reviewer’s competence, scope, procedures and deliverables.
4. Issue a controlled pack and record the recipient.
5. Reviewers perform procedures and record factual results.
6. Findings enter the consolidated register.
7. The project owner responds and remediates accepted findings.
8. Reviewers retest material remediation within their scope.
9. Domain statuses and residual qualifications are agreed.
10. Prepare the plain-English Executive Summary from the final detailed record.
11. Perform consistency and confidentiality checks.
12. Issue the final controlled pack and record its validity triggers.

The Executive Summary is written near the end of the workflow even though it appears near the start of the issued document. This prevents the summary from pre-empting incomplete reviewer findings.

## 14. Quality checks for the pack itself

Before issue, the pack will be checked for:

- agreement between the Executive Summary and detailed findings;
- complete evidence identifiers and working links;
- authoritative sources and effective dates for regulated assumptions;
- no unresolved placeholders;
- correct simulator version and file hash;
- reconciliation of finding counts and statuses;
- disclosure of every material qualification;
- reviewer scope and credential records;
- removal of personal scenario data;
- confidentiality markings and distribution restrictions;
- accessible plain-English explanations; and
- reproducibility of referenced tests and scenarios.

A reviewer who did not author the Executive Summary should compare it with the detailed reports before issue.

## 15. Out of scope for the first pack

The first pack will not:

- obtain or imply regulator approval;
- provide personal tax or financial advice;
- certify the experimental Monte Carlo companion unless separately commissioned;
- make a public verification claim;
- validate future legal or policy changes;
- treat reviewer credentials as a substitute for documented procedures and evidence; or
- claim formal assurance unless an appropriately qualified practitioner accepts such an engagement.

## 16. Acceptance criteria

The pack design is successfully implemented when:

1. a controlled master dossier and four reviewer schedules exist;
2. the Executive Summary is plain-language and traceable to detailed findings;
3. all material model rules can be followed through the evidence chain;
4. reference scenarios cover core flows and material boundaries;
5. findings and remediation remain auditable;
6. reviewer scope, competence and independence are explicit;
7. verification is bound to a specific release and dated rules;
8. re-verification triggers are operationally clear; and
9. confidential use cannot reasonably be confused with public endorsement.

## 17. Recommended implementation sequence

1. Create the master dossier template and document controls.
2. Build the evidence and authoritative-source register.
3. Create the four reviewer schedules.
4. Define and independently calculate the reference scenarios.
5. Populate the common methodology from the current simulator documentation and code.
6. Conduct an internal completeness rehearsal.
7. Engage external reviewers and agree procedures.
8. Manage findings, remediation and retesting.
9. Complete the Executive Summary and controlled final issue.

