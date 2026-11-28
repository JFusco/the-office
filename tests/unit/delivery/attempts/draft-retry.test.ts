import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { boardDraft, OUTER_499, STOPPED, TIMED_OUT, transientDraft, update } from './retry-fixture';
import { draftRetryAdmission } from '../../../../server/delivery/attempts/draft-retry';
import { deliveryRetryDecision } from '../../../../server/delivery/attempts/delivery-retry';
import { unsettledEffects } from '../../../../server/operations/unsettled-effects';
import { reconcileReadRetries } from '../../../../server/scheduling/read-retries';
import type { TicketJob } from '../../../../src/shared';

afterEach(cleanupFakes);
const admit = (f: ReturnType<typeof fakeGitHub>, job: TicketJob) => draftRetryAdmission(f.store, job, unsettledEffects(f.store));
const effect = (f: ReturnType<typeof fakeGitHub>, job: TicketJob, id: string, status: string, operation = 'git-push') =>
    f.store.db.prepare('INSERT INTO effects(id, work_key, status, body) VALUES(?, ?, ?, ?)').run(id, `${f.store.project.id}:delivery:${job.id}`, status, JSON.stringify({ id, attemptId: job.id, operation, status }));

test('an ordinary transient draft with every card move verified is admitted for publication; GH-407\'s shape for card read-back only', () => {
    const a = transientDraft();
    expect(admit(a.f, a.job)).toEqual({ mode: 'draft', diagnostic: TIMED_OUT, reason: 'transient stop with every card move verified' });
    const b = boardDraft();
    expect(admit(b.f, b.job)).toMatchObject({ mode: 'board', diagnostic: 'gh exited 1: gh: HTTP 499', updates: [{ item: 'pr-card', field: 'status', option: 'review', at: '2026-11-24T17:59:00.000Z' }] });
    // A saved draft is judged on its current evidence, however old.
    const old = transientDraft(fakeGitHub(), { stop: { kind: 'transient', at: '2025-01-01T00:00:00.000Z' }, requestedAt: '2025-01-01T00:00:00.000Z' });
    expect(admit(old.f, old.job)).toMatchObject({ mode: 'draft' });
});

test('each veto keeps a draft from running again by itself, and the stop is a person\'s with its reason', () => {
    const cases: [string, (f: ReturnType<typeof fakeGitHub>, job: TicketJob) => void, RegExp][] = [
        ['an unsettled push', (f, job) => effect(f, job, `harness:${job.id}:push:${HEAD}`, 'dispatching'), /unsettled in the Effects ledger/],
        ['an uncertain PR create', (f, job) => effect(f, job, `harness:${job.id}:pr-create:${HEAD}`, 'uncertain', 'github-pr-create'), /unsettled in the Effects ledger/],
        ['a park', (_f, job) => { job.parked = { stage: 'draft', reason: 'choose', at: STOPPED, published: true }; }, /parked/],
        ['a merge attempt', (_f, job) => { job.mergeAttempt = { head: HEAD, at: STOPPED }; }, /merge was attempted/],
        ['an uncertain receipt', (_f, job) => { job.steps.push({ stage: 'draft', result: { receipts: [{ id: 'r', action: 'git-push', target: 'x', verified: false, uncertain: true, detail: '' }] } as any }); }, /unconfirmed write receipt/],
        ['a legacy recovery route', (_f, job) => { job.implementationRecovery = { workId: 'w', kind: 'candidate', at: STOPPED }; }, /dedicated recovery route/],
        ['a recovery request', (f, job) => { f.store.state.coordination!.requests = [{ id: 'q', action: 'reconcile-preparation', key: job.key, head: '', lane: 'delivery', status: 'queued', requestedAt: STOPPED, detail: '' } as any]; }, /recovery request owns/],
        ['a competing claim', (f, job) => { f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'other', 'draft'); }, /running draft|draft/],
        ['a card move not verified', (_f, job) => { job.boardUpdates!.push(update({ item: 'pr-card', status: 'pending', detail: 'Harness board transition started' })); }, /not verified/],
        ['no identified candidate', (_f, job) => { job.worktree = ''; }, /No identified candidate/],
        ['a stop that is not a transient read', (_f, job) => { Object.assign(job, { detail: 'Error: Worktree is missing', stop: { kind: 'unclassified', at: STOPPED } }); }, /not a transient read/],
        ['an unrelated uncertain write', (_f, job) => { Object.assign(job, { detail: 'Error: Prior merge attempt needs read-back; it will not be repeated', stop: { kind: 'uncertain-effect', at: STOPPED } }); }, /unrelated write/],
    ];
    for (const [name, change, reason] of cases) {
        const { f, job } = transientDraft();
        change(f, job);
        const admission = admit(f, job);
        expect('refused' in admission, name).toBe(true);
        expect((admission as { refused: string }).refused, name).toMatch(reason);
    }
    // A prepared row is not a send: its own preflight and single-dispatch check still apply when it runs.
    const prepared = transientDraft();
    effect(prepared.f, prepared.job, `harness:${prepared.job.id}:push:${HEAD}`, 'prepared');
    expect(admit(prepared.f, prepared.job)).toMatchObject({ mode: 'draft' });
});

