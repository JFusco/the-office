import { afterEach, expect, test } from 'vitest';
import { migrateSnapshot } from '../../../server/store/migrations';
import { terminalCandidates, ticketCompletedId } from '../../../server/knowledge/retrospective-triggers';
import { recordSourceConfigBudget, recordTechnicalBudget, recordTicketParked } from '../../../server/knowledge/record-trigger';
import { runRetrospective, type KnowledgeRunner } from '../../../server/knowledge/run-retrospective';
import { scheduledRetrospectives } from '../../../server/knowledge/scheduled-retrospectives';
import { ticketSubject } from '../../../server/knowledge/retrospective-subject';
import { retrospectiveFacts } from '../../../server/knowledge/retrospective-facts';
import { publishParked } from '../../../server/cec/parking/park-ticket';
import { implementationContinuationDecision } from '../../../server/delivery/recovery/implementation/implementation-continuation';
import type { Ticket } from '../../../src/shared';
import { job, knowledgeStore, result } from './knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
function setup(projectId = 'cec') { const fixture = knowledgeStore(projectId); cleanup.push(fixture.close); return fixture; }
const ticket = (overrides: Partial<Ticket> = {}): Ticket => ({ key: 'CEC-77', summary: 'Fixture', type: 'Story', status: 'In Progress', statusId: '', assignee: '', subtask: false, boardMember: true, url: 'https://verndale.atlassian.net/browse/CEC-77', updated: '2026-11-05T12:00:00Z', stage: 'code-review', activity: 'working', blocker: '', runId: 'cec-77-run', attempt: 0, commit: 'c'.repeat(40), branch: '', worktree: '', previewUrl: '', prId: 41, results: {}, findings: [], evidence: [], pilot: true, observedAt: '', ...overrides });

test('CEC history is baselined once when tickets first join the trigger sources', () => {
    const { store } = setup();
    store.state.tickets = [ticket({ stage: 'complete' }), ticket({ key: 'CEC-78', runId: 'cec-78-run', parked: { stage: 'qa', reason: 'Decide copy', at: '', fromStatus: 'In Progress', marker: 'Office decision a1', published: true } })];
    store.state.knowledge!.baselines = ['jobs']; // a slice 1 store: knowledge exists, tickets were never baselined
    migrateSnapshot(store.state, store.project);
    expect(terminalCandidates(store.state.knowledge!, [], store.state.tickets)).toEqual([]);
    recordTicketParked(store, store.state.tickets[1]);
    expect(store.state.knowledge!.pending).toEqual([]);
    expect(store.state.knowledge!.baselines).toContain('tickets');
});

test('a completed CEC pilot run gets a retrospective with Jira and Azure links and results in pipeline order', async () => {
    const { store } = setup();
    const done = ticket({ stage: 'complete', results: { qa: result('qa', { findings: [{ id: 'Q1', summary: 'Focus ring missing', expected: '', actual: '', status: 'verified', attempts: 1 }] }), implement: result('implement') } });
    store.state.tickets = [done];
    expect(terminalCandidates(store.state.knowledge!, [], store.state.tickets).map(c => c.id)).toEqual([ticketCompletedId(done)]);
    const packet = retrospectiveFacts(store, ticketSubject(done), { id: ticketCompletedId(done), trigger: 'completed', event: { stage: 'complete', head: '', steps: 2, reason: '' } });
    expect(packet.steps.map(step => (step as { stage: string }).stage)).toEqual(['implement', 'qa']);
    expect(packet.catalog[`ticket:${done.runId}`].url).toBe(done.url);
    expect(packet.catalog[`pr:${done.runId}:41`].url).toMatch(/\/pullrequest\/41$/);
    let prompt = '';
    const run = (async (text: string) => { prompt = text; return { summary: 'QA caught a focus ring gap.', lessons: [{ statement: 'Check focus rings on new controls before QA', detail: '', kind: 'pitfall', stages: ['implement'], paths: [], evidenceIds: [`finding:${done.runId}:1:Q1`], repositoryInstruction: true }], recurrences: [] }; }) as KnowledgeRunner;
    await runRetrospective(store, run, ticketCompletedId(done));
    expect(prompt).toContain('a Jira/Azure ticket');
    const knowledge = store.state.knowledge!;
    expect(knowledge.consumed).toContain(ticketCompletedId(done));
    expect(knowledge.lessons[0]).toMatchObject({ scope: 'project', statement: 'Check focus rings on new controls before QA' });
    expect(knowledge.lessons[0].repositoryInstruction).toBeUndefined(); // AGENTS.md issues are GitHub-only
    expect(knowledge.retrospectives[0]).toMatchObject({ subject: 'ticket', key: 'CEC-77' });
});

