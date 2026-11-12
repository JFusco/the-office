# The knowledge loop

Harper (the `knowledge` role) owns what the Office has learned. She reflects on finished and blocked work, curates the set of lessons, and puts the right ones in front of a teammate when they save time. Models decide what a lesson says; the deterministic harness in `server/knowledge/` stores, selects, supplies and retires it. Nothing here grades a lesson or counts how often it "worked".

## Flow

```text
WORK   accepted stage results (delivery, CEC, maintenance, feature readers and plan reviews,
       IT investigations and resolutions, admission), completed, cancelled and parked work,
       exhausted repair budgets, blocked or completed maintenance runs, material changes in a blocker
       follow-up (IT recovery records are excluded), new evidence from a subscribed source
  v
HARPER REFLECTS   events for one subject collect in an open batch; once a retrospective
                  starts, later events form the next batch
  proposes lessons (when / do / check / why) and, for blocked work, may propose an unblock brief
  v
HARPER CURATES    per proposal: add | update | supersede | share (source-only learning: add)
  the harness applies the decision (curate-lesson.ts)
  v
LESSONS           project lessons in each project store; office lessons in the control store,
                  mirrored read-only into every project
  v
EXITS             superseded | graduated | expired | retired by Joe   (project lessons reversible)
  v
HARPER TEACHES    at dispatch, at a block, and on lookup
```

## A lesson

| Field | Meaning |
| --- | --- |
| `when` | The situation, named by stage and what the worker is about to do |
| `statement` | The one action to take |
| `check` | How to tell it worked |
| `detail` | Why, in a sentence |
| `stages`, `paths` | Where it applies; stages filter, paths only rank; never wording |
| `validUntil` | Only for a lesson tied to a ticket, version or temporary condition |
| `tier`, `revision` | `hypothesis`, `guidance`, `procedure` or `rule`; curation, tier and status changes raise the revision, review flags and repository-issue state do not |

A lesson states a rule and a check. It does not narrate an incident, name a teammate or cite a run-specific path.

## Curation

Harper's retrospective result names one action per proposed lesson (`server/knowledge/retrospective-result.ts`). For a retrospective on source evidence alone, every proposal is an add (`accept-retrospective.ts`):

- **add**: a new project lesson.
- **update**: edit an active project lesson in place; new evidence joins the old.
- **supersede**: retire the old lesson and add its replacement in one transaction, so two versions are never both active.
- **share**: the lesson already exists in another project. Nothing is added; an office-wide proposal is filed for Joe.

Office lessons change only through Joe. Harper proposes them (from a `share` or the weekly roll-up); Joe accepts or declines in the Lessons panel, or promotes a reviewed note (`promote-note-lesson.ts`). Outside curation, the harness also adds hand-written project and office seed lessons, approved by Joe, once by ID (`seeded-lessons.ts`, `seeded-office-lessons.ts`).

## Exits

| Exit | Trigger | Code |
| --- | --- | --- |
| Superseded | Harper replaces it | `curate-lesson.ts` |
| Graduated | Its repository issue closed as completed, so the rule now lives in the repository (AGENTS.md, a test or a harness check). Read back once a day | `lesson-exits.ts` |
| Expired | The day after `validUntil` | `lesson-exits.ts` |
| Retired | Joe retires it | `lesson-commands.ts`, `office-lessons.ts` |

There is no age-based retirement and no recurrence review. Joe can reactivate any retired project lesson; a retired office lesson stays retired.

## Teaching

**At dispatch** (`lesson-selection.ts`, `task-briefing.ts`, `workers/worker-runtime.ts`)

- `PROJECT LESSONS`: at most 10 active, non-hypothesis lessons for this stage (stage-specific first, then those matching these paths), within 4,000 characters. Guidance renders `When: … Do: … Check: …` where those fields are present; an installed rule appears only as a reference to its implementation. Precedence is stated in the heading: current source beats a lesson, and a lesson beats a general Brain note.
- `SOURCE EVIDENCE`: bounded excerpts from the Office's sources and from Brain. A Brain note contributes its "What to do" section when it has one.
- The lookup instruction and one `ALSO AVAILABLE BY LOOKUP` line naming what was not supplied. Lessons derived from a private source are never named in that line.

**At a block** (`unblock-brief.ts`, `blocker-followups.ts`)

The retrospective a park, block or exhausted repair budget already triggers may save an unblock brief for that subject: what is known, the decision, the next step. It is kept only when Harper returns one and the packet holds no source-scoped evidence. A block that arrives while an open learning batch exists for the same subject is merged into that batch, which is then marked as blocked and owes the brief (`record-trigger.ts`, `blocking-trigger.ts`). Blocked retrospectives run ahead of routine ones and are neither held by nor counted against the limit of 8 retrospectives per project per day (`scheduled-retrospectives.ts`, `run-retrospective.ts`). It shows on the blocker follow-up and sits immediately after the assignment line when the work resumes. It is cleared once the follow-up confirms resolution.

**On lookup** (`lookup/`)

A worker that is unsure, or about to block, queries `GET /api/knowledge/lookup` with its per-attempt capability. Results are advisory observations, never instructions. A worker cites the reference it used in its evidence; that citation is recorded as plain history.

## External Brain

The Office reads Brain (`brain/reader.ts`, a read-only CLI transport) and never writes to it. The Brain repository is still an ordinary delivery project; that is repository work, not a knowledge write.

## Sources

Link and upload sources are being removed. Nothing can be added or refreshed any more: there is no source command, upload route, scheduled read or Sources screen. Evidence already retained is still read and stays Office-private until the registry and the source-scoping code are removed in the next change. There is no Slack channel intake.

## What Joe decides

Harper's outbox (`knowledge-outbox.ts`) holds three kinds of item, each cleared in the Lessons panel:

- an office-wide lesson to accept or decline;
- a lesson that belongs in its repository, to file as an issue or decline;
- a lesson whose source changed or was withdrawn, to keep, hold as a hypothesis or retire.
