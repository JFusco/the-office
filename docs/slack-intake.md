# Private Slack learning intake

Harper uses the existing Office knowledge lane to collect learning candidates into
Brain's private inbox. Delivery, publication and active guidance remain separate.
The implementation is opt-in: absent or disabled private configuration schedules
nothing. This document is a local implementation record, not proof of a deployed
schedule or completed historical seed.

## Configuration and ownership

Only the Brain project accepts `slack-intake/config.json` under its Office data
root. Require owner-only permissions (`0600`), no symlink path components, and keep
all workspace names, channel IDs, app identifiers and domain mappings private.
Never commit a real configuration. Its shape is:

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

Resolve up to seven exact channel names/IDs and verify native lookup permalinks
against the configured workspace. Domain values must exist in Brain's private
configuration. Public hosts are an explicit list of destinations permitted for
anonymous reading. Do not add internal, signed or credential-bearing URLs.
The workspace is the bare origin (`https://NAME.slack.com`, no trailing slash).
Changing collection scope requires operator reconciliation of retained records;
old tasks with a different configuration digest do not run under new authority.
While any unfinished task, pending capture or channel identity carries another
digest, the scheduler projects a single blocked `intake-config-reconcile` item and
runs no intake work. Restore the matching configuration or reconcile the retained
private records before collection resumes; nothing migrates automatically.

## Scheduling and progress

The existing scheduler projects `knowledge-slack-intake` at rank 5 in Harper's
knowledge lane. It freezes a seed upper timestamp, enumerates history, queues
threads and referenced files/canvases, and starts catch-up immediately after seed
enumeration. Reads rotate through configured channels so continuing history in one
channel cannot monopolize the seed. Friday at 17:00 America/New_York, incremental windows include a 48-hour
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

A day allows eight actual worker launches shared by authenticated reads and public
follow-ups, independently of delivery retrospectives. Each read has a 20-minute
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
