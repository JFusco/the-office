---
status: "implemented"
executed: true
evidence: ["tests/browser/drawers.spec.ts"]
source_tool: "codex"
source: "Office drawer navigation, issue 551"
topics: ["office-ui-and-telemetry"]
digest: "7f263c6ae4a7983e4f75b30d603bdaeab00b736d9e2a7186dab243785478b88c"
---

# Drill-down navigation for Office drawers

Keep the drawer open and give each mixed-topic panel a short overview. The overview answers what’s happening, does anything need me, and where can I go? A teammate’s current assignment, a ticket blocker, or a decision awaiting approval belongs on that first screen. Conversations, configuration, evidence, and history each get their own page inside the drawer.

Use a labeled Back button as the breadcrumb. One level deeper, the header reads ‹ Lessons with Active lessons as the title. This fits a narrow drawer and tells you exactly where Back goes. The close button stays in the same place at every depth.

Forward brings the new page in from the right edge while the previous page shifts left by about 20% of the drawer width. Back reverses that movement. Both pages move together for 280 ms with the Office’s existing ease-out curve [0.22, 1, 0.36, 1]. The drawer frame, header controls, and Office scene stay still.
Each page owns its scroll position. Forward opens a topic at the top. Back restores the previous scroll position and focuses the exact row that opened the topic. A live Office update preserves the page, draft, and reading position.
Close and Escape dismiss the whole drawer from any depth. Opening Chat from the dock still lands directly in Chat. Opening a conversation from a ticket gives it a Back button labeled with that ticket’s key.
Honor both the Office and system reduced-motion settings with an immediate page change. Move keyboard focus to the incoming heading and make the outgoing page inert as soon as navigation begins.

Teammate desks: person, current work, assignment, anything needing attention; conversation, recent activity, responsibilities, and role-specific pages such as lessons, service health, or time.
Tickets: ticket key, summary, stage, blocker, next action; approach and decisions, delivery history, QA and evidence, candidate or PR, time, discussion.
Settings: Office settings and the named project; Office preferences, read-only configuration, and project settings grouped by pickup, delivery, notifications, and time.
Mailbox, PM queue, Outbox: pending work, stopped items, or decisions needing a reply; queue or status group, then ticket or outbox item. Mailbox also links to checkpoints and project settings.
GitHub and Azure operations: current failures, data freshness, refresh action; pipelines and runs, pull requests, and provider-specific pages for board, maintenance, deployments, or environments.
Service health: overall health, degraded services, outstanding follow-ups; connections, application readiness, IT investigations and follow-ups.
Goals and features: current goal or feature, phase, and next decision; goal editing and history, CTO reviews and reports, or feature conversation, documents, and delivery. Keep the desktop feature conversation and document side by side where they support the same task.
Telemetry: active scope, date range, headline totals; project and ticket breakdowns, model and effort, stage and role, daily history, and sync status.
Keep existing peer views in People and Office Brain. A directory, a single chat thread, or a review timeline can open directly. Add a level when the user is choosing a distinct topic or opening a record.

Add a shared client-side navigation stack inside the inspector. Global controls open a drawer root. Same-project links inside the drawer push a page. Back pops it. A project or floor change starts fresh. Keep the outer drawer animation for opening, closing, and switching from a global control.
Use the existing Motion dependency and motion tokens. Let each domain own its overview and pages, with the shared shell responsible for the header, transitions, scroll, and focus. Reuse current forms, actions, and data contracts.
Verify a complete path on desktop and phone: Mailbox → ticket → evidence → Back → Back. The drawer must stay open throughout, the Office canvas must stay still, and each Back must restore the originating row. Also test chat drafts, settings edits, live updates, rapid navigation, reduced motion, keyboard operation, and direct entry from shortcuts and notifications.

use TW tokens, watch for spacing issues and make each panel clean. no AI jargon and no data that the end user doesn't care about.
