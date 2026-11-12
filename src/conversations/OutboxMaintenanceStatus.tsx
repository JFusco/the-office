import type { OfficeSnapshot } from '../shared';
import { mutedCopy } from '../ui';

/** A human reply is not evidence that an interrupted maintenance run can safely resume. */
export function OutboxMaintenanceStatus({ snapshot, actionId }: { snapshot: OfficeSnapshot; actionId: string }) {
    if (!actionId.startsWith('maintenance:')) return null;
    const run = snapshot.maintenance?.runs.find(item => item.id === actionId.slice('maintenance:'.length));
    if (!run) return null;
    const missingOwnership = run.error.includes('incomplete-live-session-inventory');
    const missingOutput = run.error.includes('missing-persisted-command-output');
    return <div className="grid gap-2" data-outbox-maintenance-status>
        <p className="text-13 font-semibold">{missingOwnership || missingOutput ? 'Waiting on Office and the runtime owner' : 'Morgan needs to reconcile the original run'}</p>
        <p className={mutedCopy}>{missingOwnership ? 'Office cannot account for all active sessions. Approval or another reply cannot establish safe ownership.' : 'The original assignment was interrupted. Its saved results and any attempted changes must be verified before another run.'} {missingOutput ? 'The original command output is also missing; the owner needs to recover that evidence.' : ''}</p>
        {run.readbackRetry?.exhausted ? <p className={mutedCopy}>Automatic read-backs stopped after {run.readbackRetry.attempts} attempts. No additional retry is suggested. The owner needs new evidence before this can move forward.</p> : null}
        <p className={mutedCopy}>You can ask Morgan for clarification below. A reply does not approve a retry or mark maintenance complete; this item stays open until its original evidence is reconciled.</p>
    </div>;
}
