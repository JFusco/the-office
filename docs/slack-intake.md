# Private Slack learning intake

Harper collects through one Office source registry and the existing knowledge lane.
Project evidence stays private to subscribed projects; technical sources retain Brain's
capture, review and publication workflow. Collection is distinct from publication and
accepted employee outcomes. This document describes implementation, not a completed
historical seed or live qualification of the new registry.

## Registry authority and migration

Office → Brain → Sources and each project's Sources screen edit the same registry.
A project can subscribe to multiple channels. A shared channel has one fixed home,
stream, progress ledger and budget owner; subscribers curate their own local lessons.
Pause, resume, remove, unsubscribe, withdraw, cadence and coalesced refresh use that
registry. Removal retains history; unsubscribe revokes the project's next read;
withdrawal excludes retained evidence and dependent guidance from ordinary delivery.

The old Brain `slack-intake/config.json` is one-time migration evidence. It stays
private and unchanged after cutover, and no longer controls collection or scheduling.
Preparing/ready cutover markers fence legacy and registry ownership; existing claims
must settle before cutover. Import preserves windows, source versions, request UUIDs,
hashes and Effects identities. Disabled legacy configuration imports paused sources.
Uncertain captures keep independent reconciliation; source changes never permit replay.

The legacy import format below requires owner-only permissions, no symlink components,
verified workspace/app/channel bindings and registered Brain domains. Its original
seven-channel bound applies to this legacy import, not the number of registered sources.
Never commit real connection identities or configuration.

```json
{
  "enabled": false,
  "workspace": "https://example.slack.com",
  "appId": "CONNECTED_APP_ID",
  "channels": [{ "id": "C123", "name": "example-channel" }],
  "domains": ["tooling"],
  "publicHosts": ["docs.example.com"],
  "tools": {
    "lookup": "slack.slack_search_channels",
    "channel": "slack.slack_read_channel",
    "thread": "slack.slack_read_thread",
    "search": "slack.slack_search_public_and_private",
    "file": "slack.slack_read_file",
    "canvas": "slack.slack_read_canvas"
  }
}
```

Each active Slack authority contains exactly one validated channel and the same six
restricted read tools. Before probes or workers, the harness checks the exact source,
home, task, attempt, channel and current authority digest. Invalid bindings launch no
commands and consume no allowance. Public hosts remain explicitly approved; signed,
credential-bearing, internal and unverified URLs stay unread. A changed source authority
cannot authorize retained tasks or references from another digest.

## Scheduling and progress

The existing scheduler projects `knowledge-slack-intake` at rank 5 in Harper's
knowledge lane. It freezes a seed upper timestamp, enumerates history, queues
threads and referenced files/canvases, and starts catch-up immediately after seed
enumeration. Reads rotate through configured channels so continuing history in one
channel cannot monopolize the seed. Project channels default to daily cadence; the imported technical group keeps Friday at 17:00 America/New_York. Incremental windows include a 48-hour
overlap and timestamp-filtered reply discovery, including replies to older parents.
Resource versions use content hashes; known canvases are re-read weekly. Message
edit/deletion sweeps and whole-site recrawls are not included.

A dedicated private SQLite table records tasks, native observations, source outcomes,
proposals, capture requests and reports. It never enters `store.state`. Immutable
window bounds are durable; native cursors are expiring continuation hints. A failed
continuation restarts its original window, with durable unit/version deduplication.
Discovery completion does not imply every source body or proposal is settled.
Every effective record write changes a ledger revision; report reconciliation and
reconsideration rescan only after it changes, so idle service ticks stay cheap.

