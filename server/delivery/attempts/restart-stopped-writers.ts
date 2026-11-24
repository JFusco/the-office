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
 *
 * What a pass acts on is taken before anything is awaited: the job, its run, stage, accepted head,
 * branch and worktree, and whether the ordinary allowance or the job's repair release funds the
 * attempt (and which release). A pass that finds any of it changed after an await writes nothing,
 * on success or failure, and leaves whatever replaced it eligible. The restart is recorded, the
 * job queued and a release spent in one write, after the worktree is saved; a write that fails
 * changes nothing in the project, and the saved ref is found again by the next pass.
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
        const { work, accepted, attempt, released } = candidate, at = () => store.clock.now().toISOString();
        const pass = { stage: job.stage, branch: job.branch, worktree: job.worktree, grant: released ? job.repairRelease?.id : undefined };
        // The same live job, run, stage, head, branch and worktree, and for a released attempt the same unspent release.
        const same = () => delivery.jobs.find(live => live.id === job.id) === job && job.stage === pass.stage && job.branch === pass.branch && job.worktree === pass.worktree
            && (job.head || job.candidateBase) === accepted && store.state.workLog?.filter(entry => entry.requestId === job.id && entry.stage === `github-${job.stage}`).at(-1)?.id === work.id
            && (!released || !!job.repairRelease && job.repairRelease.id === pass.grant && !job.repairRelease.consumedAt);
        // Still the candidate it was, funded the same way.
        const eligible = () => { const now = writerRestartCandidate(store, job, store.clock.now()); return !!now && now.work.id === work.id && now.accepted === accepted && now.released === released; };
        let resetDispatched = false;
        const current = () => (resetDispatched || !held()) && same() && eligible();
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
        catch (error) { if (current()) unreadable(error); continue; }
        // The reads are asynchronous; act only if the same stopped run is still the candidate.
        if (!current()) continue;
        if (moved) { delete job.writerRestartReadError; decline(moved); continue; }
        let stopped = false, saved: { abandoned: string; ref: string };
        try {
            // A repair wait admitted after reset starts must let cleanup and recording finish.
            const execute: GitHubDelivery['execute'] = (program, args, options) => {
                if (program === 'git' && args[0] === 'reset') resetDispatched = true;
                return delivery.execute(program, args, options);
            };
            saved = await salvageWorktree(execute, { worktree: job.worktree!, branch: job.branch!, accepted, ref: `refs/office/salvage/${job.id}/${work.id}` },
                () => { if (!current()) { stopped = true; throw new Error('The job changed owner, hold or state during the salvage'); } });
        }
        catch (error) {
            // A pass whose job, run, head or release changed meanwhile, or that a wait held before the reset, writes nothing.
            if (!current()) continue;
            delete job.writerRestartReadError;
            if (stopped) continue;
            if (error instanceof SalvageRetry) unreadable(error);
            else decline(String(error));
            continue;
        }
        store.transaction(() => {
            if (!same()) return;
            // A job cancelled while its worktree was cleaned keeps that status; the reset is still recorded, and no release is spent.
            const stillStopped = ['blocked', 'interrupted'].includes(job.status);
            // Asked before the restart is recorded, which takes this run out of candidacy.
            if (stillStopped && !eligible()) return;
            delete job.writerRestartReadError;
            (job.writerRestarts ??= []).push({ workId: work.id, stage: pass.stage, at: at(), accepted, abandoned: saved.abandoned, ref: saved.ref });
            if (!stillStopped) return;
            job.status = 'queued';
            delete job.stop;
            const kept = `Its work is ${saved.ref ? `kept at ${saved.ref}` : 'unchanged from the accepted head'}`;
            if (released) {
                const grant = job.repairRelease!;
                grant.consumedAt = at();
                job.detail = `The ${job.stage} run stopped before finishing. ${kept}; attempt ${attempt}, released by harness fix ${grant.commit.slice(0, 7)} beyond the 3 ordinary restarts, restarts from ${accepted.slice(0, 7)}.`;
            }
            else job.detail = `The ${job.stage} run stopped before finishing. ${kept}; attempt ${attempt} of 3 restarts from ${accepted.slice(0, 7)}.`;
            store.emit('writer-restarted', `${job.key}: ${job.detail}`, 'developer', job.key);
        });
    }
}
