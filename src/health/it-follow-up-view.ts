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

export function sessionVisibilityCopy(followUp: ITFollowUp) {
    if (followUp.id !== 'session-visibility' || followUp.owner !== 'Morgan') return;
    return {
        title: 'Active-session check unavailable',
        explanation: 'Office cannot confirm which other Codex or Claude chats are active. New development waits for a complete check.',
        next: 'Morgan coordinates repair of the session connection. No login change or merge approval is requested from you.',
    };
}
