import type { SlackIntakeStatus as Status } from '../contracts/knowledge';
const labels: Record<Status['activity'], string> = {
    reading: 'Reading Slack', classifying: 'Assessing captured source material', 'reading-references': 'Reading references', capturing: 'Saving to Brain inbox', working: 'Intake work running', stopping: 'Stopping', queued: 'Queued for a worker',
    'waiting-budget': 'Daily budget reached', 'waiting-retry': 'Waiting to retry', waiting: 'Waiting for intake work', 'caught-up': 'Caught up', paused: 'Paused', disabled: 'Disabled', 'needs-attention': 'Needs attention',
};
const format = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
const time = (at: string) => <time dateTime={at}>{format.format(new Date(at))}</time>;
/** Public status contains aggregates and timestamps only. Receipt uncertainty never becomes a success label. */
export function SlackIntakeStatus({ status }: { status?: Status }) {
    if (!status) return null;
    return <div className="mt-3 text-11 leading-relaxed" data-slack-intake-status>
        <p className="font-semibold">Slack intake · {labels[status.activity]}</p>
        {status.activeSince ? <p>Current work started {time(status.activeSince)}.{!status.enabled || status.paused || status.draining ? ' Intake is disabled, paused or draining; active work has not yet finished.' : ''}</p> : null}
        {status.configuration !== 'valid' ? <p>{status.configuration === 'missing' ? 'Slack intake is not configured.' : 'Intake configuration needs attention. Retained work has not been reset.'}</p> : null}
        <p>{status.verifiedCaptures} verified inbox captures ({status.duplicates} duplicates). {status.quarantines} quarantined.</p>
        <p>{status.completedReads} read or assessment batches completed; {status.pendingReads} remain. {status.pendingCaptures} captures await verification.</p>
        <p>{status.observedSources} source versions discovered; {status.unresolvedSources} await resolution. Totals can grow as more history is read.</p>
        {status.needsAttention || status.retryingReads ? <p>{status.failedReads} failed read batches need attention; {status.retryingReads} read batches are retrying. {status.uncertainCaptures} captures need receipt reconciliation; {status.sourceErrors} source errors. Unverified captures are excluded from success totals.</p> : null}
        <p>{status.launches}/{status.dailyLimit} worker launches used on {status.day} (New York).</p>
        {status.nextAttemptAt ? <p>Next recorded check {time(status.nextAttemptAt)}. Scheduling and worker availability can delay it.</p> : null}
        {status.lastCaptureAt ? <p>Last verified capture {time(status.lastCaptureAt)}.</p> : null}
        {status.lastReadAt ? <p>Last source read {time(status.lastReadAt)}.</p> : null}
        <p>Status changed {time(status.changedAt)}. Inbox capture does not publish guidance.</p>
    </div>;
}
