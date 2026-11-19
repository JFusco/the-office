# Office process — version 1

This is the shared process baseline agreed on November 15, 2026. Every employee
uses the existing Office runtime, scheduler and role-specific response schema.
There is no separate QA dispatcher or learning system. The diagrams describe
the supported process, not proof that a particular ticket passed it. Configured
project policy determines which optional stages run; a diagram grants no new
permission. Changes to these boundaries belong in the same PR as their code and
behavioral tests. Do not add a ticket-specific process when a shared mechanism
can carry the same authorized task.

## Whole Office

Solid arrows move work; dotted arrows supply advice or evidence. The scheduler
releases the project lane between stages. CTO, IT and knowledge capacity stay
separate from delivery capacity; their advice never becomes a second writer.

```mermaid
flowchart TD
    U["Joe: goals, ideas, questions and explicit decisions"] --> AV["Avery: direction and priorities"]
    U --> IN["Configured Jira or GitHub intake / explicit Start / linked PR"]
    AV --> PM["Morgan: reconcile scope, eligibility and owner"]
    IN --> PM
    PM --> FP{"Feature discovery needed and enabled?"}
    FP -->|Yes| CA["Casey: research, brief and product questions"]
    CA --> Q["Questions for you: choices, recommendation and custom answer"]
    Q -->|Decision saved| CA
    CA --> PL["Alex: plan; independent review when required"]
    PL --> AP["Recorded project-policy or human approval"]
    AP --> EN["Existing delivery queue"]
    FP -->|Ordinary work / explicit Start| EN
    IN -->|Existing PR or qualifying automation PR; an adoption in progress raises no question unless it stalls| EN
    EN --> H["Shared harness: claim, identity, scope, holds, prerequisites and budget; Jira / Azure resume also checks the candidate branch has not moved"]
    H --> DEV["Alex: implement / repair on owned candidate"]
    DEV --> RV["Sam: independent review when selected or required"]
    RV -->|Findings| DEV
    RV --> QA["Riley: independent checks or browser QA when selected / required"]
    QA -->|Observed product defect| DEV
    QA --> PUB["Harness: provider-specific publication and required current-head checks"]
    PUB --> GH["GitHub: guarded merge when authorized; exact-merge Actions"]
    PUB --> AZ["Jira / Azure: Ready for Staging; human merge and deployment"]
    AZ --> SQ["Riley: verify actual staging version when available"]
    GH --> CL["Verified closeout: issue / cards / notices / cleanup as applicable"]
    SQ --> CL
    H -->|Blocked / interrupted| REC["Shared recovery: record the stop kind, retain evidence and route exact prerequisite"]
    SS["Service start: cancel unfinished work on removed one-time recovery paths; unsettled writes stay blocked for read-back"] --> REC
    REC -->|Safe authorized continuation| H
    REC -->|Human decision or access required| Q
    REC --> IT["Ellis: bounded operational diagnosis; supported recovery only"]
    IT -->|Verified prerequisite resolved| REC
    H -.-> LE["Harper: capture outcomes, curate and propose lessons asynchronously"]
    LE -.->|One weekly lesson digest| Q
    CL -.-> LE
    LE -.->|Relevant installed guidance / lookup| H
    BG["Scheduled maintenance, provider observations, conversations and notices"] --> H
    BG -.-> AV
    H -.-> TM["Time, queue, usage and cost evidence; guarded publication"]
    CL -.-> AV
```

## Discovery, decisions and intake

Morgan first checks the configured project, assignee, intake status, supported
issue type, existing feature/delivery/PR ownership, holds and prerequisites.
An issue is not admitted merely because it appears in a chat or search result.
Existing PRs are reconciled before any development is created. Exact bot identity
and content qualification allow routine Dependabot, Renovate and canonical wiki
PRs to use current-head provider checks and repository rules without an added
model review or local QA cycle.

An assignment review that stopped is closed as history, with no model run, once a complete
assignment read shows its ticket is no longer assigned or no longer open. A review of a ticket that
is still assigned keeps its status, so a blocked review still requires its read-back before any new
work. Reviews in flight, tickets the Office is delivering and configured holds are left as they are,
and an empty read closes nothing (`server/delivery/intake/settle-stopped-reviews.ts`).

