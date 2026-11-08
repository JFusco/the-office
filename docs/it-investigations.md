# Automatic operational investigations

The deterministic IT tick admits one local investigation per project, original source
identity and failure kind. Sources are uncertain Slack deliveries and failed/interrupted
workers carrying a dispatched `CommandFailure`. Model-written failure prose and task
verdicts do not admit investigations. Diagnosis workers do not investigate their own
failures recursively. Existing uncertain Slack deliveries are discovered on activation;
ordinary historical workers without typed failure records are not backfilled.

The IT scheduler uses its own lane. Original workers must all be terminal, have known
positive process-group IDs, and have no surviving group or active source claim. Pausing
or draining holds new diagnosis. Eligibility is checked again at claim and dispatch.

Each investigation gets at most three read-only attempts, each with a three-minute
model timeout. Failed reads wait 30 seconds and then 120 seconds before their remaining
attempts. The budget is saved before dispatch. After interruption, the provisional
three-minute deadline plus 30 seconds must elapse and diagnosis processes must stop
before another attempt. Exhaustion belongs to Morgan; restarts never refund attempts.

Ellis receives metadata for at most eight original workers, capped 16 KiB session
artifacts (`error.json`, `execution-completion.json`, and Slack-verifier result fields),
and at most eight matching durable effect summaries. The packet reports omitted worker
coverage. Private provider turns, message bodies, arbitrary files and credentials are
not evidence inputs. Results must cite packet references. Missing evidence is a valid
blocked diagnosis. Authentication requires explicit authentication evidence, not a
missing Slack message or an unavailable health probe.

Diagnosis is advisory. Its report and recommendation remain visible to Morgan and do
not authorize sends, write retries, login changes, source edits or a repair deployment.
Original effect and failure records remain unchanged. The source is resolved only by
a confirmed, structurally valid receipt on that exact Slack delivery, or a successful
worker explicitly bound through `originalId` with a saved execution-completion receipt.
A different, newly authorized Slack follow-up does not prove the original send landed.
Lost or reactivated resolution evidence returns the investigation to blocked status.

Live diagnostics project unresolved sources even before the next IT tick and while
paused. A report may be complete while delivery resolution is still blocked. Read-only
IT conversations may report a verified observation of an uncertain effect without
being mistaken for an attempted mutation; uncertain receipts never settle delivery.

Tests inject model runners and use isolated stores; they never send Slack or call a
live model/provider. Implementation and tests live in `server/it/investigations/` and
`tests/unit/it/investigations/`.

## Verified replacement closeout

An explicit operator command, `supersede-slack-delivery`, accepts
`slackSupersession: { originalDeliveryId, replacementDeliveryId, reason }`. The
replacement must already be confirmed, be newer than the uncertain original,
and have the same target type, recipient and workspace. It must be backed by a
human request to Morgan linked to the same ticket (and PR URL for a merge notice).
An unticketed replacement request must explicitly identify the original request
or delivery. A verified message for unrelated work never clears the warning.

The original delivery remains `uncertain`. A local supersession record binds the
project, immutable message fingerprints, context and verified replacement receipt.
That evidence closes the active Slack/outbox and IT follow-ups. History presents
“Superseded by verified follow-up” and a link, never “original delivered.” If the
receipt, recipient, text or context changes, the warnings return without refunding
investigation attempts. Reconciling a stale proof archives its previous record.

For future explicitly authorized replacements, a human `POST /api/messages` can
include `slackReplacement: { originalDeliveryId, reason }`. After the fresh send
is independently confirmed, the harness applies the same policy automatically.
Absent that explicit binding, a new confirmed message alone does not supersede
anything. A rejected closeout never downgrades the new confirmed delivery. Queued
old read-backs complete from a valid replacement receipt without another model
or Slack send. The command only changes local audit/alert state; it never sends,
edits, deletes or retries a Slack message.

## Future subprocess warnings

The worker harness now classifies surviving-subprocess rejection with the typed
`WorkFailure.code = surviving-subprocesses`. This is independent of Slack delivery
state: a confirmed or superseded send still admits one process investigation per
project/worker/warning. Older error prose is not backfilled. Existing delivery
investigations and their receipt-based closeout remain separate.

Ellis waits for process termination and receives the owned, validated lifecycle
artifact plus at most 24 KiB of fixed, hashed source files from the loaded Office
revision. Cross-project source, private transcripts and model-selected files are
excluded. The report must return an Office fix proposal with specific supplied
source references, supporting lifecycle evidence and an isolated regression-test
plan, or an explicit missing-evidence blocker and owner. Unknown or blocked diagnoses
cannot claim a supported fix. Invalid results consume the same three-attempt budget.

The harness saves source and artifact hashes with the accepted report for later review.
Morgan's live IT follow-up shows the proposed changes, tests and evidence, or the
blocker. This is a review handoff; it does not file issues, apply a patch, resend,
merge or deploy. Delivery confirmation and a successful retry do not establish that
the subprocess defect has been fixed. Diagnostic capture failure remains visible as
missing evidence and never changes the worker's execution outcome.
