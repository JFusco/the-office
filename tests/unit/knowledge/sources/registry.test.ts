import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { SourceRegistry } from '../../../../server/knowledge/sources/registry';
import { IntakeBudget } from '../../../../server/knowledge/sources/launch-budget';
import { sourceVisible } from '../../../../server/knowledge/sources/visibility';
import { SlackReadAuthority } from '../../../../server/knowledge/slack-intake/read-authority';
import { config, } from '../slack-intake/fixture';
const authority = () => SlackReadAuthority.parse({ workspace: config.workspace, appId: config.appId, channels: config.channels, tools: config.tools, publicHosts: config.publicHosts });
const input = (homeProjectId = 'cec') => ({ kind: 'slack', title: 'Project discussions', homeProjectId, authority: authority() });
function fixture() { const db = new DatabaseSync(':memory:'); return { registry: new SourceRegistry(db, { now: () => new Date('2026-11-09T17:00:00Z'), monotonic: () => 0 }), close: () => db.close() }; }
describe('shared knowledge source registry', () => {
    it('shares one source without moving its home or changing authority; revokes only the selected grant', () => {
        const f = fixture(); try {
            const s = f.registry.create(input()); f.registry.subscribe(s.id, 'other', true);
            expect(f.registry.all()).toHaveLength(1); expect(f.registry.get(s.id)?.homeProjectId).toBe('cec');
            expect(sourceVisible(f.registry, s.id, 'other')).toBe(true);
            f.registry.subscribe(s.id, 'other', false);
            expect(sourceVisible(f.registry, s.id, 'other')).toBe(false); expect(sourceVisible(f.registry, s.id, 'cec')).toBe(true);
            const next = f.registry.update(s.id, s.revision, x => { x.state = 'paused'; x.cadence = 'weekly'; });
            expect(next.sourceDigest).toBe(s.sourceDigest); expect(sourceVisible(f.registry, s.id, 'cec')).toBe(true);
            f.registry.update(s.id, next.revision, x => { x.state = 'withdrawn'; });
            expect(sourceVisible(f.registry, s.id, 'cec')).toBe(false);
        } finally { f.close(); }
    });
    it('rejects duplicate collectors, project-to-Brain conversion and stale edits', () => {
        const f = fixture(); try {
            const s = f.registry.create(input());
            expect(() => f.registry.create(input('other'))).toThrow('already registered');
            expect(() => f.registry.create({ ...input(), domains: ['tooling'] })).toThrow();
            expect(() => f.registry.update(s.id, s.revision, x => { x.destination = 'technical-brain'; x.homeProjectId = 'brain'; x.domains = ['tooling']; })).toThrow('immutable');
            expect(() => f.registry.update(s.id, 0, () => {})).toThrow('changed');
            const other = f.registry.create({ ...input(), authority: { ...authority(), workspace: 'https://another.slack.com' } });
            expect(other.id).not.toBe(s.id);
        } finally { f.close(); }
    });
    it('charges all homes to one allowance and releases only proven unspawned reservations', () => {
        const f = fixture(); try {
            const budget = new IntakeBudget(f.registry);
            for (let n = 0; n < 8; n++) expect(budget.reserve(`attempt-${n}`, n % 2 ? 'source-a' : 'source-b')).toBe(true);
            expect(budget.reserve('ninth', 'source-c')).toBe(false);
            budget.launched('attempt-0'); budget.notSpawned('attempt-0'); expect(budget.used()).toBe(8);
            budget.notSpawned('attempt-1'); expect(budget.reserve('replacement', 'source-c')).toBe(true);
            expect(budget.reserve('replacement', 'source-c')).toBe(false); expect(budget.used()).toBe(8);
            budget.defer('w', 'a', 'search', '2026-11-09T18:00:00Z'); budget.defer('w', 'a', 'search', '2026-11-09T17:00:00Z');
            expect(budget.backoff('w', 'a', 'search')).toBe('2026-11-09T18:00:00Z');
            expect(budget.backoff('w', 'b', 'search')).toBeUndefined();
        } finally { f.close(); }
    });
});
