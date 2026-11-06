import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { z } from 'zod';
import { migrateSnapshot } from '../../../server/store/migrations';
import { terminalCandidates } from '../../../server/knowledge/retrospective-triggers';
import { maintenanceBlockedId, maintenanceCompletedId } from '../../../server/knowledge/maintenance-triggers';
import { scheduledRetrospectives } from '../../../server/knowledge/scheduled-retrospectives';
import { runRetrospective, type KnowledgeRunner } from '../../../server/knowledge/run-retrospective';
import { retrospectiveFacts, PACKET_LIMIT } from '../../../server/knowledge/retrospective-facts';
import { MAINTENANCE_LIMIT, maintenanceArtifacts } from '../../../server/knowledge/maintenance-facts';
import { deliveryMetrics } from '../../../server/knowledge/delivery-metrics';
import { retrospectivePrompt } from '../../../server/knowledge/retrospective-prompt';
import { findSubject } from '../../../server/knowledge/retrospective-subject';
import { maintenanceSubject } from '../../../server/knowledge/maintenance-subject';
import { knowledgeContext, lessonPurpose } from '../../../server/knowledge/knowledge-context';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import type { command } from '../../../server/workers/process';
import type { Lesson, MaintenanceRun } from '../../../src/shared';
import { knowledgeStore, maintenanceResult, maintenanceRun } from './knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
function setup(projectId = 'cms-field-vocabulary') { const fixture = knowledgeStore(projectId); cleanup.push(fixture.close); return fixture; }
const never: KnowledgeRunner = async () => { throw new Error('Harper must not run here'); };

/** Today's shape of the problem: follow-up passed, the weekly vendor review blocked on an evidence gap. */
function blockedRun(overrides: Partial<MaintenanceRun> = {}): MaintenanceRun {
    return maintenanceRun({ status: 'blocked', stage: 'vendor-review', endedAt: '2026-11-06T09:30:00Z', steps: [
        { role: 'pm', stage: 'follow-up', at: '2026-11-06T09:10:00Z', result: maintenanceResult({ summary: 'No Dependabot PRs; release verified.', ledger: 'follow-up ledger' }) },
        { role: 'pm', stage: 'vendor-review', at: '2026-11-06T09:30:00Z', result: maintenanceResult({ outcome: 'blocked', summary: 'Scan artifacts carry no source bodies.', blocker: 'WebFetch returned HTTP 403 for the Contentful changelog; scan artifact lacks the source body.', ledger: 'vendor-review ledger' }) },
    ], ...overrides });
}
function seedRun(store: ReturnType<typeof setup>['store'], run: MaintenanceRun) {
    (store.state.maintenance ??= { runs: [], lastDaily: '', lastWeekly: '', ledger: '' }).runs.push(run);
    return run;
}
let sequence = 0;
const lesson = (statement: string, stages: Lesson['stages']): Lesson => ({ id: `lesson-${++sequence}`, scope: 'project', recurrences: [], kind: 'process', statement, detail: '', stages, paths: [], status: 'active', evidence: [], sourceRetrospectiveId: 'r', createdAt: '2026-11-01T00:00:00Z', updatedAt: '' });

test('a blocked run is one runnable retrospective, keyed by its step count; a completed run is another; consumed ids never repeat', () => {
    const { store } = setup();
    const blocked = seedRun(store, blockedRun()), done = seedRun(store, maintenanceRun({ status: 'completed', stage: 'follow-up', endedAt: '2026-11-05T09:20:00Z', weekly: false, steps: [{ role: 'pm', stage: 'follow-up', at: '2026-11-05T09:20:00Z', result: maintenanceResult() }] }));
    seedRun(store, maintenanceRun({ status: 'working', stage: 'follow-up' }));
    seedRun(store, maintenanceRun({ status: 'interrupted', error: 'Interrupted assignment' }));
    const runs = store.state.maintenance!.runs;
    const candidates = terminalCandidates(store.state.knowledge!, [], [], runs);
    expect(candidates).toMatchObject([
        { id: `${blocked.id}:blocked:2`, trigger: 'blocked', subject: 'maintenance', subjectId: blocked.id, key: 'CMS maintenance (weekly)', stage: 'vendor-review', steps: 2, at: '2026-11-06T09:30:00Z' },
        { id: `${done.id}:completed`, trigger: 'completed', subject: 'maintenance', key: 'CMS maintenance', steps: 1 },
    ]);
    expect(candidates[0].reason).toContain('HTTP 403');
    expect(maintenanceBlockedId(blocked)).toBe(candidates[0].id);
    expect(maintenanceCompletedId(done)).toBe(candidates[1].id);
    const scheduled = scheduledRetrospectives(store, never);
    expect(scheduled.map(item => [item.work.id, item.eligibility.state, item.claimEligible!()])).toEqual([[candidates[0].id, 'runnable', true], [candidates[1].id, 'runnable', true]]);
    store.state.knowledge!.consumed.push(candidates[0].id);
    expect(terminalCandidates(store.state.knowledge!, [], [], runs).map(c => c.id)).toEqual([candidates[1].id]);
    // A reconciled block that continues and blocks again is a new occurrence, by step count.
    blocked.steps.push({ role: 'pm', stage: 'vendor-review', at: '2026-11-06T10:00:00Z', result: maintenanceResult({ outcome: 'blocked', blocker: 'Still no source body' }) });
    expect(terminalCandidates(store.state.knowledge!, [], [], runs).map(c => c.id)).toEqual([`${blocked.id}:blocked:3`, candidates[1].id]);
});

