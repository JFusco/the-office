import { afterEach, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { Store } from '../../server/store';
import { Engine } from '../../server/engine';
import { Conversations, ConversationResultSchema } from '../../server/conversations';
import { saveGoal } from '../../server/goals';
import { projectById } from '../../server/projects';
import { goalReportContext, projectPRFacts } from '../../server/goal-reporting';
import { collectCTOFacts } from '../../server/cto-collector';
import { applyGoalReview, workEvidence } from '../../server/goal-reviews';
import { coordination } from '../../server/coordination';
import { assertStrictOutputSchema } from '../../server/structured-output';

const stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); vi.restoreAllMocks(); });
function setup(project = 'cec') {
    const store = new Store(':memory:', projectById(project)); stores.push(store);
    const engine = new Engine(store), chat = new Conversations(store, engine, '/private/tmp');
    chat.archive = () => {};
    const goal = saveGoal(store, { id: crypto.randomUUID(), expectedUpdatedAt: '', project: store.project.name,
        title: 'Goal with human scope', detail: 'Entire feature acceptance', priority: 2, status: 'active' });
    return { store, engine, chat, goal };
}
const reply = { handoffProject: '', pickupChange: null, reply: 'Synthetic delivery update', notifyRoles: ['cto'] as const,
    goalChanges: [], slackRequests: [], notes: [], question: '', receipts: [] };

test('routine PM progress cannot enqueue CTO work, even when a model requests notification', async () => {
    const { store, engine, chat } = setup();
    engine.agents.followup = async () => ({ ...reply, notifyRoles: ['cto'] });
    const cto = vi.fn(); engine.ctoAgents.followup = cto;
    const request = chat.enqueue({ id: crypto.randomUUID(), role: 'pm', body: 'Ticket tests are running.' });
    await chat.pump(); await chat.pumpCTO();
    expect(request.status).toBe('answered'); expect(cto).not.toHaveBeenCalled();
    expect(store.state.messages.some(message => message.to === 'cto')).toBe(false);
    expect(store.state.leadershipReports || []).toHaveLength(0);
});

test.each(['wrong-project', 'missing-goal', 'duplicate-goal'])('invalid %s goal reports stay with PM', async reason => {
    const { store, engine, chat, goal } = setup();
    engine.agents.followup = async () => ({ ...reply, notifyRoles: ['cto'], goalReport: {
        projectId: reason === 'wrong-project' ? 'brain' : 'cec',
        goalIds: reason === 'missing-goal' ? ['not-saved'] : reason === 'duplicate-goal' ? [goal.id, goal.id] : [goal.id], summary: 'Unaccepted link',
    } });
    chat.enqueue({ id: crypto.randomUUID(), role: 'pm', body: 'Synthetic goal report' });
    await chat.pump(); expect(store.state.messages.some(message => message.to === 'cto')).toBe(false);
});

test('goal-specific PM handoff is queued once for an independent CTO session in the owning project', async () => {
    const { store, engine, chat, goal } = setup();
    const report = { projectId: 'cec', goalIds: [goal.id], summary: 'CEC goal has reviewed local implementation; connected acceptance remains.' };
    engine.agents.followup = async () => ({ ...reply, notifyRoles: ['cto'], goalReport: report });
    const cto = vi.fn(async (_role: unknown, message: any) => {
        expect(message).toMatchObject({ from: 'pm', contextProject: 'cec', goalReport: report });
        return { ...reply, notifyRoles: [] };
    }); engine.ctoAgents.followup = cto;
    chat.enqueue({ id: crypto.randomUUID(), role: 'pm', body: 'Update Avery on this CEC goal.' });
    await chat.pump(); expect(cto).not.toHaveBeenCalled();
    expect(store.state.messages.filter(message => message.to === 'cto' && message.status === 'queued')).toHaveLength(1);
    await chat.pumpCTO(); await chat.pumpCTO(); expect(cto).toHaveBeenCalledOnce();
    expect(store.state.goals![0].status).toBe('active');
});

