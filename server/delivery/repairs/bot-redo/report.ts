import { stopReason } from '../../pipeline/stop-reason';
import type { Store } from '../../../store/store';
import type { BotRedo, TicketJob } from '../../../../src/shared';

/** Waiting on the bot is never a stop. */
export function waitOnBot(job: TicketJob, detail: string): void {
    job.stage = 'merge'; job.status = 'watching'; job.detail = detail; delete job.stop;
}

/** A stop is reported once: the job is blocked in merge, and an event is emitted only when the stop changed. */
export function reportStop(store: Store, job: TicketJob, redo: BotRedo, stop: string): void {
    job.stage = 'merge'; job.status = 'blocked'; job.detail = stop;
    job.stop = stopReason(new Error(stop), false, store.clock.now());
    if (redo.stop === stop) return;
    redo.stop = stop;
    store.emit('bot-redo-stopped', `${job.key}: ${stop}`, 'pm', job.key);
}

/** What the job waits on for this head, in plain words. */
export function waitingDetail(job: TicketJob, redo: BotRedo): string {
    const at = `PR #${job.pr} at ${redo.sha.slice(0, 7)}`;
    if (redo.route === 'dependabot-rebase') return `Dependabot was asked to rebase ${at} with "@dependabot rebase"; waiting for its new head.`;
    if (redo.route === 'renovate-checkbox') return `Pin Courier's rebase box was checked on ${at}; Renovate rebases it on its next scheduled run.`;
    if (redo.route === 'renovate-requested') return `Pin Courier's rebase is already requested on ${at}; waiting for Renovate's next scheduled run.`;
    return `wiki-sync was asked to regenerate ${at} through ${redo.route}${redo.run ? ` (run ${redo.run.url})` : ''}; waiting for the run's new head.`;
}

export const UNAVAILABLE = (job: TicketJob, redo: BotRedo) =>
    `Pin Courier PR #${job.pr} conflicts at ${redo.sha.slice(0, 7)} and offers no single rebase control; its producer must rebase or recreate it.`;
