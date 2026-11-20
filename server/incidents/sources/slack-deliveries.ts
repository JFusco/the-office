import { supersedingDelivery } from '../../conversations/slack/supersession-proof';
import { boundedEvidence } from '../bounded-evidence';
import { normalizeCause } from '../normalize-cause';
import type { IncidentCollector } from '../observation';

/**
 * Slack messages whose delivery could not be confirmed and that no later confirmed delivery
 * replaced. They are read back, never sent again, so each is an expected wait until it stands too
 * long. The subject is the request the message answered, which is also how its conversation or
 * notice names it.
 */
export const slackDeliveries: IncidentCollector = ({ projectId, state }) => (state.slackDeliveries ?? [])
    .filter(delivery => delivery.status === 'uncertain' && !supersedingDelivery(state, delivery))
    .map(delivery => ({
        subject: { projectId, kind: 'slack-delivery', id: delivery.requestId, episode: delivery.createdAt, stage: delivery.targetType, stop: null, lastWorker: '', head: '', unsettledEffect: true },
        cause: { source: 'slack-delivery' as const, provider: 'slack', stage: delivery.targetType, kind: 'uncertain', text: normalizeCause(delivery.error), author: 'harness' as const },
        expected: 'uncertain-effect' as const,
        evidence: boundedEvidence(delivery.error),
    }));
