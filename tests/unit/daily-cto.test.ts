import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import * as processTools from '../../server/process';
import { Store } from '../../server/store';
import { ControlStore } from '../../server/control-store';
import { DailyCTO } from '../../server/daily-cto';
import { applyGoalReview, goalHistory } from '../../server/goal-reviews';
import { projectById } from '../../server/projects';
import { Engine } from '../../server/engine';
const stores: Store[] = [], controls: ControlStore[] = [], roots:string[]=[];
afterEach(() => { stores.splice(0).forEach(store => store.close()); controls.splice(0).forEach(store => store.close());roots.splice(0).forEach(root=>rmSync(root,{recursive:true,force:true}));vi.restoreAllMocks(); });
function setup() { const root=mkdtempSync(resolve(tmpdir(),'office-cto-recovery-'));roots.push(root);const clock = { now: () => new Date('2026-10-31T21:00:00Z'), monotonic: () => 0 }, store = new Store(':memory:', projectById('brain'), root, clock), control = new ControlStore(':memory:', clock); stores.push(store); controls.push(control); const engine = new Engine(store); store.state.paused = true; store.state.goals = [{ id: 'goal', projectId: 'brain', mapping: 'mapped', project: 'Brain', title: 'Keep human scope', detail: 'Keep human detail', status: 'idea', priority: 1, updatedAt: '2026-10-30T00:00:00Z', requestId: 'human' }]; return { store, control, engine, daily: new DailyCTO(control, () => [{ store, engine, conversations: {} as any }]) }; }
function update() { return { projectId: 'brain', goalId: 'goal', expectedUpdatedAt: '2026-10-30T00:00:00Z', progress: 'Evidence gap; no completion asserted', blockers: [], evidence: [], linkedWork: [], rationale: 'Actual collected facts', status: null }; }
test('weekend 5 PM review deduplicates, includes paused projects and coalesces catch-up', () => { const { control, daily } = setup(); daily.collect(); daily.collect(); expect(control.list()).toHaveLength(1); expect((control.list()[0].facts as any).projects[0].paused).toBe(true); daily.collect(new Date('2026-11-03T22:01:00Z')); expect(control.list()).toHaveLength(2); expect(control.forDate('2026-10-31')?.status).toBe('coalesced'); expect(control.forDate('2026-11-03')?.dueAt).toBe('2026-11-03T22:00:00.000Z'); });
test('goal application survives lost central acknowledgement, enforces versions and preserves ideas', () => { const { store } = setup(); applyGoalReview(store, 'review', update()); applyGoalReview(store, 'review', update()); expect(goalHistory(store)).toHaveLength(1); expect(store.state.goals![0]).toMatchObject({ title: 'Keep human scope', detail: 'Keep human detail', priority: 1, status: 'idea' }); expect(() => applyGoalReview(store, 'other', update())).toThrow('edited'); expect(() => goalHistory(store, '', 101)).toThrow(); });
test('daily assessment applies once, delivers a bounded conversation and protects concurrent edits', async () => { const { store, control, engine, daily } = setup(); daily.collect(); engine.ctoAgents.run = async () => ({ summary: 'All projects assessed with gaps.', updates: [update()], unmapped: [] } as any); await daily.pump(daily.pending()!); expect(control.list()[0].status).toBe('completed'); expect(goalHistory(store)).toHaveLength(1); expect(store.state.messages[0].body).toContain('All projects assessed'); expect(JSON.stringify(control.summaries())).not.toContain('collectedFacts'); });
test('unmapped goals and unsupported automatic completion remain unchanged', () => { const { store } = setup(); expect(() => applyGoalReview(store, 'bad', { ...update(), status: 'done' })).toThrow(); store.state.goals![0].mapping = 'unmapped'; expect(() => applyGoalReview(store, 'bad', update())).toThrow('mapping'); expect(goalHistory(store)).toHaveLength(0); });
test('daily report cannot silently omit a saved mapped goal', async () => {
    const { store, control, engine, daily } = setup(); daily.collect();
    engine.ctoAgents.run = async () => ({ summary: 'No meaningful progress known', updates: [], unmapped: [] } as any);
    await daily.pump(daily.pending()!);
    expect(control.list()[0]).toMatchObject({ status: 'blocked', detail: expect.stringContaining('omitted goal brain:goal') });
    expect(goalHistory(store)).toHaveLength(0); expect(store.state.goals![0].status).toBe('idea');
});
test('history cursor retains every application that shares a collection timestamp', () => {
    const { store } = setup();
    for (const reviewId of ['a', 'b', 'c'])
        store.db.prepare('INSERT INTO goal_review_applications VALUES(?,?,?,?,?)').run(reviewId, 'brain', 'goal', 'same', JSON.stringify({ reviewId, projectId: 'brain', goalId: 'goal', at: 'same' }));
    const first = goalHistory(store, 'goal', 1), second = goalHistory(store, 'goal', 1, first[0].cursor), third = goalHistory(store, 'goal', 1, second[0].cursor);
    expect([first[0].reviewId, second[0].reviewId, third[0].reviewId]).toEqual(['c', 'b', 'a']);
});