test('PM goal assessment context excludes other projects and global conversation history', () => {
    const context = { projects: [{ project: { id: 'cec' }, azure: { prs: [{ id: 7 }] } }, { project: { id: 'brain' }, github: { prs: [{ number: 99 }] } }], history: [{ project: 'Brain', body: 'Unrelated' }] };
    const scoped = goalReportContext(context, { from: 'pm' } as any, 'cec');
    expect(scoped).toEqual({ projectId: 'cec', projects: [context.projects[0]], report: null });
    expect(goalReportContext(context, { from: 'human' } as any, 'cec')).toBe(context);
});

test('legacy queued PM chatter is retained without consuming a CTO model session', async () => {
    const { store, engine, chat } = setup();
    const original = chat.enqueue({ id: crypto.randomUUID(), role: 'cto', body: 'Historic routine delivery report' });
    original.from = 'pm';
    const cto = vi.fn(); engine.ctoAgents.followup = cto;
    await chat.pumpCTO(); expect(cto).not.toHaveBeenCalled();
    expect(original).toMatchObject({ status: 'answered', body: 'Historic routine delivery report' });
    expect(store.state.events.some(event => event.kind === 'cto-report-skipped')).toBe(true);
});

test('all four CEC goals are collected with CEC Azure PR evidence, separately from Brain GitHub facts', () => {
    const cec = setup(), brain = setup('brain');
    for (let i = 0; i < 3; i++) cec.store.state.goals!.push({ ...cec.goal, id: `cec-${i}`, title: `Human goal ${i}` });
    const at = '2026-10-30T14:00:00.000Z';
    cec.store.state.azure.observedAt = at; cec.store.state.azure.error = '';
    cec.store.state.azure.prs = [{ id: 40851, title: 'CEC candidate', status: 'active', draft: true, source: 'feature', target: 'main', commit: 'cec-head', mergeCommit: '', url: 'https://azure.example/cec/pr/40851', policies: [] }];
    brain.store.state.github = { status: 'idle', observedAt: '', error: '', prs: [], issues: [], runs: [] };
    brain.store.state.github!.observedAt = at; brain.store.state.github!.error = '';
    brain.store.state.github!.prs = [{ number: 400, title: 'Brain candidate', state: 'OPEN', draft: true, author: 'agent', head: 'brain-head', base: 'base', url: 'https://github.com/JFusco/brain/pull/400', mergedAt: '', mergeable: true, reviews: [], checks: [] }];
    const facts = collectCTOFacts([cec, brain].map(({ store, engine }) => ({ store, engine, conversations: {} as any })), at);
    expect(facts.projects[0].goals).toHaveLength(4);
    expect(facts.projects[0].pullRequests).toMatchObject({ projectId: 'cec', provider: 'azure', prs: [{ id: 40851, head: 'cec-head', version: at }] });
    expect(JSON.stringify(facts.projects[0])).not.toContain('brain-head');
    expect(projectPRFacts(brain.store).prs).toMatchObject([{ id: 400, head: 'brain-head' }]);
    const ref = { projectId: 'cec', kind: 'pr' as const, id: '40851', version: at, head: 'cec-head' };
    expect(workEvidence(cec.store, ref)).toEqual({ started: true, accepted: false });
    expect(workEvidence(brain.store, ref)).toBeNull();
    expect(workEvidence(cec.store, { ...ref, head: 'old' })).toBeNull();
    cec.store.state.azure.error = 'Unavailable'; expect(workEvidence(cec.store, ref)).toBeNull();
});

