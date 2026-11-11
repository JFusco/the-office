import {registerDeliveryFixture} from '../../fixtures/delivery-claim';
import {TimeLedger} from '../../../server/time/time-ledger';
import {FEATURE_PLANNING} from '../../../server/office/config';
import {openAssessment,assessmentEpisode,closeAssessment} from '../../../server/features/handoff/disposition-store';
import {blankEvidence} from '../../../server/features/handoff/evidence-contract';
import {storeEvidence} from '../../../server/features/handoff/evidence-artifacts';
import {captureRequest,requestCapture} from '../../../server/features/handoff/capture-store';
import {holdAssessmentIntake} from '../../../server/features/handoff/intake-routing';
import { Coordinator } from '../../../server/scheduling/coordination';
import { initializeLanes } from '../../fixtures/scheduler';
import { enqueueRequest } from '../../../server/scheduling/requests';
import { SessionBridge } from '../../../server/workers/session-bridge';
import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { z } from 'zod';
import { Offices } from '../../../server/scheduling/offices';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { Conversations } from '../../../server/conversations/conversations';
import { officeCapacity, projectById } from '../../../server/office/projects';
import { Scheduler } from '../../../server/scheduling/scheduler';
import { Agents } from '../../../server/workers/agents';
import { timeReport } from '../../../src/timing/timing';
import type { StageResult, Ticket } from '../../../src/shared';
const stores: Store[] = [], roots: string[] = [];
afterEach(() => { vi.restoreAllMocks(); stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
function store(id: string) { const root = mkdtempSync(resolve(tmpdir(), 'office-queue-')); roots.push(root); const s = new Store(':memory:', projectById(id), root); stores.push(s); return s; }
function offices(limit = 1) {
    // Exercise the real scheduler with isolated stores, never the live databases.
    const office = Object.create(Offices.prototype) as Offices;
    office.capacity = officeCapacity(limit);
    initializeLanes(office);
    office.entries = new Map();
    office.sessions = new SessionBridge(() => [...office.entries.values()].map(e => e.store));
    for (const id of ['cec', 'cms-field-vocabulary']) {
        const s = store(id), engine = new Engine(s, office.capacity);
        office.entries.set(id, { store: s, engine, conversations: new Conversations(s, engine, s.dataRoot), coordinator: new Coordinator(s, engine) });
    }
    return office;
}
const reply = { handoffProject: '', pickupChange: null, reply: 'Synthetic response', notifyRoles: [], question: '', goalChanges: [], slackRequests: [], notes: [], receipts: [] };
test('queued messages wait for the active project, rotate projects, and retain FIFO within each project', async () => {
    const office = offices(), cec = office.get('cec'), cms = office.get('cms-field-vocabulary'), seen: string[] = [];
    for (const entry of [cec, cms])
        entry.engine.agents.followup = async (_role, m) => { seen.push(`${entry.store.project.id}:${m.body}`); return reply; };
    const a = cec.conversations.enqueue({ id: 'ffffffff-ffff-4fff-8fff-ffffffffffff', body: 'first' }), b = cec.conversations.enqueue({ id: '00000000-0000-4000-8000-000000000000', body: 'second' }), c = cms.conversations.enqueue({ id: crypto.randomUUID(), body: 'third' });
    a.createdAt = b.createdAt = '2026-10-29T20:00:00.000Z';
    // Keep the durable collection order even with identical timestamps and reversed IDs.
    cec.store.save();
    cec.engine.busy = true;
    await office.pump();
    expect(seen).toEqual([]);
    expect(c.status).toBe('queued');
    cec.engine.busy = false;
    // Reading snapshots / switching the viewed project cannot change dispatch.
    office.snapshot('cms-field-vocabulary');
    await office.pump();
    await office.pump();
    await office.pump();
    expect(seen).toEqual(['cec:first', 'cms-field-vocabulary:third', 'cec:second']);
    expect([a.status, b.status, c.status]).toEqual(['answered', 'answered', 'answered']);
    expect(office.capacity.lane).toBe('');
});
test('a paused project leaves its requests queued while another project can proceed', async () => {
    const office = offices(), cec = office.get('cec'), cms = office.get('cms-field-vocabulary');
    cec.store.state.paused = true;
    const a = cec.conversations.enqueue({ id: crypto.randomUUID(), body: 'wait' }), b = cms.conversations.enqueue({ id: crypto.randomUUID(), body: 'proceed' });
    cms.engine.agents.followup = async () => reply;
    await office.pump();
    expect(a.status).toBe('queued');
    expect(b.status).toBe('answered');
});
test('worker status and work history use readable labels while the worker receives its complete prompt and fixed project', async () => {
    const s = store('cms-field-vocabulary'), prompt = 'Read back CMS maintenance. INTERNAL payload ' + JSON.stringify({ long: 'x'.repeat(10000) });
    const agents = new Agents(s, async (_program, _args, options) => {
        expect(options?.input).toContain(prompt);
        expect(options?.input).toContain('PROJECT CONTEXT (fixed for the entire assignment)');
        expect(options?.cwd).toBe(s.project.repo);
        expect(s.state.agents.find(a => a.id === 'pm')?.task).toBe('CMS field vocabulary · Reading back previous maintenance');
        expect(s.state.workLog?.at(-1)?.task).not.toContain('INTERNAL');
        return JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: '{"ok":true}' } });
    });
    await agents.run('pm', prompt, z.object({ ok: z.boolean() }), { stage: 'maintenance-readback', readOnly: true });
    expect(s.state.workLog?.at(-1)?.task).toBe('CMS field vocabulary · Reading back previous maintenance');
});
function ticket(s: Store, key = 'CEC-999') {
    const t = { key, summary: 'Synthetic queue fixture', type: 'Bug', status: 'To Do', statusId: '10000', assignee: 'office-account', subtask: false, boardMember: true, url: '', updated: '', stage: 'mailbox' as const, activity: 'waiting' as const, blocker: '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: '' };
    s.state.tickets.push(t);
    return t;
}
test('implementation waits for the shared lane, deduplicates, and rechecks live eligibility at dispatch', async () => {
    const office = offices(), cec = office.get('cec'), cms = office.get('cms-field-vocabulary'), t = ticket(cec.store);
    let reads = 0, runs = 0;
    cec.engine.agents.readback = async () => { reads++; expect(office.capacity.lane).toBe('cec'); return { ...t, existingPrId: 0, existingOwner: '', blocker: '' }; };
    cec.engine.run = async () => { runs++; };
    cms.engine.busy = true;
    const request = cec.engine.requestDelivery(t.key, 'start-pilot');
    expect(cec.engine.requestDelivery(t.key, 'start-pilot').id).toBe(request.id);
    await office.pump();
    expect(reads).toBe(0);
    cms.engine.busy = false;
    await office.pump();
    expect(reads).toBe(1);
    expect(runs).toBe(0);
    expect(request.status).toBe('completed');
    expect(t.pilot).toBe(true);
});
test('queued implementation survives restart and pause, but a changed remote owner blocks execution', async () => {
    const office = offices(), cec = office.get('cec'), t = ticket(cec.store);
    const request = cec.engine.requestDelivery(t.key, 'start-pilot');
    cec.store.save();
    cec.store.recover();
    expect(request.status).toBe('queued');
    cec.store.state.paused = true;
    await office.pump();
    expect(request.status).toBe('queued');
    cec.engine.agents.readback = async () => ({ ...t, existingPrId: 123, existingOwner: 'another worker', blocker: '' });
    let runs = 0;
    cec.engine.run = async () => { runs++; };
    cec.store.state.paused = false;
    await office.pump();
    expect(request.status).toBe('blocked');
    expect(request.error).toContain('reconciliation');
    expect(runs).toBe(0);
    expect(office.capacity.lane).toBe('');
    request.status = 'working';
    cec.store.recover();
    expect(String(request.status)).toBe('interrupted');
    await office.pump();
    expect(runs).toBe(0);
});
test('nightly intake queues eligible tickets without starting an implementation worker', async () => {
    const office = offices(), cec = office.get('cec');
    ticket(cec.store);
    ticket(cec.store, 'CEC-998');
    let runs = 0;
    cec.engine.startPilot = async () => { runs++; };
    await cec.engine.dispatchNightly();
    await cec.engine.dispatchNightly();
    expect(runs).toBe(0);
    expect(cec.store.state.deliveryQueue?.map(r => r.key)).toEqual(['CEC-999', 'CEC-998']);
    expect(office.summaries().find(p => p.id === 'cec')?.queued).toBe(2);
});
test('implementation FIFO shares rotation with another project chat; queued resume reconciles once', async () => {
    const office = offices(), cec = office.get('cec'), cms = office.get('cms-field-vocabulary'), seen: string[] = [];
    const a = ticket(cec.store), b = ticket(cec.store, 'CEC-998');
    cec.engine.startPilot = async (key) => { seen.push(key); };
    cms.engine.agents.followup = async () => { seen.push('CMS chat'); return reply; };
    cec.engine.requestDelivery(a.key, 'start-pilot');
    cec.engine.requestDelivery(b.key, 'start-pilot');
    cms.conversations.enqueue({ id: crypto.randomUUID(), body: 'Synthetic' });
    await office.pump();
    await office.pump();
    await office.pump();
    expect(seen).toEqual([a.key, 'CMS chat', b.key]);
    a.pilot = true;
    cec.engine.resume = async (key, background) => { expect(background).toBe(false); seen.push(`resume ${key}`); };
    const request = cec.engine.requestDelivery(a.key, 'resume-ticket');
    expect(cec.engine.requestDelivery(a.key, 'resume-ticket').id).toBe(request.id);
    await office.pump();
    expect(request.status).toBe('completed');
    expect(seen.at(-1)).toBe(`resume ${a.key}`);
});
test('a bounded provider observation does not occupy the shared delivery slot', async () => {
    const office = offices(), cec = office.get('cec'), seen: string[] = [];
    ticket(cec.store);
    let release!: () => void;
    cec.engine.observe = async () => { seen.push('observation'); await new Promise<void>(done => release = done); };
    cec.engine.startPilot = async () => { seen.push('delivery'); };
    enqueueRequest(cec.store, 'refresh');
    cec.engine.requestDelivery('CEC-999', 'start-pilot');
    const tick = office.pump();
    await Promise.resolve();
    expect(seen).toContain('observation');
    expect(seen).toContain('delivery');
    release();
    await tick;
});
test('delivery queue is restored from SQLite with queued work retained and active work interrupted', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'delivery-restart-'));
    roots.push(root);
    const path = resolve(root, 'office.sqlite');
    const first = new Store(path, projectById('cec'), root), engine = new Engine(first);
    const a = ticket(first), b = ticket(first, 'CEC-998');
    engine.requestDelivery(a.key, 'start-pilot');
    engine.requestDelivery(b.key, 'start-pilot');
    first.state.deliveryQueue![1].status = 'working';
    first.save();
    first.close();
    const restored = new Store(path, projectById('cec'), root);
    stores.push(restored);
    restored.recover();
    expect(restored.state.deliveryQueue?.map(r => r.status)).toEqual(['queued', 'interrupted']);
    expect(restored.state.deliveryQueue?.[0].key).toBe(a.key);
});
test('reaping a stopped worker retains unrelated claims and running siblings', async () => {
    const office = offices(), store = office.get('cec').store;
    const delivery = store.claimWork({ projectId: 'cec', kind: 'delivery', id: 'work' }, 'worker', 'implement', 'delivery')!;
    const leadership = store.claimWork({ projectId: 'cec', kind: 'conversation', id: 'leadership' }, 'cto', 'conversation', 'cto')!;
    const base: any = { role: 'developer', task: 'Stopping fixture', ticket: 'CEC-999', stage: 'implement', requestId: 'work', sessionId: 'fixture', provider: 'fixture', model: 'fixture', effort: 'fixture', startedAt: new Date().toISOString(), lastHeartbeatAt: new Date().toISOString(), endedAt: '', elapsedMs: 0, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '', claimId: delivery.id, lane: 'delivery' };
    store.state.workLog = [{ ...base, id: 'terminated', status: 'stopping', processId: 999999 }, { ...base, id: 'sibling', status: 'running' }];
    vi.spyOn(process, 'kill').mockImplementation(() => { throw Object.assign(new Error('gone'), { code: 'ESRCH' }); });
    await office.pump();
    expect(store.activeClaims().map(c => c.id).sort()).toEqual([delivery.id, leadership.id].sort());
    Object.assign(store.state.workLog[1], { status: 'stopping', processId: 999998 });
    await office.pump();
    expect(store.activeClaims().map(c => c.id)).toEqual([leadership.id]);
});
test('worker assignment uses the current claim queue measurement instead of original ticket age', async () => {
    const s = store('cms-field-vocabulary');
    let millis = Date.parse('2026-10-29T14:00:00Z');
    const clock = { now: () => new Date(millis), monotonic: () => millis };
    const capacity = officeCapacity(), scheduler = new Scheduler(capacity, clock);
    const agents = new Agents(s, async () => JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: '{"ok":true}' } }));
    const work: any = { store: s, work: { projectId: s.project.id, kind: 'delivery', id: 'current-stage' }, stage: 'github-review', rank: 3, enqueuedAt: '2026-10-29T13:00:00Z', eligibility: { state: 'runnable', reason: 'fixture', owner: 'Sam', nextCheckAt: null }, identity: () => 'same', execute: () => agents.run('lead', 'Review fixture', z.object({ ok: z.boolean() }), { stage: 'github-review', requestId: 'old-job', enqueuedAt: '2020-01-01T00:00:00Z', readOnly: true }) };
    capacity.lane = 'occupied';
    await scheduler.pump([{ store: s, items: [work] }]);
    millis += 5000;
    capacity.lane = '';
    await scheduler.pump([{ store: s, items: [work] }]);
    const measured = s.state.workLog!.at(-1)!;
    expect(measured.queuedMs).toBe(5000);
    expect(measured.claimId).toBeTruthy();
    expect(measured.lane).toBe('delivery');
    const assignment = JSON.parse(readFileSync(resolve(s.dataRoot, 'sessions', measured.id, 'assignment.json'), 'utf8'));
    expect(assignment.work.id).toBe('current-stage');
    expect(assignment.timing.readyAt).toBe('2026-10-29T14:00:00.000Z');
    expect(assignment.timing.claimedAt).toBe('2026-10-29T14:00:05.000Z');
});
test('one CEC claim attributes its queue wait once across transition and stage workers', async () => {
    const s = store('cec'), engine = new Engine(s), t: Ticket = ticket(s);
    let millis = Date.parse('2026-10-29T14:00:00Z');
    const clock = { now: () => new Date(millis), monotonic: () => millis };
    s.clock = clock;
    Object.assign(t, { stage: 'understand', pilot: true, runId: crypto.randomUUID() });
    const result: StageResult = { resolution: null, outcome: 'passed', summary: 'Synthetic understanding', prerequisites: null, approach: { plan: 'none', review: 'none', validation: 'developer-checks', checks: ['Fixture check'], reason: 'Synthetic bounded fixture' }, commit: '', evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 0, qaRunDir: '', paidRuns: 0, blocker: '' };
    engine.agents = new Agents(s, async () => JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: JSON.stringify({ ...result, receipts: s.state.workLog!.at(-1)!.stage === 'transition' ? [{ id: 'transition', action: 'jira-transition', target: t.key, verified: true, uncertain: false, detail: 'Synthetic transition read-back' }] : [] }) } }));
    const capacity = officeCapacity(), scheduler = new Scheduler(capacity, clock);
    const work = { store: s, work: { projectId: s.project.id, kind: 'delivery' as const, id: `ticket:${t.key}` }, stage: t.stage, rank: 3, enqueuedAt: '2026-10-29T13:00:00Z', eligibility: { state: 'runnable' as const, reason: 'Fixture', owner: 'Morgan', nextCheckAt: null }, identity: () => t.stage, execute: () => engine.run(t.key) };
    capacity.lane = 'occupied';
    await scheduler.pump([{ store: s, items: [work] }]);
    millis += 5000;
    capacity.lane = '';
    await scheduler.pump([{ store: s, items: [work] }]);
    expect(t.activity).toBe('waiting');
    expect(t.stage).toBe('enhance');
    expect(s.state.workLog!.map(work => work.stage)).toEqual(['transition', 'understand']);
    expect(s.state.workLog!.map(work => work.queuedMs)).toEqual([5000, 0]);
    expect(new Set(s.state.workLog!.map(work => work.claimId)).size).toBe(1);
    expect(timeReport(s.state, t.key).workerQueueMs).toBe(5000);
    for (const work of s.state.workLog!) {
        const assignment = JSON.parse(readFileSync(resolve(s.dataRoot, 'sessions', work.id, 'assignment.json'), 'utf8'));
        expect(assignment.claimId).toBeTruthy();
        expect(assignment.timing).toEqual({ enqueuedAt: '2026-10-29T13:00:00Z', readyAt: '2026-10-29T14:00:00.000Z', claimedAt: '2026-10-29T14:00:05.000Z' });
    }
});
test('unclaimed worker sessions retain their individual queue measurements', async () => {
    const s = store('cec');
    s.clock = { now: () => new Date('2026-10-29T14:00:05Z'), monotonic: () => 0 };
    const agents = new Agents(s, async () => JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: '{"ok":true}' } }));
    for (let i = 0; i < 2; i++)
        await agents.run('pm', 'Unclaimed fixture', z.object({ ok: z.boolean() }), { enqueuedAt: '2026-10-29T14:00:00Z', readOnly: true });
    expect(s.state.workLog!.map(work => work.queuedMs)).toEqual([5000, 5000]);
});
test.each(['claimId', 'requestId', 'ticket'] as const)('recovery retains only surviving owned claims using %s association', async association => {
    const office = offices(), { store, engine, conversations } = office.get('cec'), t: Ticket = ticket(store);
    Object.assign(t, { pilot: true, stage: 'understand', activity: 'working' });
    const delivery = store.claimWork({ projectId: 'cec', kind: 'delivery', id: `ticket:${t.key}` }, 'delivery-owner', 'understand', 'delivery')!;
    const message = conversations.enqueue({ id: crypto.randomUUID(), role: 'cto', body: 'Synthetic leadership request' });
    message.status = 'working';
    const leadership = store.claimWork({ projectId: 'cec', kind: 'conversation', id: message.id }, 'cto-owner', 'conversation:cto', 'cto')!;
    const now = store.clock.now().toISOString();
    const base = { task: 'Recovery fixture', sessionId: 'fixture', provider: 'fixture', model: '', effort: '', status: 'running' as const, startedAt: now, lastHeartbeatAt: now, endedAt: '', elapsedMs: 0, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '' };
    store.state.workLog = [
        { ...base, id: 'delivery-worker', role: 'pm', stage: 'understand', ticket: t.key, requestId: association === 'requestId' ? delivery.work.id : 'old-run', claimId: association === 'claimId' ? delivery.id : undefined, lane: 'delivery', processId: 999999 },
        { ...base, id: 'cto-worker', role: 'cto', stage: 'conversation', ticket: association === 'claimId' ? t.key : '', requestId: association === 'claimId' ? delivery.work.id : message.id, claimId: association === 'claimId' ? leadership.id : undefined, lane: 'cto', processId: 999998 },
    ];
    let ctoAlive = true;
    vi.spyOn(process, 'kill').mockImplementation((pid, signal) => {
        expect(signal).toBe(0);
        if (pid === -999998 && ctoAlive)
            return true;
        throw Object.assign(new Error('Gone'), { code: 'ESRCH' });
    });
    store.recover();
    expect(store.state.workLog.map(work => work.status)).toEqual(['interrupted', 'stopping']);
    expect(store.activeClaims().map(claim => [claim.id, claim.status])).toEqual([[leadership.id, 'stopping']]);
    const saved = store.db.prepare('SELECT status FROM work_claims WHERE id=?').get(delivery.id);
    expect(saved?.status).toBe('interrupted');
    expect(store.claimWork(leadership.work, 'another-owner', leadership.stage, 'cto')).toBeNull();
    await office.pump();
    expect(store.activeClaims().map(claim => claim.id)).toEqual([leadership.id]);
    ctoAlive = false;
    await office.pump();
    expect(store.state.workLog.map(work => work.status)).toEqual(['interrupted', 'interrupted']);
    expect(store.activeClaims()).toEqual([]);
    let reclaimed = '';
    engine.run = async () => { reclaimed = store.activeClaims().find(claim => claim.work.id === delivery.work.id)?.id || ''; };
    t.activity = 'waiting';
    t.blocker = '';
    await office.pump();
    expect(reclaimed).toBeTruthy();
    expect(reclaimed).not.toBe(delivery.id);
});

