---
topics: [office-ui-and-telemetry]
plans: [2026-11-24-live-ticket-timeline-e55e366158.md]
issue: 'https://github.com/jfusco/the-office/issues/560'
issues: ['https://github.com/jfusco/the-office/issues/560']
---

# Ship the live ticket timeline

The PM queue now shows a ticket's current delivery step, owner when known, and next action. The drawer shows the same progress directly below the ticket title. Both views use project-qualified ticket identity, and the cross-project snapshot carries compact Jira/Azure progress so opening a ticket in another project keeps the queue and drawer in agreement. Provider board status remains separately labeled.

The drawer shows the five most recent recorded events and can expand to earlier activity. It preserves repair and QA retest visits, marks skipped stages, and shows a hollow marker for the next known step. A GitHub checks wait links to the PR, and a merge approval stays beside the timeline.

The queue briefly pulses the changed ticket marker. In the drawer a Motion envelope marks a handoff, a return arrow marks repair, and a check animation marks verified completion. The UI uses the Office's Tailwind tokens and honors both Office and system reduced-motion settings. Reopening a drawer, reconnecting, and receiving the same observation leave the animation still. A disconnected stream shows **Last confirmed** with the observation time.

PR #550 merged at `5b3ba3994bb03623b743d2a1e5b9c0e4361a10df`. The independent recheck verified all 17 repairs. Eleven Chromium fixture checks passed, including the desktop and mobile timeline, reduced motion, cross-project selection, focus and scroll retention, and the drawer's WCAG 2.2 AA audit. Claude Overseer deployed the merge commit, and the Office health endpoint reported the matching release hash.

[Archived plan](../plans/2026-11-24-live-ticket-timeline-e55e366158.md) · [Implementation PR #550](https://github.com/JFusco/the-office/pull/550)
