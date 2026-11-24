import { z } from 'zod';
import type { RepairRoute } from '../../../src/contracts/incidents';

/** Whose key a route's payload carries: the ticket the work is for, or the subject's own record. */
type Keyed = 'ticket' | 'record';

export interface ResumeRoute {
    /** What the handler resumes: a GitHub delivery job, a CEC pilot ticket, an assignment review, a maintenance run or a checkpoint. */
    subject: 'job' | 'ticket' | 'intake' | 'maintenance' | 'checkpoint';
    keyed: Keyed;
    /** What `head` names for this handler, or null when it takes none. Never assumed to be a commit. */
    head: string | null;
    /**
     * What of the route this release dispatches. `none`: nothing; it resumes nothing. `saved-result`:
     * only its form without a `head`, which reconciles a saved result. `all`: every form.
     */
    dispatch: 'none' | 'saved-result' | 'all';
}

const original = (stage: string) => `the ID of the original stopped ${stage} worker`;

/**
 * Every route a fix may name: the closed list of existing handlers the Office intends to resume
 * stopped work through. An action that is not here is not a route. Each row states what the
 * handler's own signature establishes; its preconditions stay the handler's to check when it runs.
 * `dispatch` widens only with the change that ships that route's resume and its test. Which `head`
 * a handler takes for a job at a given moment is its own rule to say (see route-head.ts).
 */
export const RESUME_ROUTES: Readonly<Record<string, ResumeRoute>> = {
    // The ticket's own resume: a paid model read-back and, where the head moved, a Dev update, before the handler can refuse. Queued through the project's delivery queue (see dispatch-ticket-resume.ts).
    'resume-ticket': { subject: 'ticket', keyed: 'ticket', head: null, dispatch: 'all' },
    'reconcile-implementation': { subject: 'job', keyed: 'ticket', head: `${original('implementation')}; where a saved prerequisite result stands, the ID of the latest completed writer of the job's stage`, dispatch: 'all' },
    'reconcile-validation': { subject: 'job', keyed: 'ticket', head: original('validation'), dispatch: 'all' },
    'reconcile-preparation': { subject: 'job', keyed: 'ticket', head: `${original('preparation')}; empty selects the saved-result reconciliation`, dispatch: 'all' },
    // Without a head: a saved independent review is verified against the unchanged pull request and issue. No model runs and no provider write is repeated.
    'reconcile-review': { subject: 'job', keyed: 'ticket', head: 'the ID of the stopped base-update handoff worker or of the continuation\'s original worker; empty selects the saved-review reconciliation', dispatch: 'all' },
    'reconcile-base-update': { subject: 'job', keyed: 'ticket', head: `the job's head commit for a board preflight, or ${original('base-update')}; empty selects the saved-result reconciliation`, dispatch: 'all' },
    'reconcile-scope-repair': { subject: 'job', keyed: 'ticket', head: original('scope-repair'), dispatch: 'all' },
    'reconcile-closeout': { subject: 'job', keyed: 'ticket', head: `${original('closeout')}; empty selects the saved-closeout reconciliation`, dispatch: 'all' },
    // Synchronous: the job is requeued at once, as an operator's recheck or requeue does, with a completed receipt carrying the binding (see dispatch-transition-resume.ts).
    'review-candidate': { subject: 'job', keyed: 'ticket', head: null, dispatch: 'all' },
    'review-pr': { subject: 'job', keyed: 'ticket', head: null, dispatch: 'all' },
    'requeue-implement': { subject: 'job', keyed: 'ticket', head: null, dispatch: 'all' },
    // Grants one restart of a dead hands-off writer past its ordinary allowance and restarts nothing itself; the harness's own restart spends it at a later poll (see dispatch-writer-release.ts).
    'release-writer': { subject: 'job', keyed: 'ticket', head: 'the ID of the dead writer run the restart is for; required', dispatch: 'all' },
    'review-assignment': { subject: 'intake', keyed: 'ticket', head: null, dispatch: 'none' },
    'reconcile-maintenance': { subject: 'maintenance', keyed: 'record', head: null, dispatch: 'none' },
    'retry-checkpoint': { subject: 'checkpoint', keyed: 'record', head: null, dispatch: 'none' },
    'reconcile-native-checkpoint': { subject: 'checkpoint', keyed: 'record', head: null, dispatch: 'none' },
};

