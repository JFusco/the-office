import { resolve } from 'node:path';
import { holdReason } from '../../office/project-holds';
import { browserPages, type ReadPages } from '../../qa/browser-pages';
import { signInState } from '../../qa/sign-in-observed';
import { readSignInWait } from '../../qa/sign-in-wait';
import { currentEnvironmentWait } from './environment-wait';
import type { Store } from '../../store/store';

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
        if (!ticket.pilot || ticket.activity !== 'blocked' || ticket.parked || holdReason(store.project, ticket.key)) continue;
        const wait = currentEnvironmentWait(ticket);
        if (!wait?.qaRunDir || ticket.signInResumedFor === wait.qaRunDir) continue;
        if (store.state.deliveryQueue?.some(request => request.key === ticket.key && ['queued', 'working'].includes(request.status))) continue;
        const record = readSignInWait(wait, resolve(store.dataRoot, 'runs', ticket.runId));
        if (!record || signInState(await pages(record.port), record) !== 'signed-in') continue;
        // Marked before the request, so a request that is refused is not asked for again on every poll.
        ticket.signInResumedFor = wait.qaRunDir;
        store.save();
        try {
            resume(ticket.key);
            store.emit('qa-sign-in-observed', `${ticket.key}: the browser QA left open for sign-in is now in the application. The Office resumed the ticket once; QA checks the signed-in actor itself.`, 'qa', ticket.key);
            resumed.push(ticket.key);
        }
        catch (error) {
            store.emit('qa-sign-in-resume-refused', `${ticket.key}: sign-in was observed but the resume was refused: ${String(error).replace(/^Error:\s*/, '')}. Resume it by hand.`, 'qa', ticket.key);
        }
    }
    return resumed;
}