function failedAssessment(){
    const context=setup(),{store,control,daily}=context;daily.collect();
    const report=control.list()[0];control.update(report.id,report.revision,next=>{next.status='blocked';next.attemptId='original-attempt';next.detail='Original cleanup failure retained';});
    const work:any={id:'failed-read',role:'cto',stage:'daily-cto',requestId:'original-attempt',status:'failed',processId:2147483647,sessionId:'original-native-session'};store.state.workLog=[work];
    const directory=resolve(store.dataRoot,'sessions',work.id);mkdirSync(directory,{recursive:true});
    writeFileSync(resolve(directory,'provider.json'),JSON.stringify({project:'brain',role:'cto',readOnly:true}));
    return {...context,report:control.get(report.id)!,work,directory};
}
test('CTO recovery is durable and idempotent, keeps one date and original facts, and dispatches only when pumped',async()=>{
    const {store,control,engine,daily,report}=failedAssessment();
    const run=vi.fn(async()=>({summary:'Recovered all-project assessment',updates:[update()],unmapped:[]}));engine.ctoAgents.run=run as any;
    const queued=daily.queueRecovery(report.id);expect(queued).toMatchObject({id:report.id,status:'recovery-queued',date:report.date,collectedAt:report.collectedAt,facts:report.facts});
    expect(queued.recoveryHistory).toEqual([{attemptId:'original-attempt',detail:'Original cleanup failure retained',queuedAt:control.clock.now().toISOString()}]);
    expect(daily.queueRecovery(report.id).revision).toBe(queued.revision);expect(run).not.toHaveBeenCalled();expect(control.list()).toHaveLength(1);
    await daily.pump(daily.pending()!);expect(run).toHaveBeenCalledOnce();expect(control.get(report.id)?.status).toBe('completed');expect(store.state.workLog![0].status).toBe('failed');
    expect(goalHistory(store)).toHaveLength(1);daily.queueRecovery(report.id);await daily.pump(control.get(report.id)!);expect(run).toHaveBeenCalledOnce();
});
test('explicit CTO recovery survives the next daily collection while waiting for the CTO lane', async () => {
    const { store, control, engine, daily, report } = failedAssessment();
    const run = vi.fn(async () => ({ summary: 'Recovered original assessment', updates: [update()], unmapped: [] }));
    engine.ctoAgents.run = run as any;
    const queued = daily.queueRecovery(report.id);
    expect(control.claimLease('cto', 'occupied-cto-lane')).toBe(true);
    await daily.pump(daily.pending()!);
    expect(run).not.toHaveBeenCalled();

    const nextCollection = new Date('2026-11-01T22:01:00Z');
    vi.spyOn(control.clock, 'now').mockReturnValue(nextCollection);
    daily.collect();
    expect(control.forDate('2026-11-01')?.status).toBe('queued');
    expect(control.get(report.id)).toEqual(queued);
    expect(daily.pending()).toEqual(queued);
    expect(daily.queueRecovery(report.id)).toEqual(queued);
    expect(run).not.toHaveBeenCalled();

    control.releaseLease('cto', 'occupied-cto-lane');
    await daily.pump(daily.pending()!);
    expect(run).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledWith('cto', expect.stringContaining(`for ${report.date}, collected ${report.collectedAt}.`), expect.anything(), expect.objectContaining({ readOnly: true, stage: 'daily-cto' }));
    expect(run).toHaveBeenCalledWith('cto', expect.stringContaining(`Facts: ${JSON.stringify(report.facts)}`), expect.anything(), expect.anything());
    expect(control.get(report.id)).toMatchObject({ id: report.id, status: 'completed', date: report.date, collectedAt: report.collectedAt, facts: report.facts, recoveryHistory: queued.recoveryHistory });
    expect(goalHistory(store)).toHaveLength(1);
    daily.queueRecovery(report.id);
    await daily.pump(control.get(report.id)!);
    expect(run).toHaveBeenCalledOnce();
    expect(goalHistory(store)).toHaveLength(1);
});
test('CTO recovery refuses active groups and unverified reader identity',()=>{
    const {daily,report,work,directory}=failedAssessment();work.status='running';expect(()=>daily.queueRecovery(report.id)).toThrow('stopped');work.status='failed';
    const alive=vi.spyOn(processTools,'processGroupAlive').mockReturnValue(true);expect(()=>daily.queueRecovery(report.id)).toThrow('stopped');alive.mockRestore();
    writeFileSync(resolve(directory,'provider.json'),JSON.stringify({project:'brain',role:'cto',readOnly:false}));expect(()=>daily.queueRecovery(report.id)).toThrow('read-only');
});
test('CTO recovery resumes an existing proposal without rerunning a model or duplicating an applied goal',async()=>{
    const {store,control,engine,daily,report}=failedAssessment();applyGoalReview(store,report.id,update());
    control.update(report.id,report.revision,next=>{next.result={summary:'Saved assessment',updates:[update()],unmapped:[]};});
    const run=vi.fn();engine.ctoAgents.run=run;expect(daily.queueRecovery(report.id).status).toBe('assessed');
    await daily.pump(daily.pending()!);expect(run).not.toHaveBeenCalled();expect(goalHistory(store)).toHaveLength(1);expect(control.get(report.id)?.applied).toEqual(['brain:goal']);expect(control.get(report.id)?.status).toBe('completed');
});

