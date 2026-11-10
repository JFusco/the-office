import { expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { intakeFixture, config } from './fixture';
import { linkKey } from '../../../../server/knowledge/slack-intake/read-links';
import { newTask } from '../../../../server/knowledge/slack-intake/collect';
import { configDigest } from '../../../../server/knowledge/slack-intake/config';
import { IntakeLedger } from '../../../../server/knowledge/slack-intake/ledger';
import { reconcileIntakeStatus } from '../../../../server/knowledge/slack-intake/operational-status';
import { intakeStatusMetrics } from '../../../../server/knowledge/slack-intake/status-metrics';
import { scheduledSlackIntake } from '../../../../server/knowledge/slack-intake/schedule';
import { reconcileIntakeReports } from '../../../../server/knowledge/slack-intake/report';
import { lastFriday } from '../../../../server/knowledge/weekly-rollup';
import type { Proposal, ReadTask } from '../../../../server/knowledge/slack-intake/contracts';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
import { SlackIntakeStatus } from '../../../../src/knowledge/SlackIntakeStatus';
const noRun = vi.fn() as KnowledgeRunner;
function proposal(f: ReturnType<typeof intakeFixture>, id: string, overrides: Partial<Proposal> = {}) {
    const p: Proposal = { id, task: f.task.id, domain: 'tooling', body: 'PRIVATE BODY', hash: 'hash', units: [], sourceVersions: [], configHash: configDigest(config),sourceId:f.source.id,sourceDigest:f.source.sourceDigest, status: 'captured', receipt: { found: true, requestId: id, id: `inbox-${id}`, inputSha256: 'hash', domain: 'tooling', status: 'pending' }, ...overrides };
    f.ledger.put('proposal', id, p); return p;
}
function spend(f:ReturnType<typeof intakeFixture>){for(let i=0;i<8;i++){expect(f.budget.reserve(`status-${i}`,f.source.id)).toBe(true);f.budget.launched(`status-${i}`);}}
function effect(f:ReturnType<typeof intakeFixture>,id:string,status:'dispatching'|'uncertain') {f.store.putEffect({id:`slack-capture:${id}`,work:{projectId:'brain',kind:'knowledge-slack-intake',id:`source:${f.source.id}`},attemptId:id,operation:'brain-capture',target:id,authorization:'fixture',payload:{},expectedState:{},status,createdAt:'now',dispatchedAt:'now',verifiedAt:'',receipt:null,error:'',elapsedMs:null});}
const reconcile = (f: ReturnType<typeof intakeFixture>) => { reconcileIntakeStatus(f.store, [], f.store.clock.now(),f.registry); return f.store.state.knowledge!.slackIntake!; };

test('success requires a matching receipt; duplicates, quarantine and uncertainty remain distinct and aggregate-only', () => {
    const f = intakeFixture();
    try {
        proposal(f, 'ok'); const duplicate = proposal(f, 'duplicate'); duplicate.receipt!.duplicate = true; f.ledger.put('proposal', duplicate.id, duplicate);
        const quarantined = proposal(f, 'quarantine'); quarantined.receipt!.status = 'quarantined'; f.ledger.put('proposal', quarantined.id, quarantined);
        proposal(f, 'uncertain', { status: 'unresolved', receipt: undefined });
        const invalid = proposal(f, 'invalid'); invalid.receipt!.inputSha256 = 'wrong'; f.ledger.put('proposal', invalid.id, invalid);
        proposal(f, 'pending', { status: 'pending', receipt: undefined });
        f.ledger.put('task', f.task.id, { ...f.task, status: 'needs-attention', error: 'PRIVATE ERROR https://fixture.slack.com/C123' });
        f.ledger.put('unit', 'private-source', { state: 'error', text: 'PRIVATE SOURCE', url: 'https://fixture.slack.com/C123' });
        const status = reconcile(f);
        expect(status).toMatchObject({ verifiedCaptures: 2, duplicates: 1, quarantines: 1, pendingCaptures: 3, uncertainCaptures: 2, failedReads: 1, sourceErrors: 1, needsAttention: true });
        const html = renderToStaticMarkup(createElement(SlackIntakeStatus, { status }));
        expect(html).toContain('2 verified inbox captures'); expect(html).toContain('2 captures need receipt reconciliation');
        expect(JSON.stringify(status) + html).not.toMatch(/C123|fixture.slack.com|PRIVATE|inbox-ok|private-source/);
    } finally { f.close(); }
});
test('durable active claims identify reads, classification, references, captures and stopping without hiding uncertainty', () => {
    const f = intakeFixture();
    try {
        proposal(f, 'capture', { status: 'unresolved', receipt: undefined });
        const classify=newTask(f.policy,'C123','channel','process','0.000000','200.000000',f.task.week,'now');classify.processing=['private-source'];
        for(const expected of ['reading','classifying','reading-references','capturing'] as const){
            f.ledger.put('task',f.task.id,{...f.task,status:expected==='reading'?'running':'pending'});f.ledger.put('task',classify.id,{...classify,status:expected==='classifying'?'running':'pending'});
            if(expected==='capturing')effect(f,'capture','dispatching');
            const claim=f.store.claimWork({projectId:'brain',kind:'knowledge-slack-intake',id:`source:${f.source.id}`},'knowledge','knowledge-slack-intake','knowledge')!;
            if(expected==='reading-references')f.store.state.workLog!.push({id:'link-worker',role:'knowledge',status:'running',stage:'knowledge-slack-links',claimId:claim.id} as import('../../../../src/shared').WorkTime);
            expect(reconcile(f)).toMatchObject({activity:expected,activeSince:claim.claimedAt,needsAttention:true,uncertainCaptures:1});
            f.store.finishClaim(claim.id,'stopping');expect(reconcile(f).activity).toBe('stopping');f.store.finishClaim(claim.id,'completed');
        }
    } finally { f.close(); }
});
test('a pause that marks the work session stopping is reported by report reconciliation while the claim stays running', () => {
    const f = intakeFixture();
    try {
        const claim = f.store.claimWork({ projectId: 'brain', kind: 'knowledge-slack-intake', id: `source:${f.source.id}` }, 'knowledge', 'knowledge-slack-intake', 'knowledge')!;
        const at = f.store.clock.now().toISOString();
        f.store.beginWork({ id: 'session', role: 'knowledge', task: 't', ticket: '', stage: 'knowledge-slack-intake', requestId: f.task.id, claimId: claim.id, lane: 'knowledge', sessionId: 'session', provider: 'codex', model: 'm', effort: 'low', status: 'running', startedAt: at, lastHeartbeatAt: at, endedAt: '', elapsedMs: 0, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '' });
        f.ledger.put('task',f.task.id,{...f.task,status:'running'});
        expect(reconcile(f)).toMatchObject({ activity: 'reading', paused: false });
        f.store.state.paused = true; f.store.stopWork('session', 0);
        expect(f.store.activeClaims().find(c => c.id === claim.id)?.status).toBe('running');
        reconcileIntakeReports(f.store,f.registry);
        expect(f.store.state.knowledge!.slackIntake).toMatchObject({ activity: 'stopping', paused: true, activeSince: claim.claimedAt });
    } finally { f.close(); }
});
test('public links held by the spent daily budget wait for New York midnight instead of needing attention', () => {
    const f = intakeFixture();
    try {
        const week = lastFriday(f.store.clock.now());
        f.ledger.put('task', f.task.id, { ...f.task, status: 'complete' });
        f.ledger.put('channel', 'C123', { id: 'C123', seedUpperTs: f.task.latest, enumerated: true, caughtUp: true, through: f.task.latest, week });
        f.ledger.put('link', linkKey('source','https://www.sqlite.org/a'), { url: 'https://www.sqlite.org/a', source: 'source', state: 'pending', week, depth: 0, nextAt: '' });
        spend(f);
        expect(scheduledSlackIntake(f.store,noRun,f.store.clock.now(),f.registry)).toMatchObject([{eligibility:{state:'waiting'}}]);
        expect(f.store.state.knowledge!.slackIntake).toMatchObject({ activity: 'waiting-budget', nextAttemptAt: '2026-11-07T05:00:00.000Z', needsAttention: false, pendingReads: 1 });
    } finally { f.close(); }
});
test('a projection failure under valid configuration is reported as invalid without throwing', () => {
    const f = intakeFixture();
    try {
        f.ledger.put('channel', 'C123', { id: 'C123', seedUpperTs: f.task.latest, enumerated: true, caughtUp: false, through: 'malformed', week: '' });
        const work = scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry);
        expect(work.map(w => [w.work.id, w.eligibility.state])).toEqual([[`source:${f.source.id}`, 'blocked']]);
        expect(f.store.state.knowledge!.slackIntake).toMatchObject({ configuration: 'invalid', activity: 'needs-attention', needsAttention: true });
    } finally { f.close(); }
});
test('the next recorded check is the earliest of the budget wait and recorded capture retries', () => {
    const f = intakeFixture();
    try {
        f.ledger.put('channel', 'C123', { id: 'C123', seedUpperTs: f.task.latest, enumerated: false, through: f.task.latest, week: f.task.week });
        spend(f);
        const retry = new Date(f.store.clock.now().getTime() + 3600000).toISOString();
        proposal(f, 'retry', { status: 'unresolved', receipt: undefined, nextAt: retry });effect(f,'retry','uncertain');
        const [read] = scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry);
        expect(read).toMatchObject({ work: { id: `source:${f.source.id}` }, eligibility: { state: 'waiting', nextCheckAt: '2026-11-07T05:00:00.000Z' } });
        expect(f.store.state.knowledge!.slackIntake).toMatchObject({ activity: 'waiting-budget', nextAttemptAt: retry });
        f.advance(3600000);
        const [capture] = scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry);
        expect(capture).toMatchObject({ work: { id: `source:${f.source.id}` }, eligibility: { state: 'runnable' } });
        expect(f.store.state.knowledge!.slackIntake).toMatchObject({ activity: 'queued', launches: 8 });
        proposal(f, 'retry', { status: 'unresolved', receipt: undefined, nextAt: '2026-11-07T06:00:00.000Z' });
        scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry);
        expect(f.store.state.knowledge!.slackIntake).toMatchObject({ activity: 'waiting-budget', nextAttemptAt: '2026-11-07T05:00:00.000Z' });
    } finally { f.close(); }
});
test('actual scheduler budget, New York rollover and controls refresh without source rescans or changing seed completion', () => {
    const f = intakeFixture(), all = vi.spyOn(IntakeLedger.prototype, 'all');
    try {
        f.ledger.put('channel', 'C123', { id: 'C123', seedUpperTs: f.task.latest, enumerated: false, through: f.task.latest, week: f.task.week });
        spend(f); scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry);
        expect(f.store.state.knowledge!.slackIntake).toMatchObject({ activity: 'waiting-budget', launches: 8, dailyLimit: 8, nextAttemptAt: '2026-11-07T05:00:00.000Z' });
        const scans = all.mock.calls.length, changed = f.store.state.knowledge!.slackIntake!.changedAt;
        scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry); expect(all.mock.calls.filter(([k]) => k === 'unit')).toHaveLength(0);
        expect(f.store.state.knowledge!.slackIntake!.changedAt).toBe(changed); expect(all.mock.calls.length).toBeGreaterThanOrEqual(scans);
        f.store.state.paused = true; scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry); expect(f.store.state.knowledge!.slackIntake!.activity).toBe('paused');
        f.store.state.paused = false;f.store.state.knowledge!.enabled=false; scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry); expect(f.store.state.knowledge!.slackIntake!.activity).toBe('disabled');
        f.store.state.knowledge!.enabled=true;f.registry.setMeta('seed-budget',{version:1,limit:32,members:[{sourceId:f.source.id,sourceDigest:f.source.sourceDigest}]}); scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry); expect(f.store.state.knowledge!.slackIntake).toMatchObject({ activity: 'queued', dailyLimit: 32, launches: 8 });
        f.advance(7 * 3600000); scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry); expect(f.store.state.knowledge!.slackIntake).toMatchObject({ day: '2026-11-07', launches: 0 });
        expect(f.budget.used('2026-11-06')).toBe(8); expect(f.ledger.all('seed-completion')).toHaveLength(0);
    } finally { all.mockRestore(); f.close(); }
});
test('recorded retries update at their deadline even with unchanged ledger and never imply success', () => {
    const f = intakeFixture();
    try {
        const at = new Date(f.store.clock.now().getTime() + 60000).toISOString();
        f.ledger.put('task', f.task.id, { ...f.task, status: 'pending', failures: 1, nextAt: at });
        expect(reconcile(f)).toMatchObject({ activity: 'waiting-retry', nextAttemptAt: at, retryingReads: 1, verifiedCaptures: 0 });
        f.advance(60000); expect(reconcile(f)).toMatchObject({ activity: 'needs-attention' }); expect(reconcile(f).nextAttemptAt).toBeUndefined();
    } finally { f.close(); }
});
test('invalid or changed configuration is explicit, and status remains separate from latched seed completion', () => {
    const f = intakeFixture();
    try {
        f.store.state.knowledge!.slackSeed = { status: 'complete-with-gaps', completedAt: f.store.clock.now().toISOString(), channelsTotal: 1, channelsEnumerated: 1, pendingReads: 0, pendingCaptures: 0, unresolvedSources: 0, coverageGaps: 4, dailyLimit: 8 };
        const seed = structuredClone(f.store.state.knowledge!.slackSeed);
        f.ledger.put('task', f.task.id, { ...f.task, sourceDigest: 'different' }); scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry);
        expect(f.store.state.knowledge!.slackIntake).toMatchObject({ configuration: 'changed', activity: 'needs-attention' });
        f.ledger.put('task',f.task.id,{...f.task});writeFileSync(resolve(f.store.dataRoot, 'slack-intake/config.json'), '{}', { mode: 0o600 }); scheduledSlackIntake(f.store, noRun, f.store.clock.now(),f.registry);
        expect(f.store.state.knowledge!.slackIntake).toMatchObject({ configuration: 'valid', activity: 'queued' });
        expect(f.store.state.knowledge!.slackSeed).toEqual(seed);
    } finally { f.close(); }
});
test('operational metrics use a revision cache and recover after cache loss; earlier captures keep unknown times unknown', () => {
    const f = intakeFixture(), all = vi.spyOn(IntakeLedger.prototype, 'all');
    try {
        proposal(f, 'old'); expect(intakeStatusMetrics(f.ledger)).toMatchObject({ verifiedCaptures: 1 });
        expect(intakeStatusMetrics(f.ledger).lastCaptureAt).toBeUndefined();
        const scans = all.mock.calls.length; f.advance(1000); reconcile(f); reconcile(f); expect(all.mock.calls.length).toBe(scans);
        f.store.db.prepare("DELETE FROM slack_intake WHERE kind=? AND id='operational-metrics'").run(`${f.source.id}:meta`); expect(reconcile(f).verifiedCaptures).toBe(1);
        expect(all.mock.calls.length).toBeGreaterThan(scans);
    } finally { all.mockRestore(); f.close(); }
});

