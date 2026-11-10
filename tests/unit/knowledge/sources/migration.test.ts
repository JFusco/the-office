import { test, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { knowledgeStore } from '../knowledge-fixture';
import { config } from '../slack-intake/fixture';
import { configDigest,digest } from '../../../../server/knowledge/slack-intake/config';
import { IntakeLedger } from '../../../../server/knowledge/slack-intake/ledger';
import { SourceRegistry } from '../../../../server/knowledge/sources/registry';
import { migrateIntake } from '../../../../server/knowledge/sources/migration';
import { IntakeBudget } from '../../../../server/knowledge/sources/launch-budget';
import { scheduledSlackIntake } from '../../../../server/knowledge/slack-intake/schedule';

test.each([true, false])('legacy import enabled=%s preserves frozen identities and ignores subsequent file changes', enabled => {
    const f = knowledgeStore(), db = new DatabaseSync(':memory:'), registry = new SourceRegistry(db, f.store.clock);
    try {
        const old = { ...config, enabled, channels: [...config.channels, { id: 'C456', name: 'second' }] }, hash = configDigest(old);
        const path = resolve(f.store.dataRoot, 'slack-intake/config.json'); mkdirSync(resolve(f.store.dataRoot, 'slack-intake'));
        const bytes = JSON.stringify(old); writeFileSync(path, bytes, { mode: 0o600 });
        const legacy = new IntakeLedger(f.store);
        legacy.put('task', 'original-task', { id: 'original-task', channel: 'C123', status: 'complete', configHash: hash, oldest: '0.000000', latest: '123.456789', cursor: 'opaque' });
        legacy.put('unit', 'C123:1:v', { id: 'C123:1', version: 'v', channel: 'C123', requests: ['original-request'], text: 'retained' });
        legacy.put('proposal', 'original-request', { id: 'original-request', task: 'original-task', hash: 'frozen-hash', configHash: hash, status: 'unresolved' });
        legacy.put('launches', '2026-11-06', 3); legacy.put('backoff', config.tools.search, '2026-11-06T23:00:00Z');
        migrateIntake(registry, f.store);
        expect(registry.all()).toHaveLength(2); expect(registry.all().every(s => s.state === (enabled ? 'active' : 'paused') && s.homeProjectId === 'brain')).toBe(true);
        const source = registry.all().find(s => s.authority?.channels[0].id === 'C123')!, scoped = new IntakeLedger(f.store, source);
        expect(scoped.get('task', 'original-task')).toMatchObject({ id: 'original-task', configHash: hash, sourceDigest: source.sourceDigest, cursor: 'opaque', latest: '123.456789' });
        expect(scoped.get('proposal', 'original-request')).toMatchObject({ id: 'original-request', hash: 'frozen-hash', configHash: hash });
        expect(new IntakeBudget(registry).used('2026-11-06')).toBe(3); expect(readFileSync(path, 'utf8')).toBe(bytes);
        unlinkSync(path); migrateIntake(registry, f.store); expect(registry.all()).toHaveLength(2);
        expect(new IntakeBudget(registry).used('2026-11-06')).toBe(3);
        expect(legacy.get('task', 'original-task')).not.toHaveProperty('sourceId');
    } finally { db.close(); f.close(); }
});
test('interrupted import closes collection until ambiguous membership is reconciled, then resumes without duplicates', () => {
    const f = knowledgeStore(), db = new DatabaseSync(':memory:'), registry = new SourceRegistry(db, f.store.clock);
    try {
        mkdirSync(resolve(f.store.dataRoot, 'slack-intake'));
        writeFileSync(resolve(f.store.dataRoot, 'slack-intake/config.json'), JSON.stringify(config), { mode: 0o600 });
        const legacy = new IntakeLedger(f.store); legacy.put('unit', 'unknown', { channel: 'C999', text: 'ambiguous' });
        expect(() => migrateIntake(registry, f.store)).toThrow(/reconciliation/);
        expect(registry.meta('cutover')).toMatchObject({ state: 'preparing' });
        expect(scheduledSlackIntake(f.store, async () => { throw Error('must not run'); }, f.store.clock.now(), registry)).toEqual([]);
        const originalId = registry.all()[0].id;
        // Operator resolution from native evidence, retained legacy row kept rather than deleted.
        legacy.put('unit', 'unknown', { channel: 'C123', text: 'ambiguous', resolution: 'synthetic native membership' });
        migrateIntake(registry, f.store); expect(registry.all()).toHaveLength(1); expect(registry.all()[0].id).toBe(originalId);
        expect(registry.meta('cutover')).toMatchObject({ state: 'ready' });
    } finally { db.close(); f.close(); }
});
test('imports the approved seed allowance and its completion receipt without changing authority or daily counts',()=>{const f=knowledgeStore(),db=new DatabaseSync(':memory:'),registry=new SourceRegistry(db,f.store.clock);try{const legacy=new IntakeLedger(f.store),approved={...config,seedLaunchesPerDay:32},path=resolve(f.store.dataRoot,'slack-intake/config.json');mkdirSync(resolve(f.store.dataRoot,'slack-intake'));writeFileSync(path,JSON.stringify(approved),{mode:0o600});legacy.put('channel','C123',{id:'C123',seedUpperTs:'200.000000',enumerated:true,caughtUp:true});legacy.put('launches','2026-11-06',8);const key=digest(JSON.stringify([configDigest(approved),[['C123','200.000000']]]));const summary={status:'complete-with-gaps',channelsTotal:1,channelsEnumerated:1,pendingReads:0,pendingCaptures:0,unresolvedSources:0,coverageGaps:4,dailyLimit:8,completedAt:'2026-11-06T14:00:00Z'};legacy.put('seed-completion',key,{summary});migrateIntake(registry,f.store);const source=registry.all()[0];expect(registry.meta('seed-budget')).toMatchObject({limit:32,importedCompletion:key,members:[{sourceId:source.id,completedAt:summary.completedAt}]});expect(registry.meta(`legacy-seed-completion:${key}`)).toEqual({summary});expect(new IntakeBudget(registry).used('2026-11-06')).toBe(8);expect(new IntakeBudget(registry).limit(source.id)).toBe(8);}finally{db.close();f.close();}});