test('daily missing-evidence proposal queues one owning-project PM task, survives application recovery, and ends after the mapped answer', async () => {
    const { Conversations } = await import('../../server/conversations');
    const { store, control, engine, daily } = setup(); store.state.paused = false;
    daily.collect(); const report = control.list()[0], facts = report.facts as any;
    const request = { projectId: 'brain', goals: [{ goalId: 'goal', expectedUpdatedAt: update().expectedUpdatedAt }], inputFingerprint: facts.projects[0].goalEvidenceInputFingerprint, questions: ['Which current project PR and hosted acceptance cover this goal; what remains?'] };
    const assess = vi.fn(async () => ({ summary: 'Goal needs project-scoped delivery evidence.', updates: [update()], unmapped: [], evidenceRequests: [request] })); engine.ctoAgents.run = assess as any;
    const deliver = vi.fn(); engine.agents.followup = deliver;
    await daily.pump(daily.pending()!); expect(deliver).not.toHaveBeenCalled();
    let pending = store.state.messages.filter(message => message.goalEvidenceRequest && message.from === 'cto' && message.to === 'pm');
    expect(pending).toHaveLength(1); expect(pending[0]).toMatchObject({ contextProject: 'brain', status: 'queued', goalEvidenceRequest: { reviewId: report.id, goalIds: ['goal'], fingerprint: request.inputFingerprint } });
    expect(assess.mock.calls[0]).toBeDefined();
    const complete = control.get(report.id)!; control.update(complete.id, complete.revision, next => { next.status = 'assessed'; });
    const recovered = new DailyCTO(control, () => [{ store, engine, conversations: {} as any }]); await recovered.pump(recovered.pending()!);
    expect(assess).toHaveBeenCalledOnce(); expect(goalHistory(store)).toHaveLength(1);
    expect(store.state.messages.filter(message => message.from === 'cto' && message.to === 'pm')).toHaveLength(1);
    const answer = { handoffProject: '', pickupChange: null, reply: 'Current project evidence and precise remaining scope supplied.', notifyRoles: ['cto'], goalChanges: [], slackRequests: [], notes: [], question: '', receipts: [], goalReport: { projectId: 'brain', goalIds: ['goal'], summary: 'Same-project evidence supplied; full acceptance remains.' } };
    engine.agents.followup = vi.fn(async () => answer as any);
    engine.ctoAgents.followup = vi.fn(async () => ({ ...answer, notifyRoles: ['pm'] } as any));
    const chat = new Conversations(store, engine, '/private/tmp'); chat.archive = () => {};
    await chat.pump(); expect(store.state.messages.filter(message => message.from === 'pm' && message.to === 'cto' && message.status === 'queued')).toHaveLength(1);
    await chat.pumpCTO(); await chat.pumpCTO();
    expect(engine.ctoAgents.followup).toHaveBeenCalledOnce();
    expect(store.state.messages.filter(message => message.from === 'cto' && message.to === 'pm')).toHaveLength(1);
    expect(store.state.goals![0]).toMatchObject({ title: 'Keep human scope', detail: 'Keep human detail', priority: 1, status: 'idea' });
});