For Jira/Azure work the harness reads the complete list of active pull requests before and after
a PM read-back or assignment review. The assessment is refused only when a pull request that could
concern the ticket was added, removed or modified in between: one that names the ticket key in its
title, source branch or description, uses the ticket's branch, or is the ticket's own. Any other
pull request changing is recorded and does not stop the dispatch
(`server/cec/related-pr-change.ts`).

Each Jira/Azure project uses its own configured Jira statuses, ticket key, prompt authority and
observed deployment. A project added beside CEC never inherits CEC's authority, statuses or
repository facts; CEC keeps its legacy values.

```mermaid
flowchart LR
    I["Provider issue / idea / explicit planning request"] --> G{"Current intake and ownership eligible?"}
    G -->|No| W["Wait or show the concrete restriction; preserve original ownership"]
    G -->|Yes| D{"Ordinary delivery or discovery?"}
    D -->|Ordinary / explicit Start| O["Existing delivery admission"]
    D -->|Discovery enabled| C["Bounded source capture; Morgan assessment; Casey research"]
    C --> N{"Product decision actually missing?"}
    N -->|Yes| Q["One current question round; no answer selected automatically"]
    Q --> C
    N -->|No| B["Confirmed brief under saved manual / automatic policy"]
    B --> P["Alex plan and required independent plan review"]
    P --> A["Recheck baseline, requirements, decisions and authority"]
    A --> O
```

Questions use the existing Questions for you / outbox action. Joe sees the actual
question, recommended choice, alternatives and custom answer. Saving a note is
not an approval or retry. A resolved decision stays bound to its recorded scope;
an expired observation prompts a fresh check, not another approval for unchanged
scope. Changed requirements use the existing revision and approval policy.

## Development, review and QA

Morgan proposes the approach and Alex confirms it after source inspection.
Planning can be none, brief or reviewed; code review can be none, focused or
full; validation can be developer checks, independent checks or browser QA.
Repository requirements, explicit acceptance criteria and unresolved findings
take precedence. No gate is downgraded to hide a failure.

```mermaid
flowchart TD
    PRE["Harness: claim, hold and admission; Jira / Azure resume stops if another writer moved the candidate branch"] --> A["Alex: implementation and required repository checks"]
    A --> R{"Selected independent review required?"}
    R -->|Yes| S["Sam: review exact candidate"]
    S -->|Product findings| F["Alex: focused repair; retain finding IDs and counters"]
    R -->|No| V{"Selected validation route"}
    S -->|Accepted| V
    V -->|Developer checks sufficient| P["Provider publication gates"]
    V -->|Independent checks / browser| SET["Riley: verify candidate, capabilities and owned setup"]
    SET -->|Missing prerequisite| B["Name owner and action; affected cases untested; stop kind recorded"]
    SET -->|Ready| T["Riley: observe all required cases and adjacent regressions"]
    T --> REP["Structured report: case references, actual observations, evidence and next action"]
    REP -->|Observed product defect| F
    F --> S2["Sam: review repaired head when selected / required"]
    S2 -->|Accepted| RT["Riley: independently retest findings and relevant cases on repaired head"]
    S2 -->|Findings| F
    RT --> REP
    REP -->|Evidence accepted for this exact head| P
    B -->|Prerequisite resolved under existing authority| SET
```

Riley is one independent QA worker. The fixer does not verify their own fix.
Browser QA verifies startup, callback origin, actual signed-in actor, tenant,
test-data permissions and owned application/database/browser before feature
actions. Checks-only QA starts no browser merely to satisfy a template. Show a
visible named browser window before asking Joe to sign in. Keep it available
while waiting. An HTTP response or login page is not feature acceptance.

