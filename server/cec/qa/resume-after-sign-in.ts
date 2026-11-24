import { resolve } from 'node:path';
import { holdReason } from '../../office/project-holds';
import { browserPages, type ReadPages } from '../../qa/browser-pages';
import { signInState } from '../../qa/sign-in-observed';
import { readSignInWait } from '../../qa/sign-in-wait';
import { currentEnvironmentWait } from './environment-wait';
import type { Store } from '../../store/store';
import type { Ticket } from '../../../src/shared';

/**
 * Requests one resume of each ticket whose QA stage is waiting on a person's sign-in, once the browser
 * that QA run left open is seen to be signed in (`server/qa/sign-in-observed.ts`). The ticket is blocked
 * at a QA stage on an environment wait of its current candidate, and that run left a sign-in record.
 * The resume is the ordinary one: the setup-stop cap, the PM read-back and the QA worker's own check of
 * the signed-in actor all still run. Once per recorded wait; a hold, a pause, a request already queued,
 * a browser that is gone or a record that cannot be read leaves the ticket for a manual resume.
 */
export async function resumeAfterSignIn(store: Store, resume: (key: string) => unknown, pages: ReadPages = browserPages): Promise<string[]> {
    const resumed: string[] = [];
    if (store.state.paused || store.state.draining) return resumed;
    for (const ticket of store.state.tickets) {
        const wait = signInWait(store, ticket);
        if (!wait) continue;
        const record = readSignInWait(wait, resolve(store.dataRoot, 'runs', ticket.runId));
        if (!record || signInState(await pages(record.port), record) !== 'signed-in') continue;
        // Read again after the browser read, and marked together with the request: a restart between them loses neither.
        let refused = false;
        try {
            const queued = store.transaction(() => {
                if (store.state.paused || store.state.draining || signInWait(store, ticket)?.qaRunDir !== wait.qaRunDir) return false;
                ticket.signInResumedFor = wait.qaRunDir;
                try { resume(ticket.key); }
                catch (error) { refused = true; throw error; }
                store.emit('qa-sign-in-observed', `${ticket.key}: the browser QA left open for sign-in is now in the application. The Office resumed the ticket once; QA checks the signed-in actor itself.`, 'qa', ticket.key);
                return true;
            });
            if (queued) resumed.push(ticket.key);
        }
        catch (error) {
            if (!refused) throw error;
            // A request that is refused is marked on its own, so it is not asked for again on every poll.
            ticket.signInResumedFor = wait.qaRunDir;
            store.emit('qa-sign-in-resume-refused', `${ticket.key}: sign-in was observed but the resume was refused: ${String(error).replace(/^Error:\s*/, '')}. Resume it by hand.`, 'qa', ticket.key);
        }
    }
    return resumed;
}

/** The ticket's sign-in wait this watcher may still answer: a hold, a park, a request already queued or a wait already answered rules it out. */
function signInWait(store: Store, ticket: Ticket) {
    if (!ticket.pilot || ticket.activity !== 'blocked' || ticket.parked || holdReason(store.project, ticket.key)) return;
    const wait = currentEnvironmentWait(ticket);
    if (!wait?.qaRunDir || ticket.signInResumedFor === wait.qaRunDir) return;
    if (store.state.deliveryQueue?.some(request => request.key === ticket.key && ['queued', 'working'].includes(request.status))) return;
    return wait;
}
