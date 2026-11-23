import { expect, test } from 'vitest';
import { investigationFixture } from './fixture';
import { investigationResolution, syncInvestigations } from '../../../../server/it/investigations/ledger';
import { providerLimitResolution } from '../../../../server/it/investigations/provider-limit-resolution';

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
        const saved = entry({ createdAt: '2026-11-23T09:01:00Z', updatedAt: '2026-11-23T09:05:00Z', nextAt: '', lastError: LIMIT });
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
