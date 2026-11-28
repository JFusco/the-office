import { basename, dirname, resolve } from 'node:path';
import { realpathSync } from 'node:fs';
import { groupRecord } from '../../maintenance/publication/group-record';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/**
 * The worktree a completed maintenance run of this project created for this job's issue and branch, or ''.
 * A delivery job that adopts the run's pull request did not create the candidate itself, so nothing else
 * marks it as the Office's own. The proof is the run's passed `draft-pr` step, with at least one receipt
 * and every receipt verified, naming this issue and this branch; the worktree must be the Office's own path for that branch,
 * `<repo>-worktrees/<branch without codex/>`. The head is not compared: a repair after the draft moves it,
 * and removal checks every tip against the delivered head itself.
 */
export function maintenanceCandidate(store: Pick<Store, 'project' | 'state'>, job: Pick<TicketJob, 'key' | 'branch'>): string {
    const issue = /^GH-\d+$/.test(job.key) ? Number(job.key.slice(3)) : 0, branch = job.branch || '';
    if (!issue || !branch.startsWith(`codex/${issue}-`)) return '';
    const repo = store.project.repo, expected = resolve(dirname(repo), `${basename(repo)}-worktrees`, branch.slice('codex/'.length));
    const real = (path: string) => { try { return realpathSync(path); } catch { return resolve(path); } };
    for (const run of store.state.maintenance?.runs || []) {
        if (run.status !== 'completed') continue;
        // A versioned group (#612) is identified only by its complete completion record, bound to its saved proposal
        // step (`group-record.ts`): every publication reference, and this issue, branch and owned path.
        if ((run.publication?.candidates || []).some(candidate => {
            const record = candidate.completed && groupRecord(run, candidate.completed.proposalStep, store.project.repository);
            return !!record && record === candidate.completed && record.issue === issue && record.branch === branch && real(record.worktree) === real(expected);
        })) return expected;
        for (const step of run.steps || []) {
            if (step.publicationVersion === 1) continue;
            const receipts = step.result.receipts || [];
            // A step with no receipt at all published nothing it can show.
            if (step.stage !== 'draft-pr' || step.result.outcome !== 'passed' || !receipts.length || receipts.some(receipt => !receipt.verified || receipt.uncertain)) continue;
            if ((step.result.candidates || []).some(candidate => candidate.issue === issue && candidate.branch === branch && !!candidate.worktree && resolve(candidate.worktree) === expected)) return expected;
        }
    }
    return '';
}
