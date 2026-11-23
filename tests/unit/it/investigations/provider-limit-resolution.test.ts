import { expect, test } from 'vitest';
import { investigationFixture } from './fixture';
import { investigationResolution, syncInvestigations } from '../../../../server/it/investigations/ledger';
import { providerLimitResolution } from '../../../../server/it/investigations/provider-limit-resolution';
import { reconcileBlockerFollowups } from '../../../../server/knowledge/blocker-followups';

const LIMIT = 'codex exited 1: You’ve hit your usage limit. Visit https://chatgpt.com/settings/usage to purchase more credits or try again at Nov 24th, 2026 11:50 AM.';
const entry = (extra: object = {}): any => ({ id: 'investigation', source: { kind: 'worker', id: 'refused', requestId: 'harper-followup:one', ticket: '', failureKind: 'other', workerIds: ['refused'] }, status: 'blocked', attempts: 3, ...extra });
const run = (id: string, extra: object = {}): any => ({ id, requestId: `request-${id}`, stage: 'conversation-readback', role: 'knowledge', provider: 'codex', status: 'completed', ticket: '', startedAt: '2026-11-23T13:30:00Z', endedAt: '2026-11-23T13:31:00Z', ...extra });
const refused = (failure: object = { category: 'other', dispatched: true, detail: LIMIT }, extra: object = {}) => run('refused', { requestId: 'harper-followup:one', status: 'failed', startedAt: '2026-11-23T09:00:00Z', endedAt: '2026-11-23T09:00:12Z', failure, ...extra });

function withLog(log: any[], check: (store: ReturnType<typeof investigationFixture>['store']) => void) {
    const f = investigationFixture();
    try { f.store.state.workLog = log; f.store.state.slackDeliveries = []; check(f.store); } finally { f.close(); }
}

test('a run the provider refused at its limit is settled once that provider has completed a later run', () => {
    withLog([refused(), run('later')], store => {
        expect(providerLimitResolution(store, entry())).toEqual({ kind: 'superseded', sourceId: 'later', receipt: 'provider:codex:later' });
        // Through the ledger's own rule, where it sits beside the others.
        expect(investigationResolution(store, entry())).toEqual({ kind: 'superseded', sourceId: 'later', receipt: 'provider:codex:later' });
    });
    // The same for a refusal recorded with its own category.
    withLog([refused({ category: 'provider-limit', dispatched: true, detail: LIMIT, retryAt: '2026-11-24T16:50:00.000Z' }), run('later')], store =>
        expect(providerLimitResolution(store, entry({ source: { ...entry().source, failureKind: 'provider-limit' } }))).toMatchObject({ sourceId: 'later' }));
});

test('nothing is settled while the provider has not completed a run since', () => {
    const cases: [string, any[]][] = [
        ['no later run', [refused()]],
        ['only an earlier completed run', [run('earlier', { endedAt: '2026-11-23T08:00:00Z' }), refused()]],
        ['a later run that failed too', [refused(), run('later', { status: 'failed', failure: { category: 'other', dispatched: true, detail: LIMIT } })]],
        ['a later run still going', [refused(), run('later', { status: 'running', endedAt: undefined })]],
        ['a later completed run on another provider', [refused(), run('later', { provider: 'claude' })]],
    ];
    for (const [label, log] of cases) withLog(log, store => expect(providerLimitResolution(store, entry()), label).toBeUndefined());
});

test('a run that failed for another reason is not settled by the provider recovering', () => {
    const failures: [string, object][] = [
        ['another failure', { category: 'other', dispatched: true, detail: 'codex exited 1: stream disconnected' }],
        ['the sentence inside other output', { category: 'other', dispatched: true, detail: `codex exited 1: tool output\n${LIMIT}` }],
        ['an effect of unknown outcome', { category: 'uncertain-effect', dispatched: true, detail: LIMIT }],
        ['a run that left subprocesses', { category: 'other', dispatched: true, detail: LIMIT, code: 'surviving-subprocesses' }],
    ];
    for (const [label, failure] of failures) withLog([refused(failure), run('later')], store => expect(providerLimitResolution(store, entry()), label).toBeUndefined());
    withLog([refused(undefined, { failure: undefined }), run('later')], store => expect(providerLimitResolution(store, entry())).toBeUndefined());
    // The limit sentence is the provider's: the same words from another program are not it.
    withLog([refused({ category: 'other', dispatched: true, detail: LIMIT }, { provider: 'claude' }), run('later', { provider: 'claude' })], store => expect(providerLimitResolution(store, entry())).toBeUndefined());
});