The v2 QA report refers to each saved check by a deterministic criterion ID.
The worker can explain the case in its own words. Changing a saved requirement
changes its ID; it needs the normal route/baseline decision, not silent semantic
equivalence. IDs persist across candidate revisions when the requirement text
does not change. A regression has no acceptance criterion ID. Legacy v1 reports
retain their exact-text coverage rule and original bytes. Current-head evidence,
all required cases, prior finding dispositions and known usage/effects still
gate acceptance. Open a ticket's **QA Results** to see setup, cases, evidence,
findings, next owner/action and the full report.

A Jira/Azure retest must mark verified, itself, every finding a QA stage has reported, every
finding the current repair was sent to fix, and any finding on the ticket that is not yet verified.
Only a finding another stage raised about its own work and that is already verified, such as a
developer's note that its verification was unfinished once the review has settled it, is not owed a
QA disposition. A refusal names the findings that are missing
(`server/cec/qa/retest-dispositions.ts`).

## Publication and closeout

```mermaid
flowchart TD
    PASS["Accepted implementation, selected review and validation on current head"] --> PR["Harness reconciles or creates the one owned PR"]
    PR --> CH["Verify repository, base, head, metadata and required provider checks"]
    CH -->|Failed checks| FIX["Sam diagnoses exact-head logs; authorized repair / metadata fix / evidenced transient retry"]
    FIX -->|Source changed| RE["Alex repair; new-head review and validation"]
    RE --> PASS
    CH -->|Jira / Azure checks passed| READY["Verified Ready for Staging transition; wait"]
    READY --> HM["Human merge and verified staging deployment"]
    HM --> ST["Riley: actual deployed-version staging checks"]
    ST -->|Accepted| CEC["Staging verified; human release / closure remains separate"]
    CH -->|GitHub merge authorized and current checks green| MG["Harness guarded merge once"]
    MG --> CI["Watch actual merge Actions and configured release behavior"]
    CI -->|Verified required outcomes| END["Verify original issue and board closeout"]
    END --> NC["Natural notices, time/cost publication and safe owned cleanup"]
```

CEC may retain a verified draft PR before QA under its existing stage route;
QA pass promotes/publishes that PR rather than creating a duplicate. A staging PR
can trigger checks, so PR-triggered checks are not required before the PR exists.
Ready for Staging is a waiting boundary, not permission to merge or deploy COS.
GitHub automatic merge is limited to configured authorization; it never grants
that authority to Jira/Azure work. A project's `policy.merge` is a ceiling above
that authorization: under `human` no merge is queued or dispatched, a merge
already queued blocks with "Project policy requires human merge", and a merge
already attempted is still settled by read-back. Release, package or downstream-runner success
must be observed from the relevant provider; a merge is not proof of release.

A Jira/Azure draft pull request is expected on the accepted candidate. When the developer brings the
branch up to date with the target first, so the pull request opens on a head that contains the
accepted candidate, the harness verifies that with git, records the pull request and sends the new
head back to the developer to confirm. The confirming pass spends no repair attempt and posts no Dev
update, because the move is not a finding, and it must report the moved head or a commit that
contains it. The confirmed head then takes the review the approach selects. A head QA had already
tested is retested; a head that moved before any QA goes on to the validation the approach selected.
It is published without drafting again. A stopped ticket whose recorded draft result is in this
shape takes the same route on resume without running the stage again. A head that does not contain
the accepted candidate is still refused (`server/cec/draft-pr-moved-head.ts`,
`server/cec/confirm-moved-head.ts`, `server/cec/resume-moved-head.ts`).

