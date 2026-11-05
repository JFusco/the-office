import { expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { createFeature } from '../../../server/features/commands';
import { importReview, FeatureReviewRunner } from '../../../server/features/review-run';
import { commandFeature, featureById } from '../../../server/features/commands';
import { fixture } from './test-store';
import { FeatureWorkflow } from '../../../server/features/workflow';
test('review import stores the full accepted artifact and pending decisions block approval', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-review-import-')), store = new Store(':memory:', projectById('brain'), root);
    try {
        const f = createFeature(store, { action: 'create', requestId: 'create', title: 'Search', intent: 'Find content' });
        f.phase = 'review'; f.review = { run: 'owned' } as any;
        const evidence = { run: 'owned', status: 'needs_user', stage: 'adjudicate', revision: 2, fingerprint: 'f', researchDigest: 'r', error: '', findings: [{ id: 'FIND-001', disposition: 'PENDING_USER', evidence: 'Which audience?', correction_recommended: 'Editors', rationale: '' }] } as any;
        importReview(store, f, evidence); importReview(store, f, evidence);
        expect(f.rounds).toHaveLength(1); expect(f.status).toBe('waiting'); expect(f.phase).toBe('review');
        const manifest = { provider: 'github', destination: store.project.repository, items: [{ id: 'one', title: 'First', key: '', action: 'create', predecessor: '', criteria: ['Works'], operations: [{ id: 'create', kind: 'create', payload: {}, expected: {} }] }] };
        const plan = 'Full refined implementation checklist\n\x60\x60\x60feature-manifest\n' + JSON.stringify(manifest) + '\n\x60\x60\x60';
        importReview(store, f, { ...evidence, revision: 4, status: 'complete', findings: [], plan, artifact: 'accepted.json' });
        expect(f.plans[0].markdown).toBe(plan); expect(f.phase).toBe('approval');
        importReview(store, f, { ...evidence, revision: 4, status: 'complete', findings: [], plan, artifact: 'accepted.json' });
        expect(f.plans).toHaveLength(1);
    } finally { store.close(); rmSync(root, { recursive: true, force: true }); }
});
function reviewing() {
    const f = fixture();
    f.feature.phase = 'review';
    f.feature.baseline = { path: f.root, repository: f.store.project.repository, sha: 'a', ref: 'main', scope: [], files: {} };
    f.feature.plans.push({ markdown: 'Draft' } as any);
    f.feature.review = { attemptDir: resolve(f.root, 'attempt'), run: resolve(f.root, 'review'), processes: [], revision: 2, pendingDecision: '{"FIND-1":"Editors"}' } as any;
    const evidence = { run: f.feature.review!.run, revision: 2, status: 'needs_user', findings: [], fallbacks: {}, timeout: 60, stage: 'adjudicate' } as any;
    return { ...f, evidence };
}
test('helper checkpoint updates re-resolve live review state after a concurrent rollback', async () => {
    const f = reviewing();
    try {
        const calls: string[][] = [];
        let inspections = 0;
        const runner = new FeatureReviewRunner(f.store, async (_program, args) => {
            calls.push(args);
            expect(() => f.store.transaction(() => { throw new Error('Concurrent rollback'); })).toThrow();
            return '';
        }, async () => ++inspections === 1 ? f.evidence : { ...f.evidence, status: 'ready', revision: 3, stage: 'refine' });
        await runner.step(f.feature);
        const current = featureById(f.store, f.feature.id);
        expect(current).not.toBe(f.feature); expect(current.review!.pendingDecision).toBeUndefined();
        expect(current.status).toBe('queued');
        expect(calls[0].slice(1, 4)).toEqual(['decide', f.evidence.run, '--instruction']);
        expect(JSON.parse(calls[0][4])).toEqual({ 'FIND-1': 'Editors' });
        await runner.waitForIdle();
    } finally { f.close(); }
});
test('a failed helper transaction leaves the live feature blocked and the runner idle', async () => {
    const f = reviewing();
    try {
        const runner = new FeatureReviewRunner(f.store, async () => {
            f.store.transaction(() => { throw new Error('Helper failed'); });
            return '';
        }, async () => f.evidence);
        const workflow = new FeatureWorkflow(f.store, { active: new Map() } as any);
        Object.assign(workflow, { review: runner });
        await workflow.step(f.feature.id);
        expect(featureById(f.store, f.feature.id)).toMatchObject({ status: 'blocked', detail: 'Error: Helper failed' });
        await runner.waitForIdle();
    } finally { f.close(); }
});
test('decisions for an older helper revision are never submitted to its next needs_user revision', async () => {
    const f = reviewing();
    try {
        let dispatches = 0;
        const runner = new FeatureReviewRunner(f.store, async () => { dispatches++; return ''; }, async () => ({ ...f.evidence, revision: 3, findings: [{ id: 'FIND-2', disposition: 'PENDING_USER', evidence: 'New decision', correction_recommended: 'New answer' }] }));
        await runner.step(f.feature);
        expect(dispatches).toBe(0); expect(f.feature.review!.pendingDecision).toBeUndefined();
        expect(f.feature.rounds.at(-1)).toMatchObject({ reviewRun: f.evidence.run, reviewRevision: 3, answers: {} });
    } finally { f.close(); }
});
test('all pending findings are answered in rounds of three before deciding', () => {
    const f = fixture();
    try {
        f.feature.phase = 'review'; f.feature.review = { run: 'run-a' } as any;
        const evidence = { run: 'run-a', status: 'needs_user', revision: 2, findings: [1, 2, 3, 4].map(n => ({ id: 'FIND-' + n, disposition: 'PENDING_USER', evidence: 'Decision ' + n, correction_recommended: 'Accept' })) } as any;
        importReview(f.store, f.feature, evidence); importReview(f.store, f.feature, evidence);
        let round = f.feature.rounds.at(-1)!;
        expect(round.questions).toHaveLength(3);
        const answer = (requestId: string) => commandFeature(f.store, f.feature.id, { action: 'answer', requestId, expectedRevision: 1, roundId: round.id, answers: Object.fromEntries(round.questions.map(q => [q.id, 'Accept ' + q.id])) });
        answer('first');
        expect(f.feature.review!.pendingDecision).toBeUndefined(); expect(f.feature.status).toBe('waiting');
        round = f.feature.rounds.at(-1)!; expect(round.questions.map(q => q.id)).toEqual(['FIND-4']);
        importReview(f.store, f.feature, evidence); expect(f.feature.rounds).toHaveLength(2);
        answer('second');
        expect(JSON.parse(f.feature.review!.pendingDecision!)).toEqual({ 'FIND-1': 'Accept FIND-1', 'FIND-2': 'Accept FIND-2', 'FIND-3': 'Accept FIND-3', 'FIND-4': 'Accept FIND-4' });
        expect(f.feature.status).toBe('queued');
    } finally { f.close(); }
});
test('helper run identity keeps prior lineage answers out of a new run at the same revision', () => {
    const f = fixture();
    try {
        const evidence = { run: 'run-a', status: 'needs_user', revision: 2, findings: [{ id: 'FIND-1', disposition: 'PENDING_USER', evidence: 'Audience?', correction_recommended: 'Editors' }] } as any;
        f.feature.phase = 'review'; f.feature.review = { run: 'run-a' } as any;
        importReview(f.store, f.feature, evidence);
        const old = f.feature.rounds[0];
        commandFeature(f.store, f.feature.id, { action: 'answer', requestId: 'old-answer', expectedRevision: 1, roundId: old.id, answers: { 'FIND-1': 'Editors' } });
        commandFeature(f.store, f.feature.id, { action: 'revise', requestId: 'revise', expectedRevision: 1, instruction: 'Readers instead' });
        f.feature.phase = 'review'; f.feature.review = { run: 'run-b' } as any;
        importReview(f.store, f.feature, { ...evidence, run: 'run-b' }); importReview(f.store, f.feature, { ...evidence, run: 'run-b' });
        expect(f.feature.rounds).toHaveLength(2); expect(f.feature.rounds[1]).toMatchObject({ revision: 2, reviewRun: 'run-b', answers: {} });
        expect(f.feature.review!.pendingDecision).toBeUndefined();
        expect(() => commandFeature(f.store, f.feature.id, { action: 'answer', requestId: 'stale', expectedRevision: 2, roundId: old.id, answers: { 'FIND-1': 'Editors' } })).toThrow('no longer current');
        const current = featureById(f.store, f.feature.id), round = current.rounds[1];
        commandFeature(f.store, current.id, { action: 'answer', requestId: 'new', expectedRevision: 2, roundId: round.id, answers: { 'FIND-1': 'Readers' } });
        expect(JSON.parse(current.review!.pendingDecision!)).toEqual({ 'FIND-1': 'Readers' });
    } finally { f.close(); }
});