test('a Slack source, a missing run and a proposed Office fix are left alone', () => {
    withLog([refused(), run('later')], store => {
        expect(providerLimitResolution(store, entry({ source: { ...entry().source, kind: 'slack' } }))).toBeUndefined();
        expect(providerLimitResolution(store, entry({ source: { ...entry().source, id: 'gone' } }))).toBeUndefined();
        expect(providerLimitResolution(store, entry({ report: { officeFix: { status: 'proposed' } } }))).toBeUndefined();
        expect(providerLimitResolution(store, entry({ report: { officeFix: { status: 'blocked' } } }))).toMatchObject({ sourceId: 'later' });
    });
});

test('the ledger closes it as history: resolved, no lesson recorded, and said in plain words', () => {
    const f = investigationFixture();
    try {
        f.store.state.workLog = [refused(), run('later')]; f.store.state.slackDeliveries = [];
        // Saved under the id the ledger gives this source, as the loop's investigations are.
        const saved = entry({ id: 'investigation:brain:worker:refused:other', createdAt: '2026-11-23T09:01:00Z', updatedAt: '2026-11-23T09:05:00Z', nextAt: '', lastError: LIMIT });
        f.store.state.it!.investigations = [saved];
        const lessons = () => JSON.stringify(f.store.state.knowledge ?? null), before = lessons();
        syncInvestigations(f.store);
        expect(saved).toMatchObject({ status: 'resolved', resolution: { kind: 'superseded', sourceId: 'later', receipt: 'provider:codex:later' } });
        expect(lessons()).toBe(before);
        expect(f.store.state.events.filter(event => /provider that refused the run is working again/.test(event.message))).toHaveLength(1);
        // A second pass changes nothing.
        const once = JSON.stringify(saved); syncInvestigations(f.store); expect(JSON.stringify(saved)).toBe(once);
    } finally { f.close(); }
});

test('nothing is learned from it: the queued lesson batch is dropped and the follow-up closes without recording one', () => {
    const f = investigationFixture();
    try {
        const id = 'investigation:brain:worker:refused:other';
        f.store.state.workLog = [refused()]; f.store.state.slackDeliveries = [];
        const saved = entry({ id, createdAt: '2026-11-23T09:01:00Z', updatedAt: '2026-11-23T09:05:00Z', nextAt: '', lastError: LIMIT });
        f.store.state.it!.investigations = [saved];
        const knowledge = f.store.state.knowledge!;
        // While it is blocked the follow-up is recorded and, as the loop did, a lesson batch is queued for it.
        reconcileBlockerFollowups(f.store);
        knowledge.pending.push({ id: 'learning:queued', jobId: id, key: '', source: { kind: 'investigation', id }, subject: 'investigation', trigger: 'learning', createdAt: '2026-11-23T09:06:00Z', attempts: 0, nextAt: '', lastError: '', eventIds: [], opportunities: [] } as any);
        knowledge.pending.push({ id: 'learning:other', jobId: 'other', key: '', source: { kind: 'investigation', id: 'another' }, subject: 'investigation', trigger: 'learning', createdAt: '2026-11-23T09:06:00Z', attempts: 0, nextAt: '', lastError: '', eventIds: [], opportunities: [] } as any);
        const consumed = [...(knowledge.learningConsumed || [])];
        // The provider completes a run; the ledger closes the investigation and the follow-up is reconciled.
        f.store.state.workLog.push(run('later'));
        syncInvestigations(f.store);
        reconcileBlockerFollowups(f.store);
        expect(saved.status).toBe('resolved');
        expect(knowledge.pending.map(item => item.id)).toEqual(['learning:other']);
        expect(knowledge.learningConsumed || []).toEqual(consumed);
        const followup = knowledge.followups!.find(item => item.id === `investigation:${id}`)!;
        expect(followup).toMatchObject({ disposition: 'superseded', nextAction: 'The provider that refused this run is working again; the refused run was not repeated.' });
        expect(followup.history.length).toBeGreaterThan(1);
    } finally { f.close(); }
});