test('a pending maintenance retrospective waits while its run is queued or working again', () => {
    const { store } = setup();
    const run = seedRun(store, blockedRun());
    const id = maintenanceBlockedId(run);
    store.state.knowledge!.pending.push({ id, jobId: run.id, key: 'CMS maintenance (weekly)', trigger: 'blocked', subject: 'maintenance', createdAt: '2026-11-06T09:31:00Z', event: { stage: 'vendor-review', head: '', steps: 2, reason: 'x' }, attempts: 0, nextAt: '', lastError: '' });
    run.status = 'queued';
    const [item] = scheduledRetrospectives(store, never);
    expect(item.eligibility).toMatchObject({ state: 'waiting', reason: 'Waiting for the maintenance run to finish' });
    expect(item.claimEligible!()).toBe(false);
    run.status = 'blocked';
    expect(scheduledRetrospectives(store, never)[0].claimEligible!()).toBe(true);
});

test('the first migration after deploy baselines retained runs, so history is never replayed', () => {
    const { store } = setup();
    const run = seedRun(store, blockedRun());
    store.state.knowledge!.baselines = ['jobs', 'tickets'];
    migrateSnapshot(store.state, store.project);
    expect(store.state.knowledge!.baselines).toContain('maintenance');
    expect(store.state.knowledge!.consumed).toContain(maintenanceBlockedId(run));
    expect(terminalCandidates(store.state.knowledge!, [], [], store.state.maintenance!.runs)).toEqual([]);
    migrateSnapshot(store.state, store.project);
    expect(store.state.knowledge!.consumed.filter(id => id === maintenanceBlockedId(run))).toHaveLength(1);
    delete store.state.knowledge;
    migrateSnapshot(store.state, store.project);
    expect(store.state.knowledge!.consumed).toContain(maintenanceBlockedId(run));
});

test('the packet carries each step, the ledgers, the harness error and the saved artifacts as catalog refs with no invented URLs', () => {
    const { store } = setup();
    const run = seedRun(store, blockedRun({ error: 'Vendor review blocked' }));
    const root = resolve(store.dataRoot, 'runs', run.id);
    mkdirSync(root, { recursive: true });
    for (const name of ['1-follow-up.json', '2-vendor-review.json', 'scan-contentful.json']) writeFileSync(resolve(root, name), '{}');
    const subject = findSubject(store, maintenanceBlockedId(run))!;
    expect(subject).toMatchObject({ kind: 'maintenance', id: run.id, status: 'blocked', stage: 'vendor-review', detail: expect.stringContaining('HTTP 403'), steps: [{ stage: 'follow-up' }, { stage: 'vendor-review', result: { outcome: 'blocked', findings: [] } }] });
    const packet = retrospectiveFacts(store, subject, { id: maintenanceBlockedId(run), trigger: 'blocked', event: { stage: 'vendor-review', head: '', steps: 2, reason: 'x' } });
    expect(packet.job).toMatchObject({ kind: 'maintenance', key: 'CMS maintenance (weekly)', issueUrl: '', pr: 0, prUrl: '' });
    expect(packet.steps.map(step => (step as { stage: string; outcome: string; blocker: string }).stage)).toEqual(['follow-up', 'vendor-review']);
    expect((packet.steps[1] as { blocker: string }).blocker).toContain('HTTP 403');
    expect(packet.maintenance).toMatchObject({ weekly: true, error: 'Vendor review blocked', artifactsRoot: root, artifacts: [{ ref: `artifact:${run.id}:1-follow-up.json`, name: '1-follow-up.json' }, { ref: `artifact:${run.id}:2-vendor-review.json` }, { ref: `artifact:${run.id}:scan-contentful.json` }], steps: [{ index: 0, role: 'pm', ledger: 'follow-up ledger' }, { index: 1, ledger: 'vendor-review ledger', candidates: 0, checks: 0 }], omitted: { ledgers: 0, artifacts: 0 } });
    expect(Object.keys(packet.catalog).sort()).toEqual([`artifact:${run.id}:1-follow-up.json`, `artifact:${run.id}:2-vendor-review.json`, `artifact:${run.id}:scan-contentful.json`, `maintenance:${run.id}`, `step:${run.id}:0`, `step:${run.id}:1`].sort());
    expect(packet.catalog[`artifact:${run.id}:scan-contentful.json`]).toEqual({ kind: 'artifact', ref: `artifact:${run.id}:scan-contentful.json`, url: '', detail: resolve(root, 'scan-contentful.json') });
    expect(Object.values(packet.catalog).every(item => item.url === '')).toBe(true);
    const prompt = retrospectivePrompt(packet, store.project.repo);
    expect(prompt).toContain('CMS maintenance run');
    expect(prompt).toContain('MAINTENANCE FOCUS');
    expect(prompt).toContain('evidence gap');
    expect(prompt).toContain('repeat of an active lesson');
    expect(prompt).toContain('what Morgan should do differently');
    expect(prompt).toContain('intake|implement|review|validate|repair|maintenance|any');
});

