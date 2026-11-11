import type { Store } from '../../store/store';
import type { SourceRegistry } from './registry';

/**
 * One-time cleanup after the Brain write path was removed. A source that fed the Brain inbox is deleted with
 * its collection ledger; nothing consumed its evidence. Remaining records lose the retired `destination` key.
 * Idempotent: a second run finds nothing to change.
 */
export function retireBrainSources(registry: SourceRegistry, stores: Map<string, Store>): number {
    return registry.transaction(() => {
        const rows = registry.db.prepare('SELECT id,body FROM knowledge_sources').all() as { id: string; body: string }[];
        let retired = 0;
        for (const row of rows) {
            const body = JSON.parse(row.body) as { destination?: string; domains?: unknown; homeProjectId: string };
            if (body.destination === 'technical-brain') {
                for (const table of ['knowledge_subscriptions', 'knowledge_launches']) registry.db.prepare(`DELETE FROM ${table} WHERE source_id=?`).run(row.id);
                registry.db.prepare('DELETE FROM knowledge_sources WHERE id=?').run(row.id);
                const home = stores.get(body.homeProjectId);
                if (home && home.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='slack_intake'").get()) home.db.prepare("DELETE FROM slack_intake WHERE kind LIKE ? ESCAPE '\\'").run(`${row.id}:%`);
                retired++;
            } else if ('destination' in body) {
                delete body.destination;
                registry.db.prepare('UPDATE knowledge_sources SET body=? WHERE id=?').run(JSON.stringify(body), row.id);
            }
        }
        if (retired) registry.db.prepare("DELETE FROM knowledge_source_meta WHERE id='seed-budget'").run();
        return retired;
    });
}