A change made to a Jira/Azure candidate that already passed the verification the approach selects
is verified at its own scope. A passing repair that starts from such a candidate, and whose commit
git shows contains it, may state the review, validation and checks its own change needs, with a
reason. What it states is never the ticket's approach: the harness applies it to this change only
and keeps the ticket's own approach to return to. The reviewer and QA are told the verified commit
and the scope and can widen it through a route change before executing; nothing else a stage
states replaces a scope in force. A retest of a scoped change owes a disposition for findings not
yet verified and for those the repair was sent to fix. A stated approach that raises review or
validation above the ticket's is a lasting decision under the ticket-wide rule, and a scope that
cannot be shown to sit on the verified candidate is ignored. A scope describes one change, from the
verified commit to the current head, and holds while that change is the same: a later repair that
commits nothing keeps it (git must show the worktree still on that commit), and one that changes the
commit keeps a scope only by stating one for the whole change; a restated scope keeps review and
validation at least at the scope in force. The scope ends when the change is published, when a
repair changes it again without a new scope, or when its repair attempts are exhausted and a revised
approach is assessed; the ticket's own approach then applies again and the return is recorded as a
decision. A ticket whose review once failed keeps at least a focused review
on the change, because publication requires a passing review on the current head. A candidate is
not verified while its latest review or QA result failed, whatever the approach selects, and a
repair on such a candidate keeps the ticket-wide rule: a reduction with work unresolved is refused
(`server/cec/change-scope.ts`, `server/cec/change-scope-note.ts`).

Office QA judges what can be observed at its own stage. A check that only a later stage can observe
(a hosted build that runs only once the pull request is opened or published, or publication itself)
is covered for the part observable now and named for the owner of that stage; it is not failed,
blocked or raised as a finding. A required check with no part observable now is taken out through
a route change before QA executes, not given an invented case. An earlier finding that records only
that such a gate has not run yet is settled with that reason. A gate that has run and failed, or is
running now, is reported as observed
(`server/qa/later-stage-gates.ts`).

Sam's GitHub readiness review does not run on a PR that GitHub already reports as not
reviewable. A draft PR and running current-head checks wait without a model run, and the
review queues once when the PR is ready and its checks finish. A conflict on a head the team
already reviewed is refreshed by the harness (Alex merges the current target into the same
branch) without Sam assessing the conflict first; a conflict on an unreviewed head still goes
to Sam.

On a hands-off project the harness marks a maintenance proposal's draft pull request ready itself.
A maintenance run publishes its draft only after the review and verification its approach selected
ran on the head its proposal step built, and it checks the draft against that head; so once the run
has completed, a draft whose issue and head match that built head counts as verified. The prepare
stage then marks it ready through its effect, and a job parked at the readiness review on such a
draft is sent back to that stage on its next observation, once per head. A run still in flight is
left alone, because it re-reads its draft on every step. The readiness review and merge
authorization are unchanged (`server/delivery/publication/maintenance-verified-draft.ts`).

## Recovery and human involvement — shared across roles

| Observation | Next action | Boundary |
|---|---|---|
| Known safe read stale / timed out | Refresh the unfinished read within the existing persisted budget; check freshness at use | Do not restart the job, extend freshness or reset counters |
| Complete JSON surrounded by one presentation fence | Local schema-validated normalization; retain original bytes and hashes | No model call or action replay; no fragment extraction or invented fields |
| Malformed / incomplete output | Retain failure; existing stage recovery or owner decides permitted repair | Formatting cannot replace missing evidence or imply a product pass |
| Product defect observed | Developer repair, selected review, independent retest | Setup errors are not product defects |
| Missing setup / information | Route named prerequisite to capable owner | Joe is asked only for his actual decision or access |
| External write uncertain | Independent read-back against exact saved Effects intent | Never blind resend or infer non-execution from a negative search |
| Wrong identity, permission denied, competing writer, real hold | Stop affected action; authoritative resolution required | Lessons and free-form prose do not grant authority |
| Native helper survives / output missing | Retain claim, failure and original evidence; supported reconciliation only | No success assertion, unrelated kill or repeated investigation loop |

When a delivery stage, ticket stage or harness request stops on an error, the harness records
why on the record (`stop.kind`: provider checks, PR not ready, closed source, uncertain effect, transient read,
pause, hold, authority or unclassified). The label is for counting stops (`pnpm office baseline`);
it changes no status and grants no retry, resume or authority.