test('a run with long ledgers, many steps and many artifacts stays within the packet bound', () => {
    const { store } = setup();
    const steps = Array.from({ length: 12 }, (_, index) => ({ role: 'pm' as const, stage: index ? 'vendor-review' : 'follow-up', at: '', result: maintenanceResult({ outcome: 'blocked', summary: 'S'.repeat(3000), blocker: 'B'.repeat(3000), ledger: 'L'.repeat(9000) }) }));
    const approach = { plan: 'none', review: 'focused', validation: 'checks', checks: Array.from({ length: 30 }, () => 'C'.repeat(400)), reason: 'R'.repeat(3000) };
    const run = seedRun(store, blockedRun({ error: 'E'.repeat(5000), steps: steps.map(step => ({ ...step, result: { ...step.result, approach } as never })) }));
    const root = resolve(store.dataRoot, 'runs', run.id);
    mkdirSync(root, { recursive: true });
    for (let index = 0; index < 60; index++) writeFileSync(resolve(root, `${index}-${'artifact-name-'.repeat(12)}.json`), '{}');
    const packet = retrospectiveFacts(store, maintenanceSubject(store, run), { id: maintenanceBlockedId(run), trigger: 'blocked', event: { stage: 'vendor-review', head: '', steps: 12, reason: '' } });
    expect(JSON.stringify(packet).length).toBeLessThanOrEqual(PACKET_LIMIT);
    expect(JSON.stringify(packet.maintenance).length).toBeLessThanOrEqual(MAINTENANCE_LIMIT);
    // The latest ledger survives; artifact names (pointers only) go first, oldest first, with their catalog entries.
    expect(packet.maintenance!.steps.filter(step => step.ledger).map(step => step.index)).toContain(11);
    expect(packet.maintenance!.artifacts.length + packet.maintenance!.omitted.artifacts).toBe(20);
    if (packet.maintenance!.artifacts.length) expect(packet.maintenance!.artifacts.at(-1)!.name).toMatch(/^59-/);
    expect(Object.keys(packet.catalog).filter(ref => ref.startsWith('artifact:')).sort()).toEqual(packet.maintenance!.artifacts.map(artifact => artifact.ref).sort());
    // Older steps are dropped as for a delivery job; the triggering step always stays.
    const kept = packet.steps.map(step => (step as { index: number }).index);
    expect(kept).toContain(11);
    expect(kept.length).toBeLessThan(12);
    expect(packet.omitted.steps).toBe(12 - kept.length);
});