test('fresh goal report schema is strict without changing historical reply parsing', () => {
    const schema = z.toJSONSchema(ConversationResultSchema, { target: 'draft-7' });
    expect(() => assertStrictOutputSchema(schema)).not.toThrow();
    expect(schema.required).toContain('goalReport');
    expect(ConversationResultSchema.safeParse({ ...reply, notifyRoles: [], goalReport: null }).success).toBe(true);
});
test('tracked GitHub PR accepts current provider progress evidence separately from delivery acceptance', () => {
    const { store, goal } = setup('brain');
    const head = 'a'.repeat(40), providerVersion = '2026-10-30T14:00:00.000Z', deliveryVersion = '2026-10-30T13:00:00.000Z';
    store.state.coordination = coordination();
    const job = { id: 'delivery-999', key: 'GH-999', pr: 700, head, mergeCommit: '', updatedAt: deliveryVersion, stage: 'lead-pr', status: 'watching', steps: [{ stage: 'review', result: { outcome: 'passed', receipts: [] } }] } as any;
    store.state.coordination.jobs = [job];
    store.state.github = { status: 'idle', observedAt: providerVersion, error: '', issues: [], runs: [], prs: [{ number: 700, title: 'Goal progress candidate', state: 'OPEN', draft: false, author: 'agent', head, base: 'base', url: 'https://github.com/JFusco/brain/pull/700', mergedAt: '', mergeable: true, reviews: [], checks: [] }] };
    const ref = { projectId: 'brain', kind: 'pr' as const, id: '700', version: providerVersion, head };
    expect(workEvidence(store, ref)).toEqual({ started: true, accepted: false });
    const update = { projectId: 'brain', goalId: goal.id, expectedUpdatedAt: goal.updatedAt, progress: 'Current PR supports progress; acceptance remains outstanding.', blockers: [], evidence: [ref], linkedWork: [ref], rationale: 'Current owning-project provider observation', status: null };
    applyGoalReview(store, 'provider-progress', update);
    expect(goal.progress?.evidence).toEqual([ref]); expect(goal.status).toBe('active');
    for (const invalid of [{ projectId: 'cec' }, { head: 'b'.repeat(40) }, { version: 'stale' }])
        expect(workEvidence(store, { ...ref, ...invalid })).toBeNull();
    store.state.github.error = 'Provider unavailable'; expect(workEvidence(store, ref)).toBeNull(); store.state.github.error = '';
    // The provider's current head remains valid when delivery still records an older candidate.
    job.head = 'b'.repeat(40); expect(workEvidence(store, ref)).toEqual({ started: true, accepted: false }); job.head = head;
    const deliveryRef = { ...ref, kind: 'job' as const, id: job.id, version: deliveryVersion };
    expect(workEvidence(store, { ...deliveryRef, version: providerVersion })).toBeNull();
    expect(workEvidence(store, deliveryRef)).toEqual({ started: true, accepted: false });
    job.status = 'completed'; job.stage = 'closeout';
    job.steps.push({ stage: 'closeout', result: { outcome: 'passed', receipts: [{ verified: true, uncertain: false }] } });
    expect(workEvidence(store, deliveryRef)).toEqual({ started: true, accepted: true });
    expect(workEvidence(store, { ...ref, version: deliveryVersion })).toEqual({ started: true, accepted: true });
    expect(workEvidence(store, ref)).toEqual({ started: true, accepted: false });
    expect(() => applyGoalReview(store, 'provider-completion', { ...update, expectedUpdatedAt: goal.updatedAt, status: 'done' })).toThrow('scope acceptance');
});

test('fresh daily evidence requests are strict while historic daily results remain readable', async () => {
    const { DailyResultSchema, FreshDailyResultSchema } = await import('../../server/goal-reviews');
    expect(DailyResultSchema.parse({ summary: 'Old saved result', updates: [], unmapped: [] })).not.toHaveProperty('evidenceRequests');
    expect(() => assertStrictOutputSchema(z.toJSONSchema(FreshDailyResultSchema, { target: 'draft-7' }))).not.toThrow();
    expect(FreshDailyResultSchema.safeParse({ summary: 'Fresh result', updates: [], unmapped: [], evidenceRequests: [] }).success).toBe(true);
    expect(FreshDailyResultSchema.safeParse({ summary: 'Fresh result', updates: [], unmapped: [], evidenceRequests: [{ projectId: 'cec', goals: [], inputFingerprint: 'x', questions: [] }] }).success).toBe(false);
});

