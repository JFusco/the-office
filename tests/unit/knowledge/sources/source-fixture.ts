import { DatabaseSync } from 'node:sqlite';
import { digest } from '../../../../server/knowledge/digest';
import { IntakeBudget } from '../../../../server/knowledge/sources/launch-budget';
import { SourceLedger } from '../../../../server/knowledge/sources/ledger';
import { SourceRegistry } from '../../../../server/knowledge/sources/registry';
import { knowledgeStore } from '../knowledge-fixture';

export const cleanScan = async (text: string) => ({ version: 1 as const, inputSha256: digest(text), scannerVersion: 'synthetic', policyVersion: 'fixture-v1', clean: true, findings: [] });
/** An enabled Brain store with one registered public link source and its private ledger. */
export function sourceFixture() {
    const f = knowledgeStore('brain', '2026-11-06T23:00:00Z'); f.store.state.knowledge!.enabled = true;
    const db = new DatabaseSync(':memory:'), registry = new SourceRegistry(db, f.store.clock);
    const source = registry.create({ kind: 'link', title: 'Fixture', homeProjectId: 'brain', cadence: 'weekly', url: 'https://www.sqlite.org/docs.html' });
    return { ...f, close: () => { db.close(); f.close(); }, registry, source, ledger: new SourceLedger(f.store, source), budget: new IntakeBudget(registry) };
}
