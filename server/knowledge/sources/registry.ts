import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Clock } from '../../office/clock';
import { systemClock } from '../../office/clock';
import type { SourceSubscription } from '../../../src/contracts/knowledge-sources';
import { SlackReadAuthority } from '../slack-intake/read-authority';
import { sourceSchema } from './schema';
import { SourceInput, sourceDigest, sourceIdentity, type KnowledgeSource } from './source-record';

/** One private registry; no source content or authority is added to office_knowledge. */
export class SourceRegistry {
    constructor(readonly db: DatabaseSync, readonly clock: Clock = systemClock) { sourceSchema(db); }
    transaction<T>(fn: () => T): T {
        this.db.exec('BEGIN IMMEDIATE');
        try { const result = fn(); this.db.exec('COMMIT'); return result; }
        catch (error) { this.db.exec('ROLLBACK'); throw error; }
    }
    get(id: string): KnowledgeSource | undefined {
        const row = this.db.prepare('SELECT body FROM knowledge_sources WHERE id=?').get(id) as { body: string } | undefined;
        return row && JSON.parse(row.body);
    }
    all(): KnowledgeSource[] { return (this.db.prepare('SELECT body FROM knowledge_sources ORDER BY id').all() as { body: string }[]).map(r => JSON.parse(r.body)); }
    home(project: string): KnowledgeSource[] { return this.all().filter(s => s.homeProjectId === project); }
    create(value: unknown, state: KnowledgeSource['state'] = 'active'): KnowledgeSource {
        const input = SourceInput.parse(value), identity = sourceIdentity(input);
        return this.transaction(() => {
            if (identity) {
                const row = this.db.prepare('SELECT body FROM knowledge_sources WHERE identity=?').get(identity) as { body: string } | undefined;
                if (row) {
                    const retained: KnowledgeSource = JSON.parse(row.body);
                    if (retained.state !== 'removed' || retained.homeProjectId !== input.homeProjectId || retained.sourceDigest !== sourceDigest(input)) throw Error(`Source already registered: ${retained.id}; share the existing source`);
                    retained.state = state; retained.revision++; retained.updatedAt = this.clock.now().toISOString();
                    this.db.prepare('UPDATE knowledge_sources SET revision=?,body=? WHERE id=?').run(retained.revision, JSON.stringify(retained), retained.id);
                    return retained;
                }
            }
            const at = this.clock.now().toISOString(), source: KnowledgeSource = { ...input, cadence: input.kind === 'artifact' ? 'manual' : input.cadence,
                id: randomUUID(), state, revision: 1, sourceDigest: sourceDigest(input), createdAt: at, updatedAt: at };
            this.db.prepare('INSERT INTO knowledge_sources VALUES(?,?,?,?)').run(source.id, identity || null, source.revision, JSON.stringify(source));
            this.db.prepare('INSERT INTO knowledge_subscriptions VALUES(?,?,1,1,?)').run(source.id, source.homeProjectId, at);
            return source;
        });
    }
    update(id: string, revision: number, change: (s: KnowledgeSource) => void): KnowledgeSource {
        return this.transaction(() => {
            const source = this.get(id); if (!source || source.revision !== revision) throw Error('Source changed; reload before editing');
            const home = source.homeProjectId, identity = sourceIdentity(source);
            change(source);
            const { id: _id, state: _state, revision: _revision, sourceDigest: _digest, createdAt: _created, updatedAt: _updated, refreshRequestedAt: _refresh, ...input } = source;
            SourceInput.parse(input);
            if (source.id !== id || source.homeProjectId !== home || sourceIdentity(source) !== identity) throw Error('Source identity and home are immutable');
            source.revision++; source.updatedAt = this.clock.now().toISOString(); source.sourceDigest = sourceDigest(source);
            this.db.prepare('UPDATE knowledge_sources SET revision=?,body=? WHERE id=?').run(source.revision, JSON.stringify(source), id);
            return source;
        });
    }
    subscribe(id: string, project: string, active: boolean): void {
        if (!this.get(id)) throw Error('Unknown source');
        this.db.prepare(`INSERT INTO knowledge_subscriptions VALUES(?,?,?,1,?) ON CONFLICT(source_id,project_id) DO UPDATE SET active=excluded.active, revision=knowledge_subscriptions.revision+1, updated_at=excluded.updated_at`).run(id, project, active ? 1 : 0, this.clock.now().toISOString());
    }
    subscriptions(id: string): SourceSubscription[] {
        return (this.db.prepare('SELECT project_id,active,revision,updated_at FROM knowledge_subscriptions WHERE source_id=? ORDER BY project_id').all(id) as { project_id: string; active: number; revision: number; updated_at: string }[])
            .map(r => ({ projectId: r.project_id, active: !!r.active, revision: r.revision, updatedAt: r.updated_at }));
    }
    authorized(id: string, project: string): boolean { return this.subscriptions(id).some(s => s.projectId === project && s.active); }
    authority(id: string): { source: KnowledgeSource; authority: SlackReadAuthority } {
        const source = this.get(id); if (!source || source.kind !== 'slack') throw Error('Unknown Slack source');
        return { source, authority: SlackReadAuthority.parse(source.authority) };
    }
    meta<T>(id: string): T | undefined {
        const row = this.db.prepare('SELECT body FROM knowledge_source_meta WHERE id=?').get(id) as { body: string } | undefined;
        return row && JSON.parse(row.body);
    }
    setMeta(id: string, value: unknown): void { this.db.prepare('INSERT INTO knowledge_source_meta VALUES(?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(id, JSON.stringify(value)); }
}
