import { afterEach, beforeEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { createFeature, commandFeature, featureById } from '../../../server/features/commands';
import { document } from '../../../server/features/documents';
let store: Store, root: string;
beforeEach(() => { root = mkdtempSync(resolve(tmpdir(), 'office-feature-command-')); store = new Store(':memory:', projectById('brain'), root); });
afterEach(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
const create = () => createFeature(store, { action: 'create', requestId: 'create', title: 'Search', intent: 'Find articles' });
test('creation is durable and duplicate requests cannot change content', () => {
    const f = create(); expect(create().id).toBe(f.id);
    expect(() => createFeature(store, { action: 'create', requestId: 'create', title: 'Different', intent: 'Find articles' })).toThrow('different content');
    expect(store.state.features).toHaveLength(1);
    expect(store.state.agents.find(a => a.id === 'analyst')?.name).toBe('Casey');
    expect(JSON.parse((store.db.prepare('SELECT body FROM state WHERE id=1').get() as any).body).features[0].id).toBe(f.id);
});
test('answers identify the current round and all questions; replay stays idempotent', () => {
    const f = create();
    store.transaction(() => { f.status = 'waiting'; f.rounds.push({ id: 'round', revision: 1, questions: [{ id: 'q', question: 'Audience?', recommendation: 'Editors', choices: ['Editors', 'Readers'] }], answers: {}, createdAt: '' }); });
    const input = { action: 'answer', requestId: 'answer', expectedRevision: 1, roundId: 'round', answers: { q: 'Editors' } };
    expect(commandFeature(store, f.id, input).revision).toBe(2);
    expect(commandFeature(store, f.id, input).revision).toBe(2);
    expect(() => commandFeature(store, f.id, { ...input, requestId: 'late' })).toThrow('changed');
    expect(featureById(store, f.id).rounds[0].answers).toEqual({ q: 'Editors' });
});
test('create plan binds the displayed brief and project isolation is enforced', () => {
    const f = create();
    store.transaction(() => { f.status = 'waiting'; f.briefs.push(document(store, f, 'Accepted scope')); });
    expect(() => commandFeature(store, f.id, { action: 'create-plan', requestId: 'bad', expectedRevision: 1, briefDigest: 'stale' })).toThrow('current brief');
    const current = featureById(store, f.id);
    commandFeature(store, f.id, { action: 'create-plan', requestId: 'plan', expectedRevision: 1, briefDigest: current.briefs[0].digest });
    expect(featureById(store, f.id).phase).toBe('plan');
    store.state.features![0].projectId = 'other';
    expect(() => featureById(store, f.id)).toThrow('this project');
});
