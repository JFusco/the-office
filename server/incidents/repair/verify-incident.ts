import { subjectKey, type Incident, type ResumeAssessment, type ResumeOutcomeKind } from '../../../src/contracts/incidents';
import { stopDatedBefore } from './stop-dated-before';

/** What an incident's evidence amounts to: the state it should move to, why, and the subjects that say so. */
export interface Verdict { state: 'verified' | 'recurred'; detail: string; subjects: string[] }

/** Outcomes after which nothing more is expected of a resume. `recurred` is one too, and is read before these. */
const SETTLED: readonly ResumeOutcomeKind[] = ['advanced', 'moved-by-hand', 'gone', 'untested'];

/**
 * What a `deployed` or `verified` incident's evidence amounts to, or null while it amounts to
 * nothing yet. Pure. It reads the incident; for a deployed one, how each subject of its latest
 * fix stands (see assess-resumes.ts); and `opened`, the subjects the ledger recorded as opening
 * after the event the incident is measured from, by its own order of writing: the deployment
 * mark of a deployed incident, the verification of a verified one (see
 * IncidentLedger.openedAfter). In either state, leave out stops the project dated at or before
 * the deployment mark, whenever the ledger first saw them.
 *
 * Deployed, in order:
 * - `recurred`: a resume's outcome is `recurred`, or any subject of the incident opened after the
 *   deployment mark, resumed or not, named by the fix or not. The first such subject decides;
 *   the others are not waited for.
 * - `verified`: every subject the fix names is accounted for and at least one resume advanced.
 *   Accounted for: the fix gave it no route; its stop cleared or changed without a resume
 *   (gone); or its resume has an outcome that will not change. A subject still held or due, a
 *   resume that is pending, chained or stalled, and a subject the fix gave a route this release
 *   cannot dispatch, are not.
 *
 * Verified: `recurred` when any subject opened after the verification. Nothing else follows from
 * a verified incident; in particular a later rollback does not undo it.
 */
export function incidentVerdict(incident: Incident, standings: ResumeAssessment['subjects'] | null, opened: readonly { subject: string }[]): Verdict | null {
    const again = (since: string) => opened.map(({ subject }) => subject).filter(subject => !stopDatedBefore(incident.subjects.find(record => subjectKey(record) === subject)?.stop?.at, since));
    const fix = incident.fixes?.at(-1);
    if (incident.state === 'verified') {
        const verifiedAt = incident.verified?.at;
        const stopped = again(fix?.deployed?.at ?? verifiedAt ?? '');
        return stopped.length ? { state: 'recurred', detail: `After the incident was verified${verifiedAt ? ` at ${verifiedAt}` : ''}, the ledger observed another stop for the same cause.`, subjects: stopped } : null;
    }
    if (incident.state !== 'deployed' || !fix?.deployed) return null;
    const outcome = (subject: string) => fix.outcomes?.find(held => held.subject === subject)?.outcome;
    const recurred = [...new Set([...(fix.outcomes ?? []).filter(held => held.outcome === 'recurred').map(held => held.subject), ...again(fix.deployed.at)])];
    if (recurred.length) return { state: 'recurred', detail: `The cause stopped work again after the fix was found in the running release at ${fix.deployed.at}.`, subjects: recurred };
    if (!standings) return null;
    const accounted = fix.bindings.every(binding => {
        const standing = standings.find(held => held.subject === binding.subject)?.standing;
        // By the binding, not by the reading: the reading also says `no-route` of a route this release cannot dispatch, and that subject is still stopped as the fix bound it.
        return binding.disposition === 'no-route' || standing === 'gone' || standing === 'admitted' && SETTLED.includes(outcome(binding.subject) as ResumeOutcomeKind);
    });
    const advanced = fix.bindings.map(binding => binding.subject).filter(subject => outcome(subject) === 'advanced');
    return accounted && advanced.length ? { state: 'verified', detail: `Every subject of the fix is accounted for and ${advanced.length} resumed past the boundary the fix declared.`, subjects: advanced } : null;
}
