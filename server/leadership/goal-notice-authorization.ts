import type { MergeNotice } from '../../src/shared';
import type { Store } from '../store/store';

export function goalNoticeAuthorized(store: Store, notice: MergeNotice) {
    const policy = store.state.coordination?.notices?.policy.goals;
    return notice.kind === 'goal' && policy?.enabled && policy.version === notice.policyVersion && !!notice.resolved &&
        notice.resolved.targetId === policy.targetId && notice.resolved.workspaceId === policy.workspaceId &&
        store.state.goals?.some(goal => goal.id === notice.goalId && goal.projectId === store.project.id && goal.status === 'done');
}

/** A crash before either durable send record exists cannot have sent a message. */
export function goalNoticeNeverDispatched(store: Store, notice: MergeNotice) {
    return notice.kind === 'goal' && !store.getEffect(`slack:${notice.id}`) && !store.state.slackDeliveries?.some(delivery => delivery.requestId === notice.id);
}
