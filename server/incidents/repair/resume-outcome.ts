import type { IncidentSubjectRecord, ResumeOutcomeKind, SubjectFix } from '../../../src/contracts/incidents';
import type { HarnessRequest } from '../../../src/contracts/work';
import type { TicketJob } from '../../../src/shared';
import { boundaryCrossed } from './boundary-crossed';

/** Everything one resume's outcome is read from. Nothing here is a model's word. */
export interface OutcomeEvidence {
    binding: Extract<SubjectFix, { route: unknown }>;
    /** When the ledger says the resume was admitted. */
    admittedAt: string;
    /** When the fix's deployment mark, as it stands, was made. A mark made after the admission means the release was withdrawn in between. */
    deployedAt: string;
    /** The outcome already recorded for this subject and fix. */
    previous?: ResumeOutcomeKind;
    /** When the subject last opened in this incident: from its record, or from the history once the projection has let a cleared record go. */
    record?: Pick<IncidentSubjectRecord, 'openedAt'>;
    /** The resume's request as its project holds it. */
    request?: Pick<HarnessRequest, 'repairResume'>;
    job?: Pick<TicketJob, 'stage' | 'status' | 'steps'>;
    /** An operator's command recorded for the ticket after the admission (see moved-by-hand.ts). */
    moved: { kind: string; at: string } | null;
    /** Where else the job, or the resume's own request, is open: other incidents, each with when it opened there. */
    elsewhere: readonly { incident: string; subject: string; openedAt: string }[];
}

export interface OutcomeReading { outcome: ResumeOutcomeKind; detail: string }

const after = (at: string, than: string) => Date.parse(at) > Date.parse(than);

/**
 * What became of one admitted resume, or null while nothing new can be said. The first that
 * applies:
 *
 * 1. `recurred`: the subject opened again in this incident after the admission and after the
 *    deployment mark: the cause outlived the fix in a release that held it. It replaces whatever
 *    was recorded, and nothing replaces it.
 * 2. An outcome already recorded stands, unless it is `chained`.
 * 3. `untested`: the deployment mark is newer than the admission, so the release that held the
 *    fix stopped serving while the outcome was open, and what happened since says nothing of it.
 * 4. `gone`: the project no longer holds the resume's request.
 * 5. `untested`: the binding does not say how the job stood at the admission.
 * 6. `moved-by-hand`: an operator's command for the ticket followed the admission. Asked before
 *    the boundary and before a missing job: a job a person moved proves nothing about the repair.
 * 7. `untested`: the fix declared no boundary.
 * 8. `advanced`: the boundary is crossed (see boundary-crossed.ts); `untested` when it cannot be judged.
 * 9. `gone`: the job is missing or cancelled.
 * 10. `chained`: the job, or the resume's own request, opened in another incident after the
 *     admission. Recorded once; it gives way to any outcome above.
 *
 * Whichever automatic path crossed the boundary, the resume, IT's next request or a restart, it
 * counts: the boundary is evidence about the fix, not about the request. Pure: the same evidence
 * gives the same reading, and nothing is read here (see judge-resumes.ts for what is read when).
 */
export function resumeOutcome({ binding, admittedAt, deployedAt, previous, record, request, job, moved, elsewhere }: OutcomeEvidence): OutcomeReading | null {
    const say = (outcome: ResumeOutcomeKind, detail: string): OutcomeReading => ({ outcome, detail });
    if (previous === 'recurred') return null;
    if (record && after(record.openedAt, admittedAt) && after(record.openedAt, deployedAt)) return say('recurred', `The subject stopped again for this incident's cause at ${record.openedAt}, after its resume.`);
    if (previous && previous !== 'chained') return null;
    if (after(deployedAt, admittedAt)) return say('untested', 'The release that held the fix stopped serving after the resume was admitted; what happened since says nothing of the fix.');
    if (!request?.repairResume) return say('gone', 'The project no longer holds the request this resume queued.');
    const stood = request.repairResume.stood;
    if (!stood) return say('untested', 'The resume was admitted before outcomes were judged: how the job stood then was not recorded.');
    if (moved) return say('moved-by-hand', `An operator's command (${moved.kind}) moved the job at ${moved.at}, after its resume.`);
    if (binding.disposition === 'undeclared-boundary') return say('untested', `The fix declared no boundary to observe: ${binding.reason}`);
    const crossing = boundaryCrossed(binding.boundary, job, stood);
    if ('unjudged' in crossing) return say('untested', crossing.unjudged);
    if (crossing.crossed) return say('advanced', crossing.detail);
    if (!job || job.status === 'cancelled') return say('gone', job ? 'The job was cancelled before the boundary was crossed.' : 'The project no longer holds the job.');
    if (previous === 'chained') return null;
    const link = elsewhere.find(other => after(other.openedAt, admittedAt));
    return link ? say('chained', `${link.subject} stopped for another cause after the resume (${link.incident}).`) : null;
}
