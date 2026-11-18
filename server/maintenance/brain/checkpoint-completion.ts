import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { BrainStatusSchema } from './brain-status';
import { publishedWorkCleanedUp } from './published-cleanup';
import { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { DailyCheckpoint, MaintenanceRun } from '../../../src/shared';

const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const verified = z.object({ verified: z.literal(true), uncertain: z.literal(false) });
const coverageSchema = z.object({
    originalWorkId: z.string().min(1), nativeSha256: z.string().regex(/^[a-f0-9]{64}$/),
    completeNativeExecution: z.literal(true), asyncCommandsComplete: z.literal(true),
    delegatedTasksComplete: z.literal(true), allAttemptedEffectsKnown: z.literal(true),
    freshProviderDispositions: z.literal(true), calls: z.array(verified), receipts: z.array(verified),
});
/**
 * Read the original date, not today's slot. A reconciled worker alone is not completion: the native
 * gate must show that date published by this run's own session, the accepted read-back must cover
 * every call and receipt, and git itself must show each published pull request merged and cleaned up.
 * The worker's own follow-up notes have no fixed format and are not read.
 */
export async function brainCheckpointCompletion(store: Store, checkpoint: DailyCheckpoint, run: MaintenanceRun,
    read: (path: string) => string = path => readFileSync(path, 'utf8'), execute: typeof command = command) {
    if (store.project.id !== 'brain' || run.status !== 'reconciled') return;
    const step = run.steps.filter(step => step.stage === 'maintenance-readback').at(-1);
    const coverage = coverageSchema.safeParse((step?.result as unknown as { coverage?: unknown })?.coverage);
    if (step?.result.outcome !== 'passed' || !coverage.success ||
        step.result.receipts.some(receipt => !receipt.verified || receipt.uncertain)) return;
    const workers = (store.state.workLog || []).filter(work => work.requestId === run.id && work.stage === 'brain-maintenance');
    const work = workers.find(work => work.id === coverage.data.originalWorkId);
    if (workers.length !== 1 || !work?.sessionId || !work.endedAt ||
        !['failed', 'blocked', 'interrupted', 'completed'].includes(work.status)) return;
    try {
        const path = resolve(store.project.repo, '.state/nightly.json'), raw = read(path), state = JSON.parse(raw);
        const gate = BrainStatusSchema.parse({ slotDate: checkpoint.date, active: state.active ?? null,
            completed: state.completed?.[checkpoint.date] ?? null, attempts: state.attempts?.[checkpoint.date] ?? 0,
            retryAfter: state.retryAfter ?? null });
        const native = gate.completed;
        if (gate.active || !native || native.authorId !== work.sessionId || native.slotDate !== checkpoint.date ||
            native.outcome !== 'published' || !/^[a-f0-9]{64}$/.test(native.reportSha256 || '') ||
            run.nativeRunId && run.nativeRunId !== native.id ||
            !(Date.parse(native.completedAt) >= Date.parse(work.startedAt) && Date.parse(native.completedAt) <= Date.parse(work.endedAt))) return;
        if (!(Date.parse(step.at) >= Date.parse(native.completedAt)) || !native.prs?.length ||
            !await publishedWorkCleanedUp(execute, store.project.repo, store.project.target, native.prs)) return;
        return { native, originalWorkId: work.id, readbackAt: step.at, cleanupVerifiedFromGit: true, files: [{ path, sha256: hash(raw) }] };
    } catch { return; } // Missing, malformed or incompatible native evidence leaves the notice open.
}