A GitHub writer stage (implement or update base) on a hands-off project whose run died within
the last six hours is restarted by the harness, not read back by a model. The harness first confirms the
run's processes are gone and that the remote branch and PR are still at the accepted head. It
keeps whatever the run left in the worktree under a local ref (`refs/office/salvage/<job>/<run>`),
resets the worktree to the accepted head and queues the same stage again: up to three times,
after 30 seconds, 2 minutes and 5 minutes. A returned verdict (including a returned `failed`), a moved
branch or PR, an unsettled effect, a hold, a nested repository in the worktree or an existing
recovery record is not restarted and keeps its existing handling. Scope repair always carries a
recovery record, so it is never restarted this way. Once a job has been restarted, the
stopped-base readback no longer applies to it: a run the harness then declines, or a job that
uses up its three restarts, stays blocked for a person. Jira/Azure work is unchanged.

For Jira/Azure work, a QA stage that stopped in setup (nothing tested, no paid run) is run again
on resume instead of being reconstructed. A review stage whose worker returned its own verdict
is likewise run again on resume, since a read-only review repeats nothing. So is a stage that
works only in its own worktree or test environment (plan, implement, repair, QA and retest) when
its latest run finished and returned its own result with every write read back and its paid runs
counted: its blocker is that result's own words, so a phrase such as "tests timed out" describes
the work and not an interrupted run. A result with an unverified or unknown write, or an unknown
paid-run count, is still reconstructed, and so is a stage that writes to a provider (a Jira update,
a pushed branch, a pull request), whose wording still decides. Once the
implementation that a recorded continuation produced has passed, the receipt of the run it
replaced is settled history: stage, chat and reconcile workers are shown it as settled and told it
is history, a restated copy is dropped from any stage's result, and it gates nothing. A review decides on the source and its evidence; work
that belongs to a later stage is not a reason for it to block. After three setup stops in a row on one
candidate, the next resume shows the count and latest reason without starting a worker;
resuming again runs one more attempt.

A QA run that stopped in setup without exercising any case or making a paid run posts no QA
comment. A setup stop that parks for a person or sends the ticket to repair still posts it: the
park is settled against that comment, and a repair should be explained on the ticket. When the stage runs again after a
setup stop and the harness's own two matching reads show Jira still in that stage's status, no PM
run is spent moving it (`server/cec/qa/status-held.ts`).

A writable Codex worker saves its finished result as a completion checkpoint before it returns. If
the stage time limit stops the worker after that save, the checkpoint is the stage result: the
runner uses it directly, and for a Jira/Azure stage already recorded as interrupted the next
resume accepts it instead of reconstructing the stage. It passes the same gates as any result
and no work is run again. A worker that stalled, a reader, or a worker stopped while an action
was still running is not covered. On resume, a checkpoint for another candidate or attempt is
not accepted.

A stage runner holds its ticket or job for the whole run. When a store transaction fails, the
store restores its saved contents in place, so that record stays the live one and nothing the
runner writes afterwards is lost. If a Jira/Azure stage result was saved to its attempt but is
not on the ticket, the next run of that stage applies it under the same attempt: no worker runs
again and writes already verified for that attempt are not repeated.

The move to Jira Blocked is the one Jira write that does not go through TWG. The workflow requires
a comment in the transition request itself, as Jira's own dialog sends it, and TWG posts a
transition comment separately. The harness resolves the Blocked transition for that issue by
reading Jira, then sends one Jira REST transition carrying the decision comment, through Effects
like every other write. Its Jira API token is read from the login Keychain (service
`the-office-jira`, account the Jira user) when a park is sent; it is never stored, logged or put
in a command's arguments. Before the write the harness asks Jira which account the token acts as.
A missing token, a token Jira does not accept, a token for another account or a missing transition
refuses the park before any write, and the ticket keeps its Office block. A move Jira refuses after
that stays unconfirmed with Jira's reason and is never resent; the settlement described next
recognizes only the older TWG refusal, so such a move needs IT. Every other read, the read-back
and the fallback comment stay on TWG.

A Jira move to Blocked that carried its decision comment and was refused by Jira is settled as
rejected at the next resume, by reading Jira: the ticket is still at the status it was parked
from, nothing changed its status after the Office's verified QA comment, and no comment carrying
that decision exists. The refusal text alone is never taken as proof. If the read does not prove
it, the ticket says so and stays blocked.

