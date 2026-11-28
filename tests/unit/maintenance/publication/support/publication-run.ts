import { fakeMaintenanceGitHub, HEAD, BASE, type FakeProject } from './fake-maintenance-github';
import { pushHookBaseline } from '../../../../../server/maintenance/publication/hook-baseline';
import type { MaintenanceOwner } from '../../../../../server/maintenance/publication/maintenance-effect';
import type { MaintenancePublicationCandidate, MaintenanceRun } from '../../../../../src/shared';

/**
 * A working weekly run with one candidate whose issue and owned worktree the harness already verified. By default on
 * the synthetic `fixture` project, whose push is not held; pass `cms-field-vocabulary` for the CMS hold.
 */
export async function publicationRun(runId = 'run-1', branch = 'codex/101-restore-x', project: FakeProject = 'fixture') {
    const f = fakeMaintenanceGitHub({ project });
    const issue = f.addIssue({ title: '[Bug] Restore x', body: 'body', assignees: ['JFusco'], labels: ['bug'] });
    const hooks = await pushHookBaseline(f.execute as any, f.project.repo);
    const progress: MaintenancePublicationCandidate = { index: 0, key: 'cms-k', proposalStep: 2,
        issue: { number: issue.number, url: issue.html_url, nodeId: issue.node_id, title: issue.title, effectId: '', adopted: true, at: '' },
        candidate: { branch, worktree: f.project.repo, base: BASE, gitDir: '', gitCommonDir: '', hooks, createdBy: 'maintenance', at: '' } };
    const run = { id: runId, requestedAt: '', startedAt: '', endedAt: '', status: 'working', weekly: true, stage: 'draft-pr', error: '',
        steps: [{ role: 'pm', stage: 'follow-up', at: '', result: {} }, { role: 'pm', stage: 'vendor-review', at: '', result: {} },
            { role: 'developer', stage: 'proposal', at: '', publicationVersion: 1, result: { outcome: 'passed', summary: '', ledger: '', blocker: '', receipts: [], candidates: [{ issue: issue.number, worktree: f.project.repo, branch, head: HEAD, summary: '' }] } }],
        publication: { version: 1, candidates: [progress], evidence: [] } } as unknown as MaintenanceRun;
    f.store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    const owner = (current: () => string | undefined = () => undefined): MaintenanceOwner => ({ run, claim: 'maintenance', subject: 'cms-k', issue: issue.number, current });
    const content = { title: 'fix(sources): restore x', body: `## Summary\nRestore x.\n\nCloses #${issue.number}\n` };
    return { ...f, run, issue, progress, owner, content, branch, head: HEAD };
}
