import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SalvageRetry, salvageWorktree } from './salvage-worktree';
import { writerRestartCandidate } from './restart-writer';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

/** Reads that must hold before a restart: nothing the stopped run could have published has moved. */
async function unchangedSinceAccepted(delivery: GitHubDelivery, job: TicketJob, accepted: string): Promise<string> {
    if (!existsSync(job.worktree!)) return 'the recorded worktree is missing';
    if (resolve(job.worktree!) === resolve(delivery.store.project.repo)) return 'the recorded worktree is the primary checkout';
    const remote = (await delivery.execute('git', ['ls-remote', '--heads', 'origin', `refs/heads/${job.branch}`], { cwd: delivery.store.project.repo, timeout: 60000, readOnly: true })).trim().split(/\s+/)[0] || '';
    if (remote && remote !== job.head) return 'the remote branch is not at the accepted head';
    if (job.pr) {
        if (!remote) return 'the published branch is missing';
        const pr = await delivery.verifyPR(job);
        if (pr.state !== 'open' || pr.head?.sha !== accepted) return 'the PR is closed or not at the accepted head';
    }
    return '';
}

/**
 * Re-runs a writer stage whose last run died: saves what it left, resets the worktree to the
 * accepted head and queues the same stage again. A job whose published state moved, or whose
 * worktree cannot be saved, is declined once with the reason and left to its existing handling.
 * A read or lock failure decides nothing: it is recorded once and tried again next observation.
 */
export async function restartStoppedWriters(delivery: GitHubDelivery) {
    const { store } = delivery;
    for (const job of [...delivery.jobs]) {
        const candidate = writerRestartCandidate(store, job, store.clock.now());
        if (!candidate) continue;
        const { work, accepted, attempt } = candidate, at = () => store.clock.now().toISOString();
        const current = () => writerRestartCandidate(store, job, store.clock.now())?.work.id === work.id;
        const unreadable = (error: unknown) => {
            const reason = String(error).slice(0, 300);
            if (job.writerRestartReadError === reason) return;
            job.writerRestartReadError = reason;
            store.emit('writer-restart-unreadable', `${job.key}: the stopped ${job.stage} run cannot be restarted yet: ${reason}`, 'pm', job.key);
            store.save();
        };
        const decline = (reason: string) => {
            job.writerRestartDeclined = { workId: work.id, reason: reason.slice(0, 400), at: at() };
            store.emit('writer-restart-declined', `${job.key}: stopped ${job.stage} run not restarted: ${job.writerRestartDeclined.reason}`, 'pm', job.key);
            store.save();
        };
        let moved: string;
        try { moved = await unchangedSinceAccepted(delivery, job, accepted); }
        catch (error) { unreadable(error); continue; }
        // The reads are asynchronous; act only if the same stopped run is still the candidate.
        if (!current()) continue;
        delete job.writerRestartReadError;
        if (moved) { decline(moved); continue; }
        let stopped = false;
        try {
            const saved = await salvageWorktree(delivery.execute, { worktree: job.worktree!, branch: job.branch!, accepted, ref: `refs/office/salvage/${job.id}/${work.id}` },
                () => { if (!current()) { stopped = true; throw new Error('The job changed owner, hold or state during the salvage'); } });
            // The worktree is reset: record that even if the job was cancelled or retired meanwhile, but queue only a job still stopped.
            (job.writerRestarts ??= []).push({ workId: work.id, stage: job.stage, at: at(), accepted, abandoned: saved.abandoned, ref: saved.ref });
            if (delivery.jobs.includes(job) && ['blocked', 'interrupted'].includes(job.status)) {
                job.status = 'queued';
                delete job.stop;
                job.detail = `The ${job.stage} run stopped before finishing. Its work is ${saved.ref ? `kept at ${saved.ref}` : 'unchanged from the accepted head'}; attempt ${attempt} of 3 restarts from ${accepted.slice(0, 7)}.`;
                store.emit('writer-restarted', `${job.key}: ${job.detail}`, 'developer', job.key);
            }
            store.save();
        }
        catch (error) {
            if (error instanceof SalvageRetry && !stopped) unreadable(error);
            // A guard stop leaves the run for the next observation; any other failure is this run's final answer.
            else if (!stopped) decline(String(error));
        }
    }
}
