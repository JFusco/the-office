import { investigationFixture } from '../../it/investigations/fixture';
import type { SlackDelivery, TeamMessage } from '../../../../src/shared';

export function supersessionFixture() {
    const f = investigationFixture();
    const ts = (Date.parse('2026-11-08T02:20:00Z') / 1000).toFixed(6);
    const replacement: SlackDelivery = { ...f.delivery, id: 'replacement', requestId: crypto.randomUUID(), status: 'confirmed', createdAt: '2026-11-08T02:19:00Z', updatedAt: '2026-11-08T02:20:00Z', error: '', text: 'Completion: https://github.com/JFusco/brain/pull/343', channelId: 'D123', messageTs: ts, permalink: `https://fixture.slack.com/archives/D123/p${ts.replace('.', '')}` };
    const human = { id: replacement.requestId, requestId: replacement.requestId, from: 'human', to: 'pm', ticket: 'GH-350', body: 'Send a fresh completion follow-up for notice', status: 'answered', actionId: '', sessionId: '', recheck: false, receipts: [], recipients: [], error: '', createdAt: replacement.createdAt } as TeamMessage;
    f.store.state.tickets.push({ key: 'GH-350', summary: 'Synthetic completed work', type: 'GitHub issue', status: 'closed', statusId: '', assignee: 'JFusco', subtask: false, boardMember: true, url: 'https://github.com/JFusco/brain/issues/350', updated: '', stage: 'complete', activity: 'idle', blocker: '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 343, results: {}, findings: [], evidence: [], pilot: false, observedAt: '' });
    f.store.state.messages.push(human); f.store.state.slackDeliveries!.push(replacement);
    f.store.state.coordination!.notices = { policy: { enabled: true }, entries: [{ id: 'notice', key: 'GH-350', prUrl: 'https://github.com/JFusco/brain/pull/343', mergeCommit: 'a'.repeat(40), status: 'uncertain', detail: 'No receipt', createdAt: f.delivery.createdAt }] } as any;
    const input = { originalDeliveryId: 'delivery', replacementDeliveryId: 'replacement', reason: 'Joe requested a separately verified completion follow-up.' };
    return { ...f, replacement, human, input };
}
