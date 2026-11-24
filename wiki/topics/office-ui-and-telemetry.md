# Office interface and telemetry

The office scene and work drawers share project, employee, and delivery state.
The directory and org chart use a single persona registry. Settings and
operational views have distinct drawer entry points. The PM queue and ticket
drawer surface live stage events from the delivery record.

A global control opens a fresh drawer. Inside it, a topic or record opens on a new page and Back names the parent. The Office frame stays in place while the pages slide. Reduced motion switches pages immediately. Returning restores the originating row and its reading position. A project or floor change starts a fresh path. See the [drawer navigation decision](../journal/2026-11-24-drawer-navigation.md).

Estimated model cost comes from worker accounting. The Office records its
estimates alongside time and publishes board cost through Effects with
provider read-back.

## Evidence

- [Office settings](https://github.com/JFusco/the-office/pull/52), [people directory](https://github.com/JFusco/the-office/pull/64), and [live ticket timelines](https://github.com/JFusco/the-office/pull/550)
- [Cost capture](https://github.com/JFusco/the-office/pull/81), [board publication](https://github.com/JFusco/the-office/pull/83), and [Telemetry drawer](https://github.com/JFusco/the-office/pull/84)
