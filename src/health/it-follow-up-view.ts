import type { ITFollowUp, ITState } from '../shared';

/** Presentation only. A retained investigation never becomes resolved because it is old. */
export function itFollowUpView(it: ITState, followUps: ITFollowUp[]) {
    const investigations = followUps.flatMap(followUp => {
        const entry = it.investigations?.find(item => item.id === followUp.id);
        return entry?.source.failureKind === 'surviving-subprocesses' && entry.status === 'blocked'
            && entry.report?.officeFix?.status === 'blocked' && followUp.owner !== 'You'
            ? [{ followUp, entry }] : [];
    });
    const retained = new Set(investigations.map(item => item.followUp.id));
    return { current: followUps.filter(item => !retained.has(item.id)), investigations };
}

export function sessionVisibilityCopy(followUp: ITFollowUp, projectId?: string) {
    // The plain-language card replaces the settled follow-up, whoever holds it; a retry in progress and a request to Joe show as they are.
    if (followUp.id !== 'session-visibility' || followUp.owner === 'You' || /^(?:Read-only recovery|Recovery intent)/.test(followUp.detail)) return;
    if (projectId === 'brain' || projectId === 'cms-field-vocabulary') return {
        title: 'Optional chat context unavailable',
        explanation: 'Office cannot read current activity from other chats. Delivery uses its own assignments and holds; source checks, reviews and recovery checks still apply.',
        next: 'Ellis keeps checking. Morgan owns any delivery blocker shown in the queue. No login change or merge approval is requested from you.',
    };
    return {
        title: 'Active-session check unavailable',
        explanation: 'Office cannot confirm which other Codex or Claude chats are active. Work that needs a complete check reports its own block.',
        next: 'Ellis keeps checking. No login change or merge approval is requested from you.',
    };
}
