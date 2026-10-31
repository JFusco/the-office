import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { z } from 'zod';
import { Store } from '../../../../server/store/store';
import { Engine } from '../../../../server/scheduling/engine';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { ProjectProgress } from '../../../../server/delivery/board/project-progress';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { Conversations } from '../../../../server/conversations/conversations';
import { ResultSchema, FreshResultSchema, LegacyResultSchema } from '../../../../server/workers/agents';
import { assertStrictOutputSchema } from '../../../../server/workers/structured-output';
import { enqueueRepairDiagnosis, githubRepairEligible, jiraRepairable, repairFindingIds, reserveRepair } from '../../../../server/delivery/repairs/delivery-repairs';
import { deliveryHumanInputs, deliveryInputSha256 } from '../../../../server/github/github-context';
import type { StageResult, TeamMessage, Ticket } from '../../../../src/shared';
const roots: string[] = [], stores: Store[] = [];
beforeEach(() => { vi.spyOn(ProjectProgress.prototype, 'reconcile').mockResolvedValue(undefined); vi.spyOn(ProjectProgress.prototype, 'reviewStarted').mockResolvedValue(undefined); });
afterEach(() => { vi.restoreAllMocks(); for (const s of stores.splice(0)) s.close(); for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true }); });
const a = 'a'.repeat(40), b = 'b'.repeat(40);
function fixture(projectId = 'brain') {
 const root = mkdtempSync(resolve(tmpdir(), 'office-repair-loop-')); roots.push(root);
 const store = new Store(':memory:', projectById(projectId), root); stores.push(store); store.state.coordination = coordination(); store.state.paused = false;
 const engine = new Engine(store); let actualHead = a, dirty = '', branch = 'issue-999';
 const calls: string[] = [];
 const execute = async (bin: string, args: string[], options?: any) => { calls.push(`${bin} ${args.join(' ')}`);
  if (bin === 'git') { if (args[0] === 'remote') return `https://github.com/${store.project.repository}.git`; if (args[0] === 'rev-parse') return actualHead; if (args[0] === 'branch') return branch; if (args[0] === 'status') return dirty; if (args[0] === 'merge-base') return ''; }
  if (bin === 'gh' && args[1].endsWith('/issues/999')) return JSON.stringify({ number: 999, html_url: `https://github.com/${store.project.repository}/issues/999`, body: 'Complete acceptance body', updated_at: 'v1', state: 'open', assignees: [{ login: 'JFusco' }] });
  if (bin === 'gh' && args[1].endsWith('/commits/main')) return JSON.stringify({ sha: a });
  // Hands-off projects move repair-start cards in the harness; the card is already In progress here, so no write occurs.
  if (bin === 'gh' && args[1] === 'graphql' && options?.input) { const { query } = JSON.parse(options.input);
   if (query.includes('fields(first')) return JSON.stringify({ data: { user: { projectV2: { id: 'p', fields: { nodes: [{ id: 'status', name: 'Status', options: [{ id: 'progress', name: 'In progress' }] }], pageInfo: { hasNextPage: false } } } } } });
   if (query.includes('items(first')) return JSON.stringify({ data: { node: { items: { nodes: [{ id: 'card', content: { __typename: 'Issue', number: 999, repository: { nameWithOwner: store.project.repository } } }], pageInfo: { hasNextPage: false } } } } });
   return JSON.stringify({ data: { node: { id: 'card', fieldValues: { nodes: [{ field: { id: 'status' }, optionId: 'progress' }], pageInfo: { hasNextPage: false } } } } }); }
  throw new Error(`Unexpected test operation ${bin} ${args.join(' ')}`);
 };
 const delivery = new GitHubDelivery(store, engine, execute as any); delivery.enqueue('GH-999'); const job = delivery.jobs[0];
 const artifactRoot = resolve(root, 'ticket-work', job.id); mkdirSync(artifactRoot, { recursive: true }); const proof = resolve(artifactRoot, 'proof.txt'); writeFileSync(proof, 'fixture evidence only');
 const result = (stage: string, head = actualHead): StageResult => ({ outcome: 'passed', prerequisites: null, approach: null, summary: `Synthetic ${stage}`, commit: head, evidence: [{ id: 'diag', kind: stage === 'review' ? 'review' : 'checks', summary: 'Fixture diagnostic', commit: head, path: proof, environment: 'fixture', url: '', observedAt: '' }], findings: [], receipts: [], worktree: resolve(root, 'candidate'), branch, prId: 0, qaRunDir: '', previewUrl: '', blocker: '', paidRuns: 0 });
 const failed = (stage = 'review'): StageResult => ({ ...result(stage), outcome: 'blocked', blocker: 'Scoped fixture source defect', resolution: { kind: 'source-repair', findingIds: ['F1'], evidenceIds: ['diag'] }, findings: [{ id: 'F1', summary: 'Fixture defect', expected: 'Pass', actual: 'Fail', status: 'open', attempts: 0 }] });
 const seed = () => { job.stage = 'review'; job.head = a; job.branch = branch; job.worktree = resolve(root, 'candidate'); job.status = 'queued'; job.approach = { plan: 'none', review: 'focused', validation: 'independent-checks', checks: ['focused check'], reason: 'Fixture risk' }; };
 return { root, store, engine, delivery, job, result, failed, seed, calls, setHead: (head: string) => actualHead = head, setDirty: (value: string) => dirty = value, setBranch: (value: string) => branch = value };
}
for (const project of ['brain', 'cms-field-vocabulary']) test(`${project}: actual stage entrypoint repairs the same candidate then renews review and validation`, async () => {
 const f = fixture(project); f.seed(); const originalId = f.job.id, originalPath = f.job.worktree; const roles: string[] = [];
 f.engine.agents.run = async (role, prompt) => { roles.push(role); expect(prompt).toContain('Complete acceptance body'); return f.failed() as any; };
 await f.delivery.step(f.job); expect(f.job.stage).toBe('update-base'); expect(f.job.status).toBe('queued'); expect(f.job.repairCycle?.owner).toBe('developer'); expect(f.job.steps[0].result.outcome).toBe('blocked');
 f.engine.agents.run = async (role, prompt) => { roles.push(role); expect(prompt).toContain('SAME branch/worktree'); f.setHead(b); return { ...f.result('repair', b), findings: [{ ...f.failed().findings[0], status: 'fixed' }] } as any; };
 await f.delivery.step(f.job); expect(f.job.head).toBe(b); expect(f.job.stage).toBe('review');
 f.engine.agents.run = async (role) => { roles.push(role); return { ...f.result('review', b), findings: [{ ...f.failed().findings[0], status: 'fixed' }] } as any; };
 await f.delivery.step(f.job); expect(f.job.stage).toBe('validate');
 f.engine.agents.run = async (role) => { roles.push(role); return { ...f.result('validate', b), findings: [{ ...f.failed().findings[0], status: 'verified' }] } as any; };
 await f.delivery.step(f.job); expect(f.job.stage).toBe('draft'); expect(f.job.status).toBe('queued'); expect(f.job.id).toBe(originalId); expect(f.job.worktree).toBe(originalPath); expect(f.delivery.jobs).toHaveLength(1); expect(roles).toEqual(['lead', 'developer', 'lead', 'qa']); expect(f.calls.some(c => /push|merge --|POST|PUT/.test(c))).toBe(false);
});
for (const kind of ['permission', 'scope', 'human-hold', 'uncertain-effect', 'provider-wait'] as const) test(`typed ${kind} cannot become a source repair`, async () => {
 const f = fixture(); f.seed(); const r = f.failed(); r.resolution!.kind = kind; f.engine.agents.run = async () => r as any; await f.delivery.step(f.job); expect(f.job.status).toBe('blocked'); expect(f.job.repairCycle).toBeUndefined();
});
test('uncertain original mutation and changed candidate stop repair without replay', async () => {
 const f = fixture(); f.seed(); const r = f.failed(); r.receipts = [{ id: 'uncertain', action: 'issue-comment', target: 'original', verified: false, uncertain: true, detail: 'timeout' }]; f.engine.agents.run = async () => r as any; await f.delivery.step(f.job); expect(f.job.status).toBe('blocked'); expect(f.job.repairCycle).toBeUndefined();
 const g = fixture(); g.seed(); g.setHead(b); g.engine.agents.run = async () => ({ ...g.failed(), commit: a, evidence: [{ ...g.failed().evidence[0], commit: a }] }) as any; await g.delivery.step(g.job); expect(g.job.status).toBe('blocked'); expect(g.job.repairCycle).toBeUndefined();
});
test('source repair cannot adopt a native Brain discovery recovery', async () => { const f = fixture(); f.seed(); f.job.discoveryRecovery = { noteId: 'missing-native-note' } as any; f.engine.agents.run = async () => f.failed() as any; await f.delivery.step(f.job); expect(f.job.repairCycle).toBeUndefined(); expect(f.job.status).toBe('blocked'); });
test('bounded repeated failure queues one read-only technical diagnosis and separate IT operations', async () => {
 const f = fixture(); f.seed(); f.engine.agents.run = async () => f.failed() as any;
 await f.delivery.step(f.job); await f.delivery.step(f.job); await f.delivery.step(f.job);
 expect(f.job.repairCycle?.findingAttempts.F1).toBe(2); expect(f.job.repairCycle?.phase).toBe('diagnosis'); expect(f.job.stage).toBe('review'); expect(f.job.status).toBe('queued');
 const diagnosis = f.store.state.messages.filter(m => m.to === 'it'); expect(diagnosis).toHaveLength(1); expect(diagnosis[0].body).toContain('Do not implement ticket code');
 const beforeDiagnosis = structuredClone(f.job);
 const chat = new Conversations(f.store, f.engine, f.root); chat.archive = () => {};
 const followup = vi.fn(async () => ({ handoffProject: '', pickupChange: null, reply: 'Read-only operational diagnosis', notifyRoles: [], question: '', goalChanges: [], slackRequests: [], notes: [], receipts: [] }));
 f.engine.itAgents.followup = followup;
 await chat.pump(); await chat.pumpIT();
 expect(followup).toHaveBeenCalledExactlyOnceWith('it', diagnosis[0]);
 expect(diagnosis[0]).toMatchObject({ from: 'pm', status: 'answered' });
 expect(f.job).toEqual(beforeDiagnosis);
 f.engine.agents.run = async (role, prompt) => { expect(role).toBe('lead'); expect(prompt).toContain('ONE concrete revised technical approach'); return { ...f.failed(), approach: { ...f.job.approach!, checks: ['new focused investigation check'], reason: 'Actual changed diagnosis/check strategy' } } as any; };
 await f.delivery.step(f.job); expect(f.job.stage).toBe('update-base'); expect(f.job.repairCycle?.approachRevision).toBe(1); expect(f.job.repairCycle?.findingAttempts.F1).toBe(3); expect(f.store.state.messages.filter(m => m.to === 'it' && m.from === 'pm')).toHaveLength(1);
});
test.each([false, true])('Jira repair diagnosis uses its retained request ID and enforces read-only replies (dispatch=%s)', async dispatch => {
 const root = mkdtempSync(resolve(tmpdir(), 'office-jira-diagnosis-')); roots.push(root);
 const store = new Store(':memory:', projectById('cec'), root); stores.push(store); store.state.coordination = coordination();
 const f = { root, store, engine: new Engine(store) };
 const ticket: Ticket = { key: 'CEC-999', summary: 'Synthetic diagnosis', type: 'Bug', status: 'Code Review', statusId: '', assignee: 'office-account', subtask: false, boardMember: true, url: '', updated: '', stage: 'code-review', activity: 'waiting', blocker: '', runId: 'jira-original', attempt: 2, commit: a, branch: 'fixture', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: true, observedAt: '' };
 f.store.state.tickets.push(ticket);
 ticket.repairCycle = { ...reserveRepair(undefined, ['J1'], 'code-review', a), phase: 'diagnosis' };
 const request = { id: ticket.runId, key: ticket.key, head: ticket.commit, steps: [], repairCycle: ticket.repairCycle };
 enqueueRepairDiagnosis(f.store, request); enqueueRepairDiagnosis(f.store, request);
 const message = f.store.state.messages.find(m => m.id === ticket.repairCycle!.diagnosisRequestId)!;
 const unrelated = { ...message, id: crypto.randomUUID(), requestId: crypto.randomUUID() };
 f.store.state.messages.unshift(unrelated);
 const before = structuredClone(ticket), jobs = structuredClone(f.store.state.coordination!.jobs);
 const chat = new Conversations(f.store, f.engine, f.root); chat.archive = () => {};
 const followup = vi.fn(async () => ({ handoffProject: '', pickupChange: null, reply: 'Operations diagnosis only', notifyRoles: dispatch ? ['developer' as const] : [], question: '', goalChanges: [], slackRequests: [], notes: [], receipts: [] }));
 f.engine.itAgents.followup = followup;
 await chat.pumpIT(); await chat.pump();
 expect(followup).toHaveBeenCalledExactlyOnceWith('it', message);
 expect(message.status).toBe(dispatch ? 'failed' : 'answered'); if (dispatch) expect(message.error).toContain('IT chat');
 expect(unrelated.status).toBe('queued'); expect(ticket).toEqual(before); expect(f.store.state.coordination!.jobs).toEqual(jobs);
 expect(f.store.state.messages.some(m => m.from === 'it')).toBe(!dispatch);
});
test('missing finding dispositions and uncontained diagnostics cannot queue repair', async () => {
 const f = fixture(); f.seed(); const r = f.failed(); r.resolution!.findingIds = ['other']; f.engine.agents.run = async () => r as any; await f.delivery.step(f.job); expect(f.job.status).toBe('blocked');
 const g = fixture(); g.seed(); const bad = g.failed(); bad.evidence[0].path = '/private/tmp/unowned-evidence'; g.engine.agents.run = async () => bad as any; await g.delivery.step(g.job); expect(g.job.status).toBe('blocked');
});
test('unchanged successful stages use the existing path', async () => { const f = fixture(); f.seed(); f.engine.agents.run = async () => f.result('review') as any; await f.delivery.step(f.job); expect(f.job.stage).toBe('validate'); expect(f.job.repairCycle).toBeUndefined(); });
test('fresh schema is strict, historical parsing preserves exact legacy shape', () => { const f = fixture(); const legacy = { ...f.result('review'), prerequisites: null, approach: null }; const parsed = ResultSchema.parse(legacy); expect(JSON.stringify(parsed)).toBe(JSON.stringify(LegacyResultSchema.parse(legacy))); expect(Object.hasOwn(parsed, 'resolution')).toBe(false); assertStrictOutputSchema(z.toJSONSchema(FreshResultSchema, { target: 'draft-7' })); expect(FreshResultSchema.safeParse(legacy).success).toBe(false); });
test('blocked Jira source defects use the shared typed gate; permissions and uncertain QA comment writes stay blocked', () => { const f = fixture(); const r = f.failed(); expect(jiraRepairable('code-review', r)).toBe(true); r.resolution!.kind = 'permission'; expect(jiraRepairable('code-review', r)).toBe(false); r.resolution!.kind = 'source-repair'; r.receipts.push({ id: 'qa-comment', action: 'jira-comment', target: 'CEC-1', verified: false, uncertain: true, detail: 'dispatch timeout' }); expect(jiraRepairable('qa', r)).toBe(false); });
test('repair budgets persist distinct finding counters and cap total rounds', () => { let cycle = reserveRepair(undefined, ['A'], 'review', a); cycle = reserveRepair(cycle, ['B'], 'review', a); expect(cycle.findingAttempts).toEqual({ A: 1, B: 1 }); for (let i = 0; i < 5; i++) cycle = reserveRepair(cycle, [`next${i}`], 'review', a); expect(cycle.phase).toBe('diagnosis'); expect(cycle.attempts).toBe(6); });
function addHumanNote(f: ReturnType<typeof fixture>, from: 'human' | 'developer' = 'human') { const request: TeamMessage = { id: crypto.randomUUID(), requestId: '', from, to: 'pm', ticket: 'GH-999', actionId: '', body: 'Actual authenticated human direction', status: 'answered', createdAt: 'now', sessionId: '', recheck: false, error: '', recipients: [], receipts: [] }; request.requestId = request.id; f.store.state.messages.push(request, { ...request, id: crypto.randomUUID(), from: 'pm', body: 'Recorded', requestId: request.id }); f.store.state.projectNotes.push({ id: crypto.randomUUID(), requestId: request.id, ticket: 'GH-999', summary: 'Direction', detail: 'Precise scoped requirement', createdAt: 'now' }); }
test('only attributable human PM notes reach current inputs and alter readiness fingerprint', () => { const f = fixture(); const empty = deliveryInputSha256(f.store, 'GH-999'); addHumanNote(f, 'developer'); expect(deliveryHumanInputs(f.store, 'GH-999')).toHaveLength(0); expect(deliveryInputSha256(f.store, 'GH-999')).toBe(empty); addHumanNote(f); expect(deliveryHumanInputs(f.store, 'GH-999')).toHaveLength(1); expect(deliveryInputSha256(f.store, 'GH-999')).not.toBe(empty); expect(deliveryHumanInputs(f.store, 'GH-123')).toHaveLength(0); });
test('concurrent human input is retained and prevents advancement using stale context', async () => { const f = fixture(); f.seed(); f.engine.agents.run = async () => { addHumanNote(f); return f.result('review') as any; }; await f.delivery.step(f.job); expect(f.job.status).toBe('queued'); expect(f.job.stage).toBe('review'); expect(f.job.detail).toContain('reassessment queued'); expect(f.job.steps).toHaveLength(1); });
test('a failed repair check on a new descendant commit continues on that same saved candidate', async () => { const f = fixture(); f.seed(); f.engine.agents.run = async () => f.failed() as any; await f.delivery.step(f.job); f.engine.agents.run = async () => { f.setHead(b); return f.failed('repair') as any; }; await f.delivery.step(f.job); expect(f.job.stage).toBe('update-base'); expect(f.job.head).toBe(b); expect(f.job.repairCycle?.findingAttempts.F1).toBe(2); expect(f.calls).toContain(`git merge-base --is-ancestor ${a} ${b}`); });
test('changed worktree head is rejected before the queued repair worker starts', async () => { const f = fixture(); f.seed(); f.engine.agents.run = async () => f.failed() as any; await f.delivery.step(f.job); f.setHead(b); let repairs = 0; f.engine.agents.run = async () => { repairs++; return f.result('repair') as any; }; await f.delivery.step(f.job); expect(repairs).toBe(0); expect(f.job.status).toBe('blocked'); expect(f.job.steps).toHaveLength(1); });
test('new attributable human input wakes a watching readiness review once', async () => {
 const f = fixture(); f.seed(); f.job.stage = 'lead-pr'; f.job.status = 'watching'; f.job.pr = 700;
 f.delivery.verifyPR = async () => ({ state: 'open', head: { sha: a }, base: { ref: 'main', sha: b }, draft: false, updated_at: 'unchanged', mergeable: true });
 f.delivery.api = async path => path.includes('check-runs') ? { total_count: 0, check_runs: [] } : { total_count: 0, state: 'success' };
 f.delivery.queueCIRepair = async () => false;
 await f.delivery.observe(); const prior = f.job.lastPRFingerprint; f.job.status = 'watching';
 addHumanNote(f, 'developer'); await f.delivery.observe(); expect(f.job.status).toBe('watching'); expect(f.job.lastPRFingerprint).toBe(prior);
 addHumanNote(f); await f.delivery.observe(); expect(f.job.status).toBe('queued'); expect(f.job.stage).toBe('lead-pr'); expect(f.job.lastPRFingerprint).not.toBe(prior);
 f.job.status = 'watching'; await f.delivery.observe(); expect(f.job.status).toBe('watching');
});
test('typed published source review defect reuses the same PR and branch with a fenced remote head', async () => {
 const f=fixture();f.seed();f.job.pr=700;f.job.prUrl='https://github.com/JFusco/brain/pull/700';f.job.stage='lead-pr';f.job.existingPR=true;
 const remote={state:'open',draft:false,html_url:f.job.prUrl,head:{sha:a,ref:f.job.branch},base:{ref:'main',sha:b},updated_at:'v1',merged_at:null};
 f.delivery.verifyPR=async()=>remote;f.delivery.readinessPolicy=async()=>({repository:f.store.project.repository,head:a}) as any;
 f.engine.agents.run=async()=>({...f.failed(),prId:700}) as any;
 await f.delivery.step(f.job);expect(f.job.stage).toBe('update-base');expect(f.job.status).toBe('queued');expect(f.job.repairReason).toBe('source');expect(f.job.repairCycle?.publishedHead).toBe(a);
 f.engine.agents.run=async()=>{f.setHead(b);return {...f.failed('repair'),prId:700} as any;};
 await f.delivery.step(f.job);expect(f.job.head).toBe(b);expect(f.job.status).toBe('queued');expect(f.job.repairCycle?.publishedHead).toBe(a);
 f.engine.agents.run=async()=>({...f.result('repair',b),prId:700,findings:[{...f.failed().findings[0],status:'fixed'}]}) as any;
 await f.delivery.step(f.job);expect(f.job.stage,f.job.detail).toBe('review');expect(f.job.head).toBe(b);expect(f.job.pr).toBe(700);expect(f.delivery.jobs).toHaveLength(1);expect(f.calls.some(c=>/push|POST|PUT/.test(c))).toBe(false);
});
async function publishedRepairAtValidation() {
 const f = fixture(); f.seed(); f.job.pr = 700; f.job.prUrl = 'https://github.com/JFusco/brain/pull/700'; f.job.stage = 'lead-pr';
 const remote = { state: 'open', head: { sha: a, ref: f.job.branch }, base: { ref: 'main', sha: a }, updated_at: 'v1', merged_at: null };
 f.delivery.verifyPR = async () => remote; f.delivery.readinessPolicy = async () => ({}) as any;
 f.engine.agents.run = async () => ({ ...f.failed(), prId: 700 }) as any;
 await f.delivery.step(f.job); expect(f.job.stage, f.job.detail).toBe('update-base');
 f.engine.agents.run = async () => { f.setHead(b); return { ...f.result('repair'), prId: 700, findings: [{ ...f.failed().findings[0], status: 'fixed' }] } as any; };
 await f.delivery.step(f.job); expect(f.job.stage, f.job.detail).toBe('review');
 f.engine.agents.run = async () => ({ ...f.result('review'), prId: 700, findings: [{ ...f.failed().findings[0], status: 'fixed' }] }) as any;
 await f.delivery.step(f.job); expect(f.job.stage, f.job.detail).toBe('validate');
 return { ...f, remote };
}
async function completedPublishedRepair() {
 const f = await publishedRepairAtValidation();
 f.engine.agents.run = async () => ({ ...f.result('validate'), prId: 700, findings: [{ ...f.failed().findings[0], status: 'verified' }] }) as any;
 await f.delivery.step(f.job); expect(f.job.stage, f.job.detail).toBe('draft');
 expect(f.job.repairCycle).toMatchObject({ pendingFindingIds: [], findingAttempts: { F1: 1 }, attempts: 1 });
 expect(f.job.steps[0].result.findings[0]).toMatchObject({ id: 'F1', status: 'open' });
 // Model the subsequent published head without exercising any provider writes.
 f.remote.head.sha = b; f.job.repairCycle!.publishedHead = b;
 f.job.stage = 'lead-pr'; f.job.status = 'watching';
 return f;
}
test('completed published source repair permits a later conflict repair without old findings', async () => {
 const f = await completedPublishedRepair(), c = 'c'.repeat(40);
 f.job.steps.push({ stage: 'lead-pr', result: { ...f.result('lead-pr'), prId: 700, outcome: 'blocked', findings: [{ ...f.failed().findings[0], id: 'merge-conflicts' }] } });
 f.delivery.queueConflictRepair('GH-999', 'conflicts');
 f.engine.agents.run = async () => { f.setHead(c); return { ...f.result('repair'), prId: 700 } as any; };
 await f.delivery.step(f.job);
 expect(f.job.status, f.job.detail).toBe('queued'); expect(f.job.stage).toBe('draft'); expect(f.job.head).toBe(c);
 expect(f.job.repairCycle).toMatchObject({ pendingFindingIds: [], findingAttempts: { F1: 1 }, attempts: 1 });
 expect(f.job.steps.at(-1)!.result.findings).toEqual([]); expect(f.job.pr).toBe(700); expect(f.delivery.jobs).toHaveLength(1);
});
test('completed published repair admits a new lead finding and retains cumulative repair counters', async () => {
 const f = await completedPublishedRepair(); f.job.status = 'queued';
 f.engine.agents.run = async () => ({ ...f.failed(), prId: 700, resolution: { kind: 'source-repair', findingIds: ['F2'], evidenceIds: ['diag'] }, findings: [{ ...f.failed().findings[0], id: 'F2' }] }) as any;
 await f.delivery.step(f.job);
 expect(f.job.status, f.job.detail).toBe('queued'); expect(f.job.stage).toBe('update-base');
 expect(f.job.repairCycle).toMatchObject({ pendingFindingIds: ['F2'], findingAttempts: { F1: 1, F2: 1 }, attempts: 2, publishedHead: b });
 expect(f.job.pr).toBe(700); expect(f.delivery.jobs).toHaveLength(1);
});
test.each(['missing-disposition', 'fixed-only', 'wrong-head', 'missing-evidence'])('validation %s cannot retire the active repair findings', async failure => {
 const f = await publishedRepairAtValidation();
 const result = { ...f.result('validate'), prId: 700, findings: [{ ...f.failed().findings[0], status: 'verified' as const }] };
 if (failure === 'missing-disposition') result.findings = [];
 if (failure === 'fixed-only') result.findings[0].status = 'fixed' as any;
 if (failure === 'wrong-head') result.commit = a;
 if (failure === 'missing-evidence') result.evidence = [];
 f.engine.agents.run = async () => result as any;
 await f.delivery.step(f.job);
 expect(f.job.status).toBe('blocked'); expect(f.job.stage).toBe('validate');
 expect(f.job.repairCycle).toMatchObject({ pendingFindingIds: ['F1'], findingAttempts: { F1: 1 }, attempts: 1 });
});
test('published source repair never replaces a hold or an uncertain merge and refuses changed remote head', async()=>{
 for(const restriction of ['human-hold','scope','permission'] as const){const f=fixture();f.seed();f.job.pr=700;f.job.stage='lead-pr';const r={...f.failed(),prId:700};r.resolution!.kind=restriction;expect(githubRepairEligible(f.job,r)).toBeNull();}
 const f=fixture();f.seed();f.job.pr=700;f.job.stage='lead-pr';f.job.prUrl='https://github.com/JFusco/brain/pull/700';f.delivery.verifyPR=async()=>({state:'open',head:{sha:b,ref:f.job.branch},base:{ref:'main'}});f.delivery.readinessPolicy=async()=>({}) as any;f.engine.agents.run=async()=>({...f.failed(),prId:700}) as any;
 await f.delivery.step(f.job);expect(f.job.status).toBe('blocked');expect(f.job.repairCycle).toBeUndefined();
 const r={...f.failed(),prId:700};f.job.mergeAttempt={head:a,at:'now'};expect(githubRepairEligible(f.job,r)).toBeNull();
});
for(const phase of ['technical-review','activation'] as const)test(`unpublished/native ${phase} continuation remains core-owned`,async()=>{
 const f=fixture();f.seed();f.job.implementationContinuation={phase} as any;f.job.pr=700;f.job.stage='lead-pr';f.job.status='working';const result={...f.failed(),prId:700};
 expect(await f.delivery.queueSourceRepair(f.job,result,resolve(f.root,'ticket-work',f.job.id))).toBe(false);expect(f.job.repairCycle).toBeUndefined();
});
test('published acceptance-phase native repair preserves all original finding gates and recovery metadata',async()=>{
 const f=fixture();f.seed();f.job.pr=700;f.job.prUrl='https://github.com/JFusco/brain/pull/700';f.job.stage='lead-pr';
 f.job.implementationContinuation={phase:'acceptance',originalWorkId:'native-original'} as any;f.job.implementationRecovery={kind:'candidate'} as any;f.job.candidateRecovery={findingIds:['native-original-finding']} as any;
 const original=JSON.stringify({continuation:f.job.implementationContinuation,recovery:f.job.implementationRecovery,candidate:f.job.candidateRecovery});
 const remote={state:'open',head:{sha:a,ref:f.job.branch},base:{ref:'main',sha:b},updated_at:'v1',merged_at:null};f.delivery.verifyPR=async()=>remote;f.delivery.readinessPolicy=async()=>({}) as any;
 f.engine.agents.run=async()=>({...f.failed(),prId:700}) as any;await f.delivery.step(f.job);expect(f.job.stage).toBe('update-base');
 f.engine.agents.run=async()=>{f.setHead(b);return {...f.result('repair',b),prId:700,findings:[{...f.failed().findings[0],status:'fixed'}]} as any;};await f.delivery.step(f.job);expect(f.job.stage).toBe('review');
 f.engine.agents.run=async()=>({...f.result('review',b),prId:700,findings:[{...f.failed().findings[0],status:'fixed'}]}) as any;await f.delivery.step(f.job);expect(f.job.status).toBe('blocked');expect(f.job.detail).toContain('Recovered implementation findings');
 expect(JSON.stringify({continuation:f.job.implementationContinuation,recovery:f.job.implementationRecovery,candidate:f.job.candidateRecovery})).toBe(original);
});

test('unpublished native acceptance remains owned by the core continuation',async()=>{const f=fixture();f.seed();f.job.status='working';f.job.implementationContinuation={phase:'acceptance'} as any;expect(await f.delivery.queueSourceRepair(f.job,f.failed(),resolve(f.root,'ticket-work',f.job.id))).toBe(false);expect(f.job.repairCycle).toBeUndefined();});

test('read-only source findings use a harness diagnostic while preserving the inspected source locator',async()=>{
 const f=fixture();f.seed();mkdirSync(f.job.worktree,{recursive:true});const source=resolve(f.job.worktree,'source.ts');writeFileSync(source,'// inspected fixture source');const r=f.failed();r.evidence[0].path=source;
 f.engine.agents.run=async()=>r as any;await f.delivery.step(f.job);expect(f.job.status).toBe('queued');expect(f.job.stage).toBe('update-base');expect(r.evidence[0].path).toBe(source);expect(r.evidence.some(e=>e.id.startsWith('repair-assessment:')&&e.path.startsWith(resolve(f.root,'ticket-work',f.job.id)))).toBe(true);
});