test('board recovery takes only uncertain moves of this draft and head with a transient provider diagnostic', () => {
    const cases: [string, (job: TicketJob) => void, RegExp][] = [
        ['a pending move', job => { job.boardUpdates!.at(-1)!.status = 'pending'; }, /started and not settled/],
        ['a definitive miss', job => { job.boardUpdates!.at(-1)!.readBack = { outcome: 'not-at-target', observed: 'progress', at: STOPPED }; }, /not at its target/],
        ['another head', job => { job.boardUpdates!.at(-1)!.head = 'c'.repeat(40); }, /another stage or head/],
        ['another stage', job => { job.boardUpdates!.at(-1)!.stage = 'review'; }, /another stage or head/],
        ['a permission failure', job => { job.boardUpdates!.at(-1)!.detail = 'gh exited 1: gh: Resource not accessible by integration (HTTP 403)'; }, /not a transient provider failure/],
        ['no identifiable item', job => { job.boardUpdates!.at(-1)!.item = ''; }, /identifiable item/],
    ];
    for (const [name, change, reason] of cases) {
        const { f, job } = boardDraft();
        change(job);
        const admission = admit(f, job);
        expect((admission as { refused: string }).refused, name).toMatch(reason);
    }
});

test('GH-407: the exact outer stop and its saved 499 are planned from the board update, keeping the outer stop, and queued when due', () => {
    const { f, job } = boardDraft();
    f.store.state.paused = false;
    const now = new Date('2026-11-27T12:00:00.000Z');
    reconcileReadRetries(f.store, now);
    expect(job.retry).toMatchObject({ attempts: 0, limit: 3, stage: 'draft', head: HEAD, latest: { detail: 'gh exited 1: gh: HTTP 499' },
        binding: { mode: 'board', stop: STOPPED, head: HEAD, updates: [{ item: 'pr-card', option: 'review' }] } });
    expect(Date.parse(job.retry!.nextAt) - now.getTime()).toBe(30000);
    // The outer stop is kept as it was: an uncertain write, read back only.
    expect(job.stop).toEqual({ kind: 'uncertain-effect', at: STOPPED });
    expect(job.detail).toBe(OUTER_499);
    reconcileReadRetries(f.store, new Date(job.retry!.nextAt));
    expect(job).toMatchObject({ status: 'queued', detail: 'Automatic card read-back 1/3 queued. Nothing is resent; publication is only read back. Original failure retained in retry history.' });
    expect(job.retry!.binding).toMatchObject({ detail: OUTER_499 });
    expect(deliveryRetryDecision(f.store, job, new Date(job.retry!.binding!.queuedAt!))).toMatchObject({ state: 'pending', mode: 'board' });
});

test('a release-marker refusal is never a transient draft, whatever filenames its detail names; a real transient provider failure still is', async () => {
    const { blockOnReleaseMarker, indeterminate } = await import('../../../../server/delivery/publication/release-marker-stop');
    const a = transientDraft();
    // The detail names files that read like a temporary provider failure.
    blockOnReleaseMarker(a.job, indeterminate('unclassified paths in x: docs/gh-exited-1-HTTP-502-timed-out.md, wiki/ECONNRESET.md'), new Date(STOPPED));
    expect(a.job.detail).toMatch(/HTTP-502/);
    expect(admit(a.f, a.job)).toEqual({ refused: 'A release-marker refusal needs a decision' });
    const b = transientDraft();
    expect(admit(b.f, b.job)).toMatchObject({ mode: 'draft', diagnostic: TIMED_OUT });
});