One Office-wide counter normally allows eight actual worker launches across source homes, authenticated reads and public follow-ups, independently of delivery retrospectives. New projects and subscriptions add no allowance. The optional private
`seedLaunchesPerDay` setting accepts 8–32 launches during initial seeding (Joe
approved 32 for this rollout). A retained seed-completion receipt automatically
returns the limit to eight. Changing this operational allowance does not change
source authority or reset the already-used daily count. Each read has a 20-minute
limit, one page per launch (below the ten-page ceiling), at most 200 messages, 25 MiB
of returned data and 1 MiB decoded text. File reads are one per launch and limited
to 10 MB. Native rate limits back off the method (inventory and reply search share
the search method). Five failures retain the batch as needs-attention until
explicitly reset; a successful replay of an incomplete window keeps its failure
count. Pause, drain and disable retain progress: an operator cancellation keeps the
cursor and failure allowance. Model-chosen read arguments must exactly match the
harness-prescribed query, so a narrowed search never certifies coverage. Every
returned item may receive an outcome; only still-pending versions require one.

## Restricted CLI and native evidence

The qualified CLI is Codex 0.163.0. It ignores user configuration and exec rules,
uses an empty working directory and read-only sandbox, disables shell/web/plugins,
hooks/memory/delegation, disables other apps and enables only six Slack read tools.
No model can capture directly; the harness owns the single-dispatch Brain effect.

CLI override keys split on literal dots; quoted key segments are not TOML parsing.
Pass the complete tools allowlist as a TOML **value**, for example
`apps.APP.tools={"slack.slack_read_channel"={enabled=true}}`, rather than putting a
quoted dotted tool name into the override path. This corrected a local probe that
incorrectly made Slack appear unavailable. Native channel/thread/search reads with
the corrected restricted profile succeeded on 2026-11-09.

Only native `item.completed` / `mcp_tool_call` events establish observations.
`structured_content` is the CLI event spelling. History, threads, search and lookup
currently return JSON text envelopes with formatted source excerpts and separate
pagination information. The decoder recognizes that observed format, validates
scope/counts/identities, and refuses unknown envelopes or pagination markers.
Formatted source material remains a participant report, not a verified vendor fact.

A live two-page thread probe established that the newest batch arrives first while
replies inside each batch are ascending. A maximum-reply timestamp is therefore
**not** a safe resume boundary. Native cursors drive continuation; their encoded
contents are never decoded or treated as timestamps. End-of-page/end-of-window
comes from the native envelope, never the model's prose.

Canvas Markdown is hashed as the body version. Binary file metadata and expiring
transport URLs do not establish a decoded body read: the source stays inaccessible
with `binary-body-unread`. Unknown attachment formats remain explicit gaps.
Bookmarks and pin inventories are not exposed by this connector. Canvas discovery
uses a channel-scoped files search and therefore cannot certify the full channel-tab inventory;
search-based reply discovery is bounded coverage, not a lossless event feed.

## Public references, capture and reporting

Public follow-ups use the shared isolated retrieval profile, receive approved URLs
only, and never receive Slack bodies, channel IDs or private context. They are queued
only for source versions classified as deferred, the sole consumer of their results. Native web
reads must corroborate returned sources. Read at most 25 links per batch and five
per source, following at most one reference hop; cycles and unsupported URLs remain
recorded. One-hop children are linked to their parent and reach reconsideration
with it. Launched public reads that fail keep a failure count with backoff and become
needs-attention on the fifth failure; cancellations and failures before launch do
not count. Internal references, including Slack message permalinks, need a separately
qualified reader: they are recorded as explicit `internal-reference-not-dereferenced`
gaps, never sent to the public reader. Malformed URL tokens are ignored. Classification
receives unavailable entries for terminal gaps and waits only on pending references;
it runs with apps disabled and no tools.

Coherent lesson proposals include source links, versions, applicability and evidence
limits. Request UUID, exact body hash and domain bind each frozen proposal. The
harness writes through Effects to `capture --stdin --request-id UUID --domain DOMAIN`,
then independently reads `capture receipt --request-id UUID`. A lost response is
reconciled only by receipt read-back; absence does not authorize redispatch. Only the
read-back receipt settles a capture; dispatch output is never compared. Scanner
quarantines and duplicates are recorded without reading quarantined bodies.

