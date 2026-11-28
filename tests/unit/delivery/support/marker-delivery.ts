import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { vi } from 'vitest';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { ReleaseMarkerCorrectionResultSchema } from '../../../../server/workers/agents';
import { currentAssignment } from '../../../../server/workers/assignment-context';
import type { Evidence, StageResult } from '../../../../src/shared';
import { markedPublication } from './marker-publication';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';

const APPROACH = { plan: 'none', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Synthetic' } as const;

/** One scripted worker turn: the developer's commits (for implement), or the correction it proposes. */
export type Turn =
    | { kind: 'implement'; commits: { files: Record<string, string | null>; message: string }[]; result?: Partial<StageResult> }
    | { kind: 'correction'; messages: (shas: string[]) => { sha: string; message: string }[]; result?: Record<string, unknown>; throws?: Error }
    | { kind: 'review' }
    | { kind: 'validate' };

/**
 * A hands-off CMS implement job on a real worktree, published through the synthetic GitHub, whose workers are
 * scripted turns. Every worker is recorded the way the runtime records one: a completed `workLog` entry on the current
 * claim, with its saved `provider.json` and `result.json`.
 */
export function markerDelivery(options: { onDisk?: boolean } = {}) {
    const p = markedPublication({ onDisk: options.onDisk });
    Object.assign(p.job, { stage: 'implement', status: 'queued', head: '', approach: undefined });
    /** The live store, engine, delivery and job; a reopen replaces them as a restarted service would. */
    const ctx = { store: p.store, engine: p.engine, job: p.job, delivery: new GitHubDelivery(p.store, p.engine, p.execute as any) };
    const turns: Turn[] = [], dispatched: { role: string; schema: unknown; options: any }[] = [];
    const record = (role: string, stage: string, readOnly: boolean, result: unknown) => {
        const { store, job } = ctx, claim = currentAssignment()!.claim, id = randomUUID(), at = store.clock.now().toISOString();
        (store.state.workLog ??= []).push({ id, requestId: job.id, ticket: job.key, role, provider: role === 'developer' ? 'claude' : 'codex', stage, status: 'completed', claimId: claim.id,
            sessionId: id, startedAt: at, endedAt: at, lane: 'delivery' } as any);
        const dir = resolve(store.dataRoot, 'sessions', id);
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, 'provider.json'), JSON.stringify({ project: store.project.id, repository: store.project.repository, role, readOnly }));
        writeFileSync(resolve(dir, 'result.json'), JSON.stringify({ session: id, result }));
        return id;
    };
    const evidence = (kind: Evidence['kind'], commit: string): Evidence => {
        const path = resolve(p.artifactRoot(ctx.job), `${kind}-${commit}-${randomUUID()}.txt`);
        writeFileSync(path, `synthetic ${kind} at ${commit}`);
        return { id: `${kind}-${commit.slice(0, 7)}`, kind, summary: 'Synthetic', path, commit, environment: 'test', url: '', observedAt: '' };
    };
    const base = (commit: string): StageResult => ({ outcome: 'passed', summary: 'Synthetic', commit, worktree: ctx.job.worktree, branch: ctx.job.branch, blocker: '', evidence: [], findings: [], receipts: [],
        previewUrl: '', prId: 0, qaRunDir: '', paidRuns: 0, approach: null, prerequisites: [] } as unknown as StageResult);
    const pending = () => Object.values(ctx.job.releaseMarkerReturns ?? {}).find(item => item.status === 'pending');
    const script = (engine: typeof p.engine) => vi.spyOn(engine.agents, 'run').mockImplementation((async (role: string, _task: string, schema: unknown, options: any) => {
        dispatched.push({ role, schema, options });
        const turn = turns.shift();
        if (!turn) throw new Error('No scripted worker turn');
        if (turn.kind === 'implement') {
            for (const c of turn.commits) p.commit(c.files, c.message);
            const head = p.git(['rev-parse', 'HEAD']).trim();
            const result = { ...base(head), approach: APPROACH, evidence: [evidence('checks', head)], ...turn.result } as StageResult;
            record(role, options.stage, !!options.readOnly, result);
            return result;
        }
        if (turn.kind === 'correction') {
            if (turn.throws) throw turn.throws;
            const current = pending()!;
            const parsed = ReleaseMarkerCorrectionResultSchema.parse({ ...base(current.refusedHead), messages: turn.messages(current.offending.map(c => c.sha)), ...turn.result, resolution: null });
            record(role, options.stage, !!options.readOnly, parsed);
            return parsed;
        }
        const head = p.git(['rev-parse', 'HEAD']).trim();
        if (turn.kind === 'validate') return { ...base(head), evidence: [evidence('checks', head)] } as StageResult;
        return { ...base(head), evidence: [evidence('review', head)] } as StageResult;
    }) as never);
    script(ctx.engine);
    const step = () => claimedDelivery(ctx.store, ctx.job, () => ctx.delivery.step(ctx.job));
    /** Save, close and open the store again, recover it, and keep scripting workers on the new engine. */
    const restart = () => {
        ctx.store.save();
        const { store, engine } = p.reopen();
        store.recover();
        Object.assign(ctx, { store, engine, job: store.state.coordination!.jobs!.find(item => item.id === ctx.job.id)!, delivery: new GitHubDelivery(store, engine, p.execute as any) });
        script(engine);
    };
    return { ...p, turns, dispatched, step, pending, restart,
        get job() { return ctx.job; }, get store() { return ctx.store; }, get engine() { return ctx.engine; }, get delivery() { return ctx.delivery; } };
}