The harness writes the comments people read on a Jira ticket, in one shape: a headline, a short
plain summary, what is needed, the findings, a few real links and one closing reference line
(`server/comments/`). It posts the QA comment for qa, retest and staging-qa, which is verified by
read-back and gates the stage, and the Dev update after a draft PR or a repair, which informs and
never gates. It is posted once the stage result is accepted. An update that may have reached Jira
is settled by reading the ticket, at once and again at the next resume if that read failed: found,
it is verified; absent, it is closed as not sent. It is never resent. Workers return the outcome and evidence and post no Jira comments of their own.

When a Jira/Azure ticket's repair budget runs out, Sam assesses one revised technical approach
before any further repair. That assessment runs as a code-review pass on the same candidate, but it
is not a review of a new candidate: the harness asks for no Jira status move for it, and the
ticket keeps its status until the repair that follows is reviewed. The PM read-back before it is
told that the exhausted budget and the failed QA result are the reason for the dispatch, not
blockers for it. Until the assessment has run there is nothing to reconstruct, so a resume
dispatches it without a completion reconciliation.

The revised approach Sam returns is recorded with every gate level (plan, review, validation) kept
at least as strict as the ticket's current one: its changed checks and reason are what extend the
repair window, and the assessment never lowers a gate. The assessment runs once. If it returned a
result that did not reach the ticket, the next resume applies that saved result without running Sam
again, and the PM read-back is told so.

What a resume does with the current stage is one named step, decided in `server/cec/resume-step.ts`
in this order: apply a result the worker already returned, accept a finished result a timed-out run
saved, continue a stopped session, run again a QA stage a provider limit cut off, read back a stage
whose outcome is unknown, or run the stage. The PM read-back before a plain resume is told that expected step,
and that the step's own inputs (findings an earlier run left open, an earlier failed or blocked
result, the repair budget, the routing of any repair) are not in themselves blockers: the harness
routes them after the step. A hold such a result reports that is still current remains a blocker,
and the read-back still returns any current hold. A first pickup, a QA handoff, a QA plan retry
and a saved-source continuation follow other routes and are told no step. The resume event
names the step.

A QA or retest run that a provider capacity limit (usage limit, rate limit or quota) cut off
before it returned a result is run again at the next resume. Nothing is reconstructed: the harness
treats that run's work as confined to its own test environment, and it posts the Jira comment
itself and posted none. The rule holds only while no worker on the ticket has since failed with an
unknown write and no harness write for the ticket is unsettled. The PM read-back and the rerun's
worker are told the interruption is history, not an open item. The interrupted run and its unknown
provider usage stay in history, and its IT investigation closes when the rerun returns a result.
A crash, a time limit, staging QA and every other stage keep their existing handling.

A QA stage on the browser route runs for up to 90 minutes, and the worker is told that limit.
A Jira/Azure repair also runs for up to 90 minutes. Other stages keep their existing limits (45
minutes for Jira/Azure stages, 60 for GitHub delivery stages).

Ellis does not investigate a timed-out run whose saved result the stage accepted: that
investigation resolves from the accepted result.
A stopped-base recovery is settled once its delivery has finished or been cancelled.

Stopped work is counted by the cause the harness itself recorded. It is counted as needing a
decision only when its park reached a person, it is under a hold or it lacks authority. A park
waiting on a release is a prerequisite, a write of unknown outcome is unconfirmed, and a status that
names its own cause (failed, interrupted) keeps it. Work with no recorded cause is shown as exactly
that, never assumed to be a decision (`server/scheduling/stop-cause.ts`).

Ellis's follow-ups close when the work they are about finishes, and only real trouble reaches
Morgan or Joe:

- An investigation of a failed worker is kept as history once the delivery it ran for is
  completed or cancelled, or its Jira/Azure ticket is complete. A Jira/Azure stage worker is
  recorded without a request ID: it is investigated on its own, and a later completed run of the
  same ticket stage settles its read failure.