Weekly rollups receive an aggregate-only appendix, including quiet weeks and late
completion, without rewriting their narrative. Private reports are generated for
every week retained in the intake ledger, whether or not a narrative rollup exists.
Channel/source details, unresolved items, internal-reference gaps and up to five
non-quarantined examples stay in a private local report:

```sh
pnpm office slack-intake-report intake-YYYY-MM-DD --project brain
pnpm office retry-slack-intake BATCH_ID --project brain
```

The retry command resets only a needs-attention read batch with no active claim or
uncertain capture, or a needs-attention public link (by URL) while no public-link
batch is claimed, and retains prior failure history. It never resends a capture.
Before rollout, finish repository checks and independent review, deploy both sides
through their own delivery rules, validate a bounded real pilot and receipt read-back,
then enable the full private channel configuration. A configured schedule is not
proof of a successful seed or weekly execution.

References: [Codex configuration](https://learn.chatgpt.com/docs/config-file/config-reference),
[Slack MCP](https://docs.slack.dev/ai/slack-mcp-server/),
[Slack CLI API command](https://docs.slack.dev/tools/slack-cli/reference/commands/slack_api/),
and [bookmarks.list](https://docs.slack.dev/reference/methods/bookmarks.list/).

## Historical seed completion

Lessons shows aggregate historical seed progress even without a weekly narrative.
The private intake reports include the same `historicalSeed` result. In-progress
counts are outstanding work, not a percentage or ETA: later pages can discover
more threads, attachments and references.

Completion requires every configured history and its initial inventory, verified
channel identities, completed catch-up channel/search/inventory reads, and no
unfinished read, actionable source outcome or unsettled capture. Queued catch-up
alone is not completion. Needs-attention reads, failed source outcomes and uncertain
capture receipts prevent completion. Explicit unavailable bodies and terminal public
reference gaps remain separate coverage limits. A deferred source becomes such a gap
only once a reconsideration of its current reference evidence (including at least
one unavailable reference) has completed; changed evidence needs another one.
Public-reference reads check the current private allowance when they run, not the
one in effect when they were scheduled. Bookmarks/pins and search-based
discovery prevent a claim of lossless coverage, so the finished label is
**Complete with coverage gaps**.

The first completion records a private receipt bound to the configured authority
and fixed historical windows, plus one aggregate Office `slack-seed-complete` event.
Its timestamp and result survive restart; later weekly work does not reopen the
seed or send another completion event. There is no Slack notification. Before the
first completion, the check conservatively waits for all retained intake work,
including catch-up or weekly work queued while seeding, to settle. A reset or
configuration reconciliation must preserve existing receipts and original evidence.

Slack documents substantially higher provider read rates than this local worker
allowance: [Slack MCP rate limits](https://docs.slack.dev/ai/slack-mcp-server/)
and [cursor-paginated history](https://docs.slack.dev/reference/methods/conversations.history/).
Those documented rates are not a measured throughput guarantee for this connector;
its existing method backoff, page size and restricted reader remain in force.

## Operational status

Brain → Lessons shows deterministic Slack intake activity separately from the
historical seed. Durable claims identify reading, reference reads, assessment,
inbox capture and stopping. The existing scheduler supplies queued work and the
daily-budget wait; recorded retry timestamps supply retry waits. Paused, disabled,
invalid configuration and changed source authority remain explicit. Attention
counts stay visible while other work is active.

Verified capture totals require the exact request, input hash, domain and inbox
identity receipt. Duplicates are included in verified totals and broken out;
quarantined captures are separate. Uncertain or mismatched receipts never count
as success. Completed read/assessment batches, pending work, source-version
counts, current New York-day launch use/limit, available source-read/capture
timestamps and recorded next checks appear as aggregates only. Next checks can
be delayed by worker availability; growing source totals are not an ETA. Earlier
records with no verified timestamp keep it unknown.

Operational metrics are revision-cached. Control changes, claims, retry deadlines
and New York day rollover update independently without reloading source bodies.
The status does not reset source authority, counters, capture Effects or the
latched historical completion receipt. Inbox capture does not publish guidance.

CLI qualification has a bounded 30-second startup allowance per metadata probe;
exact version and feature checks still fail closed. A pre-worker failure retains
the continuation because no reading worker used it. Five failures still exhaust
the same window. Verified partial-page settlement clears the current error while
preserving cumulative failures until complete. The retry count uses the current
retry deadline/error, so older successful checkpoints do not appear as active
failures solely because their cumulative count remains nonzero. Saved failure
receipts and prior work records remain unchanged.

## Acquisition, admission and retained copies

The restricted acquisition/classification worker necessarily sees native source content
before scanning. Secret scanning runs after acquisition and before evidence admission,
curation, ordinary employee briefings, search or digests. Scanner failure or findings
make downstream evidence unavailable; they do not erase the acquisition. Scanning does
not establish confidentiality, factual accuracy or protection from prompt injection.

Each native unit is scanned separately. A version with findings stays private and
is withheld from downstream results; clean units on the same page can settle.
Capture groups that mix clean and withheld units are deferred until clean support
is separated. Generated classifications are scanned separately; findings withhold
that classification without turning its claims into accepted outcomes. Sources
shows value-free counts of these gaps. Scanner unavailability still fails closed.

Withdraw evidence requires confirmation. Withdrawal is final in this version:
the retained source identity cannot resume or be registered again, and its
evidence and dependent guidance remain excluded. Pause and remove retain
historical access. No revalidation operation is available in this version.

Activity's Brain capture reviews paginate all retained capture requests and read
at most four current receipts per page. Brain's inbox `currentStatus` may remain
pending after review: `disposition.as` records accepted, rejected or superseded.
Office validates the original request, candidate, input hash and domain before
displaying that outcome. Accepted rows link to the recorded acceptance PR; exact
note mappings are shown only when recorded, with committed-content inspection.
Older acceptances without mappings remain explicitly unknown. Missing receipts,
quarantine and conflicting identities never imply publication. Candidate bodies
are excluded from this view.

Confirmed Office digests and identified reposts remain inspectable as source
observations, but are excluded from new weekly findings. A frozen review whose
source is later recognized as Office-authored is withheld from ordinary delivery;
its private audit bytes remain intact and a queued Slack send loses authorization.
Enabling optional Slack delivery explicitly authorizes short excerpts from sources
shared with the project to the configured, verified internal channel. The operator
must choose a destination authorized to receive that material.

Technical sources retain their private capture, review and merged-publication gate.
Raw technical observations and capture candidates do not enter ordinary search,
employee briefings, lookups or weekly digests, including for subscribed projects.
The home operator can inspect retained technical evidence and capture lineage.
Only published notes read at a committed revision enter technical delivery.
Project-evidence sources enter scoped delivery after validation and scanning.
Subscriptions never convert a technical source into project evidence or share
another project's derived lessons. Withdrawal excludes dependent guidance immediately and marks its
retained lesson records for source-withdrawn review, including after a restart.

Stopped reservation recovery never treats an uncertain launch as proven unspawned
and never authorizes replay. Once source claims and surviving worker ownership
are absent, the reservation becomes an uncertain debit on its original day. If
recovery crosses midnight, an additional conservative debit covers recovery day
because the actual launch day may be unknown. Later days are not charged forever.
Active or uncertain surviving ownership retains its reservation.

Uploads use generated private paths and bounded text/Markdown, text-PDF and DOCX
extraction. The native Slack reader does not gain attachment download authority from
upload support: missing binary text remains an explicit coverage gap. Evidence retains
identity, immutable version/hash, reader/extractor, scan receipt, provenance and limits.

Current grants and withdrawal rules apply again to retrieval, maps, frozen learning
packets, assignment briefings, recorded lookups, historical details, digests and retained
conversation copies. Previously supplied bytes cannot be recalled; future delivery uses
current permissions. Exact supplied text stays in immutable private `lessons.json`;
exact lookup responses stay in separate private `lookups.jsonl`. Store snapshots carry
reference/hash metadata. Lookup capabilities expire with the active attempt or restart.

Supplied means dispatched briefing; retrieved means a response was durably recorded
before service; verified means an accepted outcome cited exact supplied/retrieved
identities or an existing installed procedure use was confirmed. None alone proves
general application. Morgan gets one frozen scoped internal review per project/week.
That internal handoff gives no implementation, promotion or outbound Slack authority.

## Library, map and team feedback

Brain is an Office view, opened by the Brain toolbar icon on the same URL. Sources,
Library, Map and Activity use Office's existing styles, project selection and commands.
The map opens separately from the room, disposes its renderer when leaving and restores
the room camera. Fixed ID-derived node positions and stored relationships determine the
display; ambient dust and orbit movement have no routing or retrieval authority. The
searchable connection list provides the same selection and detail actions without 3D.

The Library combines permitted project evidence and advisory lessons, approved Office
knowledge, and committed technical notes through supported Brain CLI interfaces. It
never reads the viewer or treats inbox candidates as published guidance. Exact note
revision/hash and evidence versions remain inspectable. Activity separates collection
and private capture status from verified incorporation mappings. Publication read-back
checks at most four original requests and four mapped committed notes; missing lineage
and unknown publication times remain unknown.

Source-backed Harper review and weekly narrative inputs and retained generated outputs
use the same scanner. Accepted employee results retain exact private bytes and source
dependencies. Revocation filters future historical-detail reads, source-derived work,
events, session context and retained run artifacts as well as search and briefings.
Audit records remain retained privately. A failed lookup log or summary save serves no
unrecorded response; original supplied knowledge remains distinct from a lookup-log gap.

Optional outbound weekly digests have separate per-project workspace/channel settings
and are off by default. Enabling applies to future frozen weekly reviews. A destination
or permission change cancels queued sends. Native destination verification, the existing
notification lane and Effects perform one dispatch; uncertain sends use independent
read-back and never replay. Private message bodies are stored separately from ordinary
notice and delivery metadata. Only confirmed native delivery identity marks recollected
messages Office-authored. Known-link reposts also require an exact comparable text hash;
merely linking a digest does not classify an independent discussion as a repost.
Office-authored material is not independent corroboration and direct derived lessons
require review. Accepted task evidence with inherited source dependencies remains
separate from direct source curation.

Sources also accepts approved public HTTPS URLs as project evidence. These use the same
isolated public reader, scheduler, global allowance, scanner and admission path. Each
collection allows one hop and five pages on the exact approved host. Native reads support
the returned claims, but original page bytes are unavailable: versions hash the admitted
normalized claims. Signed, credential-bearing, internal or unsupported URLs stay unread.
Public sources cannot produce technical capture proposals. Uploads are limited to 10 MB,
200 PDF pages, 500,000 text characters/1 MiB extracted text, 30 seconds, a 256 MiB child
heap and a monitored 512 MiB process-tree RSS. Unsupported, encrypted, image-only and
unreadable inputs retain explicit outcomes; there is no OCR or attachment permission gain.

Deferred excerpts without recorded reference locators also receive one bounded
reassessment through the existing scheduler. Any deferral's reassessment can use
admitted versions of the same message (including a later thread read); a
reference-less excerpt can also use an admitted file/canvas whose exact native
resource ID occurs in it. Other channels, unadmitted bodies and incidental
identifier prefixes are excluded. The evidence identity prevents unchanged
reclassification loops; newly admitted context gets a new identity. Where no
locator or related admitted context exists, the prompt records that evidence as
unavailable. Only a completed reassessment whose generated classification was
admitted and still returns a deferral can retain that unavailable evidence as a
coverage gap; a scan-withheld classification leaves the source unresolved. This
never marks the missing body as read, accepts a capture or publishes guidance.