test("Harper's accepted maintenance lesson reaches the next vendor review and follow-up, but no CEC or leadership stage", async () => {
    const { store } = setup();
    const run = seedRun(store, blockedRun());
    const id = maintenanceBlockedId(run);
    const root = resolve(store.dataRoot, 'runs', run.id);
    mkdirSync(root, { recursive: true });
    writeFileSync(resolve(root, '2-vendor-review.json'), '{}');
    const prompts: string[] = [];
    const harper: KnowledgeRunner = (async (prompt: string) => { prompts.push(prompt); return { summary: 'The vendor review blocked on a refused fetch.', lessons: [{ statement: 'Read the saved scan artifact before fetching a vendor changelog', detail: 'WebFetch is refused with 403 by this vendor.', kind: 'process', stages: ['maintenance'], paths: [], evidenceIds: [`artifact:${run.id}:2-vendor-review.json`, `step:${run.id}:1`], repositoryInstruction: false }], recurrences: [] }; }) as KnowledgeRunner;
    await runRetrospective(store, harper, id);
    expect(prompts).toHaveLength(1);
    const knowledge = store.state.knowledge!;
    expect(knowledge.consumed).toContain(id);
    expect(knowledge.pending).toEqual([]);
    expect(knowledge.retrospectives).toMatchObject([{ id, jobId: run.id, key: 'CMS maintenance (weekly)', trigger: 'blocked', subject: 'maintenance' }]);
    expect(knowledge.lessons).toMatchObject([{ status: 'active', stages: ['maintenance'], evidence: [{ kind: 'artifact', url: '' }, { kind: 'step' }] }]);
    expect(scheduledRetrospectives(store, never)).toEqual([]);
    for (const stage of ['vendor-review', 'follow-up', 'proposal', 'proposal-plan', 'proposal-plan-review', 'proposal-review', 'package-verification', 'draft-pr'])
        expect(knowledgeContext(store, stage)).toContain('Read the saved scan artifact');
    for (const stage of ['github-implement', 'daily-cto', 'retrospective', 'mailbox'])
        expect(knowledgeContext(store, stage)).not.toContain('Read the saved scan artifact');
    // The actual worker prompt for Morgan's read-only vendor review carries the lesson.
    const inputs: string[] = [];
    const execute: typeof command = async (_program, _args, options = {}) => {
        inputs.push(String(options.input || ''));
        for (const event of [{ type: 'thread.started', thread_id: crypto.randomUUID() }, { type: 'item.completed', item: { type: 'agent_message', text: '{"ok":true}' } }])
            options.onLine?.(JSON.stringify(event));
        return '';
    };
    await new WorkerRuntime(store, execute).run('pm', 'CMS maintenance · vendor-review', z.object({ ok: z.boolean() }).strict(), { readOnly: true, stage: 'vendor-review', requestId: run.id });
    expect(inputs[0]).toContain('PROJECT LESSONS');
    expect(inputs[0]).toContain('Read the saved scan artifact before fetching a vendor changelog');
});

test('delivery lessons tagged any reach maintenance stages; bare draft-pr stays an implement stage on CEC', () => {
    const { store } = setup();
    store.state.knowledge!.lessons.push(lesson('ANY-LESSON', ['any']), lesson('IMPLEMENT-LESSON', ['implement']), lesson('MAINTENANCE-LESSON', ['maintenance']));
    expect(knowledgeContext(store, 'vendor-review')).toContain('ANY-LESSON');
    expect(knowledgeContext(store, 'vendor-review')).not.toContain('IMPLEMENT-LESSON');
    expect(knowledgeContext(store, 'github-implement')).not.toContain('MAINTENANCE-LESSON');
    expect(lessonPurpose('draft-pr', 'github')).toBe('maintenance');
    expect(lessonPurpose('draft-pr', 'azure')).toBe('implement');
    const cec = setup('cec');
    cec.store.state.knowledge!.lessons.push(lesson('CEC-IMPLEMENT', ['implement']), lesson('CEC-MAINTENANCE', ['maintenance']));
    expect(knowledgeContext(cec.store, 'draft-pr')).toContain('CEC-IMPLEMENT');
    expect(knowledgeContext(cec.store, 'draft-pr')).not.toContain('CEC-MAINTENANCE');
});

test('artifacts are listed in natural order and the newest stage files are kept', () => {
    const { store } = setup();
    const root = resolve(store.dataRoot, 'runs', 'natural');
    mkdirSync(root, { recursive: true });
    for (let index = 1; index <= 25; index++) writeFileSync(resolve(root, `${index}-vendor-review.json`), '{}');
    const names = maintenanceArtifacts(root);
    expect(names).toHaveLength(20);
    expect(names[0]).toBe('6-vendor-review.json');
    expect(names.at(-1)).toBe('25-vendor-review.json');
    expect(maintenanceArtifacts(resolve(root, 'missing'))).toEqual([]);
});

test('weekly delivery metrics never count maintenance runs as deliveries', () => {
    const { store } = setup();
    const at = '2026-11-04T12:00:00Z';
    store.state.knowledge!.retrospectives.push(
        { id: 'run-1:completed', jobId: 'run-1', key: 'CMS maintenance', trigger: 'completed', subject: 'maintenance', eventAt: at, attemptId: 'a', summary: '', lessonIds: [], at },
        { id: 'run-2:blocked:2', jobId: 'run-2', key: 'CMS maintenance (weekly)', trigger: 'blocked', subject: 'maintenance', eventAt: at, attemptId: 'b', summary: '', lessonIds: [], at },
    );
    const metrics = deliveryMetrics(store, new Date('2026-11-01T00:00:00Z'), new Date('2026-11-08T00:00:00Z'));
    expect(metrics).toMatchObject({ completed: 0, parked: 0, retired: 0, repairBudgets: 0, retrospectives: 2 });
});
