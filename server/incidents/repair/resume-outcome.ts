import type { ResumeOutcomeKind, SubjectFix } from '../../../src/contracts/incidents';
import type { HarnessRequest } from '../../../src/contracts/work';
import { boundaryCrossed, type Crossing, type Progress } from './boundary-crossed';
import { stopDatedBefore } from './stop-dated-before';

/** Everything one resume's outcome is read from. Nothing here is a model's word. */
export interface OutcomeEvidence {
    binding: Extract<SubjectFix, { route: unknown }>;
    /** When the ledger says the resume was admitted. */
    admittedAt: string;
    /** When the current deployment mark was made. */
    deployedAt: string;
    /** Whether a replacement mark followed admission by ledger order or saved admission time. */
    replacementMarkAfterAdmission: boolean;
    /** The outcome already recorded for this subject and fix. */
    previous?: ResumeOutcomeKind;
    /**
     * The subject's latest opening in this incident that the ledger recorded after the deployment
     * mark that stands, by its own order of writing (see IncidentLedger.openedAfter): when, and
     * the project's own date for that stop where the projection still holds the subject. Null
     * when it has not opened since. A resume is admitted only for a subject that still stood as
     * the fix bound it, so an opening after the mark is after the admission too, unless the mark
     * was made again later.
     */
    reopened: { at: string; stoppedAt: string | null } | null;
    /** The resume's request as its project holds it. */
    request?: Pick<HarnessRequest, 'repairResume'>;
    /** The job as its project holds it, or the ticket seen the same way (see ticket-progress.ts). */
    job?: Progress;
    /**
     * For a checkpoint, in place of `job`: whether its project still holds it, and the crossing read
     * from its original run (see checkpoint-progress.ts). A checkpoint has no steps of its own.
     */
    record?: { exists: boolean; crossing: Crossing };
    /** What the subject is called in the words recorded; the rules are the same for each. A job when not given. */
    noun?: 'job' | 'ticket' | 'checkpoint';
    /** An operator's command recorded for the ticket after the admission, or a retry queued for a checkpoint's original run (see moved-by-hand.ts). */
    moved: { kind: string; at: string } | null;
    /** Where else the job, or the resume's own request, is open: other incidents, each with when it opened there. */
    elsewhere: readonly { incident: string; subject: string; openedAt: string }[];
    /** When the quiet began, if nothing has moved for the resume for 24 hours and no wait explains it (see stalled-resume.ts); null otherwise. */
    stalled: string | null;
}

export interface OutcomeReading { outcome: ResumeOutcomeKind; detail: string }

const after = (at: string, than: string) => Date.parse(at) > Date.parse(than);

/**
 * What became of one admitted resume, or null while nothing new can be said. The first that
 * applies:
 *
 * 1. `recurred`: the ledger recorded the subject opening again in this incident after the
 *    deployment mark, and the project did not date that stop at or before the mark: the cause
 *    stopped the work anew with the fix deployed. It replaces whatever was recorded, and nothing
 *    replaces it.
 * 2. An outcome already recorded stands, unless it is `chained` or `stalled`.
 * 3. `untested`: a replacement deployment mark followed the admission by append order or by the saved
 *    admission time. The release that held the fix stopped serving while the outcome was open.
 * 4. `gone`: the project no longer holds the resume's request.
 * 5. `untested`: the binding does not say how the job stood at the admission.
 * 6. `moved-by-hand`: an operator's command for the ticket followed the admission; for a
 *    checkpoint, a retry was queued for its original run, by whoever queued it. Asked before the
 *    boundary and before a missing job: a job a person moved proves nothing about the repair.
 * 7. `untested`: the fix declared no boundary.
 * 8. `advanced`: the boundary is crossed (see boundary-crossed.ts, and checkpoint-progress.ts for a
 *    checkpoint); `untested` when it cannot be judged.
 * 9. `gone`: the job is missing or cancelled; a checkpoint, missing.
 * 10. `stalled`: nothing has moved for 24 hours and no wait explains it. Recorded once; it
 *     replaces `chained` and gives way to any outcome above.
 * 11. `chained`: the job, or the resume's own request, opened in another incident after the
 *     admission. Recorded once; it gives way to any outcome above, and is not said of a resume
 *     already called stalled.
 *
 * Whichever automatic path crossed the boundary, the resume, IT's next request or a restart, it
 * counts: the boundary is evidence about the fix, not about the request. Pure: the same evidence
 * gives the same reading, and nothing is read here (see judge-resumes.ts for what is read when).
 */
export function resumeOutcome({ binding, admittedAt, deployedAt, replacementMarkAfterAdmission, previous, reopened, request, job, record, noun = 'job', moved, elsewhere, stalled }: OutcomeEvidence): OutcomeReading | null {
    const say = (outcome: ResumeOutcomeKind, detail: string): OutcomeReading => ({ outcome, detail });
    if (previous === 'recurred') return null;
    if (reopened && !stopDatedBefore(reopened.stoppedAt, deployedAt)) return say('recurred', `The subject stopped again for this incident's cause, seen at ${reopened.at}, after its resume.`);
    if (previous && previous !== 'chained' && previous !== 'stalled') return null;
    if (replacementMarkAfterAdmission) return say('untested', 'The release that held the fix stopped serving after the resume was admitted; what happened since says nothing of the fix.');
    if (!request?.repairResume) return say('gone', 'The project no longer holds the request this resume queued.');
    const stood = request.repairResume.stood;
    if (!stood) return say('untested', `The resume was admitted before outcomes were judged: how the ${noun} stood then was not recorded.`);
    if (moved) return say('moved-by-hand', noun === 'checkpoint' ? `A retry of the checkpoint's original run was queued at ${moved.at}, after its resume.` : `An operator's command (${moved.kind}) moved the ${noun} at ${moved.at}, after its resume.`);
    if (binding.disposition === 'undeclared-boundary') return say('untested', `The fix declared no boundary to observe: ${binding.reason}`);
    const crossing = record ? record.crossing : boundaryCrossed(binding.boundary, job, stood, noun === 'ticket' ? 'ticket' : 'job');
    if ('unjudged' in crossing) return say('untested', crossing.unjudged);
    if (crossing.crossed) return say('advanced', crossing.detail);
    if (record ? !record.exists : !job || job.status === 'cancelled') return say('gone', job ? `The ${noun} was cancelled before the boundary was crossed.` : `The project no longer holds the ${noun}.`);
    if (previous === 'stalled') return null;
    if (stalled) return say('stalled', `Nothing has moved for this resume since ${stalled}: 24 hours without progress, and no wait that explains it.`);
    if (previous === 'chained') return null;
    const link = elsewhere.find(other => after(other.openedAt, admittedAt));
    return link ? say('chained', `${link.subject} stopped for another cause after the resume (${link.incident}).`) : null;
}
