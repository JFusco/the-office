# The knowledge loop

Harper (the `knowledge` role) owns what the Office has learned. She reflects on finished and blocked work, curates the set of lessons, and puts the right ones in front of a teammate when they save time. Models decide what a lesson says; the deterministic harness in `server/knowledge/` stores, selects, supplies and retires it. Nothing here grades a lesson or counts how often it "worked".

## Flow

```text
WORK   completed, cancelled and parked jobs, exhausted repair budgets, maintenance runs,
       resolved blockers (IT recovery records are excluded)
  v
HARPER REFLECTS   one retrospective per subject
  proposes lessons (when / do / check / why) and, for blocked work, an unblock brief
  v
HARPER CURATES    per proposal: add | update | supersede | share
  the harness applies the decision (curate-lesson.ts); nothing else changes the set
  v
LESSONS           project lessons in each project store; office lessons in the control store,
                  mirrored read-only into every project
  v
EXITS             superseded | graduated | expired | retired by Joe      (all reversible)
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
| `stages`, `paths` | Where it applies; selection matches on these, never on wording |
| `validUntil` | Only for a lesson tied to a ticket, version or temporary condition |
| `tier`, `revision` | `hypothesis`, `guidance`, `procedure` or `rule`; every edit raises the revision |

A lesson states a rule and a check. It does not narrate an incident, name a teammate or cite a run-specific path.

## Curation

Harper's retrospective result names one action per proposed lesson (`server/knowledge/retrospective-result.ts`):

- **add**: a new project lesson.
- **update**: edit an active project lesson in place; new evidence joins the old.
- **supersede**: retire the old lesson and add its replacement in one transaction, so two versions are never both active.
- **share**: the lesson already exists in another project. Nothing is added; an office-wide proposal is filed for Joe.

Office lessons change only through Joe. Harper proposes them (from a `share` or the weekly roll-up); Joe accepts or declines in the Lessons panel.

## Exits

| Exit | Trigger | Code |
| --- | --- | --- |
| Superseded | Harper replaces it | `curate-lesson.ts` |
| Graduated | Its repository issue closed as completed, so the rule now lives in the repository (AGENTS.md, a test or a harness check). Read back once a day | `lesson-exits.ts` |
| Expired | The day after `validUntil` | `lesson-exits.ts` |
| Retired | Joe retires it | `lesson-commands.ts` |

There is no age-based retirement and no recurrence review. Joe can reactivate any retired lesson.

## Teaching

**At dispatch** (`lesson-selection.ts`, `task-briefing.ts`, `workers/worker-runtime.ts`)

- `PROJECT LESSONS`: at most 10 active lessons for this stage and these paths, within 4,000 characters, rendered `When: … Do: … Check: …`. Precedence is stated in the heading: current source beats a lesson, and a lesson beats a general Brain note.
- `SOURCE EVIDENCE`: bounded excerpts from the Office's sources and from Brain. A Brain note contributes its "What to do" section when it has one.
- The lookup instruction and one `ALSO AVAILABLE BY LOOKUP` line naming what was not supplied. Lessons derived from a private source are never named in that line.

**At a block** (`unblock-brief.ts`, `blocker-followups.ts`)

The retrospective a park or block already triggers also writes an unblock brief for that subject: what is known, the decision, the next step. It shows on the blocker follow-up and is the first thing in the prompt when the work resumes. It is cleared when the blocker resolves.

**On lookup** (`lookup/`)

A worker that is unsure, or about to block, queries `GET /api/knowledge/lookup` with its per-attempt capability. Results are advisory observations, never instructions. A worker cites the reference it used in its evidence; that citation is recorded as plain history.

## External Brain

The Office reads Brain (`brain/reader.ts`, a read-only CLI transport) and never writes to it. Technology facts worth keeping are captured into Brain by a person with the `brain-capture` skill. The Brain repository is still an ordinary delivery project; that is repository work, not a knowledge write.

## Sources

Two kinds: a public **link** (read on a daily, weekly or manual cadence) and an uploaded **artifact**. A new source is shared with every configured project; a project can unsubscribe itself. Evidence is Office-private. Withdrawing a source marks the lessons that depend on it for Joe's review. There is no Slack channel intake.

## What Joe decides

Harper's outbox (`knowledge-outbox.ts`) holds three kinds of item, each cleared in the Lessons panel:

- an office-wide lesson to accept or decline;
- a lesson that belongs in its repository, to file as an issue or decline;
- a lesson whose source changed or was withdrawn, to keep, hold as a hypothesis or retire.
