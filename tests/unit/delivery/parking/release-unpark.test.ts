import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { park } from '../../../../server/delivery/parking/park';
import { resumeParked } from '../../../../server/delivery/parking/resume';
import { MAX_RELEASE_UNPARKS, RELEASE_CHECK_MS, unparkReleasedWaits } from '../../../../server/delivery/parking/release-unpark';
import { HOLDS } from '../../../../server/office/config';
import type { StageResult } from '../../../../src/shared';
afterEach(() => { cleanupFakes(); delete HOLDS['GH-5']; });

const release = { registry: 'npm' as const, package: '@optimizely/cms-sdk', minimum: '3.1.0' };
const waiting = (withRelease = true, kind = 'provider-wait'): StageResult => ({ outcome: 'blocked', summary: 'Waiting on SDK', blocker: 'Stable @optimizely/cms-sdk 3.1 is not published.', commit: HEAD, evidence: [], findings: [], receipts: [],
    previewUrl: '', qaRunDir: '', prerequisites: null, resolution: { kind: kind as any, findingIds: [], evidenceIds: ['e1'], ...(withRelease ? { release } : {}) } } as any);
const pickup = { enabled: true, status: 'Ready' };

async function parked(versions: string[], result = waiting()) {
    const f = fakeGitHub(), job = f.candidate({ stage: 'implement', status: 'working' });
    f.state.cards[0].status = 'progress';
    let published = versions;
    const npmCalls: string[][] = [];
    const base = f.execute;
    const execute = async (program: string, args: string[], options: any) => {
        if (program === 'npm') { npmCalls.push(args); return JSON.stringify(published); }
        return base(program, args, options);
    };
    (f.delivery as any).execute = execute;
    await claimedDelivery(f.store, job, () => park(f.delivery, job, result));
    return { f, job, execute: execute as any, npmCalls, publish: (next: string[]) => { published = next; } };
}
const T0 = new Date('2026-11-07T00:00:00Z'), later = (n: number) => new Date(T0.getTime() + n * RELEASE_CHECK_MS);
/** Parks on a prerelease-only registry and takes the baseline check, then publishes stable 3.1.0. */
async function waitingThenReleased() {
    const fixture = await parked(['3.0.2', '3.1.0-beta.2']);
    expect(await unparkReleasedWaits(fixture.f.store, fixture.execute, fixture.f.delivery.jobs, pickup, T0)).toEqual([]);
    fixture.publish(['3.0.2', '3.1.0-beta.2', '3.1.0']);
    return fixture;
}

test('parking a provider-wait keeps its release condition', async () => {
    const { job, f } = await parked(['3.0.2']);
    expect(job.parked).toMatchObject({ published: true, release });
    expect(f.state.cards[0].status).toBe('block');
});

test('a stable release after the baseline check returns the card to Ready with one evidence comment, then the job resumes', async () => {
    const { f, job, execute, npmCalls } = await waitingThenReleased();
    const comments = f.state.comments.length;
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, pickup, later(1))).toEqual(['GH-5']);
    expect(npmCalls).toEqual([['view', '@optimizely/cms-sdk', 'versions', '--json'], ['view', '@optimizely/cms-sdk', 'versions', '--json']]);
    expect(f.state.cards[0].status).toBe('ready');
    expect(f.state.comments).toHaveLength(comments + 1);
    expect(f.state.comments.at(-1).body).toContain('@optimizely/cms-sdk@3.1.0 is published on npm');
    expect(job).toMatchObject({ releaseUnparks: 1, parked: { releaseFound: '3.1.0' } });
    expect(job.parked?.release).toBeUndefined();
    expect(resumeParked(f.store, f.delivery.jobs, [{ key: 'GH-5', pickupStatus: 'Ready' }] as any, pickup, new Map([[f.store.project.id, f.store]]), later(1))).toEqual(['GH-5']);
    expect(job).toMatchObject({ status: 'queued', stage: 'implement' });
});

test('a release already published at the first check is dropped and left to Joe, so it cannot loop', async () => {
    const { f, job, execute } = await parked(['3.1.0']);
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, pickup, T0)).toEqual([]);
    expect(job.parked?.release).toBeUndefined();
    expect(f.state.cards[0].status).toBe('block');
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, pickup, later(1))).toEqual([]);
});

test('the next check waits six hours, and each job unparks at most the cap', async () => {
    const { f, job, execute, npmCalls } = await waitingThenReleased();
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, pickup, new Date(later(1).getTime() - 1))).toEqual([]);
    expect(npmCalls).toHaveLength(1);
    job.releaseUnparks = MAX_RELEASE_UNPARKS;
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, pickup, later(1))).toEqual([]);
    expect(f.state.cards[0].status).toBe('block');
});

