import { supersedingDelivery } from '../conversations/slack/supersession-proof';
import type { OfficeSnapshot, ServiceHealth } from '../../src/shared';

/** Delivery receipts are passive evidence, never an invented authentication probe. */
export function slackHealth(snapshots: OfficeSnapshot[], now = Date.now()): ServiceHealth {
    const deliveries = snapshots.flatMap(s => (s.slackDeliveries || []).filter(delivery => !supersedingDelivery(s, delivery))).filter(d => Number.isFinite(Date.parse(d.updatedAt)) && Date.parse(d.updatedAt) <= now).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    const confirmed = deliveries.find(d => d.status === 'confirmed');
    const pending = deliveries.find(d => d.status !== 'confirmed' && (!confirmed || Date.parse(d.updatedAt) >= Date.parse(confirmed.updatedAt)));
    const recent = !!confirmed && now - Date.parse(confirmed.updatedAt) < 86400000;
    return {
        id: 'slack', name: 'Slack · connected app', kind: 'activity',
        status: pending?.status === 'uncertain' ? 'warning' : !pending && recent ? 'connected' : 'unknown',
        statusLabel: pending ? pending.status === 'uncertain' ? 'Delivery needs readback' : 'Delivery in progress' : recent ? 'Delivery verified' : confirmed ? 'Previously working' : 'No delivery evidence',
        detail: pending ? 'The latest message has not been confirmed by readback. This does not establish a Slack login failure.' : confirmed ? `${recent ? 'Within the last 24 hours, a' : 'The last recorded'} message was confirmed by reading it back through the worker’s Slack app. This records working access at that time; no separate login probe is available.` : 'No confirmed Slack delivery is recorded. Access is checked when the worker uses the connected app.',
        checkedAt: confirmed?.updatedAt || '', checkedLabel: 'Last confirmed delivery',
        expiresAt: !pending && recent ? new Date(Date.parse(confirmed!.updatedAt) + 86400000).toISOString() : undefined,
        nextStep: pending?.status === 'uncertain' ? 'Morgan reads back the existing message; it must not be resent.' : undefined,
    };
}