test.each(['goals', 'provider', 'foreign-report'])('a queued PM evidence request cannot grant %s authority', async kind => {
    const { queueGoalEvidenceRequest, goalEvidenceFingerprint } = await import('../../server/goal-reporting');
    const { store, engine, chat, goal } = setup();
    const message = queueGoalEvidenceRequest(store, 'review', { projectId: 'cec', goals: [{ goalId: goal.id, expectedUpdatedAt: goal.updatedAt }], inputFingerprint: goalEvidenceFingerprint(store), questions: ['What scope passed staging?'] });
    engine.agents.followup = async () => ({ ...reply, notifyRoles: ['cto'], goalReport: { projectId: kind === 'foreign-report' ? 'brain' : 'cec', goalIds: [goal.id], summary: 'Evidence only' },
        goalChanges: kind === 'goals' ? [{ ...goal, expectedUpdatedAt: goal.updatedAt, title: 'Unauthorized edit' }] as any : [],
        pickupChange: kind === 'provider' ? { status: 'Ready' } as any : null });
    await chat.pump(); expect(message.status).toBe('failed'); expect(store.state.goals![0].title).toBe('Goal with human scope'); expect(store.state.messages.some(item => item.from === 'pm' && item.to === 'cto')).toBe(false);
});

test('actual human CTO direction returns the mapped PM answer exactly once and cannot recurse into another PM handoff', async () => {
    const { queueCompletedGoalEvidenceReport } = await import('../../server/goal-reporting');
    const { store, engine, chat, goal } = setup();
    engine.ctoAgents.followup = vi.fn(async (_role, message) => ({ ...reply, notifyRoles: ['pm'], handoffProject: 'cec', reply: message.from === 'human' ? 'Gather CEC goal evidence from delivery.' : 'Acknowledged goal evidence; no further handoff.' } as any));
    engine.agents.followup = vi.fn(async () => ({ ...reply, notifyRoles: [], goalReport: { projectId: 'cec', goalIds: [goal.id], summary: 'Hosted selected-note acceptance passed; exact remaining scope recorded.' } } as any));
    const human = chat.enqueue({ id: crypto.randomUUID(), role: 'cto', body: 'Ask Morgan how these CEC goals were tested on staging.' });
    await chat.pumpCTO(); const handoff = store.state.messages.find(message => message.id === `cto-handoff:${human.id}`)!;
    expect(handoff).toMatchObject({ from: 'cto', to: 'pm', status: 'queued', contextProject: 'cec' });
    await chat.pump();
    const returned = store.state.messages.filter(message => message.id === `pm-report:${handoff.id}`); expect(returned).toHaveLength(1); expect(returned[0].goalEvidenceReturn?.requestId).toBe(handoff.id);
    const savedAnswer = store.state.messages.find(message => message.requestId === handoff.id && message.from === 'pm')!;
    queueCompletedGoalEvidenceReport(store, handoff.id); expect(store.state.messages.filter(message => message.id === returned[0].id)).toHaveLength(1);
    await chat.pumpCTO(); await chat.pumpCTO();
    expect(engine.ctoAgents.followup).toHaveBeenCalledTimes(2); expect(engine.agents.followup).toHaveBeenCalledOnce();
    expect(store.state.messages.filter(message => message.from === 'cto' && message.to === 'pm')).toHaveLength(1);
    expect(savedAnswer.goalReport?.goalIds).toEqual([goal.id]); expect(goal.status).toBe('active');
});

