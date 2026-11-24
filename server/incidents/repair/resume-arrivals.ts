import type { Incident, IncidentEvent, IncidentFix, ResumeRefusal } from '../../../src/contracts/incidents';
import type { HarnessRequest } from '../../../src/contracts/work';
import { sanitize } from '../../office/security';
import type { Engine } from '../../scheduling/engine';
import type { Store } from '../../store/store';
import { eventId } from '../event-id';
import type { IncidentLedger } from '../incident-ledger';
import { redactEvidence } from '../redact-evidence';
import { assessResumes } from './assess-resumes';
import { admitAssignmentResume, forAssignment } from './dispatch-assignment-resume';
import { admitCheckpointResume, forCheckpoint } from './dispatch-checkpoint-resume';
import { admitResume } from './dispatch-resume';
import { admitTicketResume } from './dispatch-ticket-resume';
import { admitTransitionResume, forTransition } from './dispatch-transition-resume';
import { resumeIdentity, resumeRequest } from './resume-binding';
import type { ResumeControl } from './resume-control';
import { RESUME_ROUTES, subjectParts, type ResumeRoute } from './resume-routes';

/** A project this Office holds. `engine` is its delivery queue, which a ticket's resume goes through; a project without one resumes jobs only. */
export interface ResumeProject { store: Store; engine?: Pick<Engine, 'requestDelivery'> }

export interface ResumeArrivalsInput {
    ledger: IncidentLedger;
    entries: readonly ResumeProject[];
    control: Pick<ResumeControl, 'read'>;
    /** The verified release that runs now, when it is known to hold this fix; null otherwise (see running-release.ts). */
    running: (fix: IncidentFix) => { commit: string; operation: string } | null;
    /** Read after confirming the release, so the admission sees any wait that ran out during that check. */
    now: () => Date;
    /** Asked before anything is read and again before every write: nothing is admitted or recorded while a deployment holds the fence. */
    fenced: () => boolean;
    routes?: Readonly<Record<string, ResumeRoute>>;
    report?: (message: string) => void;
}

/** Whether a route resumes a ticket, which is queued through its project's delivery queue and not as a recovery request. */
const forTicket = (action: string, routes: Readonly<Record<string, ResumeRoute>>) => Object.hasOwn(routes, action) && routes[action].subject === 'ticket';

/** `project/kind/id` of every subject one pass admitted or recorded as admitted, refused, or found held by the switch. A refusal already on record is listed again; it is recorded once. */
export interface ResumeArrivals { admitted: string[]; refused: string[]; held: string[] }

/** The ID of the ledger's `resume-admitted` event for one resume (see resume-binding.ts for the identity). */
export const admittedId = (incident: string, identity: string) => eventId(incident, 'resume-admitted', identity);
const refusedId = (incident: string, identity: string, code: ResumeRefusal) => eventId(incident, 'resume-refused', identity, code);

/** Whether the ledger holds an admission of this subject's resume for the latest fix of this incident. */
export const resumeAdmitted = (ledger: IncidentLedger, incident: Pick<Incident, 'id' | 'fixes'>, subject: string): boolean => {
    const fix = incident.fixes?.at(-1);
    return !!fix && !!ledger.event(admittedId(incident.id, resumeIdentity(incident.id, subject, fix.event)));
};

/**
 * Resumes what is due, and keeps the ledger's record of what was resumed.
 *
 * First, every request a project holds that is bound as a resume, a recovery request for a job,
 * a delivery request for a ticket or the completed receipt of a review, implement or assignment-review resume, has its `resume-admitted` event,
 * taken from the request itself. The project's store decides whether a resume was admitted and
 * the ledger only records it, so an admission whose event was never written is made good here,
 * whatever state its incident is in by now and whatever its subject has done since, and nothing
 * is queued twice.
 *
 * Then, for every `deployed` incident, each subject the reading calls due is put to admission in
 * its own project (see dispatch-transition-resume.ts for `review-pr`, `review-candidate` and `requeue-implement`,
 * dispatch-checkpoint-resume.ts for a Brain checkpoint's native read-back, dispatch-assignment-resume.ts
 * for `review-assignment`, dispatch-resume.ts
 * for any other job route, dispatch-ticket-resume.ts for a ticket), but only while the release that runs now is verified
 * and known to hold the fix: the deployment mark alone can name a release that no longer serves.
 * The ledger records what happened: one `resume-admitted` event per subject and fix, and one
 * `resume-refused` event per subject, fix and reason, a subject held by the paused switch
 * included. A refusal consumes nothing: the subject is put to admission again on the next pass,
 * and is admitted if the reason has gone while its repair wait still holds.
 *
 * Synchronous throughout: nothing else runs between a subject's checks and its write. Nothing is
 * read or written while `fenced` says so. A project that cannot be read is reported and leaves
 * the others unaffected.
 */
