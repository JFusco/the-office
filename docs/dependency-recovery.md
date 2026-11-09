# Dependency delivery recovery

The Office owns Brain and CMS Vocabulary dependency delivery. A merged PR is only
part of delivery: exact merge Actions, issue closure and the existing board card's
Done status must be verified. The PM queue and outbox follow that durable state;
never clear them by deleting records or treating an enabled binding as adoption.

An adopted PR starts without an Office worktree. A blocked Lead assessment that
names scoped source or missing-check findings now enters the ordinary bounded
repair route. The harness verifies the exact same-repository branch/head and fresh
clear session ownership, creates a private clone with native hooks enabled, and
retains the original assessment. Alex repairs or runs the missing mandatory checks;
Sam and Riley independently review and verify before publication. Check-only work
can retain the same commit; a prior blocked Lead verdict still requires a fresh
readiness assessment. A conflict on an adopted PR uses this full route, not the
shortcut reserved for previously reviewed Office candidates.

Before any merge request is sent, changes to the accepted base, issue or
authenticated review inputs queue a fresh read-only Lead assessment. A dispatched
or uncertain merge always requires read-back and is never replayed.

A post-merge Quality failure gets one automatic failed-job retry only when its
exact merge/push/main identity and original attempt are verified, the scanner
installer is the only failed stage, and actual logs show a GitHub HTTP 502, 503 or
504 download error. Original logs and attempt identity remain saved. Completed
retries fall through to normal diagnosis when needed; uncertain submissions are
read back without another POST. Interrupted or blocked recovery can be requeued
using the existing project-scoped `review-pr` command; it does not itself retry CI.
Releases and deterministic failures do not qualify for this operational retry.

Successful closeout removes only a clean, exact delivered-head private repair
clone. Dirty or changed clones remain pending cleanup. Adopted remote branches,
primary checkouts, assessments and failed receipts are preserved.

Harper should derive lessons from the verified delivery's existing retrospective,
including the original restriction, supported recovery route, retained evidence and
proof of closeout. A chat explanation is not a saved lesson. Any proposed AGENTS
change remains subject to the existing reviewed promotion flow. Project pauses,
holds, approval gates and private-repository activation remain separate decisions.
