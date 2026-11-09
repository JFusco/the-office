import { existsSync, readdirSync } from 'node:fs';
import { PREVIOUS_RESEARCH_PROFILE_UNAVAILABLE } from '../../../server/workers/research-profile';
import { test, expect } from 'vitest';
import { ControlStore } from '../../../server/store/control-store';
import { runWeeklyResearch, scheduledResearch } from '../../../server/knowledge/weekly-research';
import { runRollup } from '../../../server/knowledge/weekly-rollup';
import type { KnowledgeRunner } from '../../../server/knowledge/run-retrospective';
import type { WeeklyResearch } from '../../../src/shared';
import { knowledgeStore } from './knowledge-fixture';
const record = (): WeeklyResearch => ({ id: 'research:2026-11-06', topics: [{ id: 'public', question: 'Official SQLite transaction guidance', technology: 'SQLite', version: '3' }], host: 'brain', attempts: 0, status: 'pending', inputDigest: 'public', nextAt: '', sources: [], findings: [], unavailable: [] });
test('two failed research launches exhaust Office-wide; no third call and mirrors share one identity', async () => {
    const f = knowledgeStore('brain'), other = knowledgeStore('cec'), control = new ControlStore(':memory:', f.store.clock);
    try {
        const item = record(); control.updateKnowledge(k => { k.research = { [item.id]: item }; });
        let calls = 0; const workspaces: string[] = [];
        const runner = (async (_, __, options) => {
            calls++; const cwd = options!.cwd!; workspaces.push(cwd);
            expect(cwd).not.toContain(f.store.dataRoot); expect(cwd).not.toContain(f.store.project.repo);
            expect(readdirSync(cwd)).toEqual([]); throw Error('provider unavailable');
        }) as KnowledgeRunner;
        for (let i = 0; i < 3; i++) await runWeeklyResearch(control, [f.store, other.store], f.store, runner, item.id);
        expect(calls).toBe(2); expect(new Set(workspaces).size).toBe(2); for (const cwd of workspaces) expect(existsSync(cwd)).toBe(false); expect(control.knowledge().research![item.id].status).toBe('unavailable');
        expect(f.store.state.knowledge!.research).toEqual(other.store.state.knowledge!.research);
        expect(f.store.state.knowledge!.research).toHaveLength(1);
    } finally { control.close(); f.close(); other.close(); }
});
test('only topic-bound primary claims with native reads survive; unsupported findings are omitted', async () => {
    const f = knowledgeStore(), control = new ControlStore(':memory:', f.store.clock);
    try {
        const item = record(); control.updateKnowledge(k => { k.research = { [item.id]: item }; });
        const source = { topicId: 'public', applicability: 'unknown', contradictions: '', url: 'https://www.sqlite.org/transaction.html', retrievedAt: '', version: '3', primary: true, readEvidence: 'native-read:1', claim: 'Verified claim' };
        const run = (async () => ({ findings: ['Unsupported generalization'], sources: [source, { ...source, claim: 'Unverified claim', readEvidence: '' }], unavailable: [] })) as KnowledgeRunner;
        await runWeeklyResearch(control, [f.store], f.store, run, item.id);
        expect(control.knowledge().research![item.id]).toMatchObject({ status: 'partial', findings: ['Verified claim'] });
    } finally { control.close(); f.close(); }
});
test('verified research schedules a single shared public task', () => {
    const f = knowledgeStore('brain', '2026-11-06T23:00:00Z'), control = new ControlStore(':memory:', f.store.clock);
    try {
        f.store.state.knowledge!.rollups = [{ id: 'rollup:2026-11-06', weekEnding: '2026-11-06', researchId: 'research:2026-11-06' } as never];
        f.store.state.knowledge!.followups = [{ id: 'private', disposition: 'unresolved', nextAction: 'subprocess timeout', history: [{}, {}], createdAt: '2026-01' } as never];
        const run = (() => { throw Error('must not dispatch'); }) as KnowledgeRunner;
        const work = scheduledResearch(control, [f.store], () => run, f.store.clock.now());
        expect(work).toHaveLength(1); expect(work[0].stage).toBe('knowledge-research');
        expect(control.knowledge().research!['research:2026-11-06']).toMatchObject({ status: 'pending', attempts: 0, unavailable: [] });
    } finally { control.close(); f.close(); }
});
test('a report created after the shared result was mirrored still receives its appendix without another run', async () => {
    const a = knowledgeStore('brain', '2026-11-06T23:00:00Z'), b = knowledgeStore('cms-field-vocabulary', '2026-11-06T23:00:00Z'), control = new ControlStore(':memory:', a.store.clock);
    try {
        const id = 'research:2026-11-06';
        b.store.state.knowledge!.lessons = []; // Seeded guidance would make B's week non-quiet and call the narrative model.
        a.store.state.knowledge!.rollups = [{ id: 'rollup:2026-11-06', weekEnding: '2026-11-06', researchId: id, summary: 'Project A narrative', metrics: { completed: 1 } } as never];
        a.store.state.knowledge!.followups = [{ id: 'private', disposition: 'unresolved', nextAction: 'subprocess timeout', history: [{}, {}], createdAt: '2026-01' } as never];
        let calls = 0; const run = (async () => { calls++; throw Error('must not dispatch'); }) as KnowledgeRunner;
        const stores = [a.store, b.store], schedule = () => scheduledResearch(control, stores, () => run, a.store.clock.now());
        expect(schedule()).toHaveLength(1);
        control.updateKnowledge(k => { const r = k.research![id]; r.status = 'unavailable'; r.attempts = 2; r.unavailable = ['Provider retrieval unavailable']; });
        expect(schedule()).toEqual([]);
        expect(b.store.state.knowledge!.research?.map(item => item.id)).toEqual([id]); expect(b.store.state.knowledge!.rollups || []).toEqual([]);
        await runRollup(b.store, run, 'rollup:2026-11-06');
        const reports = () => stores.map(store => store.state.knowledge!.rollups!.map(report => JSON.stringify({ ...report, research: undefined })));
        const before = reports();
        expect(schedule()).toEqual([]);
        const canonical = control.knowledge().research![id];
        for (const store of stores) {
            expect(store.state.knowledge!.rollups).toHaveLength(1);
            expect(store.state.knowledge!.rollups![0].research).toEqual(canonical);
            expect(store.state.knowledge!.rollups![0].research!.unavailable[0]).toContain('Provider retrieval unavailable');
        }
        expect(reports()).toEqual(before); expect(calls).toBe(0);
        const settled = JSON.stringify(stores.map(store => store.state.knowledge));
        expect(schedule()).toEqual([]); expect(JSON.stringify(stores.map(store => store.state.knowledge))).toBe(settled);
        b.store.state.knowledge!.rollups![0].research = { ...canonical, status: 'pending', unavailable: [] };
        delete a.store.state.knowledge!.rollups![0].research;
        expect(schedule()).toEqual([]);
        for (const store of stores) expect(store.state.knowledge!.rollups![0].research).toEqual(canonical);
        expect(reports()).toEqual(before); expect(calls).toBe(0);
    } finally { control.close(); a.close(); b.close(); }
});

