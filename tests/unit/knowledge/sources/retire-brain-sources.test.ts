import { expect, it } from 'vitest';
import { retireBrainSources } from '../../../../server/knowledge/sources/retire-brain-sources';
import { IntakeLedger } from '../../../../server/knowledge/slack-intake/ledger';
import { collectionPolicy } from '../../../../server/knowledge/sources/collection-policy';
import { intakeFixture } from '../slack-intake/fixture';

it('deletes a Brain-bound source with its ledger, strips the retired field elsewhere, and is idempotent', () => {
    const f = intakeFixture();
    try {
        const stores = new Map([[f.store.project.id, f.store]]);
        const stored = (id: string) => JSON.parse((f.registry.db.prepare('SELECT body FROM knowledge_sources WHERE id=?').get(id) as { body: string }).body);
        const put = (id: string, body: object) => f.registry.db.prepare('UPDATE knowledge_sources SET body=? WHERE id=?').run(JSON.stringify(body), id);
        const kept = f.registry.create({ kind: 'artifact', title: 'Plan', homeProjectId: 'brain' });
        put(kept.id, { ...stored(kept.id), destination: 'project-evidence' });
        put(f.source.id, { ...stored(f.source.id), destination: 'technical-brain', domains: ['tooling'] });
        f.registry.setMeta('seed-budget', { version: 1, limit: 32, members: [] });
        expect(new IntakeLedger(f.store, f.source).all('task')).toHaveLength(1);

        expect(retireBrainSources(f.registry, stores)).toBe(1);
        expect(f.registry.get(f.source.id)).toBeUndefined();
        expect(f.registry.subscriptions(f.source.id)).toEqual([]);
        expect(new IntakeLedger(f.store, f.source).all('task')).toEqual([]);
        expect(f.registry.meta('seed-budget')).toBeUndefined();
        expect(stored(kept.id)).not.toHaveProperty('destination');
        expect(f.registry.get(kept.id)!.sourceDigest).toBe(kept.sourceDigest);

        expect(retireBrainSources(f.registry, stores)).toBe(0);
        // The channel can be registered again as an ordinary Office-private source.
        const again = f.registry.create({ kind: 'slack', title: 'Fixture', homeProjectId: 'brain', cadence: 'daily', authority: f.source.authority });
        expect(() => collectionPolicy(again)).not.toThrow();
    } finally { f.close(); }
});
