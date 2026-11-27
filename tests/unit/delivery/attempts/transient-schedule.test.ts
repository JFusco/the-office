import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { planReadRetry, reconcileReadRetries } from '../../../../server/scheduling/read-retries';
import { ATTEMPT_DELAYS_MS } from '../../../../server/delivery/attempts/attempt-backoff';
import { deliveryPolicy, SERVER_ERROR_TAIL_MS } from '../../../../server/delivery/attempts/transient-schedule';
import { nextAttemptAt } from '../../../../server/delivery/attempts/attempt-backoff';
import type { TicketJob } from '../../../../src/shared';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const MINUTE = 60_000;

function brain() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-transient-schedule-')); roots.push(root);
    const store = new Store(':memory:', projectById('brain'), root); stores.push(store);
    store.state.paused = false; store.state.coordination = coordination();
    return store;
}
const review = (detail: string, at: Date, extra: Partial<TicketJob> = {}) => ({ id: 'review-job', key: 'GH-376', stage: 'review', status: 'blocked', detail, head: 'a'.repeat(40), branch: 'codex/376', worktree: '', pr: 0, prUrl: '', requestedAt: at.toISOString(), stop: { kind: 'transient', at: at.toISOString() }, steps: [], ...extra }) as unknown as TicketJob;
/** Fails the queued job again, as a claimed retry that hit the same diagnostic would. */
const failAgain = (job: TicketJob, detail: string, at: Date) => Object.assign(job, { status: 'blocked', detail, stop: { kind: 'transient', at: at.toISOString() } });

test('a delivery stop on a GitHub server error runs the three short waits, then 15, 30 and 60 minutes, then is shown to a person', () => {
    const store = brain(), detail = 'Error: gh exited 1: gh: HTTP 503';
    let now = new Date('2026-11-27T12:00:00Z');
    const job = review(detail, now); store.state.coordination!.jobs = [job];
    const waits: number[] = [];
    for (let attempt = 1; attempt <= 6; attempt++) {
        reconcileReadRetries(store, now);
        expect(job.status).toBe('blocked');
        waits.push(Date.parse(job.retry!.nextAt) - now.getTime());
        expect(job.retry).toMatchObject({ limit: 6, attempts: attempt - 1, stage: 'review', head: job.head });
        now = new Date(job.retry!.nextAt);
        reconcileReadRetries(store, now);
        // Counted once, when the job becomes queued.
        expect(job.status).toBe('queued');
        expect(job.retry!.attempts).toBe(attempt);
        expect(job.detail).toBe(`Automatic read-only retry ${attempt}/6 queued. Original failure retained in retry history.`);
        now = new Date(now.getTime() + 1000);
        failAgain(job, detail, now);
    }
    expect(waits).toEqual([...ATTEMPT_DELAYS_MS, ...SERVER_ERROR_TAIL_MS]);
    expect(SERVER_ERROR_TAIL_MS).toEqual([15 * MINUTE, 30 * MINUTE, 60 * MINUTE]);
    reconcileReadRetries(store, now);
    expect(job.retry).toMatchObject({ exhausted: true, attempts: 6, nextAt: '' });
    expect(job.status).toBe('blocked');
    // Nothing more is planned for this stage and head.
    reconcileReadRetries(store, new Date(now.getTime() + 24 * 60 * MINUTE));
    expect(job.retry!.attempts).toBe(6);
});

test('a counted delivery failure that is not a server error keeps the three short waits; a later non-5xx stop after try three exhausts', () => {
    const store = brain();
    let now = new Date('2026-11-27T12:00:00Z');
    const job = review('Error: gh exited 1: gh: HTTP 499', now); store.state.coordination!.jobs = [job];
    // Two 499s, then a 502 that would continue into the tail, then a 499 again after try three.
    const failures = ['Error: gh exited 1: gh: HTTP 499', 'Error: gh exited 1: gh: HTTP 502', 'Error: gh exited 1: gh: HTTP 499'];
    for (let attempt = 1; attempt <= 3; attempt++) {
        reconcileReadRetries(store, now);
        expect(job.retry!.limit).toBe(attempt === 3 ? 6 : 3);
        now = new Date(job.retry!.nextAt); reconcileReadRetries(store, now);
        expect(job.status).toBe('queued');
        now = new Date(now.getTime() + 1000); failAgain(job, failures[attempt - 1], now);
    }
    reconcileReadRetries(store, now);
    expect(job.retry).toMatchObject({ exhausted: true, attempts: 3 });
});

