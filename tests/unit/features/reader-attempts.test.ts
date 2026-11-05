import { expect, test } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { createFeature } from '../../../server/features/commands';
import { beginReader, acceptReader } from '../../../server/features/reader-attempts';
import { FeatureWorkflow } from '../../../server/features/workflow';
import { featureById, commandFeature } from '../../../server/features/commands';
import { fixture } from './test-store';
test('a late same-revision reader preserves evidence without replacing the current brief', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-feature-reader-')), store = new Store(':memory:', projectById('brain'), root);
    try {
        const f = createFeature(store, { action: 'create', requestId: 'one', title: 'Feature', intent: 'Find things' });
        f.baseline = { repository: store.project.repository, path: '/snapshot', ref: 'main', sha: 'a', files: {}, scope: [] };
        const old = beginReader(store, f); old.status = 'interrupted'; f.status = 'queued';
        const current = beginReader(store, f);
        expect(acceptReader(store, f, old, { summary: 'old', brief: 'old', questions: [], ready: true })).toBe(false);
        expect(f.briefs).toHaveLength(0);
        expect(existsSync(resolve(root, 'features', f.id, 'readers', old.id + '.json'))).toBe(true);
        expect(acceptReader(store, f, current, { summary: 'Ready', brief: 'Current full brief', questions: [], ready: true })).toBe(true);
        expect(f.briefs[0].markdown).toBe('Current full brief'); expect(f.status).toBe('waiting');
    } finally { store.close(); rmSync(root, { recursive: true, force: true }); }
});
test('malformed plan output persists a failed attempt and blocked feature after rollback', async () => {
    const f = fixture();
    try {
        f.feature.phase = 'plan';
        f.feature.baseline = { repository: f.store.project.repository, path: f.root, ref: 'main', sha: 'a', files: {}, scope: [] };
        const workers = { active: new Map(), run: async () => ({ summary: 'Plan', markdown: 'Missing manifest', scope: ['app.ts'], questions: [] }) };
        const workflow = new FeatureWorkflow(f.store, workers as any, undefined, () => ({ context: async () => '' }) as any);
        await workflow.step(f.feature.id);
        const current = featureById(f.store, f.feature.id);
        expect(current).not.toBe(f.feature);
        expect(current.status).toBe('blocked'); expect(current.attempts[0].status).toBe('failed');
        const persisted = JSON.parse((f.store.db.prepare('SELECT body FROM state WHERE id=1').get() as any).body).features[0];
        expect(persisted.status).toBe('blocked'); expect(persisted.attempts[0].status).toBe('failed');
    } finally { f.close(); }
});
test('feature pause only cancels its own running reader controller', async () => {
    const f = fixture();
    try {
        const unrelated = new AbortController(), active = new Map([['developer', unrelated]]);
        f.feature.activeAttempt = 'failed'; f.feature.attempts.push({ id: 'failed', stage: 'feature-plan', status: 'failed' } as any);
        let finish!: (output: unknown) => void, started!: () => void;
        const running = new Promise<void>(resolve => { started = resolve; });
        const own = new AbortController();
        const workers = { active, run: () => { active.set('developer', own); started(); return new Promise(resolve => { finish = resolve; }); } };
        const workflow = new FeatureWorkflow(f.store, workers as any, undefined, () => ({ context: async () => '' }) as any);
        workflow.pause(f.feature.id); workflow.pause(); expect(unrelated.signal.aborted).toBe(false);
        f.feature.phase = 'plan'; f.feature.baseline = { repository: f.store.project.repository, path: f.root, ref: 'main', sha: 'a', files: {}, scope: [] };
        const step = workflow.step(f.feature.id); await running;
        commandFeature(f.store, f.feature.id, { action: 'pause', requestId: 'pause', expectedRevision: 1 });
        workflow.pause(f.feature.id);
        expect(own.signal.aborted).toBe(true); expect(unrelated.signal.aborted).toBe(false);
        // A replacement capacity holder is never canceled by this feature's historical role.
        active.set('developer', unrelated); workflow.pause(); expect(unrelated.signal.aborted).toBe(false);
        expect(() => f.store.transaction(() => { throw new Error('Concurrent rollback'); })).toThrow();
        finish({ summary: 'Late', markdown: 'Unused', scope: ['app.ts'], questions: [] }); await step;
        const current = featureById(f.store, f.feature.id);
        expect(current.status).toBe('blocked'); expect(current.attempts.at(-1)?.status).toBe('interrupted'); expect(current.plans).toHaveLength(0);
    } finally { f.close(); }
});
