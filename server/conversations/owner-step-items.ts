import type { OwnerSteps } from '../../src/contracts/owner-steps';
import type { ITFollowUp } from '../../src/shared';

export interface OwnerStepItem { id: string; title: string; detail: string; ownerSteps: OwnerSteps }

/** Splits the owner's follow-ups: each one that carries steps is its own outbox item; the rest stay together. */
export function ownerStepItems(followUps: ITFollowUp[]): { items: OwnerStepItem[]; rest: ITFollowUp[] } {
    const items = followUps.flatMap(f => f.ownerSteps ? [{ id: `only-you:${f.id}`, title: f.title || 'Only you can do this', detail: f.ownerSteps.why, ownerSteps: f.ownerSteps }] : []);
    return { items, rest: followUps.filter(f => !f.ownerSteps) };
}
/** Whether two items carry the same steps; two items with none are the same. */
export function sameOwnerSteps(a?: OwnerSteps, b?: OwnerSteps): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}
