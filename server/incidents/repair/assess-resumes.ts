import { subjectKey, type Incident, type ResumeAssessment, type ResumeSwitch } from '../../../src/contracts/incidents';
import { repairSubject } from '../subject-digest';
import { dispatchable, forWriterRelease, RESUME_ROUTES, routeFault, type ResumeRoute } from './resume-routes';

type Standing = ResumeAssessment['subjects'][number];

/**
 * How each subject of an incident's latest fix stands, once that fix is found in the running
 * release; null while it is not. An incident is `deployed` only for the fix its current repair
 * bound last, so that fix is the one read.
 *
 * In order: a subject the fix declared no route for has none. A subject whose resume was already
 * admitted for this fix stays admitted, whatever it does next. A subject the ledger no longer
 * holds open exactly as the fix bound it is gone, and is never resumed in its later form. A route
 * the inventory does not hold, or cannot be for this subject, or that this release does not
 * dispatch in that form, is no route; for the last, the reason is the row's own where it gives
 * one. What is left could be resumed: held while automatic
 * resumes are paused, due otherwise.
 *
 * Pure. It reads the ledger's own copy of each subject, not the project; whoever admits a resume
 * checks the project's record again at that moment. `admitted` says whether the ledger holds an
 * admission for a subject of this fix (see resume-arrivals.ts).
 */
export function assessResumes(incident: Incident, control: ResumeSwitch, routes: Readonly<Record<string, ResumeRoute>> = RESUME_ROUTES, admitted: (subject: string) => boolean = () => false): ResumeAssessment | null {
    const fix = incident.fixes?.at(-1);
    if (incident.state !== 'deployed' || !fix?.deployed) return null;
    const held = new Map(incident.subjects.map(subject => [subjectKey(subject), subject]));
    const subjects = fix.bindings.map((binding): Standing => {
        if (binding.disposition === 'no-route') return { subject: binding.subject, standing: 'no-route', reason: `The fix declared no route: ${binding.reason}` };
        const stand = (standing: Standing['standing'], reason: string): Standing => ({ subject: binding.subject, standing, reason, action: binding.route.action });
        if (admitted(binding.subject)) return stand('admitted', forWriterRelease(binding.route.action)
            ? `One more restart of worker ${String(binding.route.payload.head)} was granted for this fix; the harness restarts it, and a fix resumes a subject once.`
            : 'Its resume was queued for this fix; a fix resumes a subject once.');
        const record = held.get(binding.subject);
        if (!record || record.status !== 'open') return stand('gone', 'The stop the fix was bound to has cleared.');
        if (repairSubject(record).digest !== binding.digest) return stand('gone', 'The subject no longer stands as the fix bound it: another episode, stage, stop or head.');
        const fault = routeFault(binding.route, { subject: binding.subject, stage: record.stage, provider: incident.cause.provider }, routes);
        if (fault) return stand('no-route', `The bound route cannot resume it: ${fault}.`);
        if (!dispatchable(routes[binding.route.action], binding.route.payload)) return stand('no-route', routes[binding.route.action].reason ?? `This release cannot dispatch ${binding.route.action}${binding.route.payload.head ? ' with a head' : ''}.`);
        return control.enabled ? stand('due', 'Automatic repair resumes are enabled.') : stand('held', `Automatic repair resumes are paused: ${control.reason}`);
    });
    return { fix: fix.event, commit: fix.commit, release: fix.deployed.release, subjects };
}