/** Compared and saved exactly as sent: a key with space around it names nothing, so it is refused, not trimmed. */
const Key = z.string().min(1).max(200).refine(key => key === key.trim());
const KeyOnly = z.object({ key: Key }).strict();
const KeyAndHead = z.object({ key: Key, head: z.string().max(200).optional() }).strict();
/** A worker ID is compared exactly as sent, so only one that is blank is refused here. */
const KeyAndWorker = z.object({ key: Key, head: z.string().max(200).refine(head => head.trim() !== '') }).strict();

/** Whether a route grants a dead writer one more restart, admitted by its own path (see dispatch-writer-release.ts). */
export const forWriterRelease = (action: string) => action === 'release-writer';

/** The payload of a writer release, `{ key, head }` with the dead run's ID, or null when it is not one. */
export function writerReleasePayload(payload: unknown): { key: string; head: string } | null {
    const parsed = KeyAndWorker.safeParse(payload);
    return parsed.success ? parsed.data : null;
}

/** A subject key is `project/kind/id`; a project ID and a kind hold no slash, an ID may. Null when it is not one. */
export function subjectParts(subject: string): { project: string; kind: string; id: string } | null {
    const [project, kind, ...rest] = subject.split('/');
    return project && kind && rest.length ? { project, kind, id: rest.join('/') } : null;
}

/** Whether this release dispatches the route in the form this payload gives it. */
export function dispatchable(known: ResumeRoute, payload: Record<string, unknown>): boolean {
    return known.dispatch === 'all' || known.dispatch === 'saved-result' && !payload.head;
}

/**
 * A project's delivery work is scheduled under one kind whatever it is: a GitHub job by its ID, a
 * CEC pilot ticket as `ticket:KEY`, and a CEC queue request by its own ID. Only the project's
 * provider tells a job from a queue request, so a job needs GitHub and a ticket needs Azure.
 */
const SUBJECTS: Record<ResumeRoute['subject'], { named: string; is: (kind: string, id: string, provider: string) => boolean }> = {
    ticket: { named: 'a CEC pilot ticket', is: (kind, id, provider) => kind === 'delivery' && id.startsWith('ticket:') && provider === 'azure' },
    job: { named: 'a GitHub delivery job', is: (kind, id, provider) => kind === 'delivery' && !id.startsWith('ticket:') && provider === 'github' },
    intake: { named: 'an assignment review', is: kind => kind === 'intake' },
    maintenance: { named: 'a maintenance run', is: kind => kind === 'maintenance' },
    checkpoint: { named: 'a checkpoint', is: kind => kind === 'checkpoint' },
};

/**
 * Why a route can never resume the subject it is bound to, or null. Checked from the binding and
 * the subject as the repair recorded it, with no project read: the action is in the inventory, the
 * payload has that action's shape, the action applies to the subject's kind in a project of that
 * provider (the one its incident's cause records), a key that names the
 * subject's own record names this one, and the stage the route expects is the stage the stop was
 * recorded at. The digest already pins that stage, so any other could never be admitted. A null
 * stage is one the caller could not establish; it is then not compared.
 */
export function routeFault(route: RepairRoute, subject: { subject: string; stage: string | null; provider: string }, routes: Readonly<Record<string, ResumeRoute>> = RESUME_ROUTES): string | null {
    const known = Object.hasOwn(routes, route.action) ? routes[route.action] : undefined;
    if (!known) return `${route.action} is not a resume route; the routes are ${Object.keys(routes).join(', ')}`;
    const shape = known.head === null ? KeyOnly : forWriterRelease(route.action) ? KeyAndWorker : KeyAndHead, payload = shape.safeParse(route.payload);
    if (!payload.success) return `the payload of ${route.action} is ${shape === KeyOnly ? '{ key }' : shape === KeyAndWorker ? '{ key, head }' : '{ key, head? }'}`;
    const work = subjectParts(subject.subject);
    if (!work || !SUBJECTS[known.subject].is(work.kind, work.id, subject.provider)) return `${route.action} resumes ${SUBJECTS[known.subject].named}, which ${subject.subject || 'this subject'} is not`;
    const own = known.subject === 'ticket' ? work.id.slice('ticket:'.length) : known.keyed === 'record' ? work.id : null;
    if (own !== null && payload.data.key !== own) return `the key of ${route.action} for ${subject.subject} is ${own}`;
    if (subject.stage !== null && route.expectedStage !== subject.stage) return `${subject.subject} was recorded at stage ${subject.stage || '(none)'}, not ${route.expectedStage}`;
    return null;
}