test.each(['foreign-project', 'stale-goal', 'provider-drift', 'malformed-request'])('daily evidence request rejects %s before queueing delivery', async reason => {
    const { store, control, engine, daily } = setup(); daily.collect(); const report = control.list()[0], facts = report.facts as any;
    const request = { projectId: reason === 'foreign-project' ? 'cec' : 'brain', goals: [{ goalId: 'goal', expectedUpdatedAt: update().expectedUpdatedAt }], inputFingerprint: facts.projects[0].goalEvidenceInputFingerprint, questions: ['Provide exact scope evidence.'] };
    if (reason === 'malformed-request') request.questions = [];
    if (reason === 'stale-goal') store.state.goals![0].updatedAt = '2026-11-01T00:00:00Z';
    if (reason === 'provider-drift') store.state.github = { status: 'blocked', observedAt: '', error: 'Provider unavailable after collection', issues: [], prs: [], runs: [] };
    engine.ctoAgents.run = vi.fn(async () => ({ summary: 'Missing evidence', updates: [update()], unmapped: [], evidenceRequests: [request] })) as any;
    await daily.pump(daily.pending()!);
    expect(control.get(report.id)?.status).toBe('conflicted'); expect(control.get(report.id)?.conflicts[0]).toMatch(/^evidence-request:0:/); expect(store.state.messages.filter(message => message.goalEvidenceRequest)).toHaveLength(0); expect(goalHistory(store)).toHaveLength(reason === 'stale-goal' ? 0 : 1);
});