test('current report source accounting clears terminal gaps while later unaccounted sources stay conservative', () => {
    const f = intakeFixture();
    try {
        f.ledger.put('task', f.task.id, { ...f.task, status: 'complete' });
        f.ledger.put('unit', 'deferred', { state: 'deferred' });
        f.store.state.knowledge!.slackSeed = { status: 'complete-with-gaps', channelsTotal: 1, channelsEnumerated: 1, pendingReads: 0, pendingCaptures: 0, unresolvedSources: 0, coverageGaps: 5, dailyLimit: 8 };
        expect(reconcile(f).activity).toBe('needs-attention');
        f.ledger.put('meta', 'report', { sourceProgress: { revision: f.ledger.revision(), unresolvedSources: 0 } });
        expect(reconcile(f)).toMatchObject({ activity: 'caught-up', unresolvedSources: 0 });
        f.ledger.put('unit', 'later-week', { state: 'deferred' });
        expect(reconcile(f)).toMatchObject({ activity: 'needs-attention', unresolvedSources: 2 });
    } finally { f.close(); }
});

test('historical failures after a successful checkpoint are not current retries; a due failure still is', () => {
    const f = intakeFixture();
    try {
        f.ledger.put('task', f.task.id, { ...f.task, failures: 1, error: 'old timeout', nextAt: '', cursor: 'verified-next-page' });
        const cached = intakeStatusMetrics(f.ledger);
        f.ledger.put('meta', 'operational-metrics', { token: `${f.ledger.revision()}:unknown`, metrics: { ...cached, retryingReads: 4 } });
        expect(reconcile(f).retryingReads).toBe(0); expect(f.ledger.get<ReadTask>('task', f.task.id)?.failures).toBe(1);
        f.ledger.put('task', f.task.id, { ...f.task, failures: 2, error: 'current timeout', nextAt: '2026-11-06T22:00:00.000Z' });
        expect(reconcile(f).retryingReads).toBe(1);
        f.ledger.put('task', f.task.id, { ...f.task, status: 'running', failures: 2, error: '', nextAt: '2026-11-07T00:00:00.000Z' });
        expect(reconcile(f).retryingReads).toBe(0);
        f.ledger.put('task', f.task.id, { ...f.task, status: 'running', failures: 2, error: 'current timeout', nextAt: '2026-11-07T00:00:00.000Z' });
        expect(reconcile(f).retryingReads).toBe(1);
    } finally { f.close(); }
});