test('a limit refusal closed by another rule also drops its queued retrospective, on every pass, and leaves other batches alone', () => {
    const f = investigationFixture();
    try {
        const id = 'investigation:brain:worker:refused:other', other = 'investigation:brain:worker:real:other';
        f.store.state.workLog = [refused(), run('real', { requestId: 'harper-followup:two', status: 'failed', failure: { category: 'other', dispatched: true, detail: 'codex exited 1: stream disconnected' } })];
        f.store.state.slackDeliveries = [];
        // Both already closed as history by the finished-subject rule, before the provider rule existed.
        const closed = (key: string, source: string) => entry({ id: key, source: { ...entry().source, id: source }, status: 'resolved', resolution: { kind: 'superseded', sourceId: 'job-1', receipt: 'job:job-1:completed', at: '2026-11-23T10:00:00Z' } });
        f.store.state.it!.investigations = [closed(id, 'refused'), closed(other, 'real')];
        f.store.state.coordination!.jobs = [{ id: 'job-1', key: 'GH-1', status: 'completed' } as any];
        for (const [key, investigation] of [['refused', id], ['real', other]]) (f.store.state.it!.investigations.find(e => e.id === investigation)!.source as any).requestId = 'job-1';
        const batch = (key: string, subject: string, extra: object = {}): any => ({ id: key, jobId: subject, key: '', source: { kind: 'investigation', id: subject }, subject: 'investigation', trigger: 'learning', createdAt: '2026-11-23T09:06:00Z', attempts: 0, nextAt: '', lastError: '', eventIds: [], opportunities: [], ...extra });
        const knowledge = f.store.state.knowledge!;
        knowledge.pending.push(batch('learning:limit', id), batch('learning:real', other));
        syncInvestigations(f.store);
        expect(knowledge.pending.map(item => item.id)).toEqual(['learning:real']);
        // A batch for the same refusal queued later (as the follow-up used to) is dropped on the next pass too.
        knowledge.pending.push(batch('learning:limit-again', id));
        syncInvestigations(f.store);
        expect(knowledge.pending.map(item => item.id)).toEqual(['learning:real']);
        // And the follow-up reconciliation records no lesson for it.
        const consumed = [...(knowledge.learningConsumed || [])];
        reconcileBlockerFollowups(f.store); reconcileBlockerFollowups(f.store);
        expect((knowledge.learningConsumed || []).filter(entryId => entryId.includes(id))).toEqual(consumed.filter(entryId => entryId.includes(id)));
        expect(knowledge.pending.map(item => item.id)).toEqual(['learning:real']);
    } finally { f.close(); }
});

test('a retrospective already under way for a limit refusal is left to finish', () => {
    const f = investigationFixture();
    try {
        const id = 'investigation:brain:worker:refused:other';
        f.store.state.workLog = [refused(), run('later')]; f.store.state.slackDeliveries = [];
        f.store.state.it!.investigations = [entry({ id, status: 'resolved', resolution: { kind: 'superseded', sourceId: 'later', receipt: 'provider:codex:later', at: '2026-11-23T14:00:00Z' } })];
        f.store.state.knowledge!.pending.push({ id: 'learning:running', jobId: id, key: '', source: { kind: 'investigation', id }, subject: 'investigation', trigger: 'learning', createdAt: '2026-11-23T09:06:00Z', attempts: 1, nextAt: '', lastError: '', eventIds: [], opportunities: [], frozen: true } as any);
        syncInvestigations(f.store);
        expect(f.store.state.knowledge!.pending.map(item => item.id)).toEqual(['learning:running']);
    } finally { f.close(); }
});

test('a limit refusal first closed by a rule that would otherwise record a lesson records none', () => {
    const f = investigationFixture();
    try {
        const id = 'investigation:brain:worker:refused:other';
        // The refused run also carries an accepted completion, so the accepted-completion rule closes it first.
        f.store.state.workLog = [refused(undefined, { completionAccepted: true, failure: { category: 'other', dispatched: true, detail: LIMIT } })];
        f.store.state.slackDeliveries = [];
        const saved = entry({ id, createdAt: '2026-11-23T09:01:00Z', updatedAt: '2026-11-23T09:05:00Z', nextAt: '', lastError: LIMIT });
        f.store.state.it!.investigations = [saved];
        const consumed = [...(f.store.state.knowledge!.learningConsumed || [])];
        syncInvestigations(f.store);
        expect(saved).toMatchObject({ status: 'resolved', resolution: { receipt: 'sessions/refused/completed-output.json' } });
        expect(f.store.state.knowledge!.learningConsumed || []).toEqual(consumed);
        expect(f.store.state.knowledge!.pending.filter(item => item.source?.id === id)).toEqual([]);
    } finally { f.close(); }
});
