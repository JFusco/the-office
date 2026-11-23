import type { ITFollowUp } from '../../src/shared';

/**
 * The follow-ups as compared to decide whether a new report is due. The provider's words in an owner's steps
 * can differ from one check to the next (a request id, a time), which is not a change in what is outstanding:
 * they are left out, so a sign-in that stays expired does not publish a report each minute.
 */
export function followUpPicture(followUps: ITFollowUp[]): string {
    return JSON.stringify(followUps.map(f => f.ownerSteps ? { ...f, ownerSteps: { ...f.ownerSteps, why: '' } } : f));
}
