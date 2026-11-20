import { basename, dirname, resolve } from 'node:path';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/**
 * The worktree a completed maintenance run of this project created for this job's issue and branch, or ''.
 * A delivery job that adopts the run's pull request did not create the candidate itself, so nothing else
 * marks it as the Office's own. The proof is the run's passed `draft-pr` step, with every receipt
 * verified, naming this issue and this branch; the worktree must be the Office's own path for that branch,
 * `<repo>-worktrees/<branch without codex/>`. The head is not compared: a repair after the draft moves it,
 * and removal checks every tip against the delivered head itself.
 */
export function maintenanceCandidate(store: Pick<Store, 'project' | 'state'>, job: Pick<TicketJob, 'key' | 'branch'>): string {
    const issue = /^GH-\d+$/.test(job.key) ? Number(job.key.slice(3)) : 0, branch = job.branch || '';
    if (!issue || !branch.startsWith(`codex/${issue}-`)) return '';
    const repo = store.project.repo, expected = resolve(dirname(repo), `${basename(repo)}-worktrees`, branch.slice('codex/'.length));
    for (const run of store.state.maintenance?.runs || []) {
        if (run.status !== 'completed') continue;
        for (const step of run.steps || []) {
            if (step.stage !== 'draft-pr' || step.result.outcome !== 'passed' || (step.result.receipts || []).some(receipt => !receipt.verified || receipt.uncertain)) continue;
            if ((step.result.candidates || []).some(candidate => candidate.issue === issue && candidate.branch === branch && !!candidate.worktree && resolve(candidate.worktree) === expected)) return expected;
        }
    }
    return '';
}