- An old blocked nightly checkpoint is settled by a later night that completed.
- A blocked Brain nightly checkpoint whose own run did finish is closed by the harness, not by the
  worker's notes: Brain's gate file must show that date published by the run's own session, the
  accepted read-back must cover every call and receipt, and git itself must show each published pull
  request merged into the target branch with no remote branch, local branch or worktree left at its
  head (`server/maintenance/brain/published-cleanup.ts`). The worker's follow-up notes have no
  fixed format and are never parsed.
- A Brain result stops for read-back when it is blocked or reports a write whose outcome is unknown.
  A write refused before it took effect is a known outcome and does not stop a completed run.
- A failed project refresh or assignment read is retried by Ellis; Morgan is told only after
  three failures in a row. The Azure monitor's reads are read-only, so a lingering helper is not
  treated as a possible write.
- Session visibility and service status probes are informational and stay with Ellis. They are
  listed but not counted as follow-ups, and do not by themselves show Ellis as retrying, even while
  such a watch is being retried. Any other recovery in progress, and anything waiting on Morgan or
  Joe, is counted. Probes are
  raised only for services the project uses. A confirmed logout still reaches Joe, and work that
  needs a complete session inventory reports its own block.

A Jira/Azure developer stage (implement or repair) on Claude that is stopped by its time limit
is continued, not restarted or reconstructed: the next run resumes the stopped session's
conversation under its own session ID, in the same worktree, and is told to check what is
committed and finish what remains. The worktree must still be on the ticket's branch and hold
the accepted commit. A stage is continued at most twice, each with a fresh time limit; after
that, or after any other kind of failure, it stops as an interrupted stage. If the ticket was
already recorded as interrupted, the next resume continues the session instead of reconstructing
the stage. Codex stages are not continued this way; a Codex worker's saved completion checkpoint
is used instead.

A stage worker that produces no output for 20 minutes is stopped as stalled, whatever its time
limit; a stalled Claude developer stage is continued like one that reached its limit. A Claude
worker is stopped with an interrupt first, so it ends its turn and records where it stopped; if
it has not exited five seconds later its process group is terminated as before.
What the worker prints in answer to that interrupt is not treated as its own completion of the
assignment. A read-only worker stopped as stalled is retried like one that timed out.

This policy is not a new automatic retry budget. Existing feature, delivery,
maintenance and investigation limits remain authoritative. Special historical
continuations keep their already-bound evidence and approvals; this baseline
neither replays nor retroactively upgrades them. Retiring incomplete history is
an explicit record-bound administrative decision, never proof of success or a
fixed cause.

## Operations, communication, leadership and learning

```mermaid
flowchart TD
    SCH["Shared scheduler and configured cadence"] --> OBS["Provider observations and project maintenance"]
    OBS --> NAT["Native project workflow: identity, scope, budget and publication gates"]
    NAT -->|Failure| EL["Ellis: scoped read-only diagnosis; supported service recovery"]
    EL -->|Only human can resolve| HU["Existing outbox decision / access question"]
    SCH --> CO["Human / team conversation with registered project context"]
    CO --> OWN["Route implementation to Morgan; advice stays advice"]
    SCH --> AV["Avery: scheduled weekday goals review and explicit advice"]
    AV --> GO["Goals, priorities and scoped handoffs to Morgan"]
    EV["Accepted work, blockers and conflicts"] --> CAP["Harper: existing learning opportunity capture"]
    CAP --> RET["Budgeted retrospective / curation and lesson proposals"]
    RET --> DEC["One weekly digest in Questions for you; existing accept / decline / revise and installation policy"]
    DEC --> LES["Relevant active installed lessons and assignment lookups"]
    LES -.-> CO
    LES -.-> NAT
    LES -.-> OWN
    EV --> NOT["Configured merge / goal / direct notices"]
    NOT --> SEND["One durable Slack send; independent message verification"]
    SEND -->|Unknown result| RB["Read back same intent; never resend blindly"]
    EV --> TIME["Confirmed work segments, queue time, usage and cost evidence"]
    TIME --> PUB["Configured guarded publication and read-back"]
```

