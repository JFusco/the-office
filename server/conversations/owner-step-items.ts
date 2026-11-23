import type { OwnerSteps } from '../../src/contracts/owner-steps';
import type { ITFollowUp } from '../../src/shared';

export interface OwnerStepItem { id: string; title: string; detail: string; ownerSteps: OwnerSteps }

const signIn = (f: ITFollowUp): f is ITFollowUp & { ownerSteps: OwnerSteps } => f.id.startsWith('login:') && !!f.ownerSteps;
/** Splits the owner's follow-ups: each sign-in that carries steps is its own outbox item; every other one stays together. */
export function ownerStepItems(followUps: ITFollowUp[]): { items: OwnerStepItem[]; rest: ITFollowUp[] } {
    const items = followUps.filter(signIn).map(f => ({ id: `only-you:${f.id}`, title: f.title || 'Only you can do this', detail: f.ownerSteps.why, ownerSteps: f.ownerSteps }));
    return { items, rest: followUps.filter(f => !signIn(f)) };
}
/** Whether two items carry the same steps; two items with none are the same. */
export function sameOwnerSteps(a?: OwnerSteps, b?: OwnerSteps): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}