export function dispatchResumes({ ledger, entries, control, running, now, fenced, routes = RESUME_ROUTES, report = console.error }: ResumeArrivalsInput): ResumeArrivals {
    const pass: ResumeArrivals = { admitted: [], refused: [], held: [] };
    if (fenced()) return pass;
    const record = (event: IncidentEvent) => { if (!ledger.event(event.id)) ledger.record({ events: [event], incidents: [] }); };
    const recordAdmission = (request: Pick<HarnessRequest, 'id' | 'repairResume'>) => {
        const bound = request.repairResume!;
        // Match the fix field saved in the project snapshot. The digest still identifies the original fix.
        record({ id: admittedId(bound.incident, bound.id), incident: bound.incident, at: bound.admittedAt, kind: 'resume-admitted',
            body: { resume: bound.id, fix: sanitize(bound.fix), commit: bound.commit, subject: bound.subject, action: bound.action, payload: bound.payload, request: request.id, release: bound.release } });
        pass.admitted.push(bound.subject);
    };
    for (const { store } of entries) {
        try {
            // A job's resume is a recovery request; a ticket's is a delivery request.
            for (const request of [...store.state.coordination?.requests ?? [], ...store.state.deliveryQueue ?? []]) {
                const bound = request.repairResume;
                if (!bound || ledger.event(admittedId(bound.incident, bound.id))) continue;
                if (fenced()) return pass;
                recordAdmission(request);
            }
        } catch (error) { report(`Repair resumes could not be recorded for ${store.project.id}: ${redactEvidence(String(error)).slice(0, 300)}`); }
    }
    const enabled = control.read(), projects = new Map(entries.map(entry => [entry.store.project.id, entry]));
    for (const incident of ledger.inState('deployed')) {
        const reading = assessResumes(incident, enabled, routes, subject => resumeAdmitted(ledger, incident, subject));
        if (!reading) continue;
        const fix = incident.fixes!.at(-1)!;
        for (const standing of reading.subjects) {
            const binding = fix.bindings.find(binding => binding.subject === standing.subject);
            if (!binding || binding.disposition === 'no-route' || !['held', 'due'].includes(standing.standing)) continue;
            if (fenced()) return pass;
            try {
                const identity = resumeIdentity(incident.id, standing.subject, fix.event);
                const project = projects.get(subjectParts(standing.subject)?.project ?? ''), store = project?.store;
                // If recording failed above, the project's binding still stands and can be recorded on the next pass.
                if (store && resumeRequest(store.state, identity)) continue;
                const held = standing.standing === 'held';
                const release = held ? null : running(fix);
                const at = now();
                const refuse = (code: ResumeRefusal, detail: string) =>
                    record({ id: refusedId(incident.id, identity, code), incident: incident.id, at: at.toISOString(), kind: 'resume-refused', body: { resume: identity, fix: fix.event, commit: fix.commit, subject: standing.subject, code, detail, release } });
                if (held) {
                    refuse('resumes-paused', standing.reason);
                    pass.held.push(standing.subject);
                    continue;
                }
                const outcome = !release ? { refused: 'release-unconfirmed' as const, detail: 'The release that runs now is not verified, or is not yet known to hold the fix.' }
                    : !store ? { refused: 'no-record' as const, detail: `${standing.subject} is in no project this Office holds.` }
                    : forTransition(binding.route.action) ? admitTransitionResume(store, { incident: incident.id, fix, release, binding }, at, routes)
                    : forCheckpoint(binding.route.action) ? admitCheckpointResume(store, { incident: incident.id, fix, release, binding }, at, routes)
                    : forAssignment(binding.route.action) ? admitAssignmentResume(store, { incident: incident.id, fix, release, binding }, at, routes)
                    : !forTicket(binding.route.action, routes) ? admitResume(store, { incident: incident.id, fix, release, binding }, at, routes)
                    : !project.engine ? { refused: 'not-dispatchable' as const, detail: `${store.project.id} has no delivery queue to resume a ticket through.` }
                    : admitTicketResume(store, (key, bound) => project.engine!.requestDelivery(key, 'resume-ticket', undefined, { repairResume: bound }), { incident: incident.id, fix, release, binding }, at, routes);
                if ('refused' in outcome) {
                    refuse(outcome.refused, outcome.detail);
                    pass.refused.push(standing.subject);
                    continue;
                }
                recordAdmission(outcome.admitted);
            } catch (error) { report(`A repair resume could not be admitted for ${standing.subject}: ${redactEvidence(String(error)).slice(0, 300)}`); }
        }
    }
    return pass;
}