test('a Jira Blocked park is recorded when published and survives the resume', () => {
    const { store } = setup();
    const parked = ticket({ parked: { stage: 'qa', reason: 'Which locale owns the copy?', at: '', fromStatus: 'In Progress', marker: 'Office decision b2', published: false } });
    store.state.tickets = [parked];
    publishParked(store, parked);
    publishParked(store, parked);
    delete parked.parked;
    expect(store.state.knowledge!.pending).toMatchObject([{ id: 'cec-77-run:parked:Office decision b2', trigger: 'parked', subject: 'ticket', event: { stage: 'qa', reason: 'Which locale owns the copy?' } }]);
});

test('Harper waits while a CEC stage owns the ticket', () => {
    const { store } = setup();
    const parked = ticket({ parked: { stage: 'qa', reason: 'x', at: '', fromStatus: 'In Progress', marker: 'Office decision c3', published: true } });
    store.state.tickets = [parked];
    recordTicketParked(store, parked);
    store.claimWork({ projectId: 'cec', kind: 'delivery', id: 'ticket:CEC-77' }, 'fixture', 'qa', 'delivery');
    const [item] = scheduledRetrospectives(store, (async () => ({})) as KnowledgeRunner);
    expect(item.eligibility).toMatchObject({ state: 'waiting', reason: expect.stringContaining('delivery stage') });
    expect(item.claimEligible!()).toBe(false);
});

test('Brain technical and source-configuration budgets record once per exhausted window', () => {
    const { store } = setup('brain');
    const scope = 'a'.repeat(64), head = 'b'.repeat(40);
    const brain = job({ stage: 'review', head, implementationContinuation: { originalWorkId: 'work-1', originalHead: head, noteIds: ['n1'], scopeSha256: scope, proofPath: '/proof.json', phase: 'technical-review', pendingFindingIds: ['P1'], repairFindingIds: [], round: 3, maxRounds: 3,
        sourceConfig: { attempts: 2, maxAttempts: 2, originalWorkId: 'work-1', proofPath: '/p', proofSha256: 'x', sourceId: 'contentful', baseline: {}, retryAt: '', findingIds: [] } } as never });
    const decision = implementationContinuationDecision(brain, result('review', { outcome: 'blocked', commit: head, paidRuns: 0, findings: [{ id: 'P1', summary: '', expected: '', actual: '', status: 'open', attempts: 1 }, { id: 'T1', summary: 'Technical defect', expected: '', actual: '', status: 'open', attempts: 1 }] }));
    expect(decision).toMatchObject({ action: 'blocked', exhausted: 'technical' });
    recordTechnicalBudget(store, brain); recordTechnicalBudget(store, brain);
    recordSourceConfigBudget(store, brain); recordSourceConfigBudget(store, brain);
    expect(store.state.knowledge!.pending.map(p => p.id)).toEqual([`${brain.id}:repair-budget:technical:${scope}:3`, `${brain.id}:repair-budget:source-config:work-1:contentful`]);
});

test('turning retrospectives back on does not replay CEC runs that finished while they were off', async () => {
    const { configureKnowledge } = await import('../../../server/knowledge/lesson-commands');
    const { store } = setup();
    configureKnowledge(store, { enabled: false });
    store.state.tickets = [ticket({ stage: 'complete' })];
    configureKnowledge(store, { enabled: true });
    expect(terminalCandidates(store.state.knowledge!, [], store.state.tickets)).toEqual([]);
});
