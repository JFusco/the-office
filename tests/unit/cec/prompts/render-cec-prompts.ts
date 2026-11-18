import { homedir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { DATA } from '../../../../server/office/config';
import { cecPrompt } from '../../../../server/cec/prompts/cec';
import { cecIntakePrompt, cecReadbackPrompt, cecTransitionPrompt, cecReconcilePrompt } from '../../../../server/cec/prompts/cec-reads';
import { itChatPrompt, ctoChatPrompt, cecChatPrompt } from '../../../../server/conversations/prompts/conversations';
import { slackSendPrompt, slackVerifyPrompt } from '../../../../server/conversations/prompts/slack';
import { STAGES, type SlackDelivery, type TeamMessage } from '../../../../src/shared';
import { ticket } from '../parking/fixtures';

const ARTIFACT_ROOT = '/office-golden/artifacts';
const NOW = Date.parse('2026-11-01T12:00:00Z');

/** Machine- and run-specific paths replaced so the rendering is stable on any checkout. */
function normalized(text: string, dataRoot: string): string {
    return text.split(dataRoot).join('<STORE_DATA>').split(DATA).join('<DATA>').split(homedir()).join('<HOME>');
}

const message: TeamMessage = {
    id: 'message-1', requestId: 'request-1', from: 'human', to: 'pm', ticket: 'CEC-900', actionId: '', body: 'What is next for this ticket?',
    status: 'queued', createdAt: '2026-11-01T11:59:00Z', sessionId: '', recheck: false, error: '', recipients: [], receipts: [],
};
const delivery: SlackDelivery = {
    id: 'delivery-1', requestId: 'request-1', targetType: 'person', targetId: 'U123', targetName: 'Joe', workspaceId: 'T123', text: 'Hello',
    status: 'sending', channelId: '', messageTs: '', permalink: '', sessionId: 'session-1', createdAt: '2026-11-01T11:59:00Z', updatedAt: '2026-11-01T11:59:00Z', error: '',
};

/** Every prompt the cec project renders from its binding, keyed by builder and input, for the golden comparison. */
export function renderCecPrompts(): Record<string, string> {
    const dataRoot = join(DATA, 'golden-store');
    const store = new Store(':memory:', projectById('cec'), dataRoot, { now: () => new Date(NOW), monotonic: () => NOW });
    try {
        const fixture = ticket();
        store.state.tickets.push(fixture);
        const out: Record<string, string> = {};
        for (const stage of STAGES) out[`cecPrompt:${stage}`] = cecPrompt(store, { ...fixture, stage }, stage, 'developer', ARTIFACT_ROOT);
        out['cecPrompt:enhance:featureBinding'] = cecPrompt(store, { ...fixture, stage: 'enhance', featureBinding: { featureId: 'f-1', itemId: 'i-1', approvalId: 'a-1', approvalDigest: 'd-1' } }, 'enhance', 'pm', ARTIFACT_ROOT);
        out.cecIntakePrompt = cecIntakePrompt(store);
        out.cecReadbackPrompt = cecReadbackPrompt(store, 'CEC-900');
        out.cecTransitionPrompt = cecTransitionPrompt(store, fixture, 'QA');
        out.cecReconcilePrompt = cecReconcilePrompt(store, fixture);
        out.itChatPrompt = itChatPrompt(store, { ...message, to: 'it' }, 'Morgan brief');
        out.ctoChatPrompt = ctoChatPrompt(store, { ...message, to: 'cto' }, { projects: [] }, 'Morgan brief');
        out.cecChatPrompt = cecChatPrompt(store, 'pm', message, '', fixture, [message]);
        out['cecChatPrompt:brief'] = cecChatPrompt(store, 'developer', message, 'Morgan brief', null, []);
        const pickup = store.state.coordination;
        store.state.coordination = undefined;
        out['cecChatPrompt:noPickup'] = cecChatPrompt(store, 'pm', message, '', fixture, [message]);
        store.state.coordination = pickup;
        out.slackSendPrompt = slackSendPrompt(store, delivery, message);
        out.slackVerifyPrompt = slackVerifyPrompt(store, delivery);
        return Object.fromEntries(Object.entries(out).map(([key, text]) => [key, normalized(text, dataRoot)]));
    } finally { store.close(); }
}
