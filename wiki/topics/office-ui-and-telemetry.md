# Office interface and telemetry

The office scene and work drawers share project, employee, and delivery state.
The directory and org chart use a single persona registry. Settings and
operational views have distinct drawer entry points.

A global control opens a fresh drawer. Inside it, a topic or record opens on a new page and Back names the parent. The Office frame stays in place while the pages slide. Reduced motion switches pages immediately. Returning restores the originating row and its reading position. A project or floor change starts a fresh path. See the [drawer navigation decision](../journal/2026-11-24-drawer-navigation.md).

Estimated model cost comes from worker accounting. The Office records its
estimates alongside time and publishes board cost through Effects with
provider read-back.

## Live ticket timeline

The PM queue and ticket drawer share a progress summary for GitHub and Jira/Azure.
The queue shows the current step, owner when known, and next action. Keep provider
board status separately labeled so the team can distinguish the delivery step
from the provider's lane. Qualify ticket identity with the project so progress
stays attached to the right ticket when the user switches projects.

Build the history from recorded events and outcomes. Preserve earlier visits to
QA and repair, show skipped stages explicitly, and keep the existing merge
approval control by the current status. The drawer shows the five newest
events and expands to the available history. Older tickets show the records
they have.

Animate a newly observed handoff once per live observation, with a brief pulse
in the queue and a Motion envelope in the drawer. Both motion preferences
retain the labels and symbols with instant updates. Use **Last confirmed**
and the observation time when the stream disconnects.

[Executed plan](../plans/2026-11-24-live-ticket-timeline-e55e366158.md) · [Delivery journal](../journal/2026-11-24-live-ticket-timeline.md) · [PR #550](https://github.com/JFusco/the-office/pull/550)

## Evidence

- [Office settings](https://github.com/JFusco/the-office/pull/52), [people directory](https://github.com/JFusco/the-office/pull/64), and [live ticket timelines](https://github.com/JFusco/the-office/pull/550)
- [Cost capture](https://github.com/JFusco/the-office/pull/81), [board publication](https://github.com/JFusco/the-office/pull/83), and [Telemetry drawer](https://github.com/JFusco/the-office/pull/84)
