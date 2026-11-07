import type { MergeNotice } from '../../../src/shared';
import type { Store } from '../../store/store';
import type { Agents } from '../../workers/agents';
import { Effects } from '../../store/effects';
import { SlackMessages } from '../../conversations/slack';
import { maintenanceNoticeAuthorized } from './maintenance-notice-authorization';

export async function sendMaintenanceNotice(store: Store, agents: Agents, notice: MergeNotice) {
    if (notice.kind !== 'maintenance' || notice.status !== 'queued' || store.state.paused || store.state.draining) return;
    if (!maintenanceNoticeAuthorized(store, notice)) {
        notice.status = 'cancelled'; notice.detail = 'Maintenance record or notification settings changed before sending.'; store.save(); return;
    }
    notice.status = 'working'; store.save();
    const request = { targetType: 'person' as const, targetId: notice.resolved!.targetId, targetName: notice.resolved!.targetName, workspaceId: notice.resolved!.workspaceId, text: notice.text };
    try {
        const delivery = await new Effects(store).execute({
            id: `slack:${notice.id}`, work: { projectId: store.project.id, kind: 'notice', id: notice.id }, attemptId: notice.id,
            operation: 'maintenance-completion-slack', target: request.targetId, authorization: notice.policyVersion,
            payload: request, expectedState: { runId: notice.runId },
            preflight: async () => { if (!maintenanceNoticeAuthorized(store, notice)) throw new Error('Maintenance completion authorization changed'); },
            dispatch: payload => new SlackMessages(store, agents).sendMaintenanceNotification(notice.id, payload),
            verify: async receipt => receipt.status === 'confirmed' && !!receipt.permalink && store.state.slackDeliveries?.some(saved => saved.id === receipt.id && saved.status === 'confirmed') === true,
        });
        notice.status = 'sent'; notice.detail = delivery.permalink;
    } catch (error) {
        notice.status = store.getEffect(`slack:${notice.id}`)?.status === 'uncertain' ? 'uncertain' : 'blocked'; notice.detail = String(error);
    } finally { store.save(); }
}
