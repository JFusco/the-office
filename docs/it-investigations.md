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