function savedLegacyGoalAnswer(context: ReturnType<typeof setup>) {
    const { store, goal } = context, humanId = crypto.randomUUID(), requestId = `cto-handoff:${humanId}`;
    const fields = { ticket: '', actionId: '', status: 'answered' as const, createdAt: store.clock.now().toISOString(), sessionId: '', recheck: false, error: '', recipients: [], receipts: [] };
    store.state.messages.push({ ...fields, id: humanId, requestId: humanId, from: 'human', to: 'cto', body: 'Get CEC goal evidence.' });
    store.state.messages.push({ ...fields, id: crypto.randomUUID(), requestId: humanId, from: 'cto', to: 'cto', body: 'Morgan will collect this project evidence.', recipients: ['pm'] });
    const request = { ...fields, id: requestId, requestId, from: 'cto' as const, to: 'pm' as const, body: `Avery's queued direction for CEC: Collect evidence.\nOriginal human request (context): Get CEC goal evidence.` };
    const answer = { ...fields, id: crypto.randomUUID(), requestId, from: 'pm' as const, to: 'pm' as const, body: 'Actual saved PM evidence answer; original recipients empty.', goalReport: { projectId: 'cec', goalIds: [goal.id], summary: 'Current staging tested selected annotation submission; further scope remains.' } };
    store.state.messages.push(request, answer); return { request, answer };
}
test('saved historical PM answer with empty recipients is reconciled without model rerun or raw-answer edits, durably across restart', async () => {
    const { mkdtempSync, rmSync } = await import('node:fs'); const { tmpdir } = await import('node:os'); const { resolve } = await import('node:path');
    const { queueCompletedGoalEvidenceReport } = await import('../../server/goal-reporting'); const original = setup(), { request, answer } = savedLegacyGoalAnswer(original), raw = structuredClone(answer);
    const root = mkdtempSync(resolve(tmpdir(), 'office-goal-return-')), file = resolve(root, 'office.sqlite');
    let durable: Store | undefined;
    try {
        durable = new Store(file, original.store.project, root); durable.state = structuredClone(original.store.state); durable.save();
        const queued = queueCompletedGoalEvidenceReport(durable, request.id); durable.close(); durable = new Store(file, original.store.project, root);
        expect(queueCompletedGoalEvidenceReport(durable, request.id).id).toBe(queued.id);
        expect(durable.state.messages.find(item => item.id === answer.id)).toEqual(raw);
        expect(durable.state.messages.filter(item => item.id === queued.id)).toHaveLength(1);
    } finally { durable?.close(); rmSync(root, { recursive: true, force: true }); }
});
test.each(['foreign-goal', 'missing-cto-ack', 'pm-report-cycle', 'ambiguous-answer', 'unfinished-request'])('saved answer reuse rejects %s without synthesizing a report', async reason => {
    const { queueCompletedGoalEvidenceReport } = await import('../../server/goal-reporting'); const context = setup(), { store } = context, { request, answer } = savedLegacyGoalAnswer(context);
    if (reason === 'foreign-goal') answer.goalReport.projectId = 'brain';
    if (reason === 'missing-cto-ack') store.state.messages.find(item => item.from === 'cto' && item.to === 'cto')!.recipients = [];
    if (reason === 'pm-report-cycle') store.state.messages.find(item => item.from === 'human')!.from = 'pm';
    if (reason === 'ambiguous-answer') store.state.messages.push({ ...answer, id: crypto.randomUUID() });
    if (reason === 'unfinished-request') request.status = 'working' as any;
    expect(() => queueCompletedGoalEvidenceReport(store, request.id)).toThrow();
    expect(store.state.messages.filter(item => item.id === `pm-report:${request.id}`)).toHaveLength(0); expect(answer.recipients).toEqual([]);
});


test('reconcile-goal-report command admits one durable saved-answer return with no model and rejects missing/foreign input', async () => {
    const { reconcileGoalReportCommand } = await import('../../server/goal-reporting');
    const context = setup(), { store, engine } = context, { request, answer } = savedLegacyGoalAnswer(context), raw = structuredClone(answer);
    const model = vi.fn(); engine.ctoAgents.followup = model; engine.agents.followup = model;
    const accepted = reconcileGoalReportCommand(store, request.id);
    expect(accepted).toEqual({ accepted: true, id: `pm-report:${request.id}`, status: 'queued' });
    expect(reconcileGoalReportCommand(store, request.id)).toEqual(accepted); expect(model).not.toHaveBeenCalled();
    expect(store.state.messages.find(item => item.id === answer.id)).toEqual(raw);
    expect(() => reconcileGoalReportCommand(store, undefined)).toThrow(); expect(() => reconcileGoalReportCommand(store, 'missing')).toThrow();
    const foreign = setup('brain'); expect(() => reconcileGoalReportCommand(foreign.store, request.id)).toThrow();
    expect(store.state.messages.filter(item => item.id === accepted.id)).toHaveLength(1);
});
