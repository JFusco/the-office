import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { reconcileReadRetries } from '../../../../server/scheduling/read-retries';
import { stopReason } from '../../../../server/delivery/pipeline/stop-reason';
import { noteDeliveryStop } from '../../../../server/delivery/attempts/stop-evidence';
import { captureGitHubFailures, noteGitHubFailure, type GitHubRefusalEvidence } from '../../../../server/github/refusal-capture';
import { CommandFailure } from '../../../../server/workers/process';
import type { TicketJob } from '../../../../src/shared';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => { try { store.close(); } catch { /* closed */ } }); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const HOUR = 3600_000, T0 = new Date('2026-11-27T12:00:00.000Z');
const PRIMARY = 'gh exited 1: gh: API rate limit exceeded for user ID 1. (HTTP 403)';
const at = (ms: number) => new Date(T0.getTime() + ms);

function brain(onDisk = false) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-quota-wait-')); roots.push(root);
    const path = onDisk ? resolve(root, 'office.sqlite') : ':memory:';
    const store = new Store(path, projectById('brain'), root); stores.push(store);
    store.state.paused = false; store.state.coordination = coordination();
    const job = { id: 'job', key: 'GH-376', stage: 'lead-pr', status: 'working', detail: '', head: 'a'.repeat(40), branch: 'b', worktree: '', pr: 9, prUrl: '', requestedAt: T0.toISOString(), steps: [] } as unknown as TicketJob;
    store.state.coordination.jobs = [job];
    return { store, job, root, path };
}
const refusal = (deadline: Date, extra: Partial<GitHubRefusalEvidence> = {}): GitHubRefusalEvidence => ({ principal: 'operator', resource: 'core', at: T0.toISOString(), deadline: deadline.toISOString(), secondary: false, text: PRIMARY, readOnly: true, ...extra });

/** Stops the job as the delivery stop handler does, inside a capture holding the call that caused it. */
async function stop(store: Store, job: TicketJob, error: unknown, now: Date, failed?: { text: string; readOnly: boolean; refusal?: GitHubRefusalEvidence }) {
    await captureGitHubFailures(async () => {
        if (failed) noteGitHubFailure({ args: 'api repos/JFusco/brain/pulls/9', at: now.toISOString(), ...failed });
        Object.assign(job, { status: 'blocked', detail: String(error) });
        job.stop = stopReason(error, false, now);
        noteDeliveryStop(store, job, error, now);
    });
}

test('an attributable quota refusal waits for its deadline with no attempt counted, the same over repeated ticks, and queues once it passes', async () => {
    const { store, job } = brain();
    await stop(store, job, new Error(PRIMARY), T0, { text: PRIMARY, readOnly: true, refusal: refusal(at(40 * 60_000)) });
    expect(job.stop?.kind).toBe('transient');
    expect(job.retry).toMatchObject({ failure: { category: 'provider-limit', retryAt: at(40 * 60_000).toISOString(), detail: PRIMARY, dispatched: true }, quota: { since: T0.toISOString(), principal: 'operator', resource: 'core' }, attempts: 0 });
    for (const minutes of [0, 5, 20, 39]) {
        reconcileReadRetries(store, at(minutes * 60_000));
        expect(job.retry).toMatchObject({ nextAt: at(40 * 60_000).toISOString(), attempts: 0 });
        expect(job.status).toBe('blocked');
    }
    reconcileReadRetries(store, at(40 * 60_000));
    expect(job).toMatchObject({ status: 'queued', retry: { attempts: 0, nextAt: '' } });
    expect(job.detail).toBe('GitHub quota wait ended; automatic read retry queued with no attempt counted. Original failure retained in retry history.');
});

test('gh\'s bare 429 for a read waits one minute uncounted; a refused write keeps its uncertainty and no wait', async () => {
    const a = brain();
    await stop(a.store, a.job, new Error('gh exited 1: gh: HTTP 429'), T0, { text: 'gh exited 1: gh: HTTP 429', readOnly: true });
    reconcileReadRetries(a.store, T0);
    expect(a.job.retry).toMatchObject({ failure: { category: 'provider-limit', retryAt: at(60_000).toISOString() }, nextAt: at(60_000).toISOString(), attempts: 0 });
    // The same text with no capture (a direct test of the planner): the stop's own time plus the fallback.
    const b = brain();
    Object.assign(b.job, { status: 'blocked', detail: 'Error: gh exited 1: gh: HTTP 429', stop: { kind: 'transient', at: T0.toISOString() } });
    reconcileReadRetries(b.store, at(5_000));
    expect(b.job.retry).toMatchObject({ nextAt: at(60_000).toISOString(), attempts: 0, quota: { since: T0.toISOString() } });
    const c = brain();
    const write = new CommandFailure(PRIMARY, 'uncertain-effect', true);
    await stop(c.store, c.job, write, T0, { text: PRIMARY, readOnly: false, refusal: refusal(at(HOUR), { readOnly: false }) });
    expect(c.job.stop?.kind).toBe('uncertain-effect');
    expect(c.job.retry).toBeUndefined();
    reconcileReadRetries(c.store, T0);
    expect(c.job.retry?.nextAt ?? '').toBe('');
});