function planningFixture(office: Offices) {
 const entry=office.get('cms-field-vocabulary'),key='GH-999';
 FEATURE_PLANNING[entry.store.project.id]={assessment:{enabled:true},progression:'automatic'};
 const episode=openAssessment(entry.store,key,'v1',true);
 const evidence=blankEvidence(entry.store.project.id,key,'github',entry.store.project.repository+'#999');evidence.summary='Synthetic requirements';
 evidence.coverage={issue:{state:'complete'},comments:{state:'complete'},children:{state:'complete'}};
 entry.engine.captureEvidence=async()=>({evidence,reference:storeEvidence(entry.store,evidence)});
 const review={id:'ordinary-intake',key,status:'queued',queuedAt:entry.store.clock.now().toISOString(),workRequested:'automatic',detail:'',owner:''} as any;
 entry.store.state.coordination!.listener.reviews.push(review);entry.store.state.coordination!.listener.assigned.push({key,status:'open',pickupStatus:'Ready'} as any);
 entry.store.transaction(()=>holdAssessmentIntake(entry.store,review));
 const run=vi.fn(async()=>({disposition:'ordinary',rationale:'Use existing delivery',requirements:['a'],acceptanceCriteria:['b'],settledDecisions:[],openQuestions:[],imageObservations:[]}));
 entry.engine.agents.run=run as any;
 return {entry,episode,run,review};
}
function occupyDelivery(office: Offices) {
 const entry=office.get('cec');let release!:()=>void;const stopped=new Promise<void>(resolve=>{release=resolve});
 const job={id:'occupying-job',key:'CEC-998',status:'queued',stage:'implement',requestedAt:new Date().toISOString(),steps:[],prerequisites:[]} as any;
 entry.store.state.coordination!.jobs!.push(job);entry.coordinator!.pump=async()=>{job.status='working';await stopped;job.status='completed';job.stage='closeout';};
 return {entry,release};
}
test.each([1,3])('queued assessment survives ten minutes of occupied delivery at limit %s',async limit=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));
 const office=offices(limit),occupied=occupyDelivery(office),f=planningFixture(office);let pending:Promise<void>|undefined;
 try {
  let ordinary=0;f.entry.coordinator!.pump=async()=>{ordinary++;f.review.status='ready';};
  pending=office.pump();await vi.waitFor(()=>expect(captureRequest(f.entry.store,'assessment:'+f.episode.id)?.status).toBe('complete'));
  expect(f.run).not.toHaveBeenCalled();const claim=occupied.entry.store.activeClaims()[0];expect(claim.work.id).toBe('occupying-job');
  vi.setSystemTime(new Date('2026-11-10T12:10:00Z'));await office.pump();
  expect(assessmentEpisode(f.entry.store,f.episode.id)?.closedAt).toBeUndefined();
  expect(f.run).not.toHaveBeenCalled();expect(ordinary).toBe(0);expect(occupied.entry.store.activeClaims()[0].id).toBe(claim.id);
  expect(limit===1?office.capacity.lane:office.capacity.slots.has('cec')).toBe(limit===1?'cec':true);
  occupied.release();await pending;await office.pump();await office.pump();
  expect(f.run).toHaveBeenCalledTimes(1);expect(assessmentEpisode(f.entry.store,f.episode.id)?.outcome).toBe('ordinary-by-model');
  await office.pump();expect(ordinary).toBe(1);
 } finally {occupied.release();await pending;delete FEATURE_PLANNING[f.entry.store.project.id];vi.useRealTimers();}
});
test.each([1,3])('Morgan uses a real exclusive delivery claim after occupying work drains at limit %s',async limit=>{
 const office=offices(limit),occupied=occupyDelivery(office),f=planningFixture(office);let pending:Promise<void>|undefined;
 try {
  const observations:any[]=[];f.entry.engine.agents.run=vi.fn(async()=>{observations.push({claims:f.entry.store.activeClaims(),slots:[...office.capacity.slots.values()]});return {disposition:'ordinary',rationale:'Existing path',requirements:[],acceptanceCriteria:[],settledDecisions:[],openQuestions:[],imageObservations:[]};}) as any;
  pending=office.pump();await vi.waitFor(()=>expect(captureRequest(f.entry.store,'assessment:'+f.episode.id)?.status).toBe('complete'));
  await office.pump();expect(observations).toHaveLength(0);occupied.release();await pending;await office.pump();
  expect(observations).toHaveLength(1);expect(observations[0].claims[0]).toMatchObject({work:{kind:'assessment',id:'assessment:'+f.episode.id},lane:'delivery'});
  if(limit===3)expect(observations[0].slots).toEqual([{exclusive:true}]);
 } finally {occupied.release();await pending;delete FEATURE_PLANNING[f.entry.store.project.id];}
});

