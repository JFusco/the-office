import { resolve } from 'node:path';
import { holdReason } from '../../office/project-holds';
import { environmentWait } from '../../cec/qa/environment-wait';
import { browserPages, type ReadPages } from '../../qa/browser-pages';
import { signInState } from '../../qa/sign-in-observed';
import { readSignInWait } from '../../qa/sign-in-wait';
import type { Execute } from '../board/project-graphql';
import { returnCardToPickup } from './return-to-pickup';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** A job goes back to pickup for an observed sign-in at most this many times; after that the card stays in Block for a person. */
export const MAX_SIGN_IN_UNPARKS = 2;

/** The job's last step when it is the QA setup stop it is parked on: an environment wait on the current head. */
function waitingStep(job: TicketJob) {
    const step = job.steps.at(-1);
    if (job.status !== 'blocked' || !job.parked?.published || job.parked.release || !step || job.parked.stage !== step.stage || (job.signInUnparks || 0) >= MAX_SIGN_IN_UNPARKS) return;
    return environmentWait(step.result) && step.result.commit === job.head && job.signInUnparkedStep !== job.steps.length - 1 ? step : undefined;
}

/**
 * A job parked because its QA run is waiting on a person's sign-in goes back to the pickup lane once the
 * browser that run left open is seen to be signed in (`server/qa/sign-in-observed.ts`); `resumeParked`
 * then resumes it on a later poll and QA checks the signed-in actor itself. Tried once per park, whatever
 * the outcome, and at most MAX_SIGN_IN_UNPARKS times per job. A hold, a pause, a browser that is gone, a
 * record that cannot be read, or a card a person moved out of Block is left alone. A failure is recorded
 * once and never stops the poll; the card then stays in Block for a person.
 */
export async function unparkSignedIn(store: Store, execute: Execute, jobs: TicketJob[], pickup: { enabled: boolean; status: string }, pages: ReadPages = browserPages): Promise<string[]> {
    const moved: string[] = [];
    if (!pickup.enabled || !store.project.githubProject || store.state.paused || store.state.draining) return moved;
    for (const job of jobs) {
        const step = waitingStep(job);
        if (!step || holdReason(store.project, job.key)) continue;
        const record = readSignInWait(step.result, resolve(store.dataRoot, 'ticket-work', job.id));
        if (!record || signInState(await pages(record.port), record) !== 'signed-in') continue;
        // Marked before any write: one try per park, so a write that cannot be confirmed is not read for again on every poll.
        job.signInUnparkedStep = job.steps.length - 1;
        store.save();
        try {
            const lane = await returnCardToPickup(store, execute, job, pickup.status, { slug: 'sign-in', label: 'Sign-in unpark',
                body: name => `The browser QA left open for sign-in is now in the application. The Office is moving the card back to ${name} to resume from ${job.parked!.stage}; QA checks the signed-in actor itself.` });
            // A card a person already moved out of Block is theirs.
            if (lane === null) continue;
            job.signInUnparks = (job.signInUnparks || 0) + 1;
            store.emit('delivery-sign-in-unparked', `${job.key}: sign-in observed in the waiting browser; card moved back to ${lane}.`, 'qa', job.key);
            store.save();
            moved.push(job.key);
        }
        catch (error) {
            store.emit('sign-in-unpark-unavailable', `${job.key}: sign-in was observed but the card was not moved: ${String(error)}. It stays in Block for a person.`, 'pm', job.key);
        }
    }
    return moved;
}
