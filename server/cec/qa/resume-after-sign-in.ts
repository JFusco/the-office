import { resolve } from 'node:path';
import { holdReason } from '../../office/project-holds';
import { browserPages, type ReadPages } from '../../qa/browser-pages';
import { signInState } from '../../qa/sign-in-observed';
import { readSignInWait } from '../../qa/sign-in-wait';
import { currentEnvironmentWait } from './environment-wait';
import type { Store } from '../../store/store';
import type { DeliveryRequest, Ticket } from '../../../src/shared';

/**
 * Requests one resume of each ticket whose QA stage is waiting on a person's sign-in, once the browser
 * that QA run left open is seen to be signed in (`server/qa/sign-in-observed.ts`). The ticket is blocked
 * at a QA stage on an environment wait of its current candidate, and that run left a sign-in record.
 * The resume is the ordinary one: the setup-stop cap, the PM read-back and the QA worker's own check of
 * the signed-in actor all still run. Once per recorded wait; a hold, a pause, a request already queued,
 * a browser that is gone or a record that cannot be read leaves the ticket for a manual resume.
 */
export async function resumeAfterSignIn(store: Store, resume: (key: string) => DeliveryRequest | void, pages: ReadPages = browserPages): Promise<string[]> {
    const resumed: string[] = [];
    if (store.state.paused || store.state.draining) return resumed;
    for (const ticket of store.state.tickets) {
        const wait = signInWait(store, ticket);
        if (!wait) continue;
        const { key, commit } = ticket;
        const { qaRunDir } = wait;
        const record = readSignInWait(wait, resolve(store.dataRoot, 'runs', ticket.runId));
        if (!record || signInState(await pages(record.port), record) !== 'signed-in') continue;
        // Read again after the browser read, and marked together with the request: a restart between them loses neither.
        let refused = false;
        try {
            const queued = store.transaction(() => {
                const current = store.state.tickets.find(ticket => ticket.key === key);
                if (store.state.paused || store.state.draining || !current || current.commit !== commit || signInWait(store, current)?.qaRunDir !== qaRunDir) return false;
                current.signInResumedFor = qaRunDir;
                try { resume(key); }
                catch (error) {
                    // A guard refuses before queuing. SQLite can fail on either side of that boundary.
                    refused = (error as NodeJS.ErrnoException)?.code !== 'ERR_SQLITE_ERROR'
                        && store.db.isOpen && store.db.isTransaction && !hasPendingDelivery(store, key);
                    throw error;
                }
                store.emit('qa-sign-in-observed', `${key}: the browser QA left open for sign-in is now in the application. The Office resumed the ticket once; QA checks the signed-in actor itself.`, 'qa', key);
                return true;
            });
            if (queued) resumed.push(key);
        }
        catch (error) {
            if (!refused) throw error;
            store.transition('qa-sign-in-resume-refused',
                `${key}: sign-in was observed but the resume was refused: ${String(error).replace(/^Error:\s*/, '')}. Resume it by hand.`,
                () => { store.ticket(key).signInResumedFor = qaRunDir; }, 'qa', key);
        }
    }
    return resumed;
}

/** The ticket's sign-in wait this watcher may still answer: a hold, a park, a request already queued or a wait already answered rules it out. */
function signInWait(store: Store, ticket: Ticket) {
    if (!ticket.pilot || ticket.activity !== 'blocked' || ticket.parked || holdReason(store.project, ticket.key)) return;
    const wait = currentEnvironmentWait(ticket);
    if (!wait?.qaRunDir || ticket.signInResumedFor === wait.qaRunDir) return;
    if (hasPendingDelivery(store, ticket.key)) return;
    return wait;
}

function hasPendingDelivery(store: Store, key: string) {
    return store.state.deliveryQueue?.some(request => request.key === key && (request.status === 'queued' || request.status === 'working'));
}