test('only the previous zero-launch profile deferral resumes; exhausted or other unavailable results stay settled', () => {
    const f = knowledgeStore('brain', '2026-11-06T23:00:00Z'), control = new ControlStore(':memory:', f.store.clock);
    try {
        const item = record(); item.status = 'unavailable'; item.unavailable = [PREVIOUS_RESEARCH_PROFILE_UNAVAILABLE];
        control.updateKnowledge(k => { k.research = { [item.id]: item }; });
        f.store.state.knowledge!.rollups = [{ id: 'rollup:2026-11-06', weekEnding: '2026-11-06' } as never];
        const schedule = () => scheduledResearch(control, [f.store], () => (async () => { throw Error('not dispatched'); }) as KnowledgeRunner, f.store.clock.now());
        expect(schedule()).toHaveLength(1); expect(control.knowledge().research![item.id]).toMatchObject({ status: 'pending', attempts: 0, unavailable: [] });
        for (const [attempts, reason] of [[2, PREVIOUS_RESEARCH_PROFILE_UNAVAILABLE], [0, 'Other unavailable reason']] as const) {
            control.updateKnowledge(k => { Object.assign(k.research![item.id], { status: 'unavailable', attempts, unavailable: [reason] }); });
            expect(schedule()).toEqual([]); expect(control.knowledge().research![item.id].unavailable).toEqual([reason]);
        }
    } finally { control.close(); f.close(); }
});
