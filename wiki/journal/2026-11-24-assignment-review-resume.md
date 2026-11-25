---
topics: [releases-and-incidents]
plans: [2026-11-24-524-resume-a-stopped-assignment-review-after-a-fix-093b51f84f.md]
---

# Resume a stopped assignment review after a fix

The repair engine can now resume a stopped assignment review through the `review-assignment` route. Before this change the route could be bound with `bind-fix` but was never dispatched, so a review stopped by a fixed cause waited out its 48-hour repair wait and returned to Joe.

The resume is a direct requeue, like `review-pr`. The Office requeues only the review the fix was bound to, and only while it is the latest review for its ticket. Its IT ownership-recovery count and its read-retry record are kept. A spent budget does not refuse it: Joe chose to resume such a review once per fix without replenishing anything, so the record of the resume is what prevents a second one. Admission refuses a superseded review, a key mismatch, a request for the ticket queued or working in either queue, a scheduler claim on the review, and a ticket that a delivery job holds. The requeue, the completed receipt, the lifted wait and the admission event are written in one transaction.

The outcome pass uses the review's own decision only after its scheduler claim ends; a delivery job holding the ticket proves `stage-left` at any time. `stage-left` reads `advanced` once the review is `ready` or delivery holds its ticket. `record-settled` reads `advanced` once the review reaches its own decision: `ready`, `owned` or `held`. A person's recheck or deferral afterwards reads `moved-by-hand`. The operator's `review-assignment` command is unchanged.

Every resume route in the inventory is now dispatched, except `retry-checkpoint` and `reconcile-maintenance`, which stay undispatched by decision.

Evidence: `tests/unit/scheduling/assignment-transition.test.ts`, `tests/unit/incidents/repair/dispatch-assignment-resume.test.ts`, `tests/unit/incidents/repair/review-progress.test.ts`, `tests/unit/incidents/repair/judge-assignment-resume.test.ts` and `tests/unit/incidents/repair/resume-routes.test.ts`.

[Archived plan](../plans/2026-11-24-524-resume-a-stopped-assignment-review-after-a-fix-093b51f84f.md) · [Issue JFusco/the-office#524](https://github.com/JFusco/the-office/issues/524)
