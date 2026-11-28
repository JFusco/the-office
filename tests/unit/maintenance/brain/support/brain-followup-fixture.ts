import { Engine } from '../../../../../server/scheduling/engine';
import { BrainFollowup } from '../../../../../server/maintenance/brain/brain-followup';
import { fakeMaintenanceGitHub } from '../../publication/support/fake-maintenance-github';
import { BODY } from '../../publication/support/issue-body';
import { fakeEnvironment, install, passingRecord } from '../../../workers/qualification/support';
import { policyTemplate } from '../../../../../server/workers/qualification/policy-templates';
import type { MaintenanceRun } from '../../../../../src/shared';

/**
 * A reconciled Brain run whose catalog refresh failed, on the synthetic GitHub and board, with a diagnosis worker to
 * script. Scripting the diagnosis also installs its `codex-reader` record for `maintenance-blocker` on an injected
 * host (`qualify`), since a saved diagnosis routes only while that policy is qualified; without `diagnose` the real
 * runtime launch is refused for want of a record.
 */
export function brainFixture() {
    const f = fakeMaintenanceGitHub({ project: 'brain' });
    f.state.labels = ['bug', 'area:catalog'];
    const engine = new Engine(f.store, undefined, undefined, undefined, undefined, f.execute as any);
    const run: MaintenanceRun = { id: 'original', requestedAt: '', startedAt: '', endedAt: '', status: 'reconciled', weekly: false, stage: 'brain-maintenance', error: '',
        steps: [{ role: 'pm', stage: 'brain-maintenance', at: '', result: { outcome: 'blocked', summary: 'Content Hub catalog lost sitemap coverage', ledger: 'Keep refresh #273 open', blocker: 'catalog-refresh-incomplete', receipts: [], candidates: [] } }] };
    f.store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    f.store.state.coordination!.enabled = true;
    engine.github.board = f.board as any;
    const followup = new BrainFollowup(f.store, engine, f.execute as any);
    let workers = 0;
    const qualify = (sha256?: string) => {
        install(f.store.dataRoot, passingRecord(policyTemplate('codex-reader'), ['maintenance-blocker']), 'codex-reader');
        engine.agents.qualification = fakeEnvironment(sha256 ? { sha256 } : {});
    };
    const diagnose = (decision: Record<string, unknown> = {}) => {
        qualify();
        engine.agents.run = (async (_role: string, task: string, _schema: unknown, options: any) => {
            workers++;
            const current = f.store.state.maintenance!.runs.find(item => item.id === options.requestId);
            if (current?.blockerFollowup?.status !== 'working') throw new Error('the follow-up must be persisted as working first');
            return { decision: 'create', issue: 0, title: '[Bug] Restore Content Hub sitemap coverage', body: BODY, labels: ['bug', 'area:catalog'], source: 'Content Hub', defect: 'lost sitemap coverage', summary: 'One repair', blocker: '', task, options, ...decision };
        }) as any;
    };
    const pump = () => f.claimed(run, 'continuation', () => followup.pump(run));
    /** Runs the read-back of the stopped follow-up under its own running `reconcile-maintenance` request. */
    const readBack = async (board = f.board) => {
        const { readBackFollowup } = await import('../../../../../server/maintenance/brain/brain-followup-readback');
        const request = { id: `req-${crypto.randomUUID()}`, action: 'reconcile-maintenance', key: run.id, head: '', lane: 'delivery', requestedAt: '', status: 'working', detail: '' } as any;
        f.store.state.coordination!.requests = [...(f.store.state.coordination!.requests || []), request];
        return f.claimed(run, 'reconciliation', () => readBackFollowup(f.store, f.execute as any, run, board), 'reconcile-maintenance', request.id);
    };
    return { ...f, engine, run, followup, diagnose, qualify, readBack, pump, workers: () => workers };
}