test('holds, draining, human decisions, waits without a release and cards a person moved are never touched', async () => {
    const held = await waitingThenReleased();
    HOLDS['GH-5'] = 'Joe hold';
    expect(await unparkReleasedWaits(held.f.store, held.execute, held.f.delivery.jobs, pickup, later(1))).toEqual([]);
    delete HOLDS['GH-5'];
    held.f.store.state.draining = true;
    expect(await unparkReleasedWaits(held.f.store, held.execute, held.f.delivery.jobs, pickup, later(1))).toEqual([]);
    expect(held.f.state.cards[0].status).toBe('block');

    const human = await parked(['3.1.0'], waiting(true, 'human-hold'));
    expect(human.job.parked?.release).toBeUndefined();
    expect(await unparkReleasedWaits(human.f.store, human.execute, human.f.delivery.jobs, pickup, T0)).toEqual([]);
    expect(human.npmCalls).toEqual([]);

    const plain = await parked(['3.1.0'], waiting(false));
    expect(await unparkReleasedWaits(plain.f.store, plain.execute, plain.f.delivery.jobs, pickup, T0)).toEqual([]);
    expect(plain.npmCalls).toEqual([]);

    const moved = await waitingThenReleased();
    moved.f.state.cards[0].status = 'backlog';
    expect(await unparkReleasedWaits(moved.f.store, moved.execute, moved.f.delivery.jobs, pickup, later(1))).toEqual([]);
    expect(moved.f.state.cards[0].status).toBe('backlog');
});

test('a card moved out of Block after the comment is never overridden', async () => {
    const { f, execute } = await waitingThenReleased();
    const racing = async (program: string, args: string[], options: any) => {
        const out = await execute(program, args, options);
        if (args.includes('-f') && String(args.at(-1)).startsWith('body=Office release')) f.state.cards[0].status = 'backlog';
        return out;
    };
    expect(await unparkReleasedWaits(f.store, racing as any, f.delivery.jobs, pickup, later(1))).toEqual([]);
    expect(f.state.cards[0].status).toBe('backlog');
});

test('a failed lane write is never resent: the card stays in Block and the comment is not repeated', async () => {
    const { f, execute } = await waitingThenReleased();
    const failing = async (program: string, args: string[], options: any) => {
        if (args[1] === 'graphql' && String(options?.input).includes('updateProjectV2ItemFieldValue')) throw new Error('graphql timeout');
        return execute(program, args, options);
    };
    expect(await unparkReleasedWaits(f.store, failing as any, f.delivery.jobs, pickup, later(1))).toEqual([]);
    const comments = f.state.comments.length;
    expect(f.state.cards[0].status).toBe('block');
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, pickup, later(2))).toEqual([]);
    expect(f.state.comments).toHaveLength(comments);
    expect(f.state.cards[0].status).toBe('block');
});

test('a lane write that landed without read-back is reconciled and counted', async () => {
    const { f, job, execute } = await waitingThenReleased();
    let dropped = false;
    const lost = async (program: string, args: string[], options: any) => {
        const out = await execute(program, args, options);
        if (!dropped && args[1] === 'graphql' && String(options?.input).includes('updateProjectV2ItemFieldValue')) { dropped = true; throw new Error('connection reset after write'); }
        return out;
    };
    expect(await unparkReleasedWaits(f.store, lost as any, f.delivery.jobs, pickup, later(1))).toEqual([]);
    expect(f.state.cards[0].status).toBe('ready');
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, pickup, later(2))).toEqual(['GH-5']);
    expect(job.releaseUnparks).toBe(1);
});

test('a paused office or disabled pickup checks nothing, and an npm failure is recorded without throwing', async () => {
    const { f, execute, npmCalls } = await parked(['3.1.0']);
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, { enabled: false, status: 'Ready' }, T0)).toEqual([]);
    f.store.state.paused = true;
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, pickup, T0)).toEqual([]);
    expect(npmCalls).toEqual([]);
    f.store.state.paused = false;
    const failing = async (program: string, args: string[], options: any) => program === 'npm' ? Promise.reject(new Error('registry down')) : execute(program, args, options);
    await expect(unparkReleasedWaits(f.store, failing as any, f.delivery.jobs, pickup, T0)).resolves.toEqual([]);
    expect(f.state.cards[0].status).toBe('block');
});

test('a failed first check does not take the baseline, so an already-published release is still left to Joe', async () => {
    const { f, job, execute } = await parked(['3.1.0']);
    const failing = async (program: string, args: string[], options: any) => program === 'npm' ? Promise.reject(new Error('registry timeout')) : execute(program, args, options);
    expect(await unparkReleasedWaits(f.store, failing as any, f.delivery.jobs, pickup, T0)).toEqual([]);
    expect(job.parked?.release).toEqual(release);
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, pickup, later(1))).toEqual([]);
    expect(job.parked?.release).toBeUndefined();
    expect(f.state.cards[0].status).toBe('block');
});

test('after one unpark, a card a person returns to Block is not moved again', async () => {
    const { f, execute } = await waitingThenReleased();
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, pickup, later(1))).toEqual(['GH-5']);
    f.state.cards[0].status = 'block';
    expect(await unparkReleasedWaits(f.store, execute, f.delivery.jobs, pickup, later(3))).toEqual([]);
    expect(f.state.cards[0].status).toBe('block');
});
