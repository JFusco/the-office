import { freezeReads } from '../../incidents/repair/freeze-reads';
import { repairFreeze } from '../../incidents/repair/repair-freeze';
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
        // A stop a harness repair in progress covers is not restarted into the same defect. The job stays the harness's to restart,
        // so no other recovery takes it over, and its restart counts and salvage are untouched.
        const held = () => { const now = store.clock.now(); return !!repairFreeze(store.state, { kind: 'delivery', id: job.id }, now, freezeReads(store, now)); };
        if (held()) continue;
        const { work, accepted, attempt } = candidate, at = () => store.clock.now().toISOString();
        let resetDispatched = false;
        const current = () => (resetDispatched || !held()) && writerRestartCandidate(store, job, store.clock.now())?.work.id === work.id;
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
        catch (error) { if (!held()) unreadable(error); continue; }
        // The reads are asynchronous; act only if the same stopped run is still the candidate.
        if (!current()) continue;
        if (moved) { delete job.writerRestartReadError; decline(moved); continue; }
        let stopped = false;
        try {
            // A repair wait admitted after reset starts must let cleanup and recording finish.
            const execute: GitHubDelivery['execute'] = (program, args, options) => {
                if (program === 'git' && args[0] === 'reset') resetDispatched = true;
                return delivery.execute(program, args, options);
            };
            const saved = await salvageWorktree(execute, { worktree: job.worktree!, branch: job.branch!, accepted, ref: `refs/office/salvage/${job.id}/${work.id}` },
                () => { if (!current()) { stopped = true; throw new Error('The job changed owner, hold or state during the salvage'); } });
            delete job.writerRestartReadError;
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
            if (!resetDispatched && held()) continue;
            delete job.writerRestartReadError;
            if (stopped) continue;
            if (error instanceof SalvageRetry) unreadable(error);
            else decline(String(error));
        }
    }
}
