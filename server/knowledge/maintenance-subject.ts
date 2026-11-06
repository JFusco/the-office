import { resolve } from 'node:path';
import type { MaintenanceRun, Role } from '../../src/shared';
import type { Store } from '../store/store';
import type { RetrospectiveSubject } from './retrospective-subject';
import { maintenanceKey } from './maintenance-triggers';

/** What only a maintenance run has: its ledgers, the harness error and where it saved files. Pure: no filesystem reads. */
export interface MaintenanceSubjectFacts {
    weekly: boolean;
    error: string;
    /** `.local/projects/<id>/runs/<runId>`: stage results (`<n>-<stage>.json`) and worker evidence. */
    artifactsRoot: string;
    steps: { role: Role; at: string; ledger: string; candidates: number; checks: number }[];
}

/** One CMS maintenance run as a retrospective subject. Stage results map onto the shared step shape; no findings or CI repairs exist. */
export function maintenanceSubject(store: Pick<Store, 'dataRoot'>, run: MaintenanceRun): RetrospectiveSubject {
    const artifactsRoot = resolve(store.dataRoot, 'runs', run.id), last = run.steps.at(-1);
    const head = (step: MaintenanceRun['steps'][number] | undefined) => step?.result.candidates.at(-1)?.head || '';
    return { kind: 'maintenance', id: run.id, key: maintenanceKey(run), status: run.status, stage: run.stage, detail: last?.result.blocker || run.error || last?.result.summary || '',
        issueUrl: '', pr: 0, prUrl: '', head: head(last), approach: last?.result.approach || undefined,
        steps: run.steps.map(step => ({ stage: step.stage, result: { outcome: step.result.outcome, summary: step.result.summary, blocker: step.result.blocker, commit: head(step), findings: [], receipts: step.result.receipts || [], evidence: [], resolution: null } })),
        decisions: run.decisions || [], ciRepairs: [], timing: run.timing || [], reroutes: run.steps.filter(step => step.result.outcome === 'reroute').length,
        maintenance: { weekly: run.weekly, error: run.error, artifactsRoot,
            steps: run.steps.map(step => ({ role: step.role, at: step.at, ledger: step.result.ledger, candidates: step.result.candidates.length, checks: step.result.checks?.length || 0 })) } };
}