test('intake, offline activation, model capacity and writer restarts keep their own three short attempts', () => {
    // Intake and activation plan through planReadRetry, unchanged: a 503 is exhausted after three.
    const item: any = { status: 'blocked', detail: 'Error: gh exited 1: gh: HTTP 503' };
    let now = new Date('2026-11-27T12:00:00Z');
    for (let i = 0; i < 3; i++) { planReadRetry(item, now); now = new Date(item.retry.nextAt); planReadRetry(item, now); expect(item.status).toBe('queued'); Object.assign(item, { status: 'blocked', detail: 'Error: gh exited 1: gh: HTTP 503' }); }
    planReadRetry(item, now);
    expect(item.retry).toMatchObject({ exhausted: true, attempts: 3 });
    expect(item.retry.stage).toBeUndefined();
    // Model capacity at a review stage is counted on the short policy.
    expect(deliveryPolicy('Error: codex exited 1: Selected model is at capacity. Please try a different model.')).toEqual({ kind: 'counted', delays: ATTEMPT_DELAYS_MS, limit: 3 });
    // Writer timing is unchanged.
    expect(ATTEMPT_DELAYS_MS).toEqual([30000, 120000, 300000]);
    const stopped = new Date('2026-11-27T12:00:00Z');
    expect([0, 1, 2, 3].map(attempts => nextAttemptAt(attempts, stopped)?.getTime() ?? null)).toEqual([stopped.getTime() + 30000, stopped.getTime() + 120000, stopped.getTime() + 300000, null]);
});

test('a new stage or head gets a fresh allowance; the same stage and head keep a spent one', () => {
    const store = brain();
    const now = new Date('2026-11-27T12:00:00Z');
    const job = review('Error: gh exited 1: gh: HTTP 499', now, { retry: { attempts: 3, nextAt: '', history: [], exhausted: true, stage: 'review', head: 'a'.repeat(40), limit: 3 } } as any);
    store.state.coordination!.jobs = [job];
    reconcileReadRetries(store, now);
    expect(job.retry).toMatchObject({ exhausted: true, attempts: 3 });
    Object.assign(job, { stage: 'lead-pr' });
    reconcileReadRetries(store, now);
    expect(job.retry).toMatchObject({ exhausted: false, attempts: 0, stage: 'lead-pr', head: 'a'.repeat(40) });
    expect(job.retry!.nextAt).toBeTruthy();
    Object.assign(job, { head: 'c'.repeat(40) });
    // The timer was planned for the old head: it is withdrawn and the stop shown, not run against the new head.
    reconcileReadRetries(store, new Date(now.getTime() + 1000));
    expect(job.retry!.nextAt).toBe('');
    expect(job.status).toBe('blocked');
});

test('a repair wait on the stop does not hold its read retry: the timer and the queue transition proceed', async () => {
    const { markAwaitingRepair } = await import('../../incidents/repair/mark-fixture');
    const store = brain(), now = new Date('2026-11-27T12:00:00Z');
    const job = review('Error: gh exited 1: gh: HTTP 503', now); store.state.coordination!.jobs = [job];
    markAwaitingRepair(store.state, 'brain', { kind: 'delivery', id: job.id }, 'review');
    reconcileReadRetries(store, now);
    expect(job.retry!.nextAt).toBeTruthy();
    reconcileReadRetries(store, new Date(job.retry!.nextAt));
    expect(job.status).toBe('queued');
});

test('one saved quota refusal reads the same from the tick and the command path, with no attempt spent', async () => {
    const { Coordinator } = await import('../../../../server/scheduling/coordination');
    const { Engine } = await import('../../../../server/scheduling/engine');
    const store = brain(), now = new Date();
    const job = review('Error: gh exited 1: gh: API rate limit exceeded for user ID 1. (HTTP 403)', now, {
        retry: { attempts: 0, nextAt: '', history: [], exhausted: false, stage: 'review', head: 'a'.repeat(40), quota: { since: now.toISOString() },
            failure: { category: 'provider-limit', retryAt: new Date(now.getTime() + 20 * MINUTE).toISOString(), detail: 'API rate limit exceeded', dispatched: true } } } as any);
    store.state.coordination!.jobs = [job];
    store.state.coordination!.enabled = true;
    const coordinator = new Coordinator(store, new Engine(store), (async () => { throw new Error('no provider call expected'); }) as any);
    await coordinator.tick(now);
    const planned = job.retry!.nextAt;
    expect(planned).toBe(new Date(now.getTime() + 20 * MINUTE).toISOString());
    for (let pass = 0; pass < 3; pass++) { reconcileReadRetries(store, new Date(now.getTime() + pass * MINUTE)); await coordinator.tick(new Date(now.getTime() + pass * MINUTE)); }
    expect(job.retry).toMatchObject({ nextAt: planned, attempts: 0 });
});