test('unchanged evidence capture owns only operations while spare delivery slots remain usable',async()=>{
 const office=offices(3),occupied=occupyDelivery(office),f=planningFixture(office);
 const thirdStore=store('brain'),thirdEngine=new Engine(thirdStore,office.capacity),third={store:thirdStore,engine:thirdEngine,conversations:new Conversations(thirdStore,thirdEngine,thirdStore.dataRoot),coordinator:new Coordinator(thirdStore,thirdEngine)};office.entries.set('brain',third);
 closeAssessment(f.entry.store,f.episode,'ordinary-by-model');f.review.status='cancelled';
 const target='assessment:'+f.episode.id;requestCapture(f.entry.store,target,'GH-999','observation','v1');
 let releaseCapture!:()=>void,releaseThird!:()=>void;const captureHeld=new Promise<void>(r=>{releaseCapture=r}),thirdHeld=new Promise<void>(r=>{releaseThird=r});
 const capture=f.entry.engine.captureEvidence;f.entry.engine.captureEvidence=async(...args)=>{await captureHeld;return capture(...args);};
 let first:Promise<void>|undefined,second:Promise<void>|undefined;
 try {
  first=office.pump();await vi.waitFor(()=>expect(f.entry.store.activeClaims().some(c=>c.lane==='operations')).toBe(true));
  const deliveryClaim=occupied.entry.store.activeClaims()[0];expect(f.entry.store.activeClaims()).toHaveLength(1);expect(f.entry.store.activeClaims()[0].work).toMatchObject({kind:'reconciliation',id:'evidence-capture:'+target});
  const job={id:'third-job',key:'GH-888',status:'queued',stage:'review',requestedAt:new Date().toISOString(),steps:[],prerequisites:[]} as any;registerDeliveryFixture(third.store,job);third.store.state.coordination!.jobs!.push(job);third.coordinator!.pump=async()=>{job.status='working';await thirdHeld;job.status='completed';};
  second=office.pump();await vi.waitFor(()=>expect(third.store.activeClaims()).toHaveLength(1));expect(office.capacity.slots.size).toBe(2);expect(occupied.entry.store.activeClaims()[0].id).toBe(deliveryClaim.id);
  releaseCapture();await vi.waitFor(()=>expect(captureRequest(f.entry.store,target)?.status).toBe('complete'));expect(f.run).not.toHaveBeenCalled();expect(f.entry.store.activeClaims().some(c=>c.work.kind==='assessment')).toBe(false);
 }finally{releaseCapture();releaseThird();occupied.release();await Promise.all([first,second]);delete FEATURE_PLANNING[f.entry.store.project.id];}
});
test('operations FIFO places a new refresh behind already queued time publication, with stable target and fresh claim IDs',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-09T12:00:00Z'));
 const office=offices(3),f=planningFixture(office),target='assessment:'+f.episode.id,order:string[]=[],claims:string[]=[];
 closeAssessment(f.entry.store,f.episode,'ordinary-by-model');f.review.status='cancelled';requestCapture(f.entry.store,target,'GH-999','observation','v1');
 const capture=f.entry.engine.captureEvidence;f.entry.engine.captureEvidence=async(...args)=>{order.push('capture');claims.push(f.entry.store.activeClaims().find(c=>c.lane==='operations')!.id);return capture(...args);};
 try {
  await office.pump();vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));
  const time=f.entry.store.state.coordination!.time={enabled:true,githubField:true,activatedAt:'',entries:[{id:'time',key:'GH-1',date:'2026-11-10',status:'pending',seconds:60}],baselines:{}} as any;
  vi.spyOn(TimeLedger.prototype,'sync').mockImplementation(async()=>{order.push('time');time.entries[0].status='published';return undefined as any;});
  requestCapture(f.entry.store,target,'GH-999','periodic','v1');const before=office.projection(f.entry,'operations').find(w=>w.stage==='evidence-capture')!;
  expect(office.projection(f.entry,'operations').find(w=>w.stage==='evidence-capture')!.enqueuedAt).toBe(before.enqueuedAt);
  await office.pump();expect(order).toEqual(['capture','time']);await office.pump();expect(order).toEqual(['capture','time','capture']);expect(claims[0]).not.toBe(claims[1]);
  expect(assessmentEpisode(f.entry.store,f.episode.id)?.outcome).toBe('ordinary-by-model');expect(f.run).not.toHaveBeenCalled();
 }finally{delete FEATURE_PLANNING[f.entry.store.project.id];vi.useRealTimers();}
});
test('queued assessment survives higher priority work; disabled pumping leaves assessment state unchanged',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));const office=offices(),f=planningFixture(office);
 try {
  await office.pump();const priority=enqueueRequest(f.entry.store,'reconcile-review','GH-123');
  const projection=office.projection.bind(office);office.projection=(entry,lane='delivery')=>projection(entry,lane).map(item=>item.work.id===priority.id?{...item,execute:async()=>{priority.status='completed';}}:item);
  vi.setSystemTime(new Date('2026-11-10T12:10:00Z'));await office.pump();
  expect(assessmentEpisode(f.entry.store,f.episode.id)?.closedAt).toBeUndefined();expect(f.run).not.toHaveBeenCalled();
  const before=f.entry.store.db.prepare('SELECT body FROM feature_assessments').all();delete FEATURE_PLANNING[f.entry.store.project.id];f.review.status='cancelled';await office.pump();expect(f.entry.store.db.prepare('SELECT body FROM feature_assessments').all()).toEqual(before);
 }finally{delete FEATURE_PLANNING[f.entry.store.project.id];vi.useRealTimers();}
});
test('the real pump keeps Morgan running beyond ten minutes until its result settles',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));const office=offices(),f=planningFixture(office),controller=new AbortController();let finish!:(v:any)=>void,pending:Promise<void>|undefined;
 try {
  await office.pump();f.entry.engine.agents.run=vi.fn(()=>{f.entry.engine.agents.active.set('pm',controller);return new Promise(resolve=>{finish=resolve}).finally(()=>f.entry.engine.agents.active.delete('pm'));}) as any;
  pending=office.pump();await vi.waitFor(()=>expect(finish).toBeDefined());const claim=f.entry.store.activeClaims().find(c=>c.work.kind==='assessment')!;
  vi.setSystemTime(new Date('2026-11-10T12:10:00Z'));await office.pump();expect(controller.signal.aborted).toBe(false);expect(f.entry.store.activeClaims().some(c=>c.id===claim.id)).toBe(true);expect(office.capacity.lane).toBe(f.entry.store.project.id);
  finish({disposition:'ordinary',rationale:'Completed working assessment',requirements:[],acceptanceCriteria:[],settledDecisions:[],openQuestions:[],imageObservations:[]});await pending;
  expect(assessmentEpisode(f.entry.store,f.episode.id)?.outcome).toBe('ordinary-by-model');expect(f.entry.store.state.features).toHaveLength(0);
 }finally{finish?.({disposition:'ordinary',rationale:'Cleanup',requirements:[],acceptanceCriteria:[],settledDecisions:[],openQuestions:[],imageObservations:[]});await pending;delete FEATURE_PLANNING[f.entry.store.project.id];vi.useRealTimers();}
});
test.each([true,false])('stopping process cleanup preserves pending assessment and lane ownership (alive=%s)',async alive=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));const office=offices(),f=planningFixture(office),other=office.get('cec').store;
 try {
  await office.pump();const claim=other.claimWork({projectId:'cec',kind:'delivery',id:'stopped'},'scheduler','implement')!;
  (other.state.workLog??=[]).push({id:'stopped-work',status:'stopping',processId:999997,role:'developer',requestId:'stopped',claimId:claim.id,elapsedMs:0} as any);
  vi.spyOn(process,'kill').mockImplementation(()=>{if(alive)return true;throw Object.assign(new Error('Gone'),{code:'ESRCH'});});
  f.entry.coordinator!.pump=async()=>{f.review.status='ready';};vi.setSystemTime(new Date('2026-11-10T12:10:00Z'));await office.pump();
  expect(assessmentEpisode(f.entry.store,f.episode.id)?.closedAt).toBeUndefined();expect(other.activeClaims().some(c=>c.id===claim.id)).toBe(alive);expect(f.run).not.toHaveBeenCalled();
 }finally{delete FEATURE_PLANNING[f.entry.store.project.id];vi.useRealTimers();}
});
test('bounded helper stopping claim remains a delivery blocker until its group is absent',async()=>{
 const office=offices(3),entry=office.get('cec');let alive=true;
 vi.spyOn(process,'kill').mockImplementation(()=>{if(alive)return true;throw Object.assign(new Error('gone'),{code:'ESRCH'});});
 const claim=entry.store.claimWork({kind:'feature',projectId:'cec',id:'feature-owner'},'fixture','feature-review')!;
 retainStoppingClaim(entry.store,claim,[4242]);
 const message=office.get('cms-field-vocabulary').conversations.enqueue({id:crypto.randomUUID(),body:'wait for termination'});let calls=0;office.get('cms-field-vocabulary').engine.agents.followup=async()=>{calls++;return reply;};
 await office.pump();expect(calls).toBe(0);expect(entry.store.activeClaims()[0].status).toBe('stopping');
 alive=false;await office.pump();expect(calls).toBe(1);expect(entry.store.activeClaims()).toEqual([]);expect(message.status).toBe('answered');
 office.dispose();
});
test('a malformed saved question round leaves other questions, snapshots and dispatch available', async () => {
    const office = offices();
    const entry = office.get('cec');
    const other = office.get('cms-field-vocabulary');
    const projectId = entry.store.project.id;
    FEATURE_PLANNING[projectId] = { progression: 'automatic' };
    try {
        const malformed = createFeature(entry.store, {
            action: 'create', requestId: 'malformed', title: 'Legacy round', intent: 'Synthetic',
        });
        malformed.status = 'waiting';
        malformed.rounds.push({
            id: 'legacy', revision: malformed.revision, author: 'product',
            createdAt: new Date().toISOString(), answers: {},
            questions: [{ id: 'q', question: 'No recommendation?' } as any],
        });

        const valid = createFeature(entry.store, {
            action: 'create', requestId: 'valid', title: 'Current round', intent: 'Synthetic',
        });
        valid.status = 'waiting';
        valid.rounds.push({
            id: 'current', revision: valid.revision, author: 'product',
            createdAt: new Date().toISOString(), answers: {},
            questions: [{ id: 'q', question: 'Which option?', recommendation: 'First', choices: ['First', 'Second'] }],
        });

        const questions = office.questions();
        expect(questions.map(({ featureId, roundId }) => ({ featureId, roundId })))
            .toEqual([{ featureId: valid.id, roundId: 'current' }]);
        expect(office.snapshot('cec').featureQuestions).toEqual(questions);
        expect(office.snapshot('cms-field-vocabulary').featureQuestions).toEqual(questions);
        expect(() => office.questionEvents()).not.toThrow();

        const message = other.conversations.enqueue({ id: crypto.randomUUID(), body: 'unrelated' });
        let calls = 0;
        other.engine.agents.followup = async () => { calls++; return reply; };
        await expect(office.pump()).resolves.toBeUndefined();
        expect(calls).toBe(1);
        expect(message.status).toBe('answered');
    } finally {
        delete FEATURE_PLANNING[projectId];
        office.dispose();
    }
});
import {retainStoppingClaim} from '../../../server/scheduling/stopping-claims';
import {createFeature} from '../../../server/features/commands';
