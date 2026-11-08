import { z } from 'zod';
import { replacementContext, slackFingerprint, supersedingDelivery } from './supersession-proof';
import { syncInvestigations } from '../../it/investigations/ledger';
import { syncOutbox } from '../outbox';
import { sanitize } from '../../office/security';
import type { Store } from '../../store/store';

const Input = z.object({ originalDeliveryId: z.string().min(1).max(200), replacementDeliveryId: z.string().min(1).max(200), reason: z.string().trim().min(1).max(1000) }).strict();

/** Explicit operator authority or an explicitly bound human follow-up closes local alerts, never a send. */
export function supersedeSlackDelivery(store: Store, input: unknown) {
    const request = Input.parse(input);
    return store.transaction(() => {
        const originals = store.state.slackDeliveries?.filter(delivery => delivery.id === request.originalDeliveryId) || [];
        const replacements = store.state.slackDeliveries?.filter(delivery => delivery.id === request.replacementDeliveryId) || [];
        if (originals.length !== 1 || replacements.length !== 1) throw new Error('Exact original and replacement deliveries required in this project');
        const [original] = originals, [replacement] = replacements;
        if (original.supersededBy) {
            if (supersedingDelivery(store.state, original)?.id === replacement.id) return original.supersededBy;
            if (supersedingDelivery(store.state, original)) throw new Error('Original warning is already superseded by a verified replacement');
        }
        const context = replacementContext(store.state, original, replacement);
        if (Number(replacement.messageTs) * 1000 > store.clock.now().getTime() + 5000 || Date.parse(replacement.createdAt) > store.clock.now().getTime()) throw new Error('Replacement receipt is in the future');
        if (!context) throw new Error('Replacement must be a newer confirmed message for the same recipient, workspace and explicitly linked work');
        if (original.supersededBy) (original.supersessionHistory ??= []).push(original.supersededBy);
        original.supersededBy = { projectId: store.project.id, replacementDeliveryId: replacement.id, originalFingerprint: slackFingerprint(original), replacementFingerprint: slackFingerprint(replacement), contextFingerprint: context, reason: sanitize(request.reason), at: store.clock.now().toISOString() };
        syncInvestigations(store); syncOutbox(store.state);
        store.emit('slack-delivery-superseded', 'Earlier Slack warning closed by a verified replacement. Original send outcome and failure history retained.', 'pm');
        return original.supersededBy;
    });
}