Harper supplies advisory guidance across roles; exposure is not proof of use or
improvement. Workers cite a lesson when it changed an action and report conflicts.
Feedback/curation is asynchronous and does not gate a completed delivery. External
Brain content stays read-only. A lesson proposal is not an accepted lesson or a
global rule. Repeated mechanical defects belong in code and behavioral tests.

Avery's scheduled review is at 5 PM America/New_York on weekdays. Project
maintenance and learning follow their own configured cadence and budgets; no
chart adds a new scheduled job. Slack notices are configured separately, with
no automatic backfill or resend. Pauses stop new work and retain resources until
termination is confirmed; drains let already-claimed work settle. UI timers do
not rewrite actual time or provider usage. Publication and corrections retain
their existing Effects/read-back rules, including the documented absolute-total
hours exception; that exception is not a general resend policy.

Jira worklogs (CEC time) are published through Effects in `server/time/jira-worklog-effect.ts`.
Each attempt gets a fresh ledger publication and its own Effect
(`jira-worklog:<projectId>:<publication id>`). The publication is saved as prepared and the day
reserved before Effects runs; the identity and worklog reads are its preflight, and the
publication is saved as dispatching before the one TWG add or update. An attempted write whose
outcome is unknown is settled only by read-back, never resent. A verified Effect whose ledger
record was not finished is completed from its saved receipt without calling Jira. `reconcile-time`
queues a day to publish again only when no write can have been dispatched for it: no known
worklog and no attempted publication or Effect. An interruption during the preflight reads now
holds the day until `reconcile-time`, which requeues it with no Jira call unless the day already
has a known worklog, which stays held for a person. Publications saved before this change keep
their original read-back. The GitHub absolute-hours exception above is unchanged.

## Code owners and verification

| Process boundary | Owning source |
|---|---|
| Fair dispatch, lanes and claims | `server/scheduling/scheduler.ts`, `server/scheduling/scheduled-work.ts`, `server/workers/assignment-context.ts` |
| Common worker assignment, provider execution, output and lessons | `server/workers/worker-runtime.ts`, `server/workers/handoff-guidance.ts`, `server/workers/parse-result.ts` |
| Feature research, questions, plan and release | `server/features/workflow.ts`, `server/features/progression/`, `server/features/questions/`, `server/features/release/` |
| Approach and optional gates | `server/delivery/pipeline/approach.ts` |
| CEC / Jira-Azure transitions | `server/cec/ticket-stage-runner.ts`, `server/cec/workflow.ts` |
| GitHub result acceptance, merge and closeout | `server/delivery/pipeline/accept-stage-result.ts`, `server/delivery/harness/`, `server/delivery/readiness/`, `server/delivery/closeout/` |
| Independent QA and coverage | `server/qa/assignment.ts`, `server/qa/criteria.ts`, `server/qa/report-evidence.ts` |
| External actions | `server/store/effects.ts` |
| IT, maintenance and native workflow evidence | `server/it/`, `server/maintenance/` |
| Harper and assignment learning | `server/knowledge/lesson-selection.ts`, `server/knowledge/lesson-exposure.ts`, `server/knowledge/learning-events.ts` |
| Conversations, notifications, time and cost | `server/conversations/`, `server/time/`, `server/telemetry/`, `server/leadership/` |

Behavioral checks must prove that all roles use the shared boundary, a normalized
negative result stays negative without another provider turn, missing or changed
criteria cannot pass, older v1 reports still parse, and current-head evidence is
still required. Existing ownership, Effects and staged-delivery tests retain
their original authority. No diagram or unit fixture establishes live QA success.

## Research references

The architecture decision reuses the installed harness instead of installing a
new framework. The recommendation draws on [Anthropic's composable workflow
guidance](https://www.anthropic.com/research/building-effective-agents),
[A2A's task/input lifecycle](https://a2a-protocol.org/latest/topics/life-of-a-task/),
[JSON Schema's structural constraints](https://json-schema.org/understanding-json-schema/reference/object)
and [AWS's retry/idempotency guidance](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/).
These support the design distinctions; they do not prove improved Office
throughput, a successful recovery or an applied lesson.
