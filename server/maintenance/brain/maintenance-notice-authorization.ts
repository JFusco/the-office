import type { MergeNotice } from '../../../src/shared';
import type { Store } from '../../store/store';

/** Authorized while the goal DM recipient is unchanged and the run still records verified completed work. */
export function maintenanceNoticeAuthorized(store: Store, notice: MergeNotice) {
    const policy = store.state.coordination?.notices?.policy.goals;
    return notice.kind === 'maintenance' && !!policy?.enabled && policy.version === notice.policyVersion && !!notice.resolved &&
        notice.resolved.targetId === policy.targetId && notice.resolved.workspaceId === policy.workspaceId &&
        !!store.state.maintenance?.runs.some(run => run.id === notice.runId && run.status === 'completed' && run.stage === 'brain-completed');
}

/** A crash before either durable send record exists cannot have sent a message. */
export function maintenanceNoticeNeverDispatched(store: Store, notice: MergeNotice) {
    return notice.kind === 'maintenance' && !store.getEffect(`slack:${notice.id}`) && !store.state.slackDeliveries?.some(delivery => delivery.requestId === notice.id);
}