test('one drifted project request cannot strand other project requests or goal updates, including recovery of the saved proposal', async () => {
    const { store, control, engine } = setup();
    const root = mkdtempSync(resolve(tmpdir(), 'office-cto-other-project-')); roots.push(root);
    const cec = new Store(':memory:', projectById('cec'), root, store.clock); stores.push(cec);
    cec.state.goals = [{ ...store.state.goals![0], id: 'cec-goal', projectId: 'cec', project: 'CEC', status: 'active' }];
    const cecEngine = new Engine(cec), entries = [{ store, engine, conversations: {} as any }, { store: cec, engine: cecEngine, conversations: {} as any }];
    const daily = new DailyCTO(control, () => entries); daily.collect(); const original = control.list()[0], facts = original.facts as any;
    const requests = facts.projects.map((project: any) => ({ projectId: project.projectId, goals: [{ goalId: project.goals[0].id, expectedUpdatedAt: project.goals[0].updatedAt }], inputFingerprint: project.goalEvidenceInputFingerprint, questions: ['Supply this project scope-specific hosted evidence.'] }));
    const result = { summary: 'Both projects assessed; one request has stale provider inputs.', updates: [update(), { ...update(), projectId: 'cec', goalId: 'cec-goal' }], unmapped: [], evidenceRequests: requests }, raw = structuredClone(result);
    const assess = vi.fn(async () => result); engine.ctoAgents.run = assess as any;
    const delivery = vi.fn(); engine.agents.followup = cecEngine.agents.followup = delivery;
    store.state.github = { status: 'blocked', observedAt: '', error: 'Changed after collection', issues: [], prs: [], runs: [] };
    await daily.pump(daily.pending()!);
    let report = control.get(original.id)!;
    expect(report).toMatchObject({ status: 'conflicted', result: raw, applied: ['brain:goal', 'cec:cec-goal'], conflicts: [expect.stringContaining('evidence-request:0: Error: Goal evidence inputs changed after collection')] });
    expect(goalHistory(store)).toHaveLength(1); expect(goalHistory(cec)).toHaveLength(1);
    expect(store.state.messages.filter(message => message.goalEvidenceRequest)).toHaveLength(0);
    const queued = cec.state.messages.filter(message => message.goalEvidenceRequest); expect(queued).toHaveLength(1); expect(queued[0].status).toBe('queued');
    expect(delivery).not.toHaveBeenCalled(); expect(assess).toHaveBeenCalledOnce();
    expect(daily.queueRecovery(report.id).status).toBe('conflicted'); await daily.pump(control.get(report.id)!);
    expect(control.get(report.id)?.conflicts).toEqual(report.conflicts);
    // Simulate a lost central acknowledgement after durable requests/applications.
    report = control.get(report.id)!; control.update(report.id, report.revision, next => { next.status = 'assessed'; });
    const recovered = new DailyCTO(control, () => entries); await recovered.pump(recovered.pending()!);
    report = control.get(report.id)!;
    expect(report).toMatchObject({ status: 'conflicted', result: raw, applied: ['brain:goal', 'cec:cec-goal'], conflicts: [expect.stringContaining('evidence-request:0:')] });
    expect(cec.state.messages.filter(message => message.goalEvidenceRequest).map(message => message.id)).toEqual([queued[0].id]);
    expect(goalHistory(store)).toHaveLength(1); expect(goalHistory(cec)).toHaveLength(1); expect(assess).toHaveBeenCalledOnce(); expect(delivery).not.toHaveBeenCalled();
});

test('a genuine evidence-request persistence failure stays blocked and never masquerades as a semantic conflict', async () => {
    const { store, control, engine, daily } = setup(); daily.collect(); const original = control.list()[0], facts = original.facts as any;
    const result = { summary: 'Private SQLite failure fixture.', updates: [update()], unmapped: [], evidenceRequests: [{ projectId: 'brain', goals: [{ goalId: 'goal', expectedUpdatedAt: update().expectedUpdatedAt }], inputFingerprint: facts.projects[0].goalEvidenceInputFingerprint, questions: ['Provide exact scope evidence.'] }] };
    engine.ctoAgents.run = vi.fn(async () => result) as any;
    store.db.exec('PRAGMA query_only=ON');
    await daily.pump(daily.pending()!);
    expect(control.get(original.id)).toMatchObject({ status: 'blocked', result, conflicts: [], applied: [], detail: expect.stringMatching(/readonly|read-only/i) });
    expect(store.state.messages.filter(message => message.goalEvidenceRequest)).toHaveLength(0); expect(goalHistory(store)).toHaveLength(0);
    store.db.exec('PRAGMA query_only=OFF');
});
