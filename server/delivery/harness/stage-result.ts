import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Receipt, StageResult, TicketJob } from '../../../src/shared';

export function receipt(id: string, action: string, target: string, detail: string): Receipt {
    return { id, action, target, verified: true, uncertain: false, detail };
}

/** Saves harness evidence under the job's artifact directory and returns a passed StageResult for the normal step tail. */
export function harnessStageResult(job: TicketJob, root: string, input: {
    stage: string;
    summary: string;
    commit: string;
    receipts?: Receipt[];
    prId?: number;
    evidence: Record<string, unknown>;
}): StageResult {
    mkdirSync(root, { recursive: true, mode: 0o700 });
    const path = resolve(root, `harness-${input.stage}-${job.steps.length}-${crypto.randomUUID()}.json`);
    writeFileSync(path, JSON.stringify({ stage: input.stage, commit: input.commit, at: new Date().toISOString(), ...input.evidence }, null, 2), { mode: 0o600 });
    return {
        outcome: 'passed', summary: input.summary, commit: input.commit, blocker: '', findings: [],
        receipts: input.receipts || [],
        evidence: [{ id: crypto.randomUUID(), kind: 'checks', summary: `Office harness ${input.stage} read-back`, path, commit: input.commit, environment: 'Office harness', url: '', observedAt: new Date().toISOString() }],
        worktree: job.worktree, branch: job.branch, prId: input.prId ?? job.pr, previewUrl: '', qaRunDir: '', paidRuns: 0,
        approach: null, prerequisites: null, resolution: null,
    };
}