test('a quota wait survives a reload; a distinct non-quota stop ends the episode and is counted', async () => {
    const { store, job, root, path } = brain(true);
    await stop(store, job, new Error(PRIMARY), T0, { text: PRIMARY, readOnly: true, refusal: refusal(at(30 * 60_000)) });
    reconcileReadRetries(store, T0);
    store.save(); store.close();
    const reopened = new Store(path, projectById('brain'), root); stores.push(reopened);
    reopened.state.paused = false;
    const saved = reopened.state.coordination!.jobs![0];
    expect(saved.retry).toMatchObject({ nextAt: at(30 * 60_000).toISOString(), quota: { since: T0.toISOString() }, failure: { category: 'provider-limit' } });
    reconcileReadRetries(reopened, at(30 * 60_000));
    expect(saved).toMatchObject({ status: 'queued', retry: { attempts: 0 } });
    // The queued retry fails on an ordinary server error: the quota episode ends and the stop is counted.
    await stop(reopened, saved, new Error('gh exited 1: gh: HTTP 503'), at(31 * 60_000));
    expect(saved.retry!.failure).toBeUndefined();
    expect(saved.retry!.quota).toBeUndefined();
    reconcileReadRetries(reopened, at(31 * 60_000));
    expect(saved.retry).toMatchObject({ attempts: 0, limit: 6, nextAt: at(31 * 60_000 + 30_000).toISOString() });
    reconcileReadRetries(reopened, at(31 * 60_000 + 30_000));
    expect(saved.retry!.attempts).toBe(1);
});

test('a reset beyond six hours is reviewed at the cap with no earlier queue, and the episode spans its repeated refusals', async () => {
    const { store, job } = brain();
    await stop(store, job, new Error(PRIMARY), T0, { text: PRIMARY, readOnly: true, refusal: refusal(at(2 * HOUR)) });
    reconcileReadRetries(store, T0);
    reconcileReadRetries(store, at(2 * HOUR));
    expect(job.status).toBe('queued');
    // The retry is refused again, with a reset far past the six hours: the wait ends at the cap, counted by none.
    await stop(store, job, new Error(PRIMARY), at(2 * HOUR + 1000), { text: PRIMARY, readOnly: true, refusal: refusal(at(9 * HOUR)) });
    reconcileReadRetries(store, at(2 * HOUR + 2000));
    expect(job.retry).toMatchObject({ nextAt: at(6 * HOUR).toISOString(), attempts: 0, quota: { since: T0.toISOString() } });
    for (const hours of [3, 4, 5, 5.99]) { reconcileReadRetries(store, at(hours * HOUR)); expect(job.status).toBe('blocked'); }
    reconcileReadRetries(store, at(6 * HOUR));
    expect(job.retry).toMatchObject({ exhausted: true, nextAt: '', attempts: 0 });
    expect(job.status).toBe('blocked');
    // A late timer or a late-starting queued claim at or past the boundary is exhausted too.
    reconcileReadRetries(store, at(7 * HOUR));
    expect(job.status).toBe('blocked');
});

test('a late window from the shared probe applies only while its own stop still stands', async () => {
    for (const changed of [false, true]) {
        const { store, job } = brain();
        let settle!: (reset: string | undefined) => void;
        const late = new Promise<string | undefined>(resolve => { settle = resolve; });
        await stop(store, job, new Error(PRIMARY), T0, { text: PRIMARY, readOnly: true, refusal: refusal(at(60_000), { late }) });
        reconcileReadRetries(store, T0);
        expect(job.retry!.nextAt).toBe(at(60_000).toISOString());
        if (changed) job.stop = { kind: 'transient', at: at(30_000).toISOString() };
        settle(at(45 * 60_000).toISOString());
        await late; await new Promise(resolve => setImmediate(resolve));
        expect(job.retry!.failure!.retryAt, String(changed)).toBe(changed ? at(60_000).toISOString() : at(45 * 60_000).toISOString());
        expect(job.retry!.nextAt, String(changed)).toBe(changed ? at(60_000).toISOString() : at(45 * 60_000).toISOString());
    }
});
